import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import {
  Lightbulb, Plus, ChevronRight, Loader2, Zap, Map,
  Trash2, GitCompare, FileText, Brain, CheckCircle2,
  Clock, Tag, Target, AlertTriangle, ChevronDown, ChevronUp,
  X, Pencil, BarChart2, Sparkles, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ThesisCompare from "@/components/theses/ThesisCompare";
import ThesisReportModal from "@/components/theses/ThesisReportModal";
import ThesisWizard from "@/components/theses/ThesisWizard";

// Compute a "thesis strength" score 0-100
function thesisStrength(thesis) {
  let score = 0;
  if (thesis.thesis_text?.length > 100) score += 20;
  if ((thesis.macro_categories || []).length >= 3) score += 20;
  if ((thesis.top_priorities || []).length >= 3) score += 20;
  if ((thesis.tags || []).length >= 10) score += 20;
  if (thesis.session_id) score += 10;
  if (thesis.matching_ran) score += 10;
  return score;
}

function StrengthBar({ thesis }) {
  const score = thesisStrength(thesis);
  const color = score >= 80 ? "#2C4425" : score >= 50 ? "#6B2FA0" : "#E10867";
  const label = score >= 80 ? "Forte" : score >= 50 ? "Boa" : "Básica";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#ECEEEA" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color, minWidth: 36 }}>{label}</span>
    </div>
  );
}

export default function InnovationTheses() {
  const navigate = useNavigate();
  const { loading: accessLoading, corporate, corporateId } = useCorporateAccess();
  const [theses, setTheses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [matchCounts, setMatchCounts] = useState({}); // thesis_id → count
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingThesis, setEditingThesis] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [reportThesis, setReportThesis] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!accessLoading && corporateId) loadData();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporateId]);

  const loadData = async () => {
    const [thesesData, sessionsData, matchesData] = await Promise.all([
      base44.entities.InnovationThesis.filter({ corporate_id: corporateId }, "-created_date"),
      base44.entities.DiagnosticSession.filter({ corporate_id: corporateId, status: "completed" }, "-completed_at"),
      base44.entities.StartupMatch.filter({ corporate_id: corporateId }),
    ]);
    setTheses(thesesData);
    setSessions(sessionsData);
    // Count matches per thesis
    const counts = {};
    for (const m of matchesData) {
      if (m.thesis_id) counts[m.thesis_id] = (counts[m.thesis_id] || 0) + 1;
    }
    setMatchCounts(counts);
    setLoading(false);
  };

  const handleThesisCreated = (savedThesis) => {
    if (editingThesis) {
      setTheses(prev => prev.map(t => t.id === savedThesis.id ? savedThesis : t));
      setEditingThesis(null);
    } else {
      setTheses(prev => [savedThesis, ...prev]);
    }
    setShowForm(false);
  };

  const toggleCompare = (id) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const goToRadar = (thesis) => {
    navigate(createPageUrl("StartupRadar") + `?corporate_id=${corporate.id}&thesis_id=${thesis.id}`);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await base44.entities.InnovationThesis.delete(deleteConfirmId);
    setTheses(prev => prev.filter(t => t.id !== deleteConfirmId));
    setDeleteConfirmId(null);
    if (compareIds.includes(deleteConfirmId)) {
      setCompareIds(prev => prev.filter(id => id !== deleteConfirmId));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  const isCompareModeActive = compareMode || compareIds.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
              <Lightbulb className="w-4 h-4" style={{ color: '#E10867' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Teses de Inovação</h1>
          </div>
          <p className="text-sm ml-10" style={{ color: '#4B4F4B' }}>
            Mapeie sua estratégia de inovação e conecte-se com startups relevantes
          </p>
        </div>
        {corporate && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {theses.length >= 2 && !isCompareModeActive && (
              <Button
                onClick={() => setCompareMode(true)}
                variant="outline" size="sm"
                style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
                <GitCompare className="w-3.5 h-3.5 mr-1.5" /> Comparar Teses
              </Button>
            )}
            {isCompareModeActive && (
              <>
                {compareIds.length >= 2 && (
                  <Button onClick={() => setShowCompare(true)} size="sm" className="text-white"
                    style={{ background: '#6B2FA0', border: 'none' }}>
                    <GitCompare className="w-3.5 h-3.5 mr-1.5" /> Comparar ({compareIds.length})
                  </Button>
                )}
                <Button onClick={() => { setCompareMode(false); setCompareIds([]); }} variant="outline" size="sm"
                  style={{ borderColor: '#A7ADA7', color: '#A7ADA7' }}>
                  <X className="w-3.5 h-3.5 mr-1" /> Cancelar
                </Button>
              </>
            )}
            <Button onClick={() => setShowForm(true)} className="text-white gap-1.5" style={{ background: '#E10867', border: 'none' }}>
              <Plus className="w-4 h-4" /> Nova Tese
            </Button>
          </div>
        )}
      </div>

      {/* ── SEM EMPRESA ── */}
      {!corporate && (
        <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="font-bold text-lg mb-2">Configure sua empresa primeiro</h2>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>Complete o onboarding para criar teses de inovação.</p>
          <Button onClick={() => navigate(createPageUrl("Onboarding"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
            Iniciar Onboarding
          </Button>
        </div>
      )}

      {/* ── SUGESTÃO: FAZER DIAGNÓSTICO ── */}
      {corporate && sessions.length === 0 && theses.length === 0 && (
        <div className="rounded-2xl border p-5 mb-6 flex items-start gap-4" style={{ borderColor: '#B4D1D7', background: '#f0f8fb' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e0f0f5' }}>
            <Zap className="w-4 h-4" style={{ color: '#6B2FA0' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1" style={{ color: '#111111' }}>Recomendação: faça o diagnóstico primeiro</p>
            <p className="text-sm" style={{ color: '#4B4F4B' }}>
              O Diagnóstico de Maturidade enriquece suas teses com dados do estágio atual da empresa. Mas você já pode criar teses livremente!
            </p>
          </div>
          <Button onClick={() => navigate(createPageUrl("MyDiagnostics"))} variant="outline" size="sm"
            className="flex-shrink-0" style={{ borderColor: '#6B2FA0', color: '#6B2FA0' }}>
            Fazer Diagnóstico
          </Button>
        </div>
      )}

      {/* ── ESTADO VAZIO ── */}
      {theses.length === 0 && corporate && (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
            <Lightbulb className="w-8 h-8" style={{ color: '#E10867' }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Nenhuma tese criada ainda</h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: '#4B4F4B' }}>
            Crie sua primeira tese de inovação para definir sua estratégia e descobrir startups alinhadas ao seu contexto.
          </p>
          <Button onClick={() => setShowForm(true)} className="text-white px-8 gap-2" style={{ background: '#E10867', border: 'none' }}>
            <Plus className="w-4 h-4" /> Criar primeira tese
          </Button>
        </div>
      )}

      {/* ── COMPARE MODE BANNER ── */}
      {isCompareModeActive && (
        <div className="rounded-xl border p-3 mb-5 flex items-center gap-3"
          style={{ borderColor: '#6B2FA0', background: '#f3e8ff' }}>
          <GitCompare className="w-4 h-4 flex-shrink-0" style={{ color: '#6B2FA0' }} />
          <p className="text-sm flex-1" style={{ color: '#6B2FA0' }}>
            <strong>{compareIds.length}</strong> tese{compareIds.length !== 1 ? 's' : ''} selecionada{compareIds.length !== 1 ? 's' : ''}
            {compareIds.length < 2 && ' — clique em mais teses para comparar'}
          </p>
        </div>
      )}

      {/* ── LISTA DE TESES ── */}
      {theses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <p className="text-sm font-medium" style={{ color: '#4B4F4B' }}>
              {theses.length} tese{theses.length > 1 ? 's' : ''} criada{theses.length > 1 ? 's' : ''}
            </p>
            <div className="flex-1 h-px" style={{ background: '#ECEEEA' }} />
            <p className="text-xs" style={{ color: '#A7ADA7' }}>
              {theses.filter(t => t.matching_ran).length}/{theses.length} com matching realizado
            </p>
          </div>

          {theses.map((thesis, idx) => {
            const isFirst = idx === 0;
            const isSelected = compareIds.includes(thesis.id);
            const isExpanded = expandedId === thesis.id;
            const matchCount = matchCounts[thesis.id] || 0;
            const thesisName = thesis.name ||
              (thesis.macro_categories?.length > 0 ? thesis.macro_categories[0] : null) ||
              format(new Date(thesis.created_date), "'Tese de' MMM yyyy", { locale: ptBR });

            return (
              <div
                key={thesis.id}
                className="bg-white rounded-2xl border transition-all duration-200"
                style={{
                  borderColor: isSelected ? '#6B2FA0' : isFirst ? '#E10867' : '#A7ADA7',
                  boxShadow: isSelected ? '0 0 0 2px #6B2FA033' : isFirst ? '0 0 0 1px #E1086720' : 'none',
                }}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Compare checkbox or icon */}
                    {isCompareModeActive ? (
                      <button
                        onClick={() => toggleCompare(thesis.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all"
                        style={{
                          borderColor: isSelected ? '#6B2FA0' : '#A7ADA7',
                          background: isSelected ? '#f3e8ff' : '#ECEEEA',
                        }}>
                        {isSelected
                          ? <CheckCircle2 className="w-5 h-5" style={{ color: '#6B2FA0' }} />
                          : <GitCompare className="w-5 h-5" style={{ color: '#A7ADA7' }} />
                        }
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: isFirst ? '#fce7ef' : '#ECEEEA' }}>
                        <Lightbulb className="w-5 h-5" style={{ color: isFirst ? '#E10867' : '#4B4F4B' }} />
                      </div>
                    )}

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {isFirst && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: '#E10867' }}>MAIS RECENTE</span>
                        )}
                        <h3 className="font-bold text-sm" style={{ color: '#111111' }}>{thesisName}</h3>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap mt-0.5">
                        <span className="text-xs flex items-center gap-1" style={{ color: '#A7ADA7' }}>
                          <Clock className="w-3 h-3" />
                          {format(new Date(thesis.created_date), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                        {thesis.session_id && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#6B2FA0' }}>
                            <Zap className="w-3 h-3" /> Com diagnóstico
                          </span>
                        )}
                        {/* Match count badge */}
                        {thesis.matching_ran && (
                          <span className="text-xs flex items-center gap-1 font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: matchCount > 0 ? '#e8f5e9' : '#ECEEEA',
                              color: matchCount > 0 ? '#2C4425' : '#A7ADA7'
                            }}>
                            <Sparkles className="w-3 h-3" />
                            {matchCount > 0 ? `${matchCount} startups encontradas` : 'Nenhum match'}
                          </span>
                        )}
                        {!thesis.matching_ran && (
                          <span className="text-xs flex items-center gap-1" style={{ color: '#A7ADA7' }}>
                            <Clock className="w-3 h-3" /> Matching pendente
                          </span>
                        )}
                      </div>

                      {/* Strength bar */}
                      <div className="mt-2 max-w-xs">
                        <StrengthBar thesis={thesis} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingThesis(thesis); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Editar tese">
                        <Pencil className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                      </button>
                      <button onClick={() => setReportThesis(thesis)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Gerar relatório">
                        <FileText className="w-4 h-4" style={{ color: '#6B2FA0' }} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(thesis.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 className="w-4 h-4" style={{ color: '#A7ADA7' }} />
                      </button>
                    </div>
                  </div>

                  {/* Thesis preview text */}
                  {thesis.thesis_text && (
                    <div className="mt-3 ml-14">
                      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#4B4F4B' }}>
                        {thesis.thesis_text.split("\n")[0]}
                      </p>
                    </div>
                  )}

                  {/* Macro categories — prominent */}
                  {(thesis.macro_categories || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 ml-14">
                      {thesis.macro_categories.slice(0, 5).map(c => (
                        <span key={c} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
                      ))}
                      {thesis.macro_categories.length > 5 && (
                        <span className="px-2 py-1 rounded-full text-xs"
                          style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                          +{thesis.macro_categories.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags — secondary, smaller */}
                  {(thesis.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-14">
                      {thesis.tags.slice(0, 5).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: '#F5F5F5', color: '#A7ADA7', fontSize: 10 }}>#{t}</span>
                      ))}
                      {thesis.tags.length > 5 && (
                        <span className="text-xs" style={{ color: '#A7ADA7', fontSize: 10 }}>+{thesis.tags.length - 5} tags</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: '#ECEEEA', background: '#FAFAFA', borderRadius: '0 0 1rem 1rem' }}>
                    {/* Top priorities */}
                    {(thesis.top_priorities || []).length > 0 && (
                      <div className="mb-5">
                        <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                          style={{ color: '#4B4F4B' }}>
                          <Target className="w-3.5 h-3.5" /> Prioridades Estratégicas
                        </p>
                        <div className="space-y-2">
                          {thesis.top_priorities.map((p, i) => (
                            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl"
                              style={{ background: '#fff', border: '1px solid #ECEEEA' }}>
                              <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
                                style={{ background: '#6B2FA0' }}>{i + 1}</span>
                              <p className="text-xs leading-relaxed" style={{ color: '#4B4F4B' }}>{p}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All tags */}
                    {(thesis.tags || []).length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                          style={{ color: '#4B4F4B' }}>
                          <Tag className="w-3.5 h-3.5" /> Tags de Matching ({thesis.tags.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {thesis.tags.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                              style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="px-5 py-3 border-t flex items-center justify-between gap-3"
                  style={{ borderColor: '#ECEEEA', background: isExpanded ? '#FAFAFA' : '#FAFAFA', borderRadius: isExpanded ? '0' : '0 0 1rem 1rem' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : thesis.id)}
                    className="flex items-center gap-1 text-xs transition-colors hover:opacity-70"
                    style={{ color: '#A7ADA7' }}>
                    {isExpanded
                      ? <><ChevronUp className="w-3.5 h-3.5" /> Recolher</>
                      : <><ChevronDown className="w-3.5 h-3.5" /> Ver prioridades e tags</>
                    }
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setReportThesis(thesis)}
                      variant="outline"
                      size="sm"
                      style={{ borderColor: '#A7ADA7', color: '#4B4F4B' }}>
                      <FileText className="w-3.5 h-3.5 mr-1.5" /> Relatório
                    </Button>
                    <Button
                      onClick={() => goToRadar(thesis)}
                      size="sm"
                      className="text-white gap-1.5"
                      style={{ background: thesis.matching_ran ? '#2C4425' : '#E10867', border: 'none' }}>
                      {thesis.matching_ran ? (
                        <><Map className="w-3.5 h-3.5" /> Ver Radar {matchCount > 0 && `(${matchCount})`}</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> Gerar Radar <ArrowRight className="w-3 h-3" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Delete confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#fef2f2' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#dc2626' }} />
            </div>
            <h3 className="font-bold text-center mb-2" style={{ color: '#111111' }}>Excluir tese?</h3>
            <p className="text-sm text-center mb-6" style={{ color: '#4B4F4B' }}>
              Esta ação é irreversível. A tese e todo o histórico de matching associado serão removidos.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}
                style={{ borderColor: '#A7ADA7' }}>
                Cancelar
              </Button>
              <Button className="flex-1 text-white" onClick={confirmDelete}
                style={{ background: '#dc2626', border: 'none' }}>
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCompare && (
        <ThesisCompare
          theses={theses.filter(t => compareIds.includes(t.id))}
          onClose={() => setShowCompare(false)}
        />
      )}

      {reportThesis && (
        <ThesisReportModal
          thesis={reportThesis}
          corporate={corporate}
          onClose={() => setReportThesis(null)}
        />
      )}

      {(showForm || editingThesis != null) && (
        <ThesisWizard
          corporate={corporate}
          sessions={sessions}
          editThesis={editingThesis}
          onClose={() => { setShowForm(false); setEditingThesis(null); }}
          onCreated={handleThesisCreated}
        />
      )}
    </div>
  );
}