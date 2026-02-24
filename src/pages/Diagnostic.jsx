import { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { DIAGNOSTIC_PILLARS, calculateScores } from "@/components/diagnostic/DiagnosticQuestions";
import MaturityRadarChart from "@/components/diagnostic/MaturityRadarChart";
import { getMaturidadeLevel } from "@/components/ui/DesignTokens";
import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Zap, Loader2, CheckCircle, HelpCircle, X } from "lucide-react";

const PILLAR_RECS = {
  estrategia_governanca: ["Estruturar comitê de inovação com mandato e budget", "Desenvolver roadmap de inovação em 90 dias"],
  cultura: ["Programa de cultura de inovação (workshops + desafios internos)", "Implementar reconhecimento de iniciativas inovadoras"],
  processos_ferramentas: ["Adotar funil de inovação com critérios de stage-gate", "Capacitar equipe em Design Thinking / Lean Startup"],
  pessoas_habilidades: ["Mapear e desenvolver competências de inovação", "Criar squad dedicado com autonomia e recursos"],
  investimento: ["Definir orçamento dedicado a inovação aberta (PoC/CVC)", "Estruturar pipeline de parcerias com startups"],
  resultados_futuro: ["Implementar dashboard de métricas de inovação", "Conduzir exercício de mapeamento de tendências e riscos"]
};

export default function Diagnostic() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const corporateId = params.get("corporate_id");
  const sessionId = params.get("session_id");

  const [session, setSession] = useState(null);
  const [pillarIdx, setPillarIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [phase, setPhase] = useState("quiz"); // quiz | results
  const [results, setResults] = useState(null);
  const [aiHelp, setAiHelp] = useState(null);
  const [aiHelpQuestion, setAiHelpQuestion] = useState(null);
  const [loadingHelp, setLoadingHelp] = useState(false);

  const pillar = DIAGNOSTIC_PILLARS[pillarIdx];
  const totalPillars = DIAGNOSTIC_PILLARS.length;

  useEffect(() => {
    if (sessionId) {
      base44.entities.DiagnosticSession.filter({ id: sessionId }).then(r => {
        if (r[0]) {
          setSession(r[0]);
          if (r[0].status === "completed") {
            setResults({
              pillarScores: r[0].pillar_scores,
              overallScore: r[0].overall_score,
              maturityLevel: r[0].maturity_level,
              synthesis: r[0].ai_synthesis,
              recommendations: r[0].ai_recommendations
            });
            setPhase("results");
          }
        }
      });
    }
  }, [sessionId]);

  const getAnswer = (qId) => responses[`${pillar.id}__${qId}`] ?? null;
  const setAnswer = (qId, val) => setResponses(r => ({ ...r, [`${pillar.id}__${qId}`]: val }));

  const pillarAnswered = pillar.questions.every(q => getAnswer(q.id) !== null);
  const progressPct = (pillarIdx / totalPillars) * 100;

  const askAiHelp = async (question) => {
    setAiHelpQuestion(question);
    setLoadingHelp(true);
    setAiHelp(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um consultor de inovação da Beta-i Brasil. Explique de forma clara e concisa (máximo 3 frases) o que esta pergunta de diagnóstico de maturidade de inovação quer avaliar: "${question.text}". Seja objetivo e evite jargões. Responda em português.`
    });
    setAiHelp(res);
    setLoadingHelp(false);
  };

  const nextPillar = async () => {
    if (!pillarAnswered) return;
    if (pillarIdx < totalPillars - 1) {
      setPillarIdx(i => i + 1);
    } else {
      await finishDiagnostic();
    }
  };

  const finishDiagnostic = async () => {
    setGenerating(true);
    const allResponses = DIAGNOSTIC_PILLARS.flatMap(p =>
      p.questions.map(q => ({
        pillar_id: p.id,
        pillar_name: p.name,
        question_id: q.id,
        question_text: q.text,
        answer_value: responses[`${p.id}__${q.id}`] ?? 0
      }))
    );
    const { pillarScores, overallScore } = calculateScores(allResponses);
    const matLevel = getMaturidadeLevel(overallScore);

    const summaryText = DIAGNOSTIC_PILLARS.map(p =>
      `${p.name}: ${pillarScores[p.id] ?? 0}% (${allResponses.filter(r => r.pillar_id === p.id).map(r => `${r.question_id}=${r.answer_value}`).join(", ")})`
    ).join("\n");

    const aiPrompt = `Você é consultor sênior de inovação da Beta-i Brasil. Com base nos resultados do diagnóstico de maturidade de inovação abaixo, gere:
1. Uma síntese executiva em 3-4 frases sobre o perfil de inovação da empresa
2. As 2 principais recomendações para cada pilar (em pt-BR)

Resultados por pilar (score 0-100):
${summaryText}

Score geral: ${overallScore}% — Nível: ${matLevel.label}

Responda estritamente no JSON schema abaixo:
{
  "synthesis": "string (síntese geral)",
  "pillar_recommendations": {
    "estrategia_governanca": ["rec1","rec2"],
    "cultura": ["rec1","rec2"],
    "processos_ferramentas": ["rec1","rec2"],
    "pessoas_habilidades": ["rec1","rec2"],
    "investimento": ["rec1","rec2"],
    "resultados_futuro": ["rec1","rec2"]
  },
  "quick_wins": ["ação rápida 1", "ação rápida 2", "ação rápida 3"],
  "strategic_initiatives": ["iniciativa estratégica 1", "iniciativa estratégica 2"]
}`;

    let aiResult = null;
    try {
      aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            synthesis: { type: "string" },
            pillar_recommendations: { type: "object" },
            quick_wins: { type: "array", items: { type: "string" } },
            strategic_initiatives: { type: "array", items: { type: "string" } }
          }
        }
      });
    } catch (e) {
      aiResult = { synthesis: "Análise gerada com base nas respostas.", pillar_recommendations: PILLAR_RECS, quick_wins: [], strategic_initiatives: [] };
    }

    let sess;
    if (session) {
      sess = await base44.entities.DiagnosticSession.update(session.id, {
        status: "completed",
        overall_score: overallScore,
        maturity_level: matLevel.label,
        pillar_scores: pillarScores,
        ai_synthesis: aiResult?.synthesis,
        ai_recommendations: aiResult?.pillar_recommendations,
        quick_wins: aiResult?.quick_wins,
        strategic_initiatives: aiResult?.strategic_initiatives,
        completed_at: new Date().toISOString()
      });
    } else if (corporateId) {
      sess = await base44.entities.DiagnosticSession.create({
        corporate_id: corporateId,
        status: "completed",
        overall_score: overallScore,
        maturity_level: matLevel.label,
        pillar_scores: pillarScores,
        ai_synthesis: aiResult?.synthesis,
        ai_recommendations: aiResult?.pillar_recommendations,
        quick_wins: aiResult?.quick_wins,
        strategic_initiatives: aiResult?.strategic_initiatives,
        completed_at: new Date().toISOString()
      });
    }

    for (const r of allResponses) {
      await base44.entities.DiagnosticResponse.create({ ...r, session_id: sess?.id, corporate_id: corporateId });
    }

    setResults({
      pillarScores,
      overallScore,
      maturityLevel: matLevel.label,
      synthesis: aiResult?.synthesis,
      recommendations: aiResult?.pillar_recommendations,
      quick_wins: aiResult?.quick_wins,
      strategic_initiatives: aiResult?.strategic_initiatives,
      sessionId: sess?.id
    });
    setGenerating(false);
    setPhase("results");
  };

  if (generating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ background: '#ECEEEA' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fce7ef' }}>
          <Zap className="w-8 h-8 animate-pulse" style={{ color: '#E10867' }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#111111' }}>Analisando suas respostas…</h2>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>A IA está gerando seu diagnóstico e recomendações personalizadas</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
      </div>
    );
  }

  if (phase === "results" && results) {
    const matLevel = getMaturidadeLevel(results.overallScore);
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: '#fce7ef' }}>
            <CheckCircle className="w-7 h-7" style={{ color: '#E10867' }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>Diagnóstico Concluído</h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>Aqui está o perfil de maturidade em inovação da sua empresa</p>
        </div>

        {/* Score card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col sm:flex-row items-center gap-6"
          style={{ borderColor: '#A7ADA7' }}>
          <div className="flex-shrink-0 text-center">
            <div className="text-6xl font-black" style={{ color: '#E10867' }}>{results.overallScore}</div>
            <div className="text-sm font-medium mt-1" style={{ color: '#4B4F4B' }}>de 100</div>
            <div className="mt-2"><MaturityBadge level={results.maturityLevel} /></div>
          </div>
          <div className="flex-1 w-full">
            <MaturityRadarChart pillarScores={results.pillarScores} size={250} />
          </div>
        </div>

        {/* AI Synthesis */}
        {results.synthesis && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: '#E10867' }} />
              <span className="font-semibold text-sm">Síntese executiva</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#4B4F4B' }}>{results.synthesis}</p>
          </div>
        )}

        {/* Pillar scores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIAGNOSTIC_PILLARS.map(p => {
            const score = results.pillarScores?.[p.id] ?? 0;
            const recs = results.recommendations?.[p.id] || PILLAR_RECS[p.id];
            return (
              <div key={p.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: '#A7ADA7' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">{p.icon} {p.name}</span>
                  <span className="font-bold text-sm" style={{ color: score >= 60 ? '#2C4425' : score >= 40 ? '#6B2FA0' : '#E10867' }}>
                    {score}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full mb-3" style={{ background: '#ECEEEA' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, background: score >= 60 ? '#2C4425' : score >= 40 ? '#6B2FA0' : '#E10867' }} />
                </div>
                {recs && (
                  <ul className="space-y-1">
                    {recs.slice(0, 2).map((r, i) => (
                      <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: '#4B4F4B' }}>
                        <span className="mt-0.5 flex-shrink-0">→</span>{r}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(createPageUrl("StartupRadar") + `?session_id=${results.sessionId}&corporate_id=${corporateId}`)}
            className="text-white px-8"
            style={{ background: '#E10867', border: 'none' }}
          >
            Ver Radar de Startups →
          </Button>
          <Button variant="outline" onClick={() => window.print()} style={{ borderColor: '#A7ADA7' }}>
            Exportar relatório
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: '#4B4F4B' }}>
            Pilar {pillarIdx + 1} de {totalPillars}
          </span>
          <span className="text-xs font-medium" style={{ color: '#E10867' }}>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: '#A7ADA7' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: '#E10867' }} />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {DIAGNOSTIC_PILLARS.map((p, i) => (
            <span key={p.id} className="px-2 py-0.5 rounded-full text-xs"
              style={{
                background: i < pillarIdx ? '#2C4425' : i === pillarIdx ? '#E10867' : '#ECEEEA',
                color: i <= pillarIdx ? '#fff' : '#4B4F4B'
              }}>
              {p.icon} {p.name.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Pillar card */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-4" style={{ borderColor: '#A7ADA7' }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-2xl">{pillar.icon}</span>
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#111111' }}>{pillar.name}</h2>
            <p className="text-xs" style={{ color: '#4B4F4B' }}>{pillar.description}</p>
          </div>
        </div>

        <div className="space-y-6">
          {pillar.questions.map((q, qi) => {
            const answer = getAnswer(q.id);
            return (
              <div key={q.id}>
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xs font-bold rounded-full w-5 h-5 flex-shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: '#ECEEEA', color: '#4B4F4B' }}>{qi + 1}</span>
                  <p className="text-sm font-medium flex-1" style={{ color: '#111111' }}>{q.text}</p>
                  <button onClick={() => askAiHelp(q)} className="flex-shrink-0 hover:opacity-70 transition-opacity" title="O que isso significa?">
                    <HelpCircle className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v}
                      onClick={() => setAnswer(q.id, v)}
                      className="flex-1 min-w-0 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                      style={{
                        borderColor: answer === v ? '#E10867' : '#A7ADA7',
                        background: answer === v ? '#fce7ef' : '#fff',
                        color: answer === v ? '#E10867' : '#4B4F4B'
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
                {q.labels && answer && (
                  <p className="text-xs mt-1.5 text-center" style={{ color: '#6B2FA0' }}>
                    {q.labels[answer - 1]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI help tooltip */}
      {aiHelpQuestion && (
        <div className="bg-white rounded-2xl border p-4 mb-4" style={{ borderColor: '#B4D1D7' }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" style={{ color: '#E10867' }} />
              <span className="text-xs font-semibold" style={{ color: '#111111' }}>Ajuda da IA</span>
            </div>
            <button onClick={() => { setAiHelpQuestion(null); setAiHelp(null); }}>
              <X className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
            </button>
          </div>
          {loadingHelp ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: '#4B4F4B' }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Explicando…
            </div>
          ) : (
            <p className="text-xs leading-relaxed" style={{ color: '#4B4F4B' }}>{aiHelp}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setPillarIdx(i => i - 1)} disabled={pillarIdx === 0}
          style={{ borderColor: '#A7ADA7' }}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
        </Button>
        <Button onClick={nextPillar} disabled={!pillarAnswered}
          className="text-white gap-2"
          style={{ background: pillarAnswered ? '#E10867' : '#A7ADA7', border: 'none' }}>
          {pillarIdx === totalPillars - 1 ? "Gerar Diagnóstico" : "Próximo"}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}