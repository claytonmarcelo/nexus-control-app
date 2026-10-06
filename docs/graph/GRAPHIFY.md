# Graphify — grafo do repositório

O script `scan.mjs` percorre `backend/src` e `frontend/src`, extrai
imports, agrega dependências por camada e produz um `graph.json` que
alimenta o visualizador interativo `index.html`.

## Uso

```bash
cd <raiz-do-projeto>
node docs/graph/scan.mjs         # regenera docs/graph/graph.json
```

Abra o visualizador:

```bash
# opção 1 — servidor local simples
python -m http.server --directory docs/graph 5173
# http://localhost:5173/

# opção 2 — VSCode Live Server na pasta docs/graph
# opção 3 — abrir index.html direto no navegador (requer CDN para vis-network)
```

## Arquivos

- `scan.mjs` — gerador (Node ES Modules, sem dependências).
- `graph.json` — saída com `nodes`, `edges`, `stats` e `generatedAt`.
- `index.html` — visualizador com filtros por lado, tipo e busca.

## Estrutura do grafo

Nós:

- `kind: file` — arquivo real do projeto (`backend/src/...`, `frontend/src/...`).
  Propriedades extras: `layer` (bucket semântico, ex.: `controllers`,
  `infrastructure`, `integrations`, `components-admin`) e `side`
  (`frontend` | `backend`).
- `kind: macro` — nós agregadores (`camada:*`, `data:*`). Facilitam visão
  de alto nível sem perder o detalhe por arquivo.
- `kind: endpoint` — grupos de endpoints HTTP (`route:/api/...`).
- `kind: package` — pacotes npm importados.

Arestas (tipos):

- `local` — import relativo entre arquivos do projeto.
- `external` — dependência de pacote npm.
- `layer` — arquivo pertence a uma camada macro.
- `endpoint` — arquivo de rota expõe um endpoint.
- `http` — serviço do frontend chama o endpoint.
- `data` — infraestrutura escreve/lê uma tabela.
- `integration` — infraestrutura contata serviço externo (Mercado Pago, SMTP, MySQL).

## Estatísticas atuais

Rodando `node docs/graph/scan.mjs` agora:

- 118 arquivos rastreados
- 23 macros (camadas + tabelas + integrações)
- 7 endpoints agregados
- 23 pacotes npm citados
- 440 arestas

O `graph.json` contém `stats` atualizados a cada execução.

## Personalização

- **Adicionar um novo lado/cor**: ajuste `COLOR` e a lista `SIDE_BY_ID`
  em `index.html`.
- **Novas arestas de dados**: edite o array `DATA_EDGES` em `scan.mjs`.
  É a forma manual de dizer que, por exemplo,
  `backend/src/infrastructure/Aluguel.js` escreve na tabela
  `data:alugueis`.
- **Ignorar arquivos de teste**: já estão filtrados pela regex
  `/\.(test|spec)\./` na primeira passada.
- **Rodar em CI**: `node docs/graph/scan.mjs && git diff --exit-code docs/graph/graph.json`
  quebra o pipeline se o grafo divergir do código.

## Exemplo de inspeção via terminal

```bash
node -e "
const d = require('./docs/graph/graph.json');
console.log(d.stats);
console.log('controllers:', d.nodes.filter(n => n.layer === 'controllers').map(n => n.id));
console.log('chamadas para Aluguel.js:', d.edges.filter(e => e.target === 'backend/src/infrastructure/Aluguel.js').map(e => e.source));
"
```

## Limitações

- Imports dinâmicos com template string (`import(\`./x/\${y}\`)`) não são
  resolvidos; esses arquivos aparecem isolados no grafo.
- Arquivos fora de `backend/src` e `frontend/src` (scripts, configs,
  testes E2E) não entram no grafo por padrão — estenda `SOURCE_ROOTS`
  se precisar.
- Dependências transitivas (react-router-dom chama `history`?) não são
  expandidas — o grafo é de primeiro nível.
