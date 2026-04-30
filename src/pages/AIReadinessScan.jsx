import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { Button } from "@/components/ui/button";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip
} from "recharts";
import {
  Brain, ChevronRight, ChevronLeft, Loader2, SkipForward,
  CheckCircle2, AlertTriangle, TrendingUp, RotateCcw, Zap, Clock, Target, Lock
} from "lucide-react";

// ─── DIMENSIONS ───────────────────────────────────────────────────────────────
const DIMENSIONS = [
  { id: "estrategia",  name: "Estratégia e Liderança",   short: "Estratégia",  emoji: "🎯" },
  { id: "governanca",  name: "Governança",               short: "Governança",  emoji: "⚖️" },
  { id: "valor",       name: "Valor em Produção",        short: "Valor",       emoji: "💰" },
  { id: "operacoes",   name: "Operações",                short: "Operações",   emoji: "⚙️" },
  { id: "ecossistema", name: "Ecossistema e Parceiros",  short: "Ecossistema", emoji: "🤝" },
  { id: "dados",       name: "Dados e Infraestrutura",   short: "Dados",       emoji: "🗄️" },
  { id: "tecnologia",  name: "Tecnologia",               short: "Tecnologia",  emoji: "💻" },
  { id: "habilidades", name: "Habilidades e Cultura",    short: "Habilidades", emoji: "👥" },
  { id: "frugalidade", name: "Frugalidade e Impacto",    short: "Frugalidade", emoji: "🌱" },
];

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "q1", dimension: "estrategia",
    text: "Quão bem definida e gerida é a sua estratégia e portfólio de IA?",
    options: [
      { score: 1, label: "A", text: "Ad-hoc; sem estratégia ou KPIs escritos." },
      { score: 2, label: "B", text: "Pilotos com responsáveis e KPIs definidos." },
      { score: 3, label: "C", text: "Estratégia formal e orçamento; revisões regulares." },
      { score: 4, label: "D", text: "Estratégia vinculada a OKRs; KPIs acompanhados trimestralmente." },
      { score: 5, label: "E", text: "Portfólio revisado pelo conselho com financiamento; KPIs cumpridos." },
    ]
  },
  {
    id: "q2", dimension: "governanca",
    text: "Quão bem definida e gerida é a política de \"IA Responsável\" da sua organização?",
    options: [
      { score: 1, label: "A", text: "Sem política formal; decisões de IA são tomadas ad-hoc por equipes individuais." },
      { score: 2, label: "B", text: "Uma política ou princípios éticos em rascunho existem, mas não são formalmente aprovados ou comunicados." },
      { score: 3, label: "C", text: "Uma Política de IA Responsável formal é aprovada pela liderança e acessível a todos os colaboradores." },
      { score: 4, label: "D", text: "A política é revisada trimestralmente com base em KPIs e auditorias externas; vista como diferencial competitivo." },
      { score: 5, label: "E", text: "A política está integrada aos fluxos de trabalho do produto com responsabilidade e ownership claros." },
    ]
  },
  {
    id: "q3", dimension: "governanca",
    text: "Como a organização avalia e documenta o risco de seus sistemas de IA?",
    options: [
      { score: 1, label: "A", text: "Não há processo de avaliação de risco formal. O risco é gerido por desenvolvedores com base em julgamento pessoal." },
      { score: 2, label: "B", text: "A área de TI/Risco revisa os projetos internamente antes do lançamento, frequentemente detectando problemas tarde demais." },
      { score: 3, label: "C", text: "A área de TI/Risco revisa os projetos internamente antes do lançamento com modelo estruturado de compliance." },
      { score: 4, label: "D", text: "Risco incorporado ao ciclo de vida com Registros de Risco e Model Cards; equipes de produto são responsáveis." },
      { score: 5, label: "E", text: "Realizamos sistematicamente o Relatório de Impacto à Proteção de Dados Pessoais (RIPD) e a Avaliação de Impacto Algorítmico (AIA) para sistemas de alto risco, conforme as diretrizes do PL 2338/2023." },
    ]
  },
  {
    id: "q4", dimension: "valor",
    text: "Com que consistência a IA entrega valor de negócio mensurável?",
    options: [
      { score: 1, label: "A", text: "Sem baselines. Impacto financeiro indefinido; decisões baseadas em intuição; sem distinção entre Capex e Opex." },
      { score: 2, label: "B", text: "Valor definido principalmente por aprendizados e capacidades; pilotos têm métricas \"Antes vs. Depois\"." },
      { score: 3, label: "C", text: "Economia unitária: custo por transação (Opex) vs. valor gerado para casos em produção é acompanhado." },
      { score: 4, label: "D", text: "Portfólio baseado em TCO: decisões de Escalar/Encerrar baseadas no Custo Total de Propriedade (Capex + Opex)." },
      { score: 5, label: "E", text: "Integração ao P&L: a IA é medida pelo impacto direto no EBITDA, com proporções otimizadas e payback comprovado." },
    ]
  },
  {
    id: "q5", dimension: "operacoes",
    text: "Quão confiável e bem gerida é a sua stack de tecnologia de IA e operações diárias?",
    options: [
      { score: 1, label: "A", text: "Ferramentas ad-hoc; sem monitoramento; responsabilidade indefinida; problemas tratados de forma reativa." },
      { score: 2, label: "B", text: "Instruções básicas para pilotos; verificações manuais; suporte feito com base no esforço disponível." },
      { score: 3, label: "C", text: "Runbooks existem para incidentes; ferramentas compartilhadas; alguém de plantão." },
      { score: 4, label: "D", text: "Bom monitoramento e alertas; lançamentos planejados; revisões básicas de segurança." },
      { score: 5, label: "E", text: "Estável e seguro; tarefas rotineiras automatizadas; atualizações frequentes e seguras." },
    ]
  },
  {
    id: "q6", dimension: "operacoes",
    text: "Como a organização lida com o risco da \"Shadow AI\" e a exposição de Propriedade Intelectual (PI)?",
    options: [
      { score: 1, label: "A", text: "Funcionários usam IAs públicas livremente com dados da empresa; alto risco de vazamento de PI e dados sensíveis." },
      { score: 2, label: "B", text: "Alertas verbais/ad-hoc. A liderança ocasionalmente avisa sobre riscos, mas não há política formalizada." },
      { score: 3, label: "C", text: "Existe uma política escrita proibindo o uso de dados da empresa em IAs não homologadas, mas sem bloqueio técnico." },
      { score: 4, label: "D", text: "Treinamento e certificação obrigatórios sobre riscos de PI e 'Prompting Seguro' antes de acessar ferramentas de IA." },
      { score: 5, label: "E", text: "A empresa fornece 'Sandboxes Corporativas' homologadas e aplica prevenção de perda de dados (DLP) para bloquear tecnicamente o envio de dados a IAs não autorizadas." },
    ]
  },
  {
    id: "q7", dimension: "ecossistema",
    text: "Como você gerencia a responsabilidade jurídica ao contratar IAs ou APIs de terceiros?",
    options: [
      { score: 1, label: "A", text: "Usamos Termos de Serviço padrão dos fornecedores, aceitando o risco de nossos dados serem usados para treinar modelos abertos." },
      { score: 2, label: "B", text: "Enviamos questionários de segurança a fornecedores, mas sem cláusulas contratuais específicas sobre uso de dados." },
      { score: 3, label: "C", text: "Due Diligence estruturada: fornecedores passam por avaliação cobrindo fontes de dados, LGPD, direitos autorais e testes de viés." },
      { score: 4, label: "D", text: "Contratos incluem cláusulas de indenização e proteção de PI específicas para IA, com auditorias periódicas." },
      { score: 5, label: "E", text: "Firmamos contratos B2B rigorosos definindo nossa empresa como Controladora e o fornecedor como Operador (termos LGPD), vedando expressamente o uso de nossos dados para treinar modelos fundacionais de terceiros." },
    ]
  },
  {
    id: "q8", dimension: "dados",
    text: "Quão preparados estão seus dados e plataformas para o uso diário de IA?",
    options: [
      { score: 1, label: "A", text: "Sem lista completa de dados; pouco ou nenhum monitoramento." },
      { score: 2, label: "B", text: "Catálogo e controles de acesso existem; dados sensíveis estão rotulados." },
      { score: 3, label: "C", text: "Contratos de dados e alertas em vigor; verificações de qualidade de dados em execução." },
      { score: 4, label: "D", text: "Regras e linhagem claras; deriva de dados detectada rapidamente; algumas correções automáticas." },
      { score: 5, label: "E", text: "Autoatendimento de dados fácil; acesso rápido; principais custos e consumo de energia rastreados." },
    ]
  },
  {
    id: "q9", dimension: "dados",
    text: "Como a empresa garante a conformidade com a LGPD ao usar dados para treinar ou embasar IAs (LLMs)?",
    options: [
      { score: 1, label: "A", text: "Não mapeamos a origem dos dados ou se possuem dados pessoais. O risco de infração à LGPD não é considerado." },
      { score: 2, label: "B", text: "Sabemos a origem dos dados, mas a anonimização é manual e não há processo sistemático de verificação de PII." },
      { score: 3, label: "C", text: "PII e dados sensíveis identificados com protocolos específicos; vieses e lacunas mapeados conforme LGPD." },
      { score: 4, label: "D", text: "Documentação completa de Propósito, Fonte, Vieses e PII é obrigatória (Data Sheet) antes do uso em qualquer sistema de IA." },
      { score: 5, label: "E", text: "Aplicamos 'Privacy by Design', isolando Dados Pessoais Sensíveis e utilizando técnicas como dados sintéticos ou privacidade diferencial antes da inferência da IA, em plena conformidade com a LGPD." },
    ]
  },
  {
    id: "q10", dimension: "tecnologia",
    text: "Quão confiável e segura é a sua stack tecnológica de IA contra ameaças cibernéticas?",
    options: [
      { score: 1, label: "A", text: "Ferramentas ad-hoc; sem monitoramento; responsabilidade indefinida." },
      { score: 2, label: "B", text: "Ferramentas aprovadas, mas trabalho majoritariamente manual; monitoramento limitado; lançamentos ad-hoc." },
      { score: 3, label: "C", text: "Ferramentas compartilhadas; alguma automação para testes e lançamentos; responsáveis definidos." },
      { score: 4, label: "D", text: "Bom monitoramento e alertas; lançamentos planejados; revisões básicas de segurança; custos visíveis." },
      { score: 5, label: "E", text: "Estável e seguro; metas atingidas; atualizações frequentes e seguras; custos rastreados e melhorando." },
    ]
  },
  {
    id: "q11", dimension: "tecnologia",
    text: "Quão significativa é a intervenção humana no ciclo de decisão da IA (Human-in-the-loop)?",
    options: [
      { score: 1, label: "A", text: "Decisões 100% automatizadas sem supervisão; humanos veem apenas o resultado final sem possibilidade de contestação." },
      { score: 2, label: "B", text: "Humanos revisam apenas quando um usuário reclama; não há mecanismo sistemático de override." },
      { score: 3, label: "C", text: "Protocolos de 'Human-in-the-loop' são definidos para fluxos de trabalho críticos, com botão de override manual." },
      { score: 4, label: "D", text: "Interfaces projetadas para explicabilidade; revisores treinados sobre viés de automação; eficácia da supervisão é medida." },
      { score: 5, label: "E", text: "Supervisão humana contínua em sistemas de alto risco, mantendo registros de eventos (logs) completos para prestação de contas (accountability) e conformidade com o PL 2338/2023." },
    ]
  },
  {
    id: "q12", dimension: "habilidades",
    text: "Quão preparadas estão as pessoas e equipes para usar a IA de forma eficaz?",
    options: [
      { score: 1, label: "A", text: "Colaboradores descobrem ferramentas de IA por conta própria, sem orientação." },
      { score: 2, label: "B", text: "Webinars opcionais ou vídeos genéricos de \"Introdução à IA\" estão disponíveis." },
      { score: 3, label: "C", text: "Treinamento formal sobre Ética em IA e políticas internas é obrigatório para todos os colaboradores." },
      { score: 4, label: "D", text: "Equipes refinam continuamente prompts e processos com base na prática diária; são a principal fonte de novos casos de uso." },
      { score: 5, label: "E", text: "Colaboradores participam ativamente no design de fluxos de trabalho de IA e na definição de protocolos \"Human-in-the-loop\" para seus papéis." },
    ]
  },
  {
    id: "q13", dimension: "frugalidade",
    text: "Com que intencionalidade você tenta tornar o uso da sua IA eficiente, responsável e fácil de escalar?",
    options: [
      { score: 1, label: "A", text: "Sem consideração de eficiência, sustentabilidade, acesso ou escala." },
      { score: 2, label: "B", text: "Ciente das trade-offs; melhorias ocasionais." },
      { score: 3, label: "C", text: "Limites básicos de custo e recursos; alguma atenção ao acesso; funciona além dos pilotos." },
      { score: 4, label: "D", text: "Limites e monitoramento claros; acessível por design; reuso e escalonamento planejados." },
      { score: 5, label: "E", text: "Eficiência e sustentabilidade consistentes; amplamente acessível; escala e replica facilmente." },
    ]
  },
  {
    id: "q14", dimension: "frugalidade",
    text: "Como você avalia o impacto social e mitiga vieses nos seus casos de uso de IA?",
    options: [
      { score: 1, label: "A", text: "Focamos apenas na performance técnica e de negócios; vieses algorítmicos não são considerados." },
      { score: 2, label: "B", text: "Discutimos possíveis preconceitos de forma pontual/ad-hoc quando algum membro da equipe levanta uma preocupação." },
      { score: 3, label: "C", text: "Realizamos avaliações de impacto estruturadas para projetos de alto risco, com planos de mitigação no backlog." },
      { score: 4, label: "D", text: "Auditores externos ou grupos impactados revisam periodicamente os resultados; métricas de equidade são acompanhadas." },
      { score: 5, label: "E", text: "Realizamos auditorias algorítmicas alinhadas à LGPD para garantir a explicabilidade das decisões e eliminar vieses discriminatórios nas entregas ao cliente final, em conformidade com o Código de Defesa do Consumidor." },
    ]
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcScores(answers) {
  const dimScores = {};
  for (const dim of DIMENSIONS) {
    const qs = QUESTIONS.filter(q => q.dimension === dim.id);
    const scores = qs.map(q => answers[q.id]).filter(s => s != null);
    // Convert 1-5 scale to 0-100: (score - 1) / 4 * 100
    dimScores[dim.id] = scores.length
      ? Math.round(scores.reduce((a, b) => a + ((b - 1) / 4 * 100), 0) / scores.length)
      : 0;
  }
  const values = Object.values(dimScores).filter(v => v > 0);
  const global = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
  return { dimension_scores: dimScores, global_score: global };
}

function scoreToPercent(score) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function getAIMaturityLabel(score) {
  if (score >= 90) return "Líder em IA";
  if (score >= 70) return "Avançado";
  if (score >= 50) return "Consolidado";
  if (score >= 30) return "Em Desenvolvimento";
  return "Inicial";
}

export function getAIMaturityColor(score) {
  if (score >= 90) return { bg: "#e8f5e9", color: "#2C4425" };
  if (score >= 70) return { bg: "#f3e8ff", color: "#6B2FA0" };
  if (score >= 50) return { bg: "#fce7ef", color: "#E10867" };
  if (score >= 30) return { bg: "#FFF3E0", color: "#E65100" };
  return { bg: "#FFEBEE", color: "#C62828" };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AIReadinessScan() {
  const navigate = useNavigate();
  const { loading: accessLoading, corporate } = useCorporateAccess();
  const [view, setView] = useState("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [saving, setSaving] = useState(false);

  const [hasCompletedDiagnostic, setHasCompletedDiagnostic] = useState(false);

  useEffect(() => {
    if (!accessLoading && corporate) checkExisting();
    else if (!accessLoading) setView("landing");
  }, [accessLoading, corporate]);

  const checkExisting = async () => {
    // Check if there's a completed DiagnosticSession first
    const [existing, completedSessions] = await Promise.all([
      base44.entities.AIAssessment.filter({ corporate_id: corporate.id }, "-created_date", 1),
      base44.entities.DiagnosticSession.filter({ corporate_id: corporate.id, status: "completed" }, "-created_date", 1),
    ]);

    const diagDone = completedSessions.length > 0;
    setHasCompletedDiagnostic(diagDone);

    if (!diagDone) {
      setView("blocked");
      return;
    }

    if (existing.length > 0) {
      setAssessment(existing[0]);
      setView("results");
    } else {
      setView("landing");
    }
  };

  const skip = () => navigate(createPageUrl("InnovationTheses"));

  const selectAnswer = (qId, score) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    const { dimension_scores, global_score } = calcScores(answers);
    const saved = await base44.entities.AIAssessment.create({
      corporate_id: corporate.id,
      answers,
      dimension_scores,
      global_score,
    });
    setAssessment(saved);
    setView("results");
    setSaving(false);
  };

  const handleRedo = () => {
    setAnswers({});
    setCurrentQ(0);
    setView("landing");
  };

  if (view === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#E10867" }} />
      </div>
    );
  }

  if (view === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#ECEEEA" }}>
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="px-8 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #1E0B2E 0%, #3B145A 100%)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "rgba(225,8,103,0.2)" }}>
              <Lock className="w-8 h-8" style={{ color: "#E10867" }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#E10867" }}>
              Passo Bloqueado
            </p>
            <h1 className="text-2xl font-bold text-white mb-3">
              Complete o Diagnóstico de Maturidade primeiro
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)" }} className="text-sm leading-relaxed">
              O AI Readiness Scan é a etapa seguinte ao Diagnóstico de Maturidade em Inovação.
              Finalize seu diagnóstico para liberar esta análise.
            </p>
          </div>
          <div className="px-8 py-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              {["Diagnóstico de Maturidade", "AI Readiness Scan", "Tese de Inovação"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && <div className="w-5 h-px" style={{ background: "#A7ADA7" }} />}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold`}
                      style={{
                        background: i === 0 ? "#A7ADA7" : "#ECEEEA",
                        color: i === 0 ? "#fff" : "#A7ADA7"
                      }}>
                      {i === 0 ? "1" : i === 1 ? "🔒" : "3"}
                    </div>
                    <span className="text-xs font-medium" style={{ color: i === 0 ? "#111111" : "#A7ADA7" }}>{step}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => navigate(createPageUrl("MyDiagnostics"))}
              className="w-full text-white text-base h-12 rounded-xl"
              style={{ background: "#E10867", border: "none" }}>
              Ir para Diagnósticos <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "landing") {
    return <LandingView onStart={() => setView("quiz")} onSkip={skip} />;
  }

  if (view === "quiz") {
    return (
      <QuizView
        currentQ={currentQ}
        setCurrentQ={setCurrentQ}
        answers={answers}
        onSelect={selectAnswer}
        onSubmit={handleSubmit}
        saving={saving}
      />
    );
  }

  return (
    <ResultsView
      assessment={assessment}
      onGoToTheses={() => navigate(createPageUrl("InnovationTheses"))}
      onRedo={handleRedo}
    />
  );
}

