# Documentação do Nexus Control App

Conjunto de referências técnicas do repositório. Cada arquivo cobre um aspecto
do sistema; comece por **ARQUITETURA** para ter o mapa mental geral e depois
mergulhe nas referências específicas.

| Documento | Escopo |
| :--- | :--- |
| [ARQUITETURA.md](./ARQUITETURA.md) | Visão macro, camadas, diagramas Mermaid |
| [API.md](./API.md) | Todos os endpoints HTTP, parâmetros, respostas |
| [DADOS.md](./DADOS.md) | Schema MySQL — tabelas, colunas, índices, enums |
| [FRONTEND.md](./FRONTEND.md) | Rotas React, componentes, contextos, serviços |
| [SEGURANCA.md](./SEGURANCA.md) | Autenticação, autorização, rate limits, segredos |
| [TESTES.md](./TESTES.md) | Como rodar as suítes Jest e Vitest; coberturas |
| [REGRAS_NEGOCIO.md](../REGRAS_NEGOCIO.md) | Regras globais implementadas (raiz do projeto) |
| [HISTORIA.md](./HISTORIA.md) | Linha do tempo completa do desenvolvimento |
| [RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md](./reports/RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md) | Entrega final das 8 fases das regras de negócio |
| [reports/](./reports/) | Relatórios, auditorias e resumos de marcos (antes espalhados na raiz) |
| [graph/GRAPHIFY.md](./graph/GRAPHIFY.md) | Grafo interativo do repositório (scan + HTML) |
| [../README.md](../README.md) | Instalação e uso geral (mantido separado desta pasta) |

Mantidos na raiz do projeto (documentos principais, com links externos já
estabelecidos): `README.md`, `README.en.md`, `CHANGELOG.md`, `SETUP.md`,
`TESTING.md`, `REGRAS_NEGOCIO.md`, `DEPLOY_CHECKLIST.md`,
`AWS_ACADEMY_INFRASTRUCTURE.md`, `INSTRUCOES_ATUALIZACAO_AWS.md`.

Relatórios/status de marcos movidos para [`docs/reports/`](./reports/):
`PRODUCTION_READY.md`, `DEPLOYMENT_SUMMARY.md`, `CHANGES_LOG.md`,
`E2E_TESTING_REPORT.md`, `ANALISE_AUTH_FLOWS.md`, `ASSETS_AUDIT_REPORT.md`,
`IMPLEMENTATION_SUMMARY.md`, `PROJECT_STATUS.md`,
`RELATORIO_IMPLEMENTACAO_REGRAS_NEGOCIO.md`.
