import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, X, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ThesisReportModal({ thesis, corporate, onClose }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(thesis.cached_report || null);

  const generateReport = async (force = false) => {
    if (!force && thesis.cached_report) {
      setReport(thesis.cached_report);
      return;
    }
    setLoading(true);
    const prompt = `Você é um analista de inovação estratégica da Beta-i.

Gere um relatório executivo resumido sobre a tese de inovação abaixo.

EMPRESA: ${corporate?.company_name || "N/A"} — ${corporate?.sector || ""}
TESE:
${thesis.thesis_text}

Macrocategorias: ${(thesis.macro_categories || []).join(", ")}
Top Prioridades: ${(thesis.top_priorities || []).join(", ")}
Setores de interesse: ${(thesis.sectors || []).join(", ")}
Tags de matching: ${(thesis.tags || []).join(", ")}

Gere o relatório com as seções:
1. Sumário Executivo (2-3 frases)
2. Contexto Estratégico (o que motivou essa tese, 1 parágrafo)
3. Macrocategorias e Justificativas (para cada macrocategoria, 1-2 frases de justificativa)
4. Prioridades Imediatas (top 3 ações concretas a tomar agora)
5. Startups a Buscar (perfil ideal de startup para cada macrocategoria, 1 frase cada)
6. Riscos e Pontos de Atenção (2-3 riscos)

Responda em JSON:
{
  "executive_summary": "string",
  "strategic_context": "string",
  "categories_justification": [{"category": "string", "justification": "string"}],
  "immediate_priorities": ["string", "string", "string"],
  "startup_profiles": [{"category": "string", "profile": "string"}],
  "risks": ["string", "string", "string"]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string" },
          strategic_context: { type: "string" },
          categories_justification: { type: "array", items: { type: "object", properties: { category: { type: "string" }, justification: { type: "string" } } } },
          immediate_priorities: { type: "array", items: { type: "string" } },
          startup_profiles: { type: "array", items: { type: "object", properties: { category: { type: "string" }, profile: { type: "string" } } } },
          risks: { type: "array", items: { type: "string" } }
        }
      }
    });

    setReport(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#111111' }}>
              <FileText className="w-5 h-5" style={{ color: '#E10867' }} />
              Relatório de Inovação — {corporate?.company_name || "Empresa"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>
              {format(new Date(thesis.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5">
          {!report && !loading && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
                <FileText className="w-7 h-7" style={{ color: '#E10867' }} />
              </div>
              <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
                A IA irá gerar um relatório executivo completo com sumário, contexto estratégico, prioridades e perfil de startups.
              </p>
              <Button onClick={generateReport} className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
                <FileText className="w-4 h-4" /> Gerar Relatório com IA
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#E10867' }} />
              <p className="text-sm" style={{ color: '#4B4F4B' }}>IA gerando relatório executivo…</p>
            </div>
          )}

          {report && (
            <div className="space-y-5">
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl" style={{ background: '#fce7ef' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#E10867' }}>Sumário Executivo</p>
                <p className="text-sm" style={{ color: '#111111' }}>{report.executive_summary}</p>
              </div>

              {/* Strategic Context */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4B4F4B' }}>Contexto Estratégico</p>
                <p className="text-sm" style={{ color: '#4B4F4B' }}>{report.strategic_context}</p>
              </div>

              {/* Categories justification */}
              {report.categories_justification?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Macrocategorias</p>
                  <div className="space-y-2">
                    {report.categories_justification.map((c, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: '#ECEEEA' }}>
                        <div className="w-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: '#E10867', alignSelf: 'stretch', minHeight: 20 }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#111111' }}>{c.category}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{c.justification}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate priorities */}
              {report.immediate_priorities?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Prioridades Imediatas</p>
                  <div className="space-y-2">
                    {report.immediate_priorities.map((p, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: '#6B2FA0' }}>{i + 1}</span>
                        <p className="text-sm" style={{ color: '#111111' }}>{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Startup profiles */}
              {report.startup_profiles?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Perfil de Startups a Buscar</p>
                  <div className="space-y-2">
                    {report.startup_profiles.map((sp, i) => (
                      <div key={i} className="p-3 rounded-xl border" style={{ borderColor: '#B4D1D7', background: '#f0f8fb' }}>
                        <p className="text-xs font-semibold" style={{ color: '#1e3a4c' }}>{sp.category}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{sp.profile}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {report.risks?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Riscos e Pontos de Atenção</p>
                  <div className="space-y-2">
                    {report.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: '#fef2f2' }}>
                        <span className="text-sm flex-shrink-0">⚠️</span>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setReport(null)} size="sm">
                  Regenerar
                </Button>
                <Button onClick={onClose} size="sm" className="text-white" style={{ background: '#E10867', border: 'none' }}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}