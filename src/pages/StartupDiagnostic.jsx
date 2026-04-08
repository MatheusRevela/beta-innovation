import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { PILLARS, getMaturityLevel, calcAllScores } from "@/components/startup/StartupDiagnosticData";
import { Loader2, ChevronRight, ChevronLeft, Star, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

export default function StartupDiagnostic() {
  const navigate = useNavigate();
  const [startup, setStartup] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [pillarIdx, setPillarIdx] = useState(0);
  const [phase, setPhase] = useState("loading"); // loading | check | quiz | processing | result
  const [result, setResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      const links = await base44.entities.StartupUser.filter({ user_email: me.email, status: "ativo" });
      if (!links.length) { navigate(createPageUrl("PublicStartupRegister")); return; }
      const startups = await base44.entities.Startup.filter({ id: links[0].startup_id });
      if (!startups.length) { navigate(createPageUrl("PublicStartupRegister")); return; }
      setStartup(startups[0]);

      // Verifica sessão existente
      const existing = await base44.entities.StartupDiagnosticSession.filter({
        startup_id: startups[0].id,
        diagnostic_type: "maturidade_startup"
      });
      const completed = existing.find(s => s.status === "completed");
      if (completed) { setResult(completed); setPhase("result"); return; }

      const inProgress = existing.find(s => s.status === "in_progress");
      if (inProgress) {
        setSession(inProgress);
        setAnswers(inProgress.answers || {});
        setPillarIdx(inProgress.current_pillar_index || 0);
        setPhase("quiz");
      } else {
        setPhase("check");
      }
    };
    init();
  }, []);

  const startNew = async () => {
    const s = await base44.entities.StartupDiagnosticSession.create({
      startup_id: startup.id,
      diagnostic_type: "maturidade_startup",
      status: "in_progress",
      current_pillar_index: 0,
      answers: {}
    });
    setSession(s);
    setAnswers({});
    setPillarIdx(0);
    setPhase("quiz");
  };

  const setAnswer = (qIdx, val) => {
    setAnswers(prev => ({ ...prev, [`${pillarIdx}_${qIdx}`]: val }));
  };

  const currentPillarAnswered = () => {
    const pillar = PILLARS[pillarIdx];
    return pillar.questions.every((_, qi) => answers[`${pillarIdx}_${qi}`] > 0);
  };

  const saveProgress = async (newAnswers, newIdx) => {
    await base44.entities.StartupDiagnosticSession.update(session.id, {
      answers: newAnswers,
      current_pillar_index: newIdx
    });
  };

  const goNext = async () => {
    const newAnswers = { ...answers };
    if (pillarIdx < PILLARS.length - 1) {
      const newIdx = pillarIdx + 1;
      await saveProgress(newAnswers, newIdx);
      setPillarIdx(newIdx);
    } else {
      await finish(newAnswers);
    }
  };

  const goPrev = () => {
    if (pillarIdx > 0) setPillarIdx(pillarIdx - 1);
  };

  const finish = async (finalAnswers) => {
    setPhase("processing");
    const { pillarScores, overall } = calcAllScores(finalAnswers);
    const matLevel = getMaturityLevel(overall);

    // Prepara prompt para IA
    const scoresText = PILLARS.map(p => `${p.title}: ${pillarScores[p.id]}/100`).join("\n");
    const weakPillars = PILLARS.filter(p => pillarScores[p.id] < 50).map(p => p.title).join(", ");

    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em diagnóstico de startups da Beta-i Brasil.
Analise os resultados abaixo de uma startup e gere:
1. Uma síntese executiva de 3-4 frases sobre o perfil de maturidade
2. Para cada pilar com score abaixo de 70, 2 recomendações práticas específicas
3. 3 quick wins (ações que podem ser iniciadas em até 30 dias)
4. 2 iniciativas estratégicas de médio prazo (3-12 meses)

Scores por pilar:
${scoresText}

Score geral: ${overall}/100
Nível: ${matLevel.label}
Pilares mais fracos: ${weakPillars || "nenhum abaixo de 50"}

Responda em português brasileiro, de forma direta e acionável.`,
      response_json_schema: {
        type: "object",
        properties: {
          synthesis: { type: "string" },
          recommendations: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } }
          },
          quick_wins: { type: "array", items: { type: "string" } },
          strategic_initiatives: { type: "array", items: { type: "string" } }
        }
      }
    });

    const updated = await base44.entities.StartupDiagnosticSession.update(session.id, {
      status: "completed",
      pillar_scores: pillarScores,
      overall_score: overall,
      maturity_level: matLevel.label,
      ai_synthesis: aiResult.synthesis,
      ai_recommendations: aiResult.recommendations,
      quick_wins: aiResult.quick_wins,
      strategic_initiatives: aiResult.strategic_initiatives,
      completed_at: new Date().toISOString(),
      answers: finalAnswers
    });
    setResult(updated);
    setPhase("result");
  };

  const progress = ((pillarIdx) / PILLARS.length) * 100;

  // ─── LOADING ────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#ECEEEA' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  // ─── CHECK (tela de boas-vindas) ─────────────────────────────
  if (phase === "check") return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#ECEEEA' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E10867' }}>
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#111111' }}>Beta-i Innovation OS</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#111111' }}>Diagnóstico de Maturidade</h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>{startup?.name}</p>
        </div>
        <div className="bg-white rounded-2xl border p-8" style={{ borderColor: '#A7ADA7' }}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[["9", "Pilares avaliados"], ["35", "Perguntas"], ["~15min", "Tempo estimado"]].map(([v, l]) => (
              <div key={l} className="text-center p-3 rounded-xl" style={{ background: '#ECEEEA' }}>
                <p className="text-2xl font-black" style={{ color: '#E10867' }}>{v}</p>
                <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>{l}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-6">
            {PILLARS.map(p => (
              <div key={p.id} className="flex items-center gap-2 text-sm" style={{ color: '#4B4F4B' }}>
                <span>{p.emoji}</span> <span>{p.title}</span>
              </div>
            ))}
          </div>
          <Button onClick={startNew} className="w-full text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
            Iniciar Diagnóstico <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // ─── QUIZ ────────────────────────────────────────────────────
  if (phase === "quiz") {
    const pillar = PILLARS[pillarIdx];
    return (
      <div className="min-h-screen" style={{ background: '#ECEEEA' }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: '#fce7ef' }}>{pillar.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#E10867' }}>
                Pilar {pillarIdx + 1} de {PILLARS.length}
              </p>
              <h2 className="font-bold text-lg leading-tight" style={{ color: '#111111' }}>{pillar.title}</h2>
            </div>
          </div>

          {/* Progress */}
          <div className="h-1.5 rounded-full mb-6" style={{ background: '#A7ADA7' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: '#E10867' }} />
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {pillar.questions.map((q, qi) => {
              const val = answers[`${pillarIdx}_${qi}`] || 0;
              return (
                <div key={qi} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: '#111111' }}>{q.text}</p>
                  <p className="text-xs mb-4" style={{ color: '#4B4F4B' }}>{q.hint}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const score = oi + 1;
                      const selected = val === score;
                      return (
                        <button key={oi} onClick={() => setAnswer(qi, score)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all text-sm"
                          style={{
                            borderColor: selected ? '#E10867' : '#A7ADA7',
                            background: selected ? '#fce7ef' : '#fff',
                            color: selected ? '#E10867' : '#111111'
                          }}>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ borderColor: selected ? '#E10867' : '#A7ADA7', background: selected ? '#E10867' : 'transparent' }}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <span className="font-semibold text-xs mr-2" style={{ color: selected ? '#E10867' : '#4B4F4B' }}>
                              {score}
                            </span>
                            {opt}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-6">
            <Button variant="ghost" onClick={goPrev} disabled={pillarIdx === 0}
              className="gap-1" style={{ color: '#4B4F4B' }}>
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button onClick={goNext} disabled={!currentPillarAnswered()}
              className="gap-2 text-white px-6" style={{ background: '#E10867', border: 'none' }}>
              {pillarIdx === PILLARS.length - 1 ? "Finalizar e gerar relatório" : "Próximo pilar"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PROCESSING ──────────────────────────────────────────────
  if (phase === "processing") return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#ECEEEA' }}>
      <div className="bg-white rounded-2xl border p-10 text-center max-w-sm" style={{ borderColor: '#A7ADA7' }}>
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: '#E10867' }} />
        <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Gerando seu relatório</h2>
        <p className="text-sm" style={{ color: '#4B4F4B' }}>
          A IA está analisando seus resultados e gerando recomendações personalizadas…
        </p>
      </div>
    </div>
  );

  // ─── RESULT ──────────────────────────────────────────────────
  if (phase === "result" && result) {
    const matLevel = getMaturityLevel(result.overall_score || 0);
    const radarData = PILLARS.map(p => ({
      subject: p.label,
      score: result.pillar_scores?.[p.id] || 0,
      fullMark: 100
    }));

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border p-6 mb-5" style={{ borderColor: '#A7ADA7' }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#E10867' }}>
                Diagnóstico de Maturidade
              </p>
              <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>{startup?.name}</h1>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black" style={{ color: '#E10867' }}>{result.overall_score}</p>
              <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>de 100</p>
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: matLevel.bg, color: matLevel.color }}>
                {matLevel.label}
              </span>
            </div>
          </div>
          {result.ai_synthesis && (
            <p className="text-sm mt-4 leading-relaxed p-4 rounded-xl" style={{ background: '#ECEEEA', color: '#111111' }}>
              {result.ai_synthesis}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Radar */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Perfil por Pilar</h2>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ECEEEA" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#4B4F4B' }} />
                <Radar name="Score" dataKey="score" stroke="#E10867" fill="#E10867" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Scores por pilar */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Score por Pilar</h2>
            <div className="space-y-3">
              {PILLARS.map(p => {
                const score = result.pillar_scores?.[p.id] || 0;
                const lv = getMaturityLevel(score);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: '#111111' }}>
                        {p.emoji} {p.label}
                      </span>
                      <span className="text-xs font-bold" style={{ color: lv.color }}>{score}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#ECEEEA' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${score}%`, background: lv.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick wins */}
        {result.quick_wins?.length > 0 && (
          <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: '#111111' }}>
              <Zap className="w-4 h-4" style={{ color: '#E10867' }} /> Quick Wins (até 30 dias)
            </h2>
            <div className="space-y-2">
              {result.quick_wins.map((qw, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl" style={{ background: '#fce7ef' }}>
                  <span className="font-bold flex-shrink-0" style={{ color: '#E10867' }}>{i + 1}.</span>
                  <span style={{ color: '#111111' }}>{qw}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic initiatives */}
        {result.strategic_initiatives?.length > 0 && (
          <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-3" style={{ color: '#111111' }}>🎯 Iniciativas Estratégicas (3–12 meses)</h2>
            <div className="space-y-2">
              {result.strategic_initiatives.map((si, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-xl" style={{ background: '#ECEEEA' }}>
                  <span className="font-bold flex-shrink-0" style={{ color: '#111111' }}>{i + 1}.</span>
                  <span style={{ color: '#111111' }}>{si}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations per pillar */}
        {result.ai_recommendations && Object.keys(result.ai_recommendations).length > 0 && (
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>📋 Recomendações por Pilar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PILLARS.map(p => {
                const recs = result.ai_recommendations[p.id];
                if (!recs?.length) return null;
                return (
                  <div key={p.id} className="p-4 rounded-xl" style={{ background: '#ECEEEA' }}>
                    <p className="font-semibold text-xs mb-2" style={{ color: '#111111' }}>
                      {p.emoji} {p.title}
                    </p>
                    <ul className="space-y-1">
                      {recs.map((r, ri) => (
                        <li key={ri} className="text-xs flex items-start gap-1.5" style={{ color: '#4B4F4B' }}>
                          <span className="mt-0.5 flex-shrink-0" style={{ color: '#E10867' }}>•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => navigate(createPageUrl("StartupPortal"))}
            style={{ borderColor: '#A7ADA7' }}>
            Voltar ao Portal
          </Button>
        </div>
      </div>
    );
  }

  return null;
}