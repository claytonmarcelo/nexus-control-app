import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';
import { useModal } from '../../contexts/ModalContext';

function FieldGroup({ label, htmlFor, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-nexus-300 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-nexus-500">{hint}</p>}
    </div>
  );
}

function SectionHeader({ title, icon, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {action}
    </div>
  );
}

function TagInput({ tags = [], onChange, placeholder }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const removeTag = (tag) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder || 'Digite e pressione Enter'}
          className="input flex-1 text-sm py-1.5"
        />
        <button type="button" onClick={addTag} className="btn btn-secondary text-xs px-3 py-1.5">
          + Adicionar
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-nexus-500/30 bg-nexus-500/10 text-nexus-300"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-nexus-500 hover:text-red-400 transition-colors ml-0.5"
              aria-label={`Remover ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CurriculoTab() {
  const { toast } = useModal();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [form, setForm] = useState({
    nome: '',
    cargo: '',
    email: '',
    telefone: '',
    github: '',
    linkedin: '',
    localizacao: '',
    sobre: '',
    disponibilidade: '',
    habilidades: {
      linguagens: [],
      frontend: [],
      backend: [],
      dados: [],
      devops: [],
      conceitos: [],
    },
    experiencias: [],
    formacao: [],
    projetos: [],
    outrosProjetos: '',
  });

  const loadCurriculo = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getCurriculo();
      if (data?.curriculo) {
        const c = data.curriculo;
        setForm({
          nome: c.nome || '',
          cargo: c.cargo || '',
          email: c.email || '',
          telefone: c.telefone || '',
          github: c.github || '',
          linkedin: c.linkedin || '',
          localizacao: c.localizacao || '',
          sobre: c.sobre || '',
          disponibilidade: c.disponibilidade || '',
          habilidades: {
            linguagens: c.habilidades?.linguagens || [],
            frontend: c.habilidades?.frontend || [],
            backend: c.habilidades?.backend || [],
            dados: c.habilidades?.dados || [],
            devops: c.habilidades?.devops || [],
            conceitos: c.habilidades?.conceitos || [],
          },
          experiencias: c.experiencias || [],
          formacao: c.formacao || [],
          projetos: c.projetos || [],
          outrosProjetos: c.outrosProjetos || '',
        });
        setLastUpdated(data.updated_at);
      }
    } catch (err) {
      console.error('[CurriculoTab] Erro ao carregar:', err);
      toast({ type: 'error', message: 'Erro ao carregar o currículo.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCurriculo();
  }, [loadCurriculo]);

  const handleField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleHabilidade = (categoria, tags) => {
    setForm((prev) => ({
      ...prev,
      habilidades: { ...prev.habilidades, [categoria]: tags },
    }));
  };

  // Formação
  const addFormacao = () => {
    setForm((prev) => ({
      ...prev,
      formacao: [
        ...prev.formacao,
        { curso: '', instituicao: '', periodo: '', descricao: '' },
      ],
    }));
  };

  const updateFormacao = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.formacao];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, formacao: updated };
    });
  };

  const removeFormacao = (index) => {
    setForm((prev) => ({
      ...prev,
      formacao: prev.formacao.filter((_, i) => i !== index),
    }));
  };

  // Projetos
  const addProjeto = () => {
    setForm((prev) => ({
      ...prev,
      projetos: [
        ...prev.projetos,
        { nome: '', descricao: '', tecnologias: [], link: '', destaque: true },
      ],
    }));
  };

  const updateProjeto = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.projetos];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, projetos: updated };
    });
  };

  const removeProjeto = (index) => {
    setForm((prev) => ({
      ...prev,
      projetos: prev.projetos.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast({ type: 'error', message: 'O campo "Nome" é obrigatório.' });
      return;
    }

    setSaving(true);
    try {
      const result = await adminService.updateCurriculo(form);
      if (result?.curriculo) {
        setLastUpdated(result.updated_at);
        toast({ type: 'success', message: 'Currículo atualizado com sucesso!' });
      }
    } catch (err) {
      console.error('[CurriculoTab] Erro ao salvar:', err);
      toast({ type: 'error', message: 'Erro ao salvar o currículo.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-4 border-nexus-500/20 border-t-nexus-500 animate-spin mx-auto" />
          <p className="text-nexus-400 text-sm">Carregando currículo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gerenciar Currículo</h2>
          <p className="text-nexus-400 text-sm mt-0.5">
            Edite e publique suas credenciais técnicas. O currículo é acessível publicamente em{' '}
            <a href="/curriculo" target="_blank" rel="noopener noreferrer" className="text-nexus-300 underline font-semibold">
              /curriculo
            </a>.
          </p>
          {lastUpdated && (
            <p className="text-nexus-500 text-xs mt-1">
              Última atualização: {new Date(lastUpdated).toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/curriculo"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visualizar Página
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary text-xs px-5 py-2 flex items-center gap-1.5 disabled:opacity-60 shadow-gold"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Dados Pessoais & Contato ────────────────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <SectionHeader
          title="Dados Pessoais & Contatos"
          icon={
            <svg className="w-5 h-5 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label="Nome Completo *" htmlFor="cv-nome">
            <input
              id="cv-nome"
              type="text"
              value={form.nome}
              onChange={(e) => handleField('nome', e.target.value)}
              placeholder="CLAYTON MARCELO TAVARES DE LIMA"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="Cargo / Tagline" htmlFor="cv-cargo">
            <input
              id="cv-cargo"
              type="text"
              value={form.cargo}
              onChange={(e) => handleField('cargo', e.target.value)}
              placeholder="Desenvolvedor Full-Stack Júnior | Estágio em Desenvolvimento de Software"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="E-mail" htmlFor="cv-email">
            <input
              id="cv-email"
              type="email"
              value={form.email}
              onChange={(e) => handleField('email', e.target.value)}
              placeholder="claytonlima10@gmail.com"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="Telefone / WhatsApp" htmlFor="cv-telefone">
            <input
              id="cv-telefone"
              type="tel"
              value={form.telefone}
              onChange={(e) => handleField('telefone', e.target.value)}
              placeholder="(21) 99155-6383"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="GitHub (URL ou perfil)" htmlFor="cv-github">
            <input
              id="cv-github"
              type="text"
              value={form.github}
              onChange={(e) => handleField('github', e.target.value)}
              placeholder="https://github.com/claytonmarcelo"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="LinkedIn (URL ou perfil)" htmlFor="cv-linkedin">
            <input
              id="cv-linkedin"
              type="text"
              value={form.linkedin}
              onChange={(e) => handleField('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/clayton-marcelo-dev"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="Localização" htmlFor="cv-local">
            <input
              id="cv-local"
              type="text"
              value={form.localizacao}
              onChange={(e) => handleField('localizacao', e.target.value)}
              placeholder="Rio de Janeiro/RJ"
              className="input w-full"
            />
          </FieldGroup>

          <FieldGroup label="Disponibilidade / Badge" htmlFor="cv-disp">
            <input
              id="cv-disp"
              type="text"
              value={form.disponibilidade}
              onChange={(e) => handleField('disponibilidade', e.target.value)}
              placeholder="Disponível para Estágio ou Posição Júnior"
              className="input w-full"
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Resumo Profissional" htmlFor="cv-sobre">
          <textarea
            id="cv-sobre"
            value={form.sobre}
            onChange={(e) => handleField('sobre', e.target.value)}
            rows={4}
            placeholder="Resumo do perfil, objetivos e diferenciais..."
            className="input w-full resize-none"
          />
        </FieldGroup>
      </div>

      {/* ─── Habilidades Técnicas por Categoria ──────────────────────────────── */}
      <div className="card p-6 space-y-5">
        <SectionHeader
          title="Habilidades Técnicas"
          icon={
            <svg className="w-5 h-5 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { key: 'linguagens', label: 'Linguagens de Programação', placeholder: 'JavaScript, TypeScript, PHP' },
            { key: 'frontend', label: 'Front-end', placeholder: 'React, React Native, Tailwind CSS, HTML5' },
            { key: 'backend', label: 'Back-end', placeholder: 'Node.js, Express, Fastify, Laravel' },
            { key: 'dados', label: 'Banco de Dados', placeholder: 'MySQL, MariaDB, Firebase, Prisma ORM' },
            { key: 'devops', label: 'Ferramentas & Deploy', placeholder: 'Git/GitHub, Vercel, Railway, JWT' },
            { key: 'conceitos', label: 'Conceitos & Arquitetura', placeholder: 'Arquitetura SaaS, Geolocalização, REST' },
          ].map(({ key, label, placeholder }) => (
            <FieldGroup key={key} label={label}>
              <TagInput
                tags={form.habilidades[key] || []}
                onChange={(tags) => handleHabilidade(key, tags)}
                placeholder={placeholder}
              />
            </FieldGroup>
          ))}
        </div>
      </div>

      {/* ─── Formação Acadêmica ─────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <SectionHeader
          title="Formação Acadêmica"
          icon={
            <svg className="w-5 h-5 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          }
          action={
            <button type="button" onClick={addFormacao} className="btn btn-secondary text-xs px-3 py-1.5">
              + Adicionar Formação
            </button>
          }
        />

        <div className="space-y-4">
          {form.formacao.map((f, idx) => (
            <div key={idx} className="bg-dark-bg/60 border border-dark-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-nexus-400 uppercase tracking-wider">
                  Curso #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeFormacao(idx)}
                  className="text-red-400 hover:text-red-300 text-xs transition-colors"
                >
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldGroup label="Curso" htmlFor={`form-curso-${idx}`}>
                  <input
                    id={`form-curso-${idx}`}
                    type="text"
                    value={f.curso}
                    onChange={(e) => updateFormacao(idx, 'curso', e.target.value)}
                    placeholder="Análise e Desenvolvimento de Sistemas"
                    className="input w-full text-sm"
                  />
                </FieldGroup>
                <FieldGroup label="Instituição" htmlFor={`form-inst-${idx}`}>
                  <input
                    id={`form-inst-${idx}`}
                    type="text"
                    value={f.instituicao}
                    onChange={(e) => updateFormacao(idx, 'instituicao', e.target.value)}
                    placeholder="UNISUAM — Centro Universitário Augusto Motta"
                    className="input w-full text-sm"
                  />
                </FieldGroup>
                <FieldGroup label="Período" htmlFor={`form-periodo-${idx}`}>
                  <input
                    id={`form-periodo-${idx}`}
                    type="text"
                    value={f.periodo}
                    onChange={(e) => updateFormacao(idx, 'periodo', e.target.value)}
                    placeholder="4º período em andamento"
                    className="input w-full text-sm"
                  />
                </FieldGroup>
              </div>
              <FieldGroup label="Descrição (opcional)" htmlFor={`form-desc-${idx}`}>
                <textarea
                  id={`form-desc-${idx}`}
                  value={f.descricao}
                  onChange={(e) => updateFormacao(idx, 'descricao', e.target.value)}
                  rows={2}
                  placeholder="Detalhes relevantes sobre a formação..."
                  className="input w-full resize-none text-sm"
                />
              </FieldGroup>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Projetos em Destaque ───────────────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <SectionHeader
          title="Projetos em Destaque"
          icon={
            <svg className="w-5 h-5 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
          action={
            <button type="button" onClick={addProjeto} className="btn btn-secondary text-xs px-3 py-1.5">
              + Adicionar Projeto
            </button>
          }
        />

        <div className="space-y-4">
          {form.projetos.map((proj, idx) => (
            <div key={idx} className="bg-dark-bg/60 border border-dark-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-nexus-400 uppercase tracking-wider">
                  Projeto #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeProjeto(idx)}
                  className="text-red-400 hover:text-red-300 text-xs transition-colors"
                >
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldGroup label="Nome do Projeto" htmlFor={`proj-nome-${idx}`}>
                  <input
                    id={`proj-nome-${idx}`}
                    type="text"
                    value={proj.nome}
                    onChange={(e) => updateProjeto(idx, 'nome', e.target.value)}
                    placeholder="Nexus Business Manager"
                    className="input w-full text-sm"
                  />
                </FieldGroup>
                <FieldGroup label="Link do Repositório / Deploy" htmlFor={`proj-link-${idx}`}>
                  <input
                    id={`proj-link-${idx}`}
                    type="url"
                    value={proj.link}
                    onChange={(e) => updateProjeto(idx, 'link', e.target.value)}
                    placeholder="https://github.com/claytonmarcelo/Nexus-Business-Manager"
                    className="input w-full text-sm"
                  />
                </FieldGroup>
              </div>

              <FieldGroup label="Descrição detalhada" htmlFor={`proj-desc-${idx}`}>
                <textarea
                  id={`proj-desc-${idx}`}
                  value={proj.descricao}
                  onChange={(e) => updateProjeto(idx, 'descricao', e.target.value)}
                  rows={2}
                  placeholder="Módulos, arquitetura, funcionalidades e impacto..."
                  className="input w-full resize-none text-sm"
                />
              </FieldGroup>

              <FieldGroup label="Tecnologias Utilizadas" htmlFor={`proj-techs-${idx}`}>
                <TagInput
                  tags={proj.tecnologias || []}
                  onChange={(tags) => updateProjeto(idx, 'tecnologias', tags)}
                  placeholder="React, Node.js, Fastify, MySQL, JWT"
                />
              </FieldGroup>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={proj.destaque ?? true}
                  onChange={(e) => updateProjeto(idx, 'destaque', e.target.checked)}
                  className="w-4 h-4 rounded accent-nexus-500"
                />
                <span className="text-xs text-nexus-300 group-hover:text-white transition-colors">
                  Exibir com badge ⭐ Destaque na página pública
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Outros Projetos Acadêmicos ─────────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <SectionHeader
          title="Outros Projetos Acadêmicos"
          icon={
            <svg className="w-5 h-5 text-nexus-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <FieldGroup label="Projetos complementares e de disciplina" htmlFor="cv-outros-projetos">
          <textarea
            id="cv-outros-projetos"
            value={form.outrosProjetos}
            onChange={(e) => handleField('outrosProjetos', e.target.value)}
            rows={3}
            placeholder="Petit-Vet (gestão veterinária com GPS), SwiftFin Pay, TaskFlow e demais projetos..."
            className="input w-full resize-none text-sm"
          />
        </FieldGroup>
      </div>

      {/* Botão salvar no rodapé */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-60 shadow-gold text-sm font-semibold"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvar Alterações no Currículo
            </>
          )}
        </button>
      </div>
    </div>
  );
}
