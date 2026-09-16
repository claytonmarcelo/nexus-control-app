export class Item {
  constructor({ id, nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque, criado_por, criado_em, criador_nome }) {
    this.id = id;
    this.nome = nome;
    this.descricao = descricao;
    this.categoria = categoria || 'Informática';
    this.fabricante = fabricante;
    this.imagem_url = imagem_url;
    this.valor_venda = valor_venda;
    this.valor_aluguel_mensal = valor_aluguel_mensal;
    this.estoque = estoque || 1;
    this.criado_por = criado_por;
    this.criado_em = criado_em;
    this.criador_nome = criador_nome;
  }

  isAvailable() {
    return this.estoque > 0;
  }

  isAvailableForRent() {
    return this.valor_aluguel_mensal !== null && this.valor_aluguel_mensal > 0;
  }

  isAvailableForSale() {
    return this.valor_venda !== null && this.valor_venda > 0;
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      categoria: this.categoria,
      fabricante: this.fabricante,
      imagem_url: this.imagem_url,
      valor_venda: this.valor_venda,
      valor_aluguel_mensal: this.valor_aluguel_mensal,
      estoque: this.estoque,
      criado_por: this.criado_por,
      criado_em: this.criado_em,
      criador_nome: this.criador_nome
    };
  }
}