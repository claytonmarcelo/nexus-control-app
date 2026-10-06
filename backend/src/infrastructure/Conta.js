import pool from '../config/database.js';
import { ROOT_ADMIN_EMAIL } from '../config/access.js';
import { registrarEvento } from './EventLog.js';

/**
 * Regras de conta (fonte única de verdade, especificação §99/§100):
 * desativação preservando histórico, obrigações pendentes, vínculo de
 * identidade entre conta nova e conta desativada, e inatividade comercial.
 */

export const STATUS_CONTA = {
  ATIVO: 'ativo',
  AVISO_INATIVIDADE: 'aviso_inatividade',
  BLOQUEADO_INATIVIDADE: 'bloqueado_inatividade',
  DESATIVADA: 'desativada',
};

export const INATIVIDADE_MESES = 6;

// Estados de aluguel que ainda representam uma obrigação com o sistema.
const ALUGUEL_ABERTO = ['aguardando_pagamento', 'ativo', 'vencido', 'regularizado'];
// Pagamentos ainda não confirmados (dívida em aberto).
const PAGAMENTO_ABERTO = ['pendente', 'processando'];

/**
 * Consultas paralelas e baratas (uma varredura por tabela, sem N+1).
 * Retorna a situação real da conta para decidir avisos, desativação e alertas.
 */
export const obterObrigacoesConta = async (usuarioId, connection = pool) => {
  const [pedidosAbertos, alugueisAbertos] = await Promise.all([
    connection.query(
      `SELECT id, total, metodo_pagamento, status_pagamento, criado_em
       FROM pedidos
       WHERE usuario_id = ? AND status_pagamento IN ('${PAGAMENTO_ABERTO.join("','")}')
       ORDER BY criado_em DESC`,
      [usuarioId]
    ).then(([rows]) => rows),
    connection.query(
      `SELECT a.id, a.pedido_id, a.item_id, a.quantidade, a.dias_aluguel, a.valor_diario,
              a.data_inicio, a.data_prevista_devolucao, a.status, a.status_retirada,
              i.nome AS item_nome
       FROM alugueis a
       JOIN itens i ON i.id = a.item_id
       WHERE a.usuario_id = ? AND a.status IN ('${ALUGUEL_ABERTO.join("','")}')
       ORDER BY a.criado_em DESC`,
      [usuarioId]
    ).then(([rows]) => rows),
  ]);

  const debitos = pedidosAbertos.reduce((sum, p) => sum + Number(p.total || 0), 0);

  return {
    possui_obrigacoes: pedidosAbertos.length > 0 || alugueisAbertos.length > 0,
    pedidos_pendentes: pedidosAbertos,
    alugueis_abertos: alugueisAbertos,
    debitos: Number(debitos.toFixed(2)),
  };
};

/**
 * Desativação da própria conta: soft delete. A linha do usuário permanece,
 * o histórico (pedidos, pagamentos, aluguéis, eventos) é preservado por FK,
 * e o e-mail é liberado para um novo cadastro legítimo guardando o original.
 */
export const desativarConta = async (usuarioId) => {
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [users] = await connection.execute(
      'SELECT id, nome, email, status_conta FROM usuarios WHERE id = ? FOR UPDATE',
      [usuarioId]
    );
    const user = users[0];
    if (!user) {
      await connection.rollback();
      transactionStarted = false;
      return { desativada: false, reason: 'not-found' };
    }
    if (user.email.toLowerCase() === ROOT_ADMIN_EMAIL) {
      await connection.rollback();
      transactionStarted = false;
      return { desativada: false, reason: 'root-admin' };
    }
    if (user.status_conta === STATUS_CONTA.DESATIVADA) {
      await connection.rollback();
      transactionStarted = false;
      return { desativada: false, reason: 'already-desativada' };
    }

    // Libera o e-mail para novo cadastro sem destruir o registro original:
    // o endereço fica reservado em email_original e a linha recebe um sufixo
    // determinístico com carimbo de tempo (evita colisão entre desativações).
    await connection.execute(
      `UPDATE usuarios
       SET status_conta = 'desativada',
           ativo = 0,
           desativado_em = NOW(),
           email_original = COALESCE(email_original, email),
           email = CONCAT(SUBSTRING(email, 1, 110), '#desativada#',
                          DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'))
       WHERE id = ?`,
      [usuarioId]
    );

    await registrarEvento(
      { usuarioId, evento: 'conta_desativada', descricao: 'Conta desativada a pedido do cliente. Histórico preservado.' },
      connection
    );

    await connection.commit();
    transactionStarted = false;
    return { desativada: true };
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/** Busca a conta desativada mais recente que usava este e-mail como original. */
export const encontrarContaDesativadaPorEmailOriginal = async (email) => {
  const [rows] = await pool.execute(
    `SELECT id, nome, email, senha, nivel_acesso, desativado_em, criado_em
     FROM usuarios
     WHERE status_conta = 'desativada' AND LOWER(COALESCE(email_original, email)) = LOWER(?)
     ORDER BY desativado_em DESC
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

/** IDs das contas antigas vinculadas a uma conta nova (base de leitura do histórico). */
export const listarContasVinculadas = async (usuarioId) => {
  const [rows] = await pool.execute(
    'SELECT antigo_usuario_id FROM vinculos_conta WHERE novo_usuario_id = ?',
    [usuarioId]
  );
  return rows.map((row) => row.antigo_usuario_id);
};

/**
 * Vínculo legítimo criado SOMENTE após prova de identidade no cadastro
 * (senha da conta desativada conferida no backend contra o hash bcrypt).
 */
export const criarVinculo = async (novoUsuarioId, antigoUsuarioId) => {
  const [existing] = await pool.execute(
    'SELECT id FROM vinculos_conta WHERE novo_usuario_id = ? AND antigo_usuario_id = ? LIMIT 1',
    [novoUsuarioId, antigoUsuarioId]
  );
  if (existing.length > 0) return false;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      'INSERT INTO vinculos_conta (novo_usuario_id, antigo_usuario_id) VALUES (?, ?)',
      [novoUsuarioId, antigoUsuarioId]
    );
    await registrarEvento(
      {
        usuarioId: novoUsuarioId,
        evento: 'historico_recuperado',
        descricao: 'Nova conta vinculada ao histórico da conta anterior após verificação de identidade.',
        metadados: { antigo_usuario_id: antigoUsuarioId },
      },
      connection
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Varredura de inatividade comercial (sem compras ou aluguéis há N meses).
 * Um único UPDATE set-based por condição — sem N+1, sem varredura por request.
 * Cadastro recente nunca é considerado inativo (§58): exige criado_em > 6 meses.
 */
export const marcarAvisosDeInatividade = async () => {
  const [avisados] = await pool.execute(
    `UPDATE usuarios u
     SET u.status_conta = 'aviso_inatividade'
     WHERE u.nivel_acesso = 'cliente'
       AND u.status_conta = 'ativo'
       AND u.criado_em < NOW() - INTERVAL ${INATIVIDADE_MESES} MONTH
       AND NOT EXISTS (
         SELECT 1 FROM pedidos p
         WHERE p.usuario_id = u.id
           AND p.status_pagamento <> 'cancelado'
           AND p.criado_em > NOW() - INTERVAL ${INATIVIDADE_MESES} MONTH
       )`
  );

  // Reativou com compra/aluguel recente? Sai do aviso automaticamente.
  const [reativados] = await pool.execute(
    `UPDATE usuarios u
     SET u.status_conta = 'ativo'
     WHERE u.status_conta = 'aviso_inatividade'
       AND EXISTS (
         SELECT 1 FROM pedidos p
         WHERE p.usuario_id = u.id
           AND p.status_pagamento <> 'cancelado'
           AND p.criado_em > NOW() - INTERVAL ${INATIVIDADE_MESES} MONTH
       )`
  );

  const total = Number(avisados.affectedRows || 0) + Number(reativados.affectedRows || 0);
  if (Number(avisados.affectedRows || 0) > 0) {
    await pool.execute(
      `INSERT INTO historico_eventos (usuario_id, evento, descricao)
       SELECT u.id, 'aviso_inatividade', 'Conta sinalizada por inatividade comercial (sem compras ou aluguéis por 6 meses).'
       FROM usuarios u
       WHERE u.status_conta = 'aviso_inatividade'`
    );
  }
  return { avisados: Number(avisados.affectedRows || 0), reativados: Number(reativados.affectedRows || 0), total };
};