// ─── LANDING VIEW ─────────────────────────────────────────────────────────────
function LandingView({ onStart, onSkip }) {
  const benefits = [
    { icon: Clock, text: "Leva menos de 10 minutos" },
    { icon: Zap, text: "Resultados instantâneos" },
    { icon: Target, text: "Relatório personalizado por dimensão" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#ECEEEA" }}>
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header band */}
          <div className="px-8 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #1E0B2E 0%, #3B145A 100%)" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "rgba(225,8,103,0.2)" }}>
              <Brain className="w-8 h-8" style={{ color: "#E10867" }} />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#E10867" }}>
              AI Readiness Scan · Beta-i
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white mb-3">
              Diagnóstico de Aptidão para IA
            </h1>
            <p className="text-lg" style={{ color: "rgba(255,255,255,0.75)" }}>
              A sua organização está criando valor com Inteligência Artificial?
            </p>
          </div>

          <div className="px-8 py-8 space-y-7">
            {/* Description */}
            <p className="text-base leading-relaxed" style={{ color: "#4B4F4B" }}>
              Descubra o estágio de maturidade em IA da sua empresa em <strong>9 dimensões críticas</strong> —
              de forma rápida, simples e acionável. Identifique seus gaps e fortaleça sua Tese de Inovação.
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4">
              {benefits.map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl"
                  style={{ background: "#ECEEEA" }}>
                  <Icon className="w-5 h-5" style={{ color: "#E10867" }} />
                  <span className="text-xs font-medium" style={{ color: "#4B4F4B" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Dimensions preview */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#A7ADA7" }}>
                9 dimensões avaliadas
              </p>
              <div className="flex flex-wrap gap-2">
                {DIMENSIONS.map(d => (
                  <span key={d.id} className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: "#fce7ef", color: "#E10867" }}>
                    {d.emoji} {d.short}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <Button onClick={onStart} className="w-full text-white text-base h-12 rounded-xl"
                style={{ background: "#E10867", border: "none" }}>
                Começar Agora <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <button
                onClick={onSkip}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm transition-opacity hover:opacity-70"
                style={{ color: "#A7ADA7" }}>
                <SkipForward className="w-4 h-4" />
                Pular este passo e ir direto para a Tese de Inovação
              </button>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {["Diagnóstico de Maturidade", "AI Readiness Scan", "Tese de Inovação"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && <div className="w-6 h-px" style={{ background: "#A7ADA7" }} />}
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 1 ? "text-white" : ""}`}
                  style={{ background: i === 0 ? "#2C4425" : i === 1 ? "#E10867" : "#A7ADA7", color: i < 1 ? "#fff" : "" }}>
                  {i === 0 ? "✓" : i + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: i === 1 ? "#111111" : "#A7ADA7" }}>{step}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QUIZ VIEW ────────────────────────────────────────────────────────────────
function QuizView({ currentQ, setCurrentQ, answers, onSelect, onSubmit, saving }) {
  const q = QUESTIONS[currentQ];
  const dim = DIMENSIONS.find(d => d.id === q.dimension);
  const answered = answers[q.id] != null;
  const isLast = currentQ === QUESTIONS.length - 1;
  const allAnswered = QUESTIONS.every(q => answers[q.id] != null);
  const progressPct = Math.round(((currentQ + (answered ? 1 : 0)) / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#ECEEEA" }}>
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "#ECEEEA" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5" style={{ color: "#E10867" }} />
                <span className="font-semibold text-sm" style={{ color: "#111111" }}>AI Readiness Scan</span>
              </div>
              <span className="text-sm font-bold" style={{ color: "#E10867" }}>
                {currentQ + 1} / {QUESTIONS.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full" style={{ background: "#ECEEEA" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: "#E10867" }} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#fce7ef", color: "#E10867" }}>
                {dim?.emoji} {dim?.name}
              </span>
              <span className="text-xs" style={{ color: "#A7ADA7" }}>Passo {currentQ + 1} de {QUESTIONS.length}</span>
            </div>
          </div>

          {/* Question */}
          <div className="px-6 py-6">
            <h2 className="text-lg font-bold mb-5 leading-snug" style={{ color: "#111111" }}>
              {q.text}
            </h2>

            <div className="space-y-2.5">
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.score;
                return (
                  <button
                    key={opt.score}
                    onClick={() => onSelect(q.id, opt.score)}
                    className="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all flex items-start gap-3"
                    style={{
                      borderColor: selected ? "#E10867" : "#ECEEEA",
                      background: selected ? "#fce7ef" : "#FAFAFA",
                    }}>
                    <span className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: selected ? "#E10867" : "#ECEEEA", color: selected ? "#fff" : "#4B4F4B" }}>
                      {opt.label}
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: selected ? "#E10867" : "#4B4F4B" }}>
                      {opt.text}
                    </span>
                    {selected && <CheckCircle2 className="w-4 h-4 flex-shrink-0 ml-auto mt-0.5" style={{ color: "#E10867" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0} style={{ borderColor: "#A7ADA7" }}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>

            {isLast ? (
              <Button
                onClick={onSubmit}
                disabled={!allAnswered || saving}
                className="text-white px-8"
                style={{ background: allAnswered ? "#E10867" : "#A7ADA7", border: "none" }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                {saving ? "Calculando..." : "Ver Resultados"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQ(q => q + 1)}
                disabled={!answered}
                className="text-white"
                style={{ background: answered ? "#E10867" : "#A7ADA7", border: "none" }}>
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESULTS VIEW ─────────────────────────────────────────────────────────────
function ResultsView({ assessment, onGoToTheses, onRedo }) {
  const [expandedDim, setExpandedDim] = useState(null);
  const [aiSynthesis, setAiSynthesis] = useState(assessment?.ai_synthesis || null);
  const [loadingSynthesis, setLoadingSynthesis] = useState(false);

  if (!assessment) return null;

  const { dimension_scores = {}, global_score = 0 } = assessment;
  const maturity = getAIMaturityLabel(global_score);
  const maturityColors = getAIMaturityColor(global_score);

  const radarData = DIMENSIONS.map(d => ({
    subject: d.short,
    score: dimension_scores[d.id] || 0,
    fullMark: 100,
  }));

  const sortedDims = DIMENSIONS
    .map(d => ({ ...d, score: dimension_scores[d.id] || 0 }))
    .sort((a, b) => a.score - b.score);
  const topGaps = sortedDims.slice(0, 3);
  const topStrengths = sortedDims.slice(-2).reverse();

  const generateSynthesis = async () => {
    setLoadingSynthesis(true);
    const dimSummary = DIMENSIONS.map(d =>
      `${d.name}: ${Math.round(dimension_scores[d.id] || 0)}/100`
    ).join(", ");
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em transformação digital e IA. Gere uma síntese executiva em português, de 3 parágrafos, para uma empresa com o seguinte perfil de AI Readiness (escala 0-100):\n\nScore Global: ${Math.round(global_score)}/100 — Nível: ${maturity}\n\nPor dimensão: ${dimSummary}\n\nA síntese deve: 1) Contextualizar o nível atual, 2) Destacar os 3 maiores gaps e seus riscos estratégicos, 3) Recomendar 3 iniciativas prioritárias concretas para os próximos 90 dias. Seja direto, executivo e acionável.`,
    });
    const text = typeof result === "string" ? result : (result?.text || result?.content || "");
    setAiSynthesis(text);
    await base44.entities.AIAssessment.update(assessment.id, { ai_synthesis: text });
    setLoadingSynthesis(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5" style={{ color: "#E10867" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#E10867" }}>
              AI Readiness Scan · Resultado
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#111111" }}>Relatório de Prontidão em IA</h1>
          <p className="text-sm mt-1" style={{ color: "#4B4F4B" }}>Avaliação de 9 dimensões críticas de Inteligência Artificial</p>
        </div>
        <Button onClick={onRedo} variant="outline" size="sm" className="flex-shrink-0" style={{ borderColor: "#A7ADA7" }}>
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Refazer
        </Button>
      </div>

      {/* Global Score Card */}
      <div className="bg-white rounded-2xl border p-6 mb-6 flex items-center gap-6" style={{ borderColor: "#A7ADA7" }}>
        <div className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
          style={{ background: maturityColors.bg }}>
          <span className="text-3xl font-black" style={{ color: maturityColors.color }}>{Math.round(global_score)}</span>
          <span className="text-xs font-medium" style={{ color: maturityColors.color }}>/100</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#A7ADA7" }}>Score Global de Prontidão em IA</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#111111" }}>{maturity}</h2>
          <div className="w-full h-2.5 rounded-full" style={{ background: "#ECEEEA" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${scoreToPercent(global_score)}%`, background: maturityColors.color }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: "#4B4F4B" }}>{Math.round(global_score)}% do nível máximo de maturidade em IA</p>
        </div>
      </div>

      {/* AI Synthesis */}
      <div className="bg-white rounded-2xl border p-6 mb-6" style={{ borderColor: "#A7ADA7" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: "#6B2FA0" }} />
            <h3 className="font-bold" style={{ color: "#111111" }}>Síntese Executiva</h3>
          </div>
          {!aiSynthesis && !loadingSynthesis && (
            <Button onClick={generateSynthesis} size="sm" className="text-white" style={{ background: "#6B2FA0", border: "none" }}>
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Gerar com IA
            </Button>
          )}
          {aiSynthesis && !loadingSynthesis && (
            <button onClick={generateSynthesis} className="text-xs flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: "#A7ADA7" }}>
              <RotateCcw className="w-3 h-3" /> Regenerar
            </button>
          )}
        </div>
        {loadingSynthesis && (
          <div className="flex items-center gap-3 py-6 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#6B2FA0" }} />
            <span className="text-sm" style={{ color: "#4B4F4B" }}>Gerando síntese executiva...</span>
          </div>
        )}
        {!loadingSynthesis && aiSynthesis && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#4B4F4B" }}>{aiSynthesis}</p>
        )}
        {!loadingSynthesis && !aiSynthesis && (
          <p className="text-sm" style={{ color: "#A7ADA7" }}>
            Clique em "Gerar com IA" para receber uma análise executiva personalizada com os principais gaps, riscos estratégicos e iniciativas prioritárias para os próximos 90 dias.
          </p>
        )}
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-2xl border p-6 mb-6" style={{ borderColor: "#A7ADA7" }}>
        <h3 className="font-bold mb-4" style={{ color: "#111111" }}>Desempenho por Dimensão</h3>
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
            <PolarGrid stroke="#ECEEEA" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#4B4F4B", fontWeight: 500 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#A7ADA7" }} tickCount={6} />
            <Radar name="Score" dataKey="score" stroke="#E10867" fill="#E10867" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip formatter={(v) => [`${Math.round(v)} / 100`, "Score"]} contentStyle={{ borderRadius: 8, border: "1px solid #ECEEEA", fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* All Dimensions — expandable */}
      <div className="bg-white rounded-2xl border mb-6 overflow-hidden" style={{ borderColor: "#A7ADA7" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#ECEEEA" }}>
          <h3 className="font-bold" style={{ color: "#111111" }}>Análise por Dimensão</h3>
          <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>Clique em cada dimensão para ver recomendações detalhadas</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#ECEEEA" }}>
          {DIMENSIONS.map(d => {
            const score = dimension_scores[d.id] || 0;
            const colors = getAIMaturityColor(score);
            const isOpen = expandedDim === d.id;
            return (
              <div key={d.id}>
                <button
                  onClick={() => setExpandedDim(isOpen ? null : d.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
                  <span className="text-lg flex-shrink-0">{d.emoji}</span>
                  <span className="flex-1 text-sm font-semibold" style={{ color: "#111111" }}>{d.name}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: colors.color }}>{Math.round(score)}/100</span>
                    <div className="w-20 h-1.5 rounded-full" style={{ background: "#ECEEEA" }}>
                      <div className="h-full rounded-full" style={{ width: `${scoreToPercent(score)}%`, background: colors.color }} />
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "#A7ADA7", transform: isOpen ? "rotate(90deg)" : "none" }} />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 pt-2 border-t" style={{ background: "#FAFAFA", borderColor: "#ECEEEA" }}>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2"
                      style={{ background: colors.bg, color: colors.color }}>{getAIMaturityLabel(score)}</span>
                    <p className="text-sm leading-relaxed" style={{ color: "#4B4F4B" }}>{getGapRecommendation(d.id)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaps & Strengths */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#A7ADA7" }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" style={{ color: "#E65100" }} />
            <h3 className="font-bold text-sm" style={{ color: "#111111" }}>Top 3 Gaps Prioritários</h3>
          </div>
          <div className="space-y-2">
            {topGaps.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#FFF3E0" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: "#E65100" }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block" style={{ color: "#E65100" }}>{d.emoji} {d.name}</span>
                  <span className="text-xs" style={{ color: "#4B4F4B" }}>{Math.round(d.score)}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#A7ADA7" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: "#2C4425" }} />
            <h3 className="font-bold text-sm" style={{ color: "#111111" }}>Pontos Fortes</h3>
          </div>
          <div className="space-y-2">
            {topStrengths.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#e8f5e9" }}>
                <span className="text-lg">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block" style={{ color: "#2C4425" }}>{d.name}</span>
                  <span className="text-xs" style={{ color: "#4B4F4B" }}>{Math.round(d.score)}/100 · Dimensão consolidada</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onGoToTheses} className="w-full text-white text-base h-12 rounded-xl"
        style={{ background: "#E10867", border: "none" }}>
        Avançar para Gerar Tese de Inovação <ChevronRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );
}

function getGapRecommendation(dimId) {
  const recs = {
    estrategia: "Formalize a estratégia de IA com KPIs, orçamento dedicado e revisões periódicas pela diretoria. Alinhe ao roadmap de inovação da empresa.",
    governanca: "Implemente o RIPD (Relatório de Impacto à Proteção de Dados Pessoais) e a Avaliação de Impacto Algorítmico (AIA) conforme as diretrizes do PL 2338/2023 para sistemas de alto risco.",
    valor: "Estabeleça baselines financeiras claros e acompanhe o impacto da IA no P&L, com controle de Capex vs. Opex e cálculo de payback.",
    operacoes: "Implemente 'Sandboxes Corporativas' homologadas e DLP (Prevenção de Perda de Dados) para combater Shadow AI e proteger a propriedade intelectual.",
    ecossistema: "Formalize contratos B2B definindo sua empresa como Controladora e fornecedores como Operadores (termos LGPD), vedando uso dos seus dados para treinar modelos de terceiros.",
    dados: "Adote 'Privacy by Design' com isolamento de Dados Pessoais Sensíveis e técnicas como dados sintéticos ou privacidade diferencial para conformidade com a LGPD.",
    tecnologia: "Fortaleça o Human-in-the-loop com logs completos de auditoria e mecanismos de override manual, especialmente em sistemas de decisão de alto risco.",
    habilidades: "Implemente treinamento obrigatório sobre ética em IA, LGPD e uso responsável para todos os colaboradores, com certificação periódica.",
    frugalidade: "Conduza auditorias algorítmicas alinhadas à LGPD para garantir explicabilidade e eliminar vieses discriminatórios nas entregas ao cliente final.",
  };
  return recs[dimId] || "Investimento nesta dimensão trará ganhos significativos de maturidade e conformidade regulatória.";
}