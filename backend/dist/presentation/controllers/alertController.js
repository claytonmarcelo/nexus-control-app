import { obterObrigacoesConta, listarContasVinculadas, STATUS_CONTA } from '../../infrastructure/Conta.js';
import { listarEventosPorUsuarios } from '../../infrastructure/EventLog.js';
import { findUserById } from '../../infrastructure/User.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { round2 } from '../../infrastructure/Preco.js';
const DIAS_AVISO_DEVOLUCAO = 3;
const mensagemPagamento = (pedido) => `O pedido #${pedido.id} (R$ ${Number(pedido.total).toFixed(2)}) ainda não teve o pagamento confirmado. Assim que ele for quitado, liberamos tudo automaticamente.`;
const mensagemAluguelVencido = (aluguel) => `O item "${aluguel.item_nome}" está com a devolução atrasada. Quanto antes regularizarmos, melhor para você continuar contando com o equipamento.`;
const mensagemDevolucaoProxima = (aluguel) => `Seu aluguel do item "${aluguel.item_nome}" vence em breve. Quer estender o período? É só usar a regularização no centro de alertas.`;
/**
 * GET /usuarios/me/alertas — centro de alertas do cliente (§9 friendly notices).
 * Tudo é derivado do estado real no banco (inclui contas anteriores vinculadas);
 * o frontend apenas apresenta — nada de regra no cliente (§63).
 */
export const getMyAlerts = async (req, res) => {
    try {
        const usuario = await findUserById(req.user.id);
        if (!usuario)
            return sendError(res, 'Usuário não encontrado', 404);
        const vinculos = await listarContasVinculadas(req.user.id);
        const contas = [req.user.id, ...vinculos];
        const obrigacoes = await Promise.all(contas.map((id) => obterObrigacoesConta(id)));
        const alerts = [];
        let totalDebitos = 0;
        for (const ob of obrigacoes) {
            for (const pedido of ob.pedidos_pendentes) {
                totalDebitos += Number(pedido.total || 0);
                alerts.push({
                    tipo: 'pagamento_pendente',
                    severidade: 'atencao',
                    pedido_id: pedido.id,
                    valor: round2(Number(pedido.total || 0)),
                    criado_em: pedido.criado_em,
                    mensagem: mensagemPagamento(pedido),
                    acao: 'pagar',
                });
            }
            for (const aluguel of ob.alugueis_abertos) {
                const diasExcedentes = aluguel.data_prevista_devolucao
                    ? diasEntre(aluguel.data_prevista_devolucao, new Date())
                    : 0;
                if (aluguel.status === 'vencido' || (aluguel.status === 'regularizado' && diasExcedentes > 0)) {
                    const valorExcedente = round2(diasExcedentes * Number(aluguel.valor_diario || 0) * Number(aluguel.quantidade || 1));
                    alerts.push({
                        tipo: 'aluguel_vencido',
                        severidade: 'urgente',
                        aluguel_id: aluguel.id,
                        item_nome: aluguel.item_nome,
                        dias_excedentes: diasExcedentes,
                        valor_excedente: valorExcedente,
                        mensagem: mensagemAluguelVencido(aluguel),
                        acao: 'regularizar',
                    });
                    totalDebitos += valorExcedente;
                }
                else if (aluguel.status === 'regularizado') {
                    alerts.push({
                        tipo: 'devolucao_pendente',
                        severidade: 'atencao',
                        aluguel_id: aluguel.id,
                        item_nome: aluguel.item_nome,
                        mensagem: `Os dias em atraso do item "${aluguel.item_nome}" estão quitados. Basta devolver o equipamento na nossa loja para encerrarmos o aluguel.`,
                        acao: 'devolver',
                    });
                }
                else if (aluguel.status === 'ativo' && aluguel.data_prevista_devolucao) {
                    const diasRestantes = diasEntre(new Date(), aluguel.data_prevista_devolucao);
                    if (diasRestantes <= DIAS_AVISO_DEVOLUCAO) {
                        alerts.push({
                            tipo: 'devolucao_proxima',
                            severidade: 'info',
                            aluguel_id: aluguel.id,
                            item_nome: aluguel.item_nome,
                            dias_restantes: diasRestantes,
                            data_prevista_devolucao: aluguel.data_prevista_devolucao,
                            mensagem: mensagemDevolucaoProxima(aluguel),
                            acao: 'estender',
                        });
                    }
                }
            }
        }
        if (usuario.status_conta === STATUS_CONTA.AVISO_INATIVIDADE) {
            alerts.push({
                tipo: 'aviso_inatividade',
                severidade: 'info',
                mensagem: 'Sentimos sua falta! Sua conta continua ativa — estamos apenas lembrando que você está sem compras ou aluguéis há algum tempo.',
                acao: 'explorar',
            });
        }
        const resumo = {
            possui_debitos: totalDebitos > 0,
            total_debitos: round2(totalDebitos),
            tem_alertas: alerts.length > 0,
            pode_desativar_sem_confirmar: alerts.filter((a) => ['pagamento_pendente', 'aluguel_vencido'].includes(a.tipo)).length === 0,
        };
        sendSuccess(res, { alerts, resumo }, 'Alertas carregados');
    }
    catch (error) {
        console.error('Erro ao carregar alertas:', error);
        sendError(res, 'Erro ao carregar alertas', 500);
    }
};
/** GET /usuarios/me/eventos — linha do tempo da conta (inclui histórico recuperado). */
export const getMyEvents = async (req, res) => {
    try {
        const vinculos = await listarContasVinculadas(req.user.id);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
        const eventos = await listarEventosPorUsuarios([req.user.id, ...vinculos], { limit });
        sendSuccess(res, { eventos }, 'Histórico carregado');
    }
    catch (error) {
        console.error('Erro ao carregar histórico do usuário:', error);
        sendError(res, 'Erro ao carregar histórico', 500);
    }
};
/** GET /usuarios/:id/eventos — auditoria de uma conta, apenas admin. */
export const getUserEvents = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 200);
        const eventos = await listarEventosPorUsuarios([Number(req.params.id)], { limit });
        sendSuccess(res, { userId: Number(req.params.id), eventos }, 'Histórico carregado');
    }
    catch (error) {
        console.error('Erro ao carregar histórico (admin):', error);
        sendError(res, 'Erro ao carregar histórico', 500);
    }
};
const diasEntre = (inicio, fim) => {
    const ms = new Date(fim).getTime() - new Date(inicio).getTime();
    return Math.max(0, Math.floor(ms / 86400000));
};
