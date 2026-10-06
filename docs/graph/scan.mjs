#!/usr/bin/env node
/**
 * Graphify — varre o código-fonte do Nexus Control App e produz um grafo
 * (nós + arestas) em JSON. Usado por docs/graph/index.html e pela
 * documentação em docs/ARQUITETURA.md.
 *
 * Uso:  node docs/graph/scan.mjs [raizDoProjeto]
 * Saída: docs/graph/graph.json
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));

const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

const SOURCE_ROOTS = [
  { key: 'backend',   dir: 'backend/src',         prefix: 'backend/' },
  { key: 'frontend',  dir: 'frontend/src',        prefix: 'frontend/' },
];

// Classifica um arquivo por "camada" (domain, infrastructure, presentation,
// application, config, middleware, utils, security, tests; para frontend:
// components, contexts, services, utils, pages, tests).
function classify(relPath) {
  const parts = relPath.split('/');
  if (parts[0] === 'backend') {
    if (parts[1] === 'domain') return parts[2] || 'domain';
    if (parts[1] === 'infrastructure') {
      if (parts[2] === 'payments') return 'integrations';
      if (parts[2] === 'security') return 'security';
      if (parts[2] === 'utils') return 'utils';
      if (parts[2] === 'config') return 'config';
      return 'infrastructure';
    }
    if (parts[1] === 'presentation') return parts[2] || 'presentation';
    if (parts[1] === 'application') return 'application';
    if (parts[1] === 'config') return 'config';
    if (parts[1] === 'middleware') return 'middleware';
    if (parts[1] === 'utils') return 'utils';
    if (parts[1] === 'tests') return 'tests';
    return 'backend';
  }
  if (parts[0] === 'frontend') {
    if (parts[1] === 'components') {
      if (parts[2] === 'dashboard') return 'components-dashboard';
      if (parts[2] === 'admin') return 'components-admin';
      if (parts[2] === 'auth') return 'components-auth';
      if (parts[2] === 'cart') return 'components-cart';
      if (parts[2] === 'layout') return 'components-layout';
      if (parts[2] === 'ui') return 'components-ui';
      if (parts[2] === 'welcome') return 'components-welcome';
      return 'components';
    }
    if (parts[1] === 'contexts') return 'contexts';
    if (parts[1] === 'services') return 'services';
    if (parts[1] === 'utils') return 'utils';
    if (parts[1] === 'tests') return 'tests';
    return 'frontend';
  }
  return 'misc';
}

async function walk(dir, rootLabel) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...await walk(full, rootLabel));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
      out.push({ abs: full, rel });
    }
  }
  return out;
}

// Extrai importadores de um arquivo: require()/import ... from '...' / import('...')
const IMPORT_RE = /(?:import\s[^'"]*?from\s*|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

function extractImports(source) {
  const imports = [];
  let match;
  while ((match = IMPORT_RE.exec(source)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

// Resolve um import relativo para o caminho normalizado de outro arquivo.
function resolveRelative(fromRel, spec) {
  if (!spec.startsWith('.')) return null;
  const fromDir = path.posix.dirname(fromRel);
  let joined = path.posix.normalize(path.posix.join(fromDir, spec));
  // remove .js/.jsx/.ts/.tsx/.mjs já presentes
  joined = joined.replace(/\.(js|jsx|ts|tsx|mjs|cjs)$/, '');
  const candidates = [joined, `${joined}.js`, `${joined}.jsx`, `${joined}.ts`, `${joined}.tsx`, `${joined}/index.js`, `${joined}/index.ts`];
  for (const c of candidates) {
    if (fileIndex.has(c)) return c;
  }
  return joined; // devolve mesmo sem match (nó externo ou não rastreado)
}

// Índices de arquivos
const fileIndex = new Map(); // rel -> meta
const nodes = [];
const edges = [];

for (const root of SOURCE_ROOTS) {
  const abs = path.join(repoRoot, root.dir);
  if (!existsSync(abs)) continue;
  const files = await walk(abs, root.key);
  for (const file of files) {
    const meta = { rel: file.rel, abs: file.abs, layer: classify(file.rel), side: root.key };
    fileIndex.set(file.rel, meta);
  }
}

// Constrói nós a partir dos arquivos rastreados
for (const [rel, meta] of fileIndex) {
  const basename = path.posix.basename(rel);
  if (/\.(test|spec)\./.test(basename)) continue; // ignora arquivos de teste no grafo
  const node = {
    id: rel,
    label: basename.replace(/\.(jsx?|tsx?|mjs|cjs)$/, ''),
    layer: meta.layer,
    side: meta.side,
    kind: 'file',
  };
  nodes.push(node);
}

// Segunda passada: arestas
for (const [rel, meta] of fileIndex) {
  if (/\.(test|spec)\./.test(path.posix.basename(rel))) continue;
  const source = await readFile(meta.abs, 'utf8');
  const imports = extractImports(source);
  for (const spec of imports) {
    if (spec.startsWith('.')) {
      const target = resolveRelative(rel, spec);
      if (!target) continue;
      const targetKey = fileIndex.has(target) ? target : null;
      if (!targetKey) continue;
      if (/\.(test|spec)\./.test(path.posix.basename(targetKey))) continue;
      edges.push({ source: rel, target: targetKey, type: 'local' });
    } else if (/^node:/.test(spec)) {
      // skip built-ins
    } else {
      // dependência externa — agrega uma vez por pacote
      const pkg = spec.startsWith('@')
        ? spec.split('/').slice(0, 2).join('/')
        : spec.split('/')[0];
      edges.push({ source: rel, target: `npm:${pkg}`, type: 'external' });
      // registra nó externo
      const externalId = `npm:${pkg}`;
      if (!nodes.find(n => n.id === externalId)) {
        nodes.push({ id: externalId, label: pkg, layer: 'external', side: 'npm', kind: 'package' });
      }
    }
  }
}

// Nós macro (camadas) para navegação rápida
const MACRO_LAYERS = [
  { id: 'camada:frontend-ui',       label: 'UI React',                side: 'frontend' },
  { id: 'camada:frontend-ctx',      label: 'Contextos',               side: 'frontend' },
  { id: 'camada:frontend-svc',      label: 'Serviços HTTP',           side: 'frontend' },
  { id: 'camada:backend-routes',    label: 'Rotas Express',           side: 'backend' },
  { id: 'camada:backend-ctrl',      label: 'Controllers',             side: 'backend' },
  { id: 'camada:backend-mw',        label: 'Middlewares',             side: 'backend' },
  { id: 'camada:backend-infra',     label: 'Infraestrutura / DB',     side: 'backend' },
  { id: 'camada:backend-domain',    label: 'Domínio',                 side: 'backend' },
  { id: 'camada:backend-integr',    label: 'Integrações externas',    side: 'backend' },
  { id: 'camada:backend-sec',       label: 'Segurança',               side: 'backend' },
  { id: 'camada:backend-util',      label: 'Utils / Response',        side: 'backend' },
  { id: 'data:usuarios',            label: 'Tabela usuarios',         side: 'data' },
  { id: 'data:itens',               label: 'Tabela itens',            side: 'data' },
  { id: 'data:pedidos',             label: 'Tabela pedidos',          side: 'data' },
  { id: 'data:alugueis',            label: 'Tabela alugueis',         side: 'data' },
  { id: 'data:negociacoes',         label: 'Tabela negociacoes',      side: 'data' },
  { id: 'data:usuario_permissoes',  label: 'Tabela usuario_permissoes', side: 'data' },
  { id: 'data:password_resets',     label: 'Tabela password_resets',  side: 'data' },
  { id: 'data:historico_eventos',   label: 'Tabela historico_eventos',side: 'data' },
  { id: 'data:vinculos_conta',      label: 'Tabela vinculos_conta',   side: 'data' },
  { id: 'ext:mercadopago',          label: 'Mercado Pago',            side: 'external' },
  { id: 'ext:smtp',                 label: 'SMTP (Nodemailer)',       side: 'external' },
  { id: 'ext:mysql',                label: 'MySQL (nexusdb)',         side: 'external' },
];

for (const macro of MACRO_LAYERS) {
  if (!nodes.find(n => n.id === macro.id)) nodes.push({ ...macro, kind: 'macro' });
}

// Mapa camadas → nós concretos (heurístico por `layer`)
const LAYER_TO_MACRO = {
  'components-dashboard': 'camada:frontend-ui',
  'components-admin': 'camada:frontend-ui',
  'components-auth': 'camada:frontend-ui',
  'components-cart': 'camada:frontend-ui',
  'components-layout': 'camada:frontend-ui',
  'components-ui': 'camada:frontend-ui',
  'components-welcome': 'camada:frontend-ui',
  'components': 'camada:frontend-ui',
  'contexts': 'camada:frontend-ctx',
  'services': 'camada:frontend-svc',
  'routes': 'camada:backend-routes',
  'controllers': 'camada:backend-ctrl',
  'middleware': 'camada:backend-mw',
  'infrastructure': 'camada:backend-infra',
  'entities': 'camada:backend-domain',
  'repositories': 'camada:backend-domain',
  'integrations': 'camada:backend-integr',
  'security': 'camada:backend-sec',
  'utils': 'camada:backend-util',
  'config': 'camada:backend-util',
  'application': 'camada:backend-ctrl',
};
for (const node of nodes) {
  if (node.kind !== 'file') continue;
  const macro = LAYER_TO_MACRO[node.layer];
  if (macro && !edges.find(e => e.source === node.id && e.target === macro)) {
    edges.push({ source: node.id, target: macro, type: 'layer' });
  }
}

// Arestas de dados (heurística manual — onde a infra toca cada tabela)
const DATA_EDGES = [
  { source: 'backend/src/infrastructure/User.js',        target: 'data:usuarios' },
  { source: 'backend/src/infrastructure/Conta.js',       target: 'data:usuarios' },
  { source: 'backend/src/infrastructure/Conta.js',       target: 'data:vinculos_conta' },
  { source: 'backend/src/infrastructure/Item.js',        target: 'data:itens' },
  { source: 'backend/src/infrastructure/Order.js',       target: 'data:pedidos' },
  { source: 'backend/src/infrastructure/Pagamento.js',   target: 'data:pedidos' },
  { source: 'backend/src/infrastructure/Aluguel.js',     target: 'data:alugueis' },
  { source: 'backend/src/infrastructure/Negotiation.js', target: 'data:negociacoes' },
  { source: 'backend/src/infrastructure/Permission.js',  target: 'data:usuario_permissoes' },
  { source: 'backend/src/infrastructure/PasswordReset.js', target: 'data:password_resets' },
  { source: 'backend/src/infrastructure/EventLog.js',    target: 'data:historico_eventos' },
  { source: 'backend/src/infrastructure/config/database.js', target: 'ext:mysql' },
  { source: 'backend/src/infrastructure/payments/mercadopago.js', target: 'ext:mercadopago' },
  { source: 'backend/src/utils/email.js',                target: 'ext:smtp' },
];
for (const e of DATA_EDGES) {
  edges.push({ ...e, type: 'data' });
}

// Rótulos curtos por aresta de rota → endpoint (opcional)
const ENDPOINTS = [
  { id: 'route:/api/auth',           label: 'POST /auth · GET /auth/me',      side: 'endpoint' },
  { id: 'route:/api/itens',          label: '/itens',                          side: 'endpoint' },
  { id: 'route:/api/usuarios',       label: '/usuarios · /me · /:id/eventos',  side: 'endpoint' },
  { id: 'route:/api/pedidos',        label: '/pedidos · confirmar pagamento',  side: 'endpoint' },
  { id: 'route:/api/admin',          label: '/admin',                          side: 'endpoint' },
  { id: 'route:/api/pagamentos',     label: '/pagamentos · webhook MP',        side: 'endpoint' },
  { id: 'route:/api/alugueis',       label: '/alugueis · regularização · retirada', side: 'endpoint' },
];
for (const ep of ENDPOINTS) nodes.push({ ...ep, kind: 'endpoint' });

const ROUTE_ENDPOINT = {
  'backend/src/presentation/routes/auth.ts': 'route:/api/auth',
  'backend/src/presentation/routes/items.ts': 'route:/api/itens',
  'backend/src/presentation/routes/users.ts': 'route:/api/usuarios',
  'backend/src/presentation/routes/orders.ts': 'route:/api/pedidos',
  'backend/src/presentation/routes/admin.ts': 'route:/api/admin',
  'backend/src/presentation/routes/payments.ts': 'route:/api/pagamentos',
  'backend/src/presentation/routes/alugueis.ts': 'route:/api/alugueis',
};
for (const [file, endpoint] of Object.entries(ROUTE_ENDPOINT)) {
  edges.push({ source: file, target: endpoint, type: 'endpoint' });
}

// Serviço frontend → endpoint (heurístico pelos prefixos usados em services.js)
const SVC_ENDPOINT = [
  { source: 'frontend/src/services/services.js', target: 'route:/api/auth' },
  { source: 'frontend/src/services/services.js', target: 'route:/api/itens' },
  { source: 'frontend/src/services/services.js', target: 'route:/api/usuarios' },
  { source: 'frontend/src/services/services.js', target: 'route:/api/pedidos' },
  { source: 'frontend/src/services/services.js', target: 'route:/api/admin' },
  { source: 'frontend/src/services/services.js', target: 'route:/api/pagamentos' },
  { source: 'frontend/src/services/services.js', target: 'route:/api/alugueis' },
];
for (const e of SVC_ENDPOINT) edges.push({ ...e, type: 'http' });

const output = {
  generatedAt: new Date().toISOString(),
  repoRoot: path.relative(process.cwd(), repoRoot) || '.',
  stats: {
    files: nodes.filter(n => n.kind === 'file').length,
    macros: nodes.filter(n => n.kind === 'macro').length,
    endpoints: nodes.filter(n => n.kind === 'endpoint').length,
    externalPackages: nodes.filter(n => n.kind === 'package').length,
    edges: edges.length,
  },
  nodes,
  edges,
};

const outFile = path.join(__dirname, 'graph.json');
await writeFile(outFile, JSON.stringify(output, null, 2), 'utf8');
console.log(`Grafo gravado em ${outFile}`);
console.log(JSON.stringify(output.stats, null, 2));
