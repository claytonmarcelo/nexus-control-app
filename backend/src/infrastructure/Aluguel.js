import pool from '../config/database.js';
import { registrarEvento } from './EventLog.js';
import { MIN_RENTAL_DAYS, MAX_RENTAL_DAYS, calcDailyRate, round2 } from './Preco.js';

/**
 * Aluguel — registro operacional de locação (tabela alugueis).
 * O período só começa na confirmação do pagamento; o vencimento é detectado
 * por varredura set-based (sem N+1) e nunca apaga histórico (§47).
 */

export const STATUS_ALUGUEL = {
  AGUARDANDO_PAGAMENTO: 'aguardando_pagamento',
  ATIVO: 'ativo',
  VENCIDO: 'vencido',
  REGULARIZADO: 'regularizado',
  DEVOLVIDO: 'devolvido',
  CANCELADO: 'cancelado',
};

export const STATUS_RETIRADA = {
  NENHUM: 'nenhum',
  PENDENTE: 'pendente',
  AGENDADA: 'agendada',
  REALIZADA: 'realizada',
};

const SELECT_ALUGUEL = `
  SELECT a.*, i.nome AS item_nome, i.imagem_url, u.nome AS usuario_nome, u.email AS usuario_email,
         GREATEST(0, DATEDIFF(NOW(), a.data_prevista_devolucao)) AS dias_excedentes
  FROM alugueis a
  JOIN itens i ON i.id = a.item_id
  JOIN usuarios u ON u.id = a.usuario_id`;

/** Cria os registros de aluguel de um pedido recém-criado (status aguardando_pagamento). */
export const criarAlugueisDoPedido = async (pedido, connection = pool) => {
  const rentalItems = (pedido.items || []).filter((item) => item.tipo === 'aluguel');
  for (const item of rentalItems) {
    await connection.execute(
      `INSERT INTO alugueis (pedido_id, usuario_id, item_id, quantidade, dias_aluguel, valor_diario, status)
       VALUES (?, ?, ?, ?, ?, ?, 'aguardando_pagamento')`,
      [pedido.id, pedido.usuario_id, item.item_id, item.quantidade, item.dias_aluguel, item.valor_diario]
    );
  }
  return rentalItems.length;
};

/**
 * Inicia os aluguéis do pedido no momento da confirmação do pagamento:
 * data_inicio = agora, devolução prevista = agora + dias contratados.
 * Retorna os aluguéis iniciados para registro de evento.
 */
export const iniciarAlugueisDoPedido = async (pedidoId, connection) => {
  const [rows] = await connection.execute(
    'SELECT id, item_id, usuario_id, dias_aluguel FROM alugueis WHERE pedido_id = ? AND status = ?',
    [pedidoId, STATUS_ALUGUEL.AGUARDANDO_PAGAMENTO]
  );
  for (const row of rows) {
    await connection.execute(
      `UPDATE alugueis
       SET status = 'ativo',
           data_inicio = NOW(),
           data_prevista_devolucao = DATE_ADD(NOW(), INTERVAL ? DAY)
       WHERE id = ? AND status = 'aguardando_pagamento'`,
      [row.dias_aluguel, row.id]
    );
    await registrarEvento(
      {
        usuarioId: row.usuario_id,
        pedidoId: Number(pedidoId),
        aluguelId: row.id,
        evento: 'aluguel_iniciado',
        descricao: `Aluguel liberado após confirmação do pagamento (${row.dias_aluguel} dias).`,
      },
      connection
    );
  }
  return rows;
};

export const cancelarAlugueisDoPedido = async (pedidoId, connection) => {
  const [rows] = await connection.execute(
    'SELECT id, usuario_id FROM alugueis WHERE pedido_id = ? AND status = ?',
    [pedidoId, STATUS_ALUGUEL.AGUARDANDO_PAGAMENTO]
  );
  for (const row of rows) {
    await connection.execute(
      "UPDATE alugueis SET status = 'cancelado' WHERE id = ? AND status = 'aguardando_pagamento'",
      [row.id]
    );
    await registrarEvento(
      { usuarioId: row.usuario_id, pedidoId: Number(pedidoId), aluguelId: row.id, evento: 'aluguel_cancelado', descricao: 'Aluguel cancelado junto ao pagamento não confirmado.' },
      connection
    );
  }
  return rows;
};

/**
 * Varredura periódica: aluguéis ativos com data de devolução ultrapassada
 * passam a 'vencido' e entram na fila de retirada. Um único UPDATE set-based
 * (§61: nada de varredura por request) precedido de SELECT dos IDs afetados
 * para registrar os eventos de histórico.
 */
export const marcarAlugueisVencidos = async () => {
  const [vencendo] = await pool.execute(
    `SELECT id, usuario_id, item_id, pedido_id, data_prevista_devolucao
     FROM alugueis
     WHERE status = 'ativo' AND data_prevista_devolucao IS NOT NULL AND data_prevista_devolucao < NOW()`
  );
  if (vencendo.length === 0) return { vencidos: 0 };

  const ids = vencendo.map((r) => r.id);
  await pool.query(
    `UPDATE alugueis SET status = 'vencido', status_retirada = 'pendente'
     WHERE id IN (${ids.map(() => '?').join(',')}) AND status = 'ativo'`,
    ids
  );

  for (const row of vencendo) {
    await registrarEvento({
      usuarioId: row.usuario_id,
      pedidoId: row.pedido_id,
      aluguelId: row.id,
      evento: 'aluguel_vencido',
      descricao: 'Período contratado ultrapassado; equipamento em posse do cliente.',
      metadados: { data_prevista_devolucao: row.data_prevista_devolucao },
    });
  }
  return { vencidos: vencendo.length };
};

/**
 * Vista do cliente (e do admin) já com dias excedentes e valor calculados
 * pelo backend — o frontend apenas representa (§63).
 */
export const listarAlugueisPorUsuarios = async (usuarioIds) => {
  const ids = (usuarioIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  const [rows] = await pool.query(
    `${SELECT_ALUGUEL}
     WHERE a.usuario_id IN (${placeholders})
     ORDER BY a.criado_em DESC`,
    ids
  );
  return rows.map(decorarAluguel);
};

const decorarAluguel = (row) => {
  const diasExcedentes = Number(row.dias_excedentes || 0);
  const valorExcedente = round2(diasExcedentes * Number(row.valor_diario || 0) * Number(row.quantidade || 1));
  return { ...row, dias_excedentes: diasExcedentes, valor_excedente: valorExcedente };
};

export const encontrarAluguelComExcedente = async (aluguelId, usuarioId) => {
  const [rows] = await pool.execute(
    `SELECT a.*,
            GREATEST(0, DATEDIFF(NOW(), a.data_prevista_devolucao)) AS dias_excedentes
     FROM alugueis a
     WHERE a.id = ? AND a.usuario_id = ?`,
    [aluguelId, usuarioId]
  );
  return rows[0] ? decorarAluguel(rows[0]) : null;
};

/**
 * Monta o pedido de regularização (dias excedentes + dias futuros opcionais).
 * TODO o valor é recalculado aqui, a partir do aluguel persistido — nunca
 * aceito do cliente (§17).
 */
export const calcularRegularizacao = async (aluguelId, usuarioId, diasAdicionais) => {
  const aluguel = await encontrarAluguelComExcedente(aluguelId, usuarioId);
  if (!aluguel) return { erro: 'not-found' };
  if (![STATUS_ALUGUEL.VENCIDO, STATUS_ALUGUEL.ATIVO, STATUS_ALUGUEL.REGULARIZADO].includes(aluguel.status)) {
    return { erro: 'status-invalido', aluguel };
  }

  const diasAdicionaisInt = Math.floor(Number(diasAdicionais) || 0);
  if (diasAdicionaisInt < 0 || diasAdicionaisInt > MAX_RENTAL_DAYS) {
    return { erro: 'dias-invalidos' };
  }
  const diasExcedentes = Number(aluguel.dias_excedentes || 0);
  if (diasExcedentes === 0 && diasAdicionaisInt === 0) {
    return { erro: 'nada-a-regularizar' };
  }

  const quantidade = Number(aluguel.quantidade || 1);
  const valorDiario = Number(aluguel.valor_diario || 0);
  const total = round2((diasExcedentes + diasAdicionaisInt) * valorDiario * quantidade);

  return {
    aluguel,
    regularizacao: {
      dias_excedentes: diasExcedentes,
      dias_adicionais: diasAdicionaisInt,
      dias_cobrados: diasExcedentes + diasAdicionaisInt,
      valor_diario: round2(valorDiario),
      quantidade,
      total,
    },
  };
};

/**
 * Aplicada na confirmação do pagamento de regularizacao_aluguel:
 * - com dias adicionais -> aluguel volta a 'ativo' com novo prazo;
 * - sem dias adicionais -> 'regularizado' (dívida quitada, aguardando devolução).
 */
export const aplicarRegularizacao = async (item, connection, pedidoId) => {
  const [rows] = await connection.execute(
    `SELECT a.*, GREATEST(0, DATEDIFF(NOW(), a.data_prevista_devolucao)) AS dias_excedentes
     FROM alugueis a WHERE a.id = ? FOR UPDATE`,
    [item.aluguel_id]
  );
  const aluguel = rows[0];
  if (!aluguel) return null;

  const diasAdicionais = Number(item.dias_adicionais || 0);
  if (diasAdicionais > 0) {
    await connection.execute(
      `UPDATE alugueis
       SET status = 'ativo',
           data_prevista_devolucao = DATE_ADD(NOW(), INTERVAL ? DAY),
           status_retirada = IF(status_retirada = 'realizada', status_retirada, 'nenhum')
       WHERE id = ?`,
      [diasAdicionais, aluguel.id]
    );
    await registrarEvento(
      {
        usuarioId: aluguel.usuario_id,
        pedidoId: Number(pedidoId),
        aluguelId: aluguel.id,
        evento: 'aluguel_estendido',
        descricao: `Excedentes quitados e período estendido em ${diasAdicionais} dia(s).`,
        metadados: { dias_excedentes_quitados: item.dias_excedentes, dias_adicionais: diasAdicionais },
      },
      connection
    );
  } else {
    // Quitação sem extensão: a contagem de excedentes recomeça da data de
    // quitação (data_prevista_devolucao = agora), evitando cobrar duas vezes
    // os mesmos dias na próxima regularização.
    await connection.execute(
      `UPDATE alugueis
       SET status = 'regularizado',
           data_prevista_devolucao = NOW(),
           status_retirada = IF(status_retirada = 'realizada', status_retirada, 'pendente')
       WHERE id = ? AND status IN ('vencido','regularizado','ativo')`,
      [aluguel.id]
    );
    await registrarEvento(
      {
        usuarioId: aluguel.usuario_id,
        pedidoId: Number(pedidoId),
        aluguelId: aluguel.id,
        evento: 'aluguel_regularizado',
        descricao: 'Dias excedentes quitados. Aguardando devolução do equipamento.',
        metadados: { dias_excedentes_quitados: item.dias_excedentes },
      },
      connection
    );
  }
  return aluguel;
};

/** Visão operacional para funcionário/admin, com filtros eficientes. */
export const listarAlugueisParaOperacao = async ({ status = null, vencidosAposRetiradaPendente = false, usuarioId = null } = {}) => {
  const condicoes = [];
  const valores = [];
  if (status) {
    condicoes.push('a.status = ?');
    valores.push(status);
  }
  if (vencidosAposRetiradaPendente) {
    condicoes.push("a.status = 'vencido'");
  }
  if (usuarioId) {
    condicoes.push('a.usuario_id = ?');
    valores.push(Number(usuarioId));
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `${SELECT_ALUGUEL}
     ${where}
     ORDER BY a.data_prevista_devolucao IS NULL, a.data_prevista_devolucao ASC`,
    valores
  );
  return rows.map(decorarAluguel);
};

export const atualizarRetirada = async (aluguelId, { status_retirada }) => {
  const [rows] = await pool.execute('SELECT * FROM alugueis WHERE id = ?', [aluguelId]);
  const aluguel = rows[0];
  if (!aluguel) return { erro: 'not-found' };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE alugueis SET status_retirada = ? WHERE id = ?', [status_retirada, aluguelId]);
    if (status_retirada === STATUS_RETIRADA.REALIZADA) {
      // Retirada conclui a devolução do equipamento.
      await connection.execute(
        "UPDATE alugueis SET status = 'devolvido' WHERE id = ? AND status IN ('vencido','regularizado','ativo')",
        [aluguelId]
      );
    }
    await registrarEvento(
      {
        usuarioId: aluguel.usuario_id,
        pedidoId: aluguel.pedido_id,
        aluguelId: Number(aluguelId),
        evento: 'retirada_atualizada',
        descricao: `Status da retirada atualizado para '${status_retirada}'.`,
      },
      connection
    );
    await connection.commit();
    return { ok: true, aluguel_id: Number(aluguelId), status_retirada };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
