import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Loader2, Sparkles, GitMerge, AlertTriangle, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ThesisCompareModal({ theses, onClose }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  };

  const runComparison = async () => {
    if (selectedIds.length !== 2) return;
    setLoading(true);
    const [t1, t2] = selectedIds.map(id => theses.find(t => t.id === id));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em estratégia de inovação corporativa. Compare duas teses de inovação e identifique sinergias, conflitos e oportunidades de integração.

TESE A (${t1.id?.slice(-6)}):
Texto: ${t1.thesis_text?.split("\n")[0]}
Categorias: ${(t1.macro_categories || []).join(", ")}
Prioridades: ${(t1.top_priorities || []).join(", ")}
Tags: ${(t1.tags || []).join(", ")}

TESE B (${t2.id?.slice(-6)}):
Texto: ${t2.thesis_text?.split("\n")[0]}
Categorias: ${(t2.macro_categories || []).join(", ")}
Prioridades: ${(t2.top_priorities || []).join(", ")}
Tags: ${(t2.tags || []).join(", ")}

Analise:
1. Sinergias entre as teses (onde se complementam e podem ser exploradas juntas)
2. Conflitos ou sobreposições (onde podem competir por recursos ou criar confusão estratégica)
3. Tags em comum (startups que servem as duas)
4. Categorias exclusivas de cada tese
5. Recomendação: devem ser integradas, mantidas separadas ou uma substituir a outra?

JSON:
{
  "synergies": [{"title": "string", "detail": "string"}],
  "conflicts": [{"title": "string", "detail": "string"}],
  "shared_tags": ["tag1", "tag2"],
  "exclusive_a": ["cat1"],
  "exclusive_b": ["cat1"],
  "recommendation": "integrar|separar|substituir",
  "recommendation_detail": "string"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          synergies: { type: "array", items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } } } },
          conflicts: { type: "array", items: { type: "object", properties: { title: { type: "string" }, detail: { type: "string" } } } },
          shared_tags: { type: "array", items: { type: "string" } },
          exclusive_a: { type: "array", items: { type: "string" } },
          exclusive_b: { type: "array", items: { type: "string" } },
          recommendation: { type: "string" },
          recommendation_detail: { type: "string" }
        }
      }
    });

    setComparison({ result, t1, t2 });
    setLoading(false);
  };

  const recColors = {
    integrar: { bg: '#f0fdf4', border: '#bbf7d0', text: '#2C4425', label: 'Integrar as teses' },
    separar: { bg: '#f0f8fb', border: '#B4D1D7', text: '#1E0B2E', label: 'Manter separadas' },
    substituir: { bg: '#fff5f7', border: '#fecaca', text: '#E10867', label: 'Uma deve substituir a outra' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: '#ECEEEA' }}>
          <h2 className="font-bold text-base flex items-center gap-2" style={{ color: '#111111' }}>
            <GitMerge className="w-4 h-4" style={{ color: '#6B2FA0' }} />
            Comparar Teses
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Select 2 theses */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>
              Selecione 2 teses para comparar ({selectedIds.length}/2)
            </p>
            <div className="space-y-2">
              {theses.map(t => {
                const isSelected = selectedIds.includes(t.id);
                const idx = selectedIds.indexOf(t.id);
                return (
                  <button key={t.id} onClick={() => toggleSelect(t.id)}
                    className="w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3"
                    style={{
                      borderColor: isSelected ? '#6B2FA0' : '#ECEEEA',
                      background: isSelected ? '#f3e8ff' : '#fff'
                    }}>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: '#6B2FA0' }}>{idx + 1}</span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#A7ADA7' }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: '#111111' }}>
                        Tese #{t.id?.slice(-6)} · {format(new Date(t.created_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#4B4F4B' }}>{t.thesis_text?.split("\n")[0]}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(t.macro_categories || []).slice(0, 3).map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={runComparison} disabled={selectedIds.length !== 2 || loading}
            className="w-full text-white gap-2" style={{ background: '#6B2FA0', border: 'none' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Comparando…" : "Comparar com IA"}
          </Button>

          {comparison && !loading && (
            <>
              {/* Recommendation */}
              {(() => {
                const rc = recColors[comparison.result.recommendation] || recColors.separar;
                return (
                  <div className="p-4 rounded-2xl border" style={{ background: rc.bg, borderColor: rc.border }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: rc.text }}>
                      ✦ Recomendação: {rc.label}
                    </p>
                    <p className="text-xs" style={{ color: '#4B4F4B' }}>{comparison.result.recommendation_detail}</p>
                  </div>
                );
              })()}

              {/* Shared tags */}
              {comparison.result.shared_tags?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#1E0B2E' }}>Tags em comum (startups que servem ambas)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {comparison.result.shared_tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Synergies */}
              <div>
                <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#2C4425' }}>
                  <Check className="w-4 h-4" /> Sinergias
                </p>
                <div className="space-y-2">
                  {(comparison.result.synergies || []).map((s, i) => (
                    <div key={i} className="p-3 rounded-xl border" style={{ borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: '#2C4425' }}>{s.title}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conflicts */}
              {comparison.result.conflicts?.length > 0 && (
                <div>
                  <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: '#E10867' }}>
                    <AlertTriangle className="w-4 h-4" /> Conflitos / Sobreposições
                  </p>
                  <div className="space-y-2">
                    {comparison.result.conflicts.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl border" style={{ borderColor: '#fecaca', background: '#fff5f7' }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: '#E10867' }}>{c.title}</p>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>{c.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exclusive categories */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: `Exclusivo da Tese A (${comparison.t1.id?.slice(-6)})`, cats: comparison.result.exclusive_a },
                  { label: `Exclusivo da Tese B (${comparison.t2.id?.slice(-6)})`, cats: comparison.result.exclusive_b },
                ].map(({ label, cats }) => cats?.length > 0 && (
                  <div key={label}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>{label}</p>
                    <div className="flex flex-wrap gap-1">
                      {cats.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}