import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft, ChevronRight, X, Zap, Loader2, Check, HelpCircle,
  Target, Lightbulb, AlertTriangle, TrendingUp, Building2, Sparkles, Brain
} from "lucide-react";

// ─── STEP DEFINITIONS ────────────────────────────────────────────────────────

const STEPS = [
  { id: "perfil",      icon: Building2,    label: "Perfil",       emoji: "🏢", description: "Contexto da empresa e diagnóstico" },
  { id: "setores",     icon: Target,        label: "Foco",         emoji: "🎯", description: "Setores e temas de interesse" },
  { id: "desafios",    icon: AlertTriangle, label: "Desafios",     emoji: "⚡", description: "O que precisa ser resolvido" },
  { id: "resultados",  icon: TrendingUp,    label: "Resultados",   emoji: "📈", description: "O que espera alcançar" },
  { id: "restricoes",  icon: Lightbulb,     label: "Restrições",   emoji: "🔒", description: "Limitações e condicionantes" },
  { id: "contexto",    icon: Sparkles,      label: "Contexto",     emoji: "✨", description: "Visão estratégica adicional" },
];

// ─── OPTIONS ─────────────────────────────────────────────────────────────────

const SECTORS = [
  { label: "Energia", emoji: "⚡" }, { label: "Saúde", emoji: "🏥" },
  { label: "Financeiro", emoji: "💰" }, { label: "Agro", emoji: "🌱" },
  { label: "Varejo", emoji: "🛍️" }, { label: "Indústria", emoji: "🏭" },
  { label: "Logística", emoji: "🚚" }, { label: "Educação", emoji: "📚" },
  { label: "Construção", emoji: "🏗️" }, { label: "Mobilidade", emoji: "🚗" },
  { label: "TI & Software", emoji: "💻" }, { label: "Outros", emoji: "🔮" },
];

const THEMES = [
  { label: "Automação e IA", emoji: "🤖" }, { label: "Sustentabilidade / ESG", emoji: "🌿" },
  { label: "Experiência do Cliente", emoji: "🎯" }, { label: "Eficiência Operacional", emoji: "⚙️" },
  { label: "Novos Modelos de Negócio", emoji: "💡" }, { label: "Segurança e Compliance", emoji: "🔐" },
  { label: "Dados e Analytics", emoji: "📊" }, { label: "Conectividade / IoT", emoji: "📡" },
  { label: "Biotecnologia", emoji: "🧬" }, { label: "Marketplace", emoji: "🛒" },
  { label: "Pagamentos e Fintech", emoji: "💳" }, { label: "Plataformas B2B", emoji: "🤝" },
];

const CHALLENGES = [
  { label: "Falta de agilidade nos processos internos", emoji: "🐌" },
  { label: "Dificuldade em escalar operações", emoji: "📈" },
  { label: "Custos operacionais elevados", emoji: "💸" },
  { label: "Experiência do cliente abaixo do esperado", emoji: "😕" },
  { label: "Necessidade de novos canais de receita", emoji: "🔀" },
  { label: "Lacunas de dados e analytics", emoji: "📉" },
  { label: "Pressão regulatória e compliance", emoji: "⚖️" },
  { label: "Concorrência de novos entrantes digitais", emoji: "🏃" },
  { label: "Dificuldade em atrair e reter talentos", emoji: "👥" },
  { label: "Sustentabilidade e metas ESG", emoji: "🌍" },
  { label: "Segurança da informação e cibersegurança", emoji: "🔒" },
  { label: "Integração entre sistemas legados e novos", emoji: "🔗" },
];

const EXPECTED_RESULTS = [
  { label: "Redução de custos operacionais (>10%)", emoji: "💰" },
  { label: "Aumento de receita com novos produtos/canais", emoji: "📈" },
  { label: "Melhoria na experiência e NPS do cliente", emoji: "⭐" },
  { label: "Acesso a novas tecnologias estratégicas", emoji: "🚀" },
  { label: "Ganhos de eficiência e produtividade", emoji: "⚙️" },
  { label: "Cumprimento de metas ESG e sustentabilidade", emoji: "🌱" },
  { label: "Redução de riscos regulatórios", emoji: "🛡️" },
  { label: "Aceleração do time-to-market", emoji: "⏩" },
  { label: "Construção de ecossistema de parceiros", emoji: "🤝" },
  { label: "Desenvolvimento de cultura de inovação", emoji: "💡" },
];

const RESTRICTIONS = [
  { label: "Orçamento limitado (PoC < R$100k)", emoji: "💳" },
  { label: "Orçamento médio (PoC entre R$100k–R$500k)", emoji: "💰" },
  { label: "Alto orçamento disponível (PoC > R$500k)", emoji: "🏦" },
  { label: "Prazo curto (resultado em até 6 meses)", emoji: "⏰" },
  { label: "Exige integração com sistemas legados (SAP, Oracle, etc.)", emoji: "🔗" },
  { label: "Restrições regulatórias específicas do setor", emoji: "⚖️" },
  { label: "Necessita aprovação de comitê ou diretoria", emoji: "✅" },
  { label: "Prefere soluções SaaS / sem infraestrutura própria", emoji: "☁️" },
  { label: "Exige startups com cases comprovados (não MVP)", emoji: "📋" },
  { label: "Deve ter aplicação geográfica específica (região/país)", emoji: "📍" },
];

const HORIZONS = [
  { label: "Curto prazo (0–12 meses)", sub: "Quick wins, eficiência imediata", color: "#2C4425" },
  { label: "Médio prazo (1–3 anos)", sub: "Transformação e novos modelos", color: "#6B2FA0" },
  { label: "Longo prazo (3–5 anos)", sub: "Inovação disruptiva e futuro", color: "#E10867" },
];

const ENGAGEMENT_TYPES = [
  { label: "Prova de Conceito (PoC)", sub: "Testar a solução em ambiente controlado" },
  { label: "Projeto Piloto", sub: "Implementação limitada antes de escalar" },
  { label: "Parceria Comercial", sub: "Contrato de prestação de serviço" },
  { label: "Investimento / CVC", sub: "Participação no capital da startup" },
  { label: "PDI Conjunto", sub: "Desenvolvimento compartilhado de produto" },
  { label: "Licenciamento de Tecnologia", sub: "Usar a solução da startup sem exclusividade" },
];

// ─── AI GAP → CHALLENGE MAPPING ──────────────────────────────────────────────
const AI_GAP_TO_CHALLENGE = {
  estrategia: "Falta de agilidade nos processos internos",
  governanca: "Pressão regulatória e compliance",
  valor: "Custos operacionais elevados",
  operacoes: "Integração entre sistemas legados e novos",
  ecossistema: "Concorrência de novos entrantes digitais",
  dados: "Lacunas de dados e analytics",
  tecnologia: "Segurança da informação e cibersegurança",
  habilidades: "Dificuldade em atrair e reter talentos",
  frugalidade: "Sustentabilidade e metas ESG",
};

const DIMENSION_NAMES = {
  estrategia: "Estratégia e Liderança", governanca: "Governança",
  valor: "Valor em Produção", operacoes: "Operações",
  ecossistema: "Ecossistema e Parceiros", dados: "Dados e Infraestrutura",
  tecnologia: "Tecnologia", habilidades: "Habilidades e Cultura",
  frugalidade: "Frugalidade e Impacto",
};

// ─── CHIP BUTTON ─────────────────────────────────────────────────────────────

function Chip({ label, emoji, selected, onClick, color = "#E10867", bgColor = "#fce7ef" }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left"
      style={{
        borderColor: selected ? color : "#A7ADA7",
        background: selected ? bgColor : "#fff",
        color: selected ? color : "#4B4F4B",
      }}
    >
      {selected && <Check className="w-3 h-3 flex-shrink-0" />}
      {!selected && emoji && <span className="flex-shrink-0">{emoji}</span>}
      <span>{label}</span>
    </button>
  );
}

// ─── MAIN WIZARD ─────────────────────────────────────────────────────────────

export default function ThesisWizard({ corporate, sessions, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [aiHint, setAiHint] = useState(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [aiAssessment, setAiAssessment] = useState(null);
  const [loadingAssessment, setLoadingAssessment] = useState(true);

  const [form, setForm] = useState({
    name: "",
    session_id: sessions[0]?.id || "",
    sectors: [],
    themes: [],
    challenges: [],
    expected_results: [],
    restrictions: [],
    horizon: "",
    engagement_types: [],
    strategic_context: "",
    current_initiatives: "",
    no_go_areas: "",
  });

  // Load AI Assessment and pre-fill challenges from gaps
  useEffect(() => {
    if (!corporate?.id) { setLoadingAssessment(false); return; }
    base44.entities.AIAssessment.filter({ corporate_id: corporate.id }, "-created_date", 1)
      .then(res => {
        if (res.length > 0) {
          const assessment = res[0];
          setAiAssessment(assessment);
          // Pre-fill challenges from top 3 gaps (lowest scoring dimensions)
          const dimScores = assessment.dimension_scores || {};
          const sorted = Object.entries(dimScores).sort(([,a],[,b]) => a - b);
          const topGapDims = sorted.slice(0, 3).map(([k]) => k);
          const suggestedChallenges = topGapDims
            .map(dim => AI_GAP_TO_CHALLENGE[dim])
            .filter(Boolean);
          setForm(f => ({ ...f, challenges: suggestedChallenges }));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingAssessment(false));
  }, [corporate?.id]);

  const toggle = (field, value) => {
    setForm(f => {
      const arr = f[field].includes(value) ? f[field].filter(x => x !== value) : [...f[field], value];
      return { ...f, [field]: arr };
    });
  };

  const canAdvance = () => {
    if (step === 1) return form.sectors.length > 0 || form.themes.length > 0;
    if (step === 2) return form.challenges.length > 0;
    if (step === 3) return form.expected_results.length > 0;
    return true;
  };

  const askHint = async (stepId) => {
    setLoadingHint(true);
    setAiHint(null);
    const hints = {
      perfil: "Explique brevemente (2-3 frases) por que vincular um diagnóstico de maturidade enriquece uma tese de inovação corporativa.",
      setores: "Dê 2-3 exemplos de setores/temas de inovação que costumam ser transformadores para corporates no Brasil em 2025.",
      desafios: "Explique como identificar os desafios certos de inovação ajuda a encontrar startups mais relevantes (2-3 frases).",
      resultados: "Por que definir resultados esperados antes de buscar startups é fundamental para uma tese de inovação bem-sucedida? (2-3 frases)",
      restricoes: "Explique como restrições e limitações ajudam a filtrar startups mais adequadas ao contexto do corporate (2-3 frases).",
      contexto: "Que tipo de contexto estratégico adicional mais enriquece uma tese de inovação corporativa? Dê 2 exemplos práticos.",
    };
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é consultor sênior de inovação da Beta-i Brasil. Responda de forma clara, prática e motivadora: ${hints[STEPS[step].id]}. Responda em português, máximo 3 frases.`
    });
    setAiHint(res);
    setLoadingHint(false);
  };

  const generateThesis = async () => {
    setGenerating(true);
    const selectedSession = sessions.find(s => s.id === form.session_id) || sessions[0];

    // Build AI Assessment context (Scenario B)
    const aiScanSection = aiAssessment
      ? (() => {
          const dimScores = aiAssessment.dimension_scores || {};
          const sorted = Object.entries(dimScores).sort(([,a],[,b]) => a - b);
          const gaps = sorted.slice(0, 3).map(([k, v]) => `${DIMENSION_NAMES[k] || k}: ${Math.round(v)}/100`).join(", ");
          const strengths = sorted.slice(-2).reverse().map(([k, v]) => `${DIMENSION_NAMES[k] || k}: ${Math.round(v)}/100`).join(", ");
          return `
═══════════════════════════════
AI READINESS SCAN (CENÁRIO B — integrar à tese)
═══════════════════════════════
Score Global de Prontidão em IA: ${Math.round(aiAssessment.global_score)}/100
Maiores Gaps de IA (dimensões mais fracas): ${gaps}
Pontos Fortes de IA: ${strengths}

INSTRUÇÃO ESPECIAL: Use os gaps identificados acima para sugerir Macrocategorias e perfis de startups focadas em resolver esses gaps tecnológicos. Inclua um parágrafo no "Contexto Estratégico" da tese que cite a prontidão atual da empresa para adoção de IA (score ${Math.round(aiAssessment.global_score)}/100) e como isso influencia a estratégia de inovação.`;
        })()
      : `
═══════════════════════════════
AI READINESS SCAN (CENÁRIO A — não realizado)
═══════════════════════════════
O usuário não realizou o AI Readiness Scan. Gere a tese baseando-se exclusivamente no Diagnóstico de Maturidade e nas verticais de interesse.`;

    const prompt = `Você é especialista sênior em inovação aberta e teses de inovação corporativa da Beta-i Brasil, uma das maiores aceleradoras de inovação aberta da Europa e América Latina.

Crie uma TESE DE INOVAÇÃO DETALHADA, APROFUNDADA E ALTAMENTE PERSONALIZADA para a empresa abaixo.

═══════════════════════════════
PERFIL DA EMPRESA
═══════════════════════════════
Empresa: ${corporate.company_name || corporate.trade_name}
Nome fantasia: ${corporate.trade_name || "N/A"}
Setor principal: ${corporate.sector || "N/A"}
Porte: ${corporate.size || "N/A"}
Estado: ${corporate.state || "N/A"}
Objetivos de inovação declarados: ${(corporate.innovation_objectives || []).join(", ") || "N/A"}

═══════════════════════════════
DIAGNÓSTICO DE MATURIDADE
═══════════════════════════════
${selectedSession
  ? `Score geral: ${selectedSession.overall_score}% — Nível: ${selectedSession.maturity_level}
Síntese: ${selectedSession.ai_synthesis || "N/A"}
Quick wins identificados: ${(selectedSession.quick_wins || []).join(", ") || "N/A"}
Iniciativas estratégicas: ${(selectedSession.strategic_initiatives || []).join(", ") || "N/A"}`
  : "Diagnóstico não realizado. Criar tese com base apenas nas informações fornecidas."}

═══════════════════════════════
FOCO DA TESE
═══════════════════════════════
Setores de interesse para inovação: ${form.sectors.join(", ") || "Geral"}
Temas / áreas prioritárias: ${form.themes.join(", ") || "Geral"}

═══════════════════════════════
DESAFIOS DE NEGÓCIO A RESOLVER
═══════════════════════════════
${form.challenges.join("\n- ") || "Não especificado"}

═══════════════════════════════
RESULTADOS ESPERADOS COM A INOVAÇÃO
═══════════════════════════════
${form.expected_results.join("\n- ") || "Não especificado"}

═══════════════════════════════
RESTRIÇÕES E CONDICIONANTES
═══════════════════════════════
${form.restrictions.join("\n- ") || "Não especificado"}

═══════════════════════════════
HORIZONTE E TIPO DE ENGAJAMENTO
═══════════════════════════════
Horizonte preferido: ${form.horizon || "Médio prazo (1–3 anos)"}
Tipos de engajamento desejados: ${form.engagement_types.join(", ") || "Aberto a todos os modelos"}

═══════════════════════════════
CONTEXTO ESTRATÉGICO ADICIONAL
═══════════════════════════════
Visão e contexto: ${form.strategic_context || "N/A"}
Iniciativas atuais em andamento: ${form.current_initiatives || "N/A"}
Áreas fora do escopo (no-go): ${form.no_go_areas || "N/A"}
${aiScanSection}

═══════════════════════════════
INSTRUÇÕES DE GERAÇÃO
═══════════════════════════════
Com base em TODOS os dados acima, gere uma tese de inovação completa com:

1. THESIS_TEXT: Narrativa estratégica da tese (4-5 parágrafos) contextualizando:
   - Por que esses setores/temas são relevantes para ESTE corporate agora
   - Como os desafios identificados se conectam à busca por inovação externa
   - Que tipo de soluções e startups serão buscadas
   - Como o engajamento com startups deve funcionar neste contexto
   - Quais são os critérios de sucesso e impacto esperado

2. MACRO_CATEGORIES: 5-7 macrocategorias específicas de inovação derivadas da tese
   (ex: para Energia → "Virtual Power Plant", "Energy as a Service", "Smart Grid B2B")
   (ex: para Bancos → "Embedded Finance", "Credit Risk AI", "Open Finance")
   Devem ser específicas ao setor e temas escolhidos, não genéricas.

3. TOP_PRIORITIES: 5-7 prioridades estratégicas concretas e acionáveis, cada uma com uma entrega clara

4. TAGS: Mínimo 15 tags técnicas e de negócio ultra-específicas para matching com startups
   (ex: "virtual power plant", "embedded finance", "digital twin manufacturing", "generative AI customer service")
   Use termos em inglês predominantemente (padrão de mercado para matching).

5. SECTORS: Setores-alvo confirmados para busca de startups

6. ENGAGEMENT_RATIONALE: Breve justificativa (2-3 frases) sobre o tipo de engajamento mais indicado para este corporate

Responda APENAS em JSON válido com as chaves: thesis_text, macro_categories, top_priorities, tags, sectors, engagement_rationale`;

    const data = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          thesis_text: { type: "string" },
          macro_categories: { type: "array", items: { type: "string" } },
          top_priorities: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          sectors: { type: "array", items: { type: "string" } },
          engagement_rationale: { type: "string" },
        }
      }
    });

    const newThesis = await base44.entities.InnovationThesis.create({
      corporate_id: corporate.id,
      session_id: form.session_id || null,
      name: form.name,
      ...data,
      matching_ran: false,
    });

    setGenerating(false);
    onCreated(newThesis);
  };

  // ── LOADING AI ASSESSMENT ───────────────────────────────────────────────────
  if (loadingAssessment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#fce7ef" }}>
            <Brain className="w-7 h-7 animate-pulse" style={{ color: "#E10867" }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: "#111111" }}>Preparando contexto de IA…</p>
          <p className="text-sm" style={{ color: "#4B4F4B" }}>Buscando seus dados de AI Readiness Scan</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4" style={{ color: "#E10867" }} />
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ──────────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-8 bg-black/60">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "#fce7ef" }}>
            <Sparkles className="w-8 h-8 animate-pulse" style={{ color: "#E10867" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#111111" }}>Construindo sua Tese…</h2>
          <p className="text-sm mb-5" style={{ color: "#4B4F4B" }}>
            A IA está analisando todos os dados fornecidos e elaborando uma tese de inovação aprofundada e personalizada.
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "#E10867" }} />
          <p className="text-xs mt-4" style={{ color: "#A7ADA7" }}>Isso pode levar alguns segundos…</p>
        </div>
      </div>
    );
  }

  const currentStep = STEPS[step];
  const progressPct = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-fade-in-up">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: "#ECEEEA" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "#111111" }}>Nova Tese de Inovação</h2>
            <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>
              Passo {step + 1} de {STEPS.length} — {currentStep.emoji} {currentStep.label}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" style={{ color: "#A7ADA7" }} />
          </button>
        </div>

        {/* ── PROGRESS ── */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{ background: i <= step ? "#E10867" : "#ECEEEA" }} />
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <span key={s.id} className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs transition-all"
                style={{
                  background: i < step ? "#2C4425" : i === step ? "#E10867" : "#ECEEEA",
                  color: i <= step ? "#fff" : "#4B4F4B",
                }}>
                {s.emoji} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── STEP CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">

          {/* STEP 0 — PERFIL */}
          {step === 0 && (
            <div className="space-y-5">
              <StepHeader
                emoji="🏢"
                title="Perfil e diagnóstico"
                desc="Vamos contextualizar a tese com o perfil da sua empresa. Se você fez o diagnóstico de maturidade, vincule-o aqui — isso enriquece enormemente a tese gerada."
              />
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "#4B4F4B" }}>
                  Nome da tese <span style={{ color: "#E10867" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Transformação Digital em IA, Energia Distribuída, Saúde em Casa..."
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: "#A7ADA7" }}
                />
                <p className="text-xs mt-1" style={{ color: "#A7ADA7" }}>Dê um nome estratégico para sua tese — isso facilita referências posteriores</p>
              </div>
              <div className="bg-white border rounded-xl p-4" style={{ borderColor: "#A7ADA7" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#4B4F4B" }}>Empresa</p>
                <p className="font-semibold" style={{ color: "#111111" }}>{corporate.company_name || corporate.trade_name}</p>
                <div className="flex gap-3 mt-1 flex-wrap">
                  {corporate.sector && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#fce7ef", color: "#E10867" }}>
                      {corporate.sector}
                    </span>
                  )}
                  {corporate.size && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                      {corporate.size}
                    </span>
                  )}
                  {corporate.state && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                      📍 {corporate.state}
                    </span>
                  )}
                </div>
              </div>

              {sessions.length > 0 && (
                <div>
                  <label className="text-xs font-semibold block mb-2" style={{ color: "#4B4F4B" }}>
                    Vincular a um diagnóstico de maturidade
                    <span className="ml-1 font-normal" style={{ color: "#A7ADA7" }}>(recomendado)</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        borderColor: !form.session_id ? "#E10867" : "#A7ADA7",
                        background: !form.session_id ? "#fce7ef" : "#fff",
                      }}>
                      <input type="radio" name="session" value=""
                        checked={!form.session_id}
                        onChange={() => setForm(f => ({ ...f, session_id: "" }))}
                        className="accent-pink-600" />
                      <span className="text-sm" style={{ color: !form.session_id ? "#E10867" : "#4B4F4B" }}>
                        Tese independente (sem diagnóstico)
                      </span>
                    </label>
                    {sessions.map(s => (
                      <label key={s.id} className="flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all"
                        style={{
                          borderColor: form.session_id === s.id ? "#E10867" : "#A7ADA7",
                          background: form.session_id === s.id ? "#fce7ef" : "#fff",
                        }}>
                        <input type="radio" name="session" value={s.id}
                          checked={form.session_id === s.id}
                          onChange={() => setForm(f => ({ ...f, session_id: s.id }))}
                          className="accent-pink-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: form.session_id === s.id ? "#E10867" : "#111111" }}>
                            Diagnóstico #{s.id?.slice(-6)}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>
                            Score: <strong>{s.overall_score}%</strong> — Nível: <strong>{s.maturity_level}</strong>
                          </p>
                          {s.ai_synthesis && (
                            <p className="text-xs mt-1 italic line-clamp-1" style={{ color: "#4B4F4B" }}>{s.ai_synthesis}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {sessions.length === 0 && (
                <div className="rounded-xl border p-4 flex items-start gap-3"
                  style={{ borderColor: "#B4D1D7", background: "#f0f8fb" }}>
                  <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#6B2FA0" }} />
                  <p className="text-sm" style={{ color: "#4B4F4B" }}>
                    Você ainda não tem diagnósticos concluídos. A tese será criada com base nas informações que você fornecer nos próximos passos.
                  </p>
                </div>
              )}

              {/* AI Readiness Scan banner */}
              {aiAssessment ? (
                <div className="rounded-xl border p-4" style={{ borderColor: "#6B2FA0", background: "#f3e8ff" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 flex-shrink-0" style={{ color: "#6B2FA0" }} />
                    <p className="text-xs font-semibold" style={{ color: "#6B2FA0" }}>
                      AI Readiness Scan detectado — tese personalizada para IA
                    </p>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#4B4F4B" }}>
                    Score global: <strong>{Math.round(aiAssessment.global_score)}/100</strong>.
                    Os desafios do próximo passo foram pré-selecionados com base nos seus <strong>principais gaps de maturidade em IA</strong>.
                  </p>
                  {(() => {
                    const dimScores = aiAssessment.dimension_scores || {};
                    const sorted = Object.entries(dimScores).sort(([,a],[,b]) => a - b).slice(0, 3);
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {sorted.map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: "#fff", color: "#6B2FA0", border: "1px solid #6B2FA0" }}>
                            {DIMENSION_NAMES[k]}: {Math.round(v)}/100
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="rounded-xl border p-4 flex items-start gap-3"
                  style={{ borderColor: "#A7ADA7", background: "#FAFAFA" }}>
                  <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#A7ADA7" }} />
                  <p className="text-xs" style={{ color: "#4B4F4B" }}>
                    <strong>Dica:</strong> Complete o <strong>AI Readiness Scan</strong> antes de criar a tese para receber sugestões personalizadas de desafios e um contexto de IA na tese gerada.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — SETORES E TEMAS */}
          {step === 1 && (
            <div className="space-y-5">
              <StepHeader
                emoji="🎯"
                title="Setores e temas de interesse"
                desc="Selecione os setores onde você busca soluções e os grandes temas de inovação que são prioritários. Escolha ao menos um."
              />
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#4B4F4B" }}>
                  Setores de busca <span style={{ color: "#E10867" }}>*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(s => (
                    <Chip key={s.label} {...s} selected={form.sectors.includes(s.label)}
                      onClick={() => toggle("sectors", s.label)} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#4B4F4B" }}>
                  Temas de inovação prioritários
                </p>
                <div className="flex flex-wrap gap-2">
                  {THEMES.map(t => (
                    <Chip key={t.label} {...t} selected={form.themes.includes(t.label)}
                      onClick={() => toggle("themes", t.label)}
                      color="#6B2FA0" bgColor="#f3e8ff" />
                  ))}
                </div>
              </div>
              {!canAdvance() && (
                <p className="text-xs text-center" style={{ color: "#A7ADA7" }}>
                  Selecione ao menos um setor ou tema para continuar
                </p>
              )}
            </div>
          )}

          {/* STEP 2 — DESAFIOS */}
          {step === 2 && (
            <div className="space-y-5">
              <StepHeader
                emoji="⚡"
                title="Desafios de negócio"
                desc="Quais são os principais problemas que sua empresa precisa resolver com inovação? Selecione os mais relevantes — isso ajuda a IA a encontrar startups alinhadas ao seu contexto real."
              />
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#4B4F4B" }}>
                  Selecione seus principais desafios <span style={{ color: "#E10867" }}>*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {CHALLENGES.map(c => (
                    <Chip key={c.label} {...c} selected={form.challenges.includes(c.label)}
                      onClick={() => toggle("challenges", c.label)}
                      color="#1E0B2E" bgColor="#f3e8ff" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#4B4F4B" }}>
                  Algum desafio específico não listado acima?
                </p>
                <textarea
                  value={form.strategic_context_challenge || ""}
                  onChange={e => setForm(f => ({ ...f, strategic_context_challenge: e.target.value }))}
                  placeholder="Ex: Precisamos digitalizar o processo de onboarding de fornecedores que hoje é 100% manual e leva 45 dias..."
                  rows={3}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: "#A7ADA7" }}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — RESULTADOS ESPERADOS */}
          {step === 3 && (
            <div className="space-y-5">
              <StepHeader
                emoji="📈"
                title="Resultados esperados"
                desc="O que sua empresa espera alcançar ao engajar com startups? Resultados claros permitem que a IA filtre soluções com impacto real no seu negócio."
              />
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#4B4F4B" }}>
                  Resultados que você quer alcançar <span style={{ color: "#E10867" }}>*</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXPECTED_RESULTS.map(r => (
                    <Chip key={r.label} {...r} selected={form.expected_results.includes(r.label)}
                      onClick={() => toggle("expected_results", r.label)}
                      color="#2C4425" bgColor="#e8f5e9" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#4B4F4B" }}>
                  Horizonte de tempo preferido
                </p>
                <div className="space-y-2">
                  {HORIZONS.map(h => (
                    <label key={h.label} className="flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all"
                      style={{
                        borderColor: form.horizon === h.label ? h.color : "#A7ADA7",
                        background: form.horizon === h.label ? `${h.color}15` : "#fff",
                      }}>
                      <input type="radio" name="horizon" value={h.label}
                        checked={form.horizon === h.label}
                        onChange={() => setForm(f => ({ ...f, horizon: h.label }))}
                        className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium" style={{ color: form.horizon === h.label ? h.color : "#111111" }}>
                          {h.label}
                        </p>
                        <p className="text-xs" style={{ color: "#4B4F4B" }}>{h.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — RESTRIÇÕES */}
          {step === 4 && (
            <div className="space-y-5">
              <StepHeader
                emoji="🔒"
                title="Restrições e condicionantes"
                desc="Limitações são importantes para filtrar startups adequadas ao seu contexto. Selecione o que se aplica — não há resposta certa ou errada."
              />
              <div>
                <p className="text-xs font-semibold mb-2.5" style={{ color: "#4B4F4B" }}>
                  Limitações e condicionantes do seu contexto
                </p>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map(r => (
                    <Chip key={r.label} {...r} selected={form.restrictions.includes(r.label)}
                      onClick={() => toggle("restrictions", r.label)}
                      color="#6B2FA0" bgColor="#f3e8ff" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#4B4F4B" }}>
                  Tipo de engajamento preferido com startups
                </p>
                <div className="space-y-1.5">
                  {ENGAGEMENT_TYPES.map(e => (
                    <label key={e.label} className="flex items-start gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: form.engagement_types.includes(e.label) ? "#6B2FA0" : "#A7ADA7",
                        background: form.engagement_types.includes(e.label) ? "#f3e8ff" : "#fff",
                      }}>
                      <input type="checkbox"
                        checked={form.engagement_types.includes(e.label)}
                        onChange={() => toggle("engagement_types", e.label)}
                        className="mt-0.5 accent-purple-700" />
                      <div>
                        <p className="text-sm font-medium" style={{ color: form.engagement_types.includes(e.label) ? "#6B2FA0" : "#111111" }}>
                          {e.label}
                        </p>
                        <p className="text-xs" style={{ color: "#4B4F4B" }}>{e.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#4B4F4B" }}>
                  Áreas ou temas fora do escopo <span className="font-normal" style={{ color: "#A7ADA7" }}>(no-go areas)</span>
                </p>
                <textarea
                  value={form.no_go_areas}
                  onChange={e => setForm(f => ({ ...f, no_go_areas: e.target.value }))}
                  placeholder="Ex: Não temos interesse em soluções de hardware. Não queremos startups em estágio de ideia, somente com produto validado..."
                  rows={2}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: "#A7ADA7" }}
                />
              </div>
            </div>
          )}

          {/* STEP 5 — CONTEXTO ESTRATÉGICO */}
          {step === 5 && (
            <div className="space-y-5">
              <StepHeader
                emoji="✨"
                title="Contexto estratégico"
                desc="Compartilhe a visão estratégica da empresa e iniciativas em andamento. Quanto mais contexto, mais personalizada e relevante será a tese gerada."
              />
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#4B4F4B" }}>
                  Visão e contexto estratégico
                  <span className="ml-1 font-normal" style={{ color: "#A7ADA7" }}>(opcional, mas muito recomendado)</span>
                </p>
                <textarea
                  value={form.strategic_context}
                  onChange={e => setForm(f => ({ ...f, strategic_context: e.target.value }))}
                  placeholder="Ex: Somos uma empresa de energia com presença em 5 estados, focada na transição energética. Queremos explorar soluções de energia distribuída e flexibilização de demanda para nosso portfólio de clientes B2B no Nordeste. Nossa estratégia para 2025 é reduzir emissões em 30% e lançar um produto de energia como serviço..."
                  rows={5}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: "#A7ADA7" }}
                />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#4B4F4B" }}>
                  Iniciativas de inovação já em andamento
                  <span className="ml-1 font-normal" style={{ color: "#A7ADA7" }}>(opcional)</span>
                </p>
                <textarea
                  value={form.current_initiatives}
                  onChange={e => setForm(f => ({ ...f, current_initiatives: e.target.value }))}
                  placeholder="Ex: Já temos uma PoC de IoT em fase piloto com a startup X. Temos um programa de open innovation chamado 'ABC Lab' que recebeu 40 startups em 2024. Participamos do programa de CVC do BNDES..."
                  rows={3}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: "#A7ADA7" }}
                />
              </div>

              {/* Summary */}
              <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "#B4D1D7", background: "#f0f8fb" }}>
                <p className="text-xs font-semibold" style={{ color: "#1E0B2E" }}>📋 Resumo da sua tese</p>
                {form.sectors.length > 0 && (
                  <p className="text-xs" style={{ color: "#4B4F4B" }}>
                    <span className="font-medium">Setores:</span> {form.sectors.join(", ")}
                  </p>
                )}
                {form.themes.length > 0 && (
                  <p className="text-xs" style={{ color: "#4B4F4B" }}>
                    <span className="font-medium">Temas:</span> {form.themes.join(", ")}
                  </p>
                )}
                {form.challenges.length > 0 && (
                  <p className="text-xs" style={{ color: "#4B4F4B" }}>
                    <span className="font-medium">Desafios:</span> {form.challenges.length} selecionados
                  </p>
                )}
                {form.expected_results.length > 0 && (
                  <p className="text-xs" style={{ color: "#4B4F4B" }}>
                    <span className="font-medium">Resultados esperados:</span> {form.expected_results.length} selecionados
                  </p>
                )}
                {form.horizon && (
                  <p className="text-xs" style={{ color: "#4B4F4B" }}>
                    <span className="font-medium">Horizonte:</span> {form.horizon}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* AI HINT */}
          <div className="mt-4">
            {aiHint ? (
              <div className="rounded-xl border p-3 flex items-start gap-2" style={{ borderColor: "#B4D1D7", background: "#f0f8fb" }}>
                <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#E10867" }} />
                <p className="text-xs leading-relaxed" style={{ color: "#4B4F4B" }}>{aiHint}</p>
              </div>
            ) : (
              <button
                onClick={() => askHint(currentStep.id)}
                disabled={loadingHint}
                className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                style={{ color: "#A7ADA7" }}>
                {loadingHint
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando dica…</>
                  : <><HelpCircle className="w-3.5 h-3.5" /> Por que isso importa?</>}
              </button>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-6 py-4 border-t flex items-center justify-between flex-shrink-0"
          style={{ borderColor: "#ECEEEA" }}>
          <Button variant="outline" onClick={() => { if (step === 0) onClose(); else setStep(s => s - 1); }}
            style={{ borderColor: "#A7ADA7" }}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 0 ? "Cancelar" : "Anterior"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => { setAiHint(null); setStep(s => s + 1); }}
              disabled={!canAdvance() || (step === 0 && !form.name)}
              className="text-white gap-2"
              style={{ background: canAdvance() && (step !== 0 || form.name) ? "#E10867" : "#A7ADA7", border: "none" }}>
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={generateThesis}
              className="text-white gap-2 px-6"
              style={{ background: "#E10867", border: "none" }}>
              <Sparkles className="w-4 h-4" /> Gerar Tese com IA
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ emoji, title, desc }) {
  return (
    <div className="pt-2 pb-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-bold text-base" style={{ color: "#111111" }}>{title}</h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#4B4F4B" }}>{desc}</p>
    </div>
  );
}