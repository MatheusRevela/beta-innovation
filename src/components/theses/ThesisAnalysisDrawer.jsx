import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  X, Loader2, Sparkles, ThumbsUp, ThumbsDown,
  Lightbulb, AlertTriangle, RefreshCw, ChevronRight
} from "lucide-react";

export default function ThesisAnalysisDrawer({ thesis, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista sênior em inovação corporativa e open innovation. Analise criticamente a seguinte tese de inovação e forneça uma análise estratégica aprofundada.

TESE DE INOVAÇÃO:
${thesis.thesis_text}

Macrocategorias: ${(thesis.macro_categories || []).join(", ")}
Top prioridades: ${(thesis.top_priorities || []).join(", ")}
Tags de matching: ${(thesis.tags || []).join(", ")}
Setores: ${(thesis.sectors || []).join(", ")}

Analise e forneça:
1. Pontos fortes da tese (mínimo 4, específicos e fundamentados)
2. Pontos fracos ou riscos estratégicos (mínimo 3)
3. Categorias alternativas de inovação que podem ser exploradas (mínimo 4, com justificativa)
4. Oportunidades emergentes não exploradas na tese
5. Score geral de robustez estratégica da tese (0-100) com justificativa

JSON:
{
  "strengths": [{"title": "string", "detail": "string"}],
  "weaknesses": [{"title": "string", "detail": "string"}],
  "alternative_categories": [{"category": "string", "rationale": "string", "urgency": "alta|media|baixa"}],
  "opportunities": ["string"],
  "robustness_score": number,
  "robustness_rationale": "string"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          strengths: { type: "array", items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } } } },
          weaknesses: { type: "array", items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } } } },
          alternative_categories: { type: "array", items: { type: "object", properties: { category: { type: "string" }, rationale: { type: "string" }, urgency: { type: "string" } } } },
          opportunities: { type: "array", items: { type: "string" } },
          robustness_score: { type: "number" },
          robustness_rationale: { type: "string" }
        }
      }
    });
    setAnalysis(result);
    setLoading(false);
    setRan(true);
  };

  const urgencyColors = {
    alta: { bg: '#fce7ef', text: '#E10867' },
    media: { bg: '#fef3c7', text: '#d97706' },
    baixa: { bg: '#ECEEEA', text: '#4B4F4B' },
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b flex-shrink-0 flex items-center justify-between" style={{ borderColor: '#ECEEEA' }}>
          <div>
            <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#111111' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#E10867' }} />
              Análise Profunda por IA
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>Tese #{thesis.id?.slice(-6)}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Thesis summary */}
          <div className="p-4 rounded-2xl" style={{ background: '#ECEEEA' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#4B4F4B' }}>Tese</p>
            <p className="text-sm line-clamp-3" style={{ color: '#111111' }}>{thesis.thesis_text?.split("\n")[0]}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(thesis.macro_categories || []).map(c => (
                <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
              ))}
            </div>
          </div>

          {/* CTA if not ran */}
          {!ran && !loading && (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#fce7ef' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#E10867' }} />
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: '#111111' }}>Análise estratégica com IA</p>
              <p className="text-xs mb-4" style={{ color: '#4B4F4B' }}>
                Identifique pontos fortes, fracos, oportunidades e categorias alternativas.
              </p>
              <Button onClick={runAnalysis} className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
                <Sparkles className="w-4 h-4" /> Analisar Tese
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
              <p className="text-sm" style={{ color: '#4B4F4B' }}>Analisando sua tese…</p>
            </div>
          )}

          {analysis && !loading && (
            <>
              {/* Robustness score */}
              <div className="p-4 rounded-2xl border" style={{ borderColor: '#B4D1D7', background: '#f0f8fb' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: '#111111' }}>Score de Robustez Estratégica</p>
                  <span className="text-2xl font-bold" style={{
                    color: analysis.robustness_score >= 70 ? '#2C4425' : analysis.robustness_score >= 45 ? '#d97706' : '#E10867'
                  }}>{analysis.robustness_score}<span className="text-sm font-normal">/100</span></span>
                </div>
                <div className="h-2 rounded-full mb-2" style={{ background: '#ECEEEA' }}>
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${analysis.robustness_score}%`,
                    background: analysis.robustness_score >= 70 ? '#2C4425' : analysis.robustness_score >= 45 ? '#d97706' : '#E10867'
                  }} />
                </div>
                <p className="text-xs" style={{ color: '#4B4F4B' }}>{analysis.robustness_rationale}</p>
              </div>

              {/* Strengths */}
              <div>
                <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#2C4425' }}>
                  <ThumbsUp className="w-4 h-4" /> Pontos Fortes
                </p>
                <div className="space-y-2">
                  {(analysis.strengths || []).map((s, i) => (
                    <div key={i} className="p-3 rounded-xl border" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#2C4425' }}>{s.title}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#E10867' }}>
                  <AlertTriangle className="w-4 h-4" /> Pontos de Atenção
                </p>
                <div className="space-y-2">
                  {(analysis.weaknesses || []).map((w, i) => (
                    <div key={i} className="p-3 rounded-xl border" style={{ borderColor: '#fecaca', background: '#fff5f7' }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#E10867' }}>{w.title}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{w.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternative categories */}
              <div>
                <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#6B2FA0' }}>
                  <Lightbulb className="w-4 h-4" /> Categorias Alternativas Sugeridas
                </p>
                <div className="space-y-2">
                  {(analysis.alternative_categories || []).map((a, i) => {
                    const colors = urgencyColors[a.urgency] || urgencyColors.baixa;
                    return (
                      <div key={i} className="p-3 rounded-xl border flex items-start gap-3" style={{ borderColor: '#ECEEEA' }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold" style={{ color: '#111111' }}>{a.category}</p>
                            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: colors.bg, color: colors.text }}>
                              {a.urgency}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: '#4B4F4B' }}>{a.rationale}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Opportunities */}
              <div>
                <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#1E0B2E' }}>
                  <ChevronRight className="w-4 h-4" /> Oportunidades Não Exploradas
                </p>
                <div className="space-y-1.5">
                  {(analysis.opportunities || []).map((o, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: '#ECEEEA' }}>
                      <span className="text-xs font-bold mt-0.5" style={{ color: '#6B2FA0' }}>{i + 1}.</span>
                      <p className="text-xs" style={{ color: '#111111' }}>{o}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={runAnalysis} className="w-full gap-2" style={{ borderColor: '#A7ADA7' }}>
                <RefreshCw className="w-3.5 h-3.5" /> Reanalisar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}