export class Order {
    constructor({ id, usuario_id, itens, total, status, status_pagamento, criado_em, atualizado_em }) {
        this.id = id;
        this.usuario_id = usuario_id;
        this.itens = itens || [];
        this.total = total || 0;
        this.status = status || 'novo';
        this.status_pagamento = status_pagamento || 'pendente';
        this.criado_em = criado_em;
        this.atualizado_em = atualizado_em;
    }
    static ORDER_STATUS = {
        NOVO: 'novo',
        PROCESSANDO: 'processando',
        CONCLUIDO: 'concluido',
        CANCELADO: 'cancelado'
    };
    static PAYMENT_STATUS = {
        PENDENTE: 'pendente',
        PROCESSANDO: 'processando',
        CONFIRMADO: 'confirmado',
        RECUSADO: 'recusado',
        ESTORNADO: 'estornado'
    };
    isPaid() {
        return this.status_pagamento === Order.PAYMENT_STATUS.CONFIRMADO;
    }
    isPending() {
        return this.status_pagamento === Order.PAYMENT_STATUS.PENDENTE;
    }
    isComplete() {
        return this.status === Order.ORDER_STATUS.CONCLUIDO;
    }
    canBeCanceled() {
        return this.status === Order.ORDER_STATUS.NOVO || this.status === Order.ORDER_STATUS.PROCESSANDO;
    }
    toJSON() {
        return {
            id: this.id,
            usuario_id: this.usuario_id,
            itens: this.itens,
            total: this.total,
            status: this.status,
            status_pagamento: this.status_pagamento,
            criado_em: this.criado_em,
            atualizado_em: this.atualizado_em
        };
    }
}
