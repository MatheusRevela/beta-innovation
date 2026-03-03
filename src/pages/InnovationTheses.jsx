import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Lightbulb, Plus, ChevronRight, Loader2, Zap, Map, Trash2, GitCompare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ThesisTimeline from "@/components/theses/ThesisTimeline";
import ThesisCompare from "@/components/theses/ThesisCompare";
import ThesisReportModal from "@/components/theses/ThesisReportModal";
import ThesisWizard from "@/components/theses/ThesisWizard";

export default function InnovationTheses() {
  const navigate = useNavigate();
  const [theses, setTheses] = useState([]);
  const [corporate, setCorporate] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [reportThesis, setReportThesis] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const me = await base44.auth.me();
    const [corpsByEmail, corpsByCreator] = await Promise.all([
      base44.entities.Corporate.filter({ contact_email: me.email }),
      base44.entities.Corporate.filter({ created_by: me.email }),
    ]);
    const allCorps = [...corpsByEmail, ...corpsByCreator];
    const seen = new Set();
    const uniqueCorps = allCorps.filter(c => seen.has(c.id) ? false : seen.add(c.id));
    const corp = uniqueCorps[0];
    setCorporate(corp);

    if (corp) {
      const [thesesData, sessionsData] = await Promise.all([
        base44.entities.InnovationThesis.filter({ corporate_id: corp.id }, "-created_date"),
        base44.entities.DiagnosticSession.filter({ corporate_id: corp.id, status: "completed" }, "-completed_at")
      ]);
      setTheses(thesesData);
      setSessions(sessionsData);
    }
    setLoading(false);
  };

  const handleThesisCreated = (newThesis) => {
    setTheses(prev => [newThesis, ...prev]);
    setShowForm(false);
  };

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const goToRadar = (thesis) => {
    navigate(createPageUrl("StartupRadar") + `?thesis_id=${thesis.id}&corporate_id=${corporate.id}`);
  };

  const deleteThesis = async (id) => {
    await base44.entities.InnovationThesis.delete(id);
    setTheses(prev => prev.filter(t => t.id !== id));
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Teses de Inovação</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            Mapeie suas teses para conectar com startups relevantes
          </p>
        </div>
        {corporate && (
          <div className="flex gap-2">
            {compareIds.length >= 2 && (
              <Button onClick={() => setShowCompare(true)} variant="outline" className="gap-2"
                style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
                <GitCompare className="w-4 h-4" /> Comparar ({compareIds.length})
              </Button>
            )}
            <Button onClick={() => setShowForm(true)} className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
              <Plus className="w-4 h-4" /> Nova Tese
            </Button>
          </div>
        )}
      </div>

      {!corporate && (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="font-bold text-lg mb-2">Configure sua empresa primeiro</h2>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>Complete o onboarding para criar teses de inovação.</p>
          <Button onClick={() => navigate(createPageUrl("Onboarding"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
            Iniciar Onboarding
          </Button>
        </div>
      )}

      {corporate && sessions.length === 0 && (
        <div className="bg-white rounded-2xl border p-6 mb-6 flex items-start gap-4" style={{ borderColor: '#B4D1D7', background: '#f0f8fb' }}>
          <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#6B2FA0' }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>Recomendação: faça o diagnóstico primeiro</p>
            <p className="text-sm" style={{ color: '#4B4F4B' }}>
              O Diagnóstico de Maturidade enriquece suas teses com dados do estágio atual da sua empresa. Mas você já pode criar teses livremente!
            </p>
            <Button onClick={() => navigate(createPageUrl("MyDiagnostics"))} variant="outline" size="sm" className="mt-3" style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
              Ir para Diagnósticos
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {theses.length > 1 && (
        <ThesisTimeline
          theses={theses}
          selectedIds={compareIds}
          onSelect={toggleCompare}
          onGoToRadar={goToRadar}
        />
      )}

      {/* Thesis list */}
      {theses.length === 0 && corporate && (
        <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
            <Lightbulb className="w-7 h-7" style={{ color: '#E10867' }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Nenhuma tese ainda</h2>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>Crie sua primeira tese de inovação para descobrir startups alinhadas.</p>
          <Button onClick={() => setShowForm(true)} className="text-white px-8" style={{ background: '#E10867', border: 'none' }}>
            Criar tese <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {theses.map(thesis => (
          <div key={thesis.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fce7ef' }}>
                  <Lightbulb className="w-5 h-5" style={{ color: '#E10867' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>
                    Tese #{thesis.id?.slice(-6)}
                  </p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>
                    Criada em {format(new Date(thesis.created_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    {thesis.session_id && " · Com diagnóstico"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setReportThesis(thesis)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Gerar relatório">
                  <FileText className="w-4 h-4" style={{ color: '#6B2FA0' }} />
                </button>
                <button onClick={() => deleteThesis(thesis.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <Trash2 className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                </button>
              </div>
            </div>

            <p className="text-sm mb-3 line-clamp-2" style={{ color: '#4B4F4B' }}>{thesis.thesis_text?.split("\n")[0]}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(thesis.macro_categories || []).map(c => (
                <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
              ))}
              {(thesis.tags || []).slice(0, 5).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: '#ECEEEA' }}>
              <span className="text-xs" style={{ color: thesis.matching_ran ? '#2C4425' : '#A7ADA7' }}>
                {thesis.matching_ran ? "✓ Matching já realizado" : "⏳ Matching pendente"}
              </span>
              <div className="flex-1" />
              <Button onClick={() => goToRadar(thesis)} size="sm" className="text-white gap-1.5" style={{ background: '#6B2FA0', border: 'none' }}>
                <Map className="w-3.5 h-3.5" />
                {thesis.matching_ran ? "Ver Radar" : "Gerar Radar"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Compare modal */}
      {showCompare && (
        <ThesisCompare
          theses={theses.filter(t => compareIds.includes(t.id))}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* Report modal */}
      {reportThesis && (
        <ThesisReportModal
          thesis={reportThesis}
          corporate={corporate}
          onClose={() => setReportThesis(null)}
        />
      )}

      {/* Create thesis form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg" style={{ color: '#111111' }}>Nova Tese de Inovação</h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="w-5 h-5" style={{ color: '#A7ADA7' }} />
                </button>
              </div>

              {sessions.length > 0 && (
                <div className="mb-5">
                  <label className="text-xs font-semibold block mb-2" style={{ color: '#4B4F4B' }}>
                    Vincular a um diagnóstico (opcional)
                  </label>
                  <select
                    value={form.session_id}
                    onChange={e => setForm(f => ({ ...f, session_id: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: '#A7ADA7' }}>
                    <option value="">Nenhum (tese independente)</option>
                    {sessions.map(s => (
                      <option key={s.id} value={s.id}>
                        Diagnóstico #{s.id?.slice(-6)} — Score: {s.overall_score} ({s.maturity_level})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-5">
                <label className="text-xs font-semibold block mb-2" style={{ color: '#4B4F4B' }}>
                  Setores de interesse *
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map(s => (
                    <button key={s} onClick={() => toggleItem("sectors", s)}
                      className="px-3 py-1.5 rounded-full text-xs border transition-all"
                      style={{
                        borderColor: form.sectors.includes(s) ? '#E10867' : '#A7ADA7',
                        background: form.sectors.includes(s) ? '#fce7ef' : '#fff',
                        color: form.sectors.includes(s) ? '#E10867' : '#4B4F4B'
                      }}>
                      {form.sectors.includes(s) && <Check className="w-3 h-3 inline mr-1" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold block mb-2" style={{ color: '#4B4F4B' }}>
                  Temas de inovação prioritários *
                </label>
                <div className="flex flex-wrap gap-2">
                  {INNOVATION_THEMES.map(t => (
                    <button key={t} onClick={() => toggleItem("themes", t)}
                      className="px-3 py-1.5 rounded-full text-xs border transition-all"
                      style={{
                        borderColor: form.themes.includes(t) ? '#6B2FA0' : '#A7ADA7',
                        background: form.themes.includes(t) ? '#f3e8ff' : '#fff',
                        color: form.themes.includes(t) ? '#6B2FA0' : '#4B4F4B'
                      }}>
                      {form.themes.includes(t) && <Check className="w-3 h-3 inline mr-1" />}
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-semibold block mb-2" style={{ color: '#4B4F4B' }}>
                  Contexto adicional (opcional)
                </label>
                <textarea
                  value={form.context}
                  onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
                  placeholder="Ex: Queremos explorar soluções de energia distribuída para nosso portfólio de ativos renováveis no Nordeste..."
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ borderColor: '#A7ADA7' }}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={generating}>
                  Cancelar
                </Button>
                <Button
                  onClick={generateThesis}
                  disabled={generating || (!form.sectors.length && !form.themes.length)}
                  className="text-white gap-2"
                  style={{ background: '#E10867', border: 'none' }}>
                  {generating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Gerando tese…</>
                  ) : (
                    <><Zap className="w-4 h-4" /> Gerar Tese com IA</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}