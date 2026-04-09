import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { CRM_TYPES } from "@/components/ui/DesignTokens";
import { FitScoreBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, Plus, ExternalLink, MessageCircle, X } from "lucide-react";

export default function StartupRadar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const urlCorporateId = params.get("corporate_id");
  const urlThesisId = params.get("thesis_id");

  const { corporateId: hookCorporateId, loading: hookLoading } = useCorporateAccess();

  const [theses, setTheses] = useState([]);
  const [selectedThesisId, setSelectedThesisId] = useState(urlThesisId || null);
  const [thesesMatches, setThesesMatches] = useState({});
  const [startups, setStartups] = useState({});
  const [loading, setLoading] = useState(true);
  const [runningMatching, setRunningMatching] = useState({});
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [crmModal, setCrmModal] = useState(null);
  const [crmForm, setCrmForm] = useState({ type: "", custom_type_label: "", description: "" });
  const [savingCrm, setSavingCrm] = useState(false);

  useEffect(() => {
    if (hookLoading && !urlCorporateId) return;
    const loadData = async () => {
      const corpId = urlCorporateId || hookCorporateId;
      const thesesData = await base44.entities.InnovationThesis.filter(
        { corporate_id: corpId },
        "-created_date"
      );
      setTheses(thesesData);
      if (!selectedThesisId && thesesData.length > 0) {
        setSelectedThesisId(thesesData[0].id);
      }

      const all = await base44.entities.Startup.filter({ is_deleted: false });
      const map = {};
      all.forEach(s => { map[s.id] = s; });
      setStartups(map);

      const matchMap = {};
      for (const t of thesesData) {
        if (t.matching_ran) {
          const matches = await base44.entities.StartupMatch.filter({ thesis_id: t.id });
          matchMap[t.id] = matches;
        } else {
          matchMap[t.id] = [];
        }
      }
      setThesesMatches(matchMap);
      setLoading(false);
    };
    loadData();
  }, [urlCorporateId, hookCorporateId, hookLoading]);

  const runMatching = async (thesisId) => {
    setRunningMatching(prev => ({ ...prev, [thesisId]: true }));
    try {
      await base44.functions.invoke('runThesisMatching', { thesisId, corporateId: urlCorporateId || hookCorporateId });
      const matches = await base44.entities.StartupMatch.filter({ thesis_id: thesisId });
      setThesesMatches(prev => ({ ...prev, [thesisId]: matches }));
    } catch (err) {
      console.error('Erro ao executar matching:', err);
      alert('Erro ao gerar radar. Tente novamente.');
    } finally {
      setRunningMatching(prev => ({ ...prev, [thesisId]: false }));
    }
  };

  const handleFeedback = async (match, feedback) => {
    try {
      await base44.entities.StartupMatch.update(match.id, { feedback });
      setThesesMatches(prev => ({
        ...prev,
        [match.thesis_id]: (prev[match.thesis_id] || []).map(m => m.id === match.id ? { ...m, feedback } : m)
      }));
    } catch (err) {
      console.error('Erro ao salvar feedback:', err);
    }
  };

  const openCrmModal = (match) => {
    setCrmModal(match);
    setCrmForm({ type: "", custom_type_label: "", description: "" });
  };

  const saveCrm = async () => {
    if (!crmModal || !crmForm.type) return;
    setSavingCrm(true);
    const startup = startups[crmModal.startup_id];
    const matchId = crmModal.id;
    const effectiveCorporateId = urlCorporateId || hookCorporateId;
    const effectiveThesisId = crmModal.thesis_id;
    
    if (!effectiveThesisId) {
      alert('Erro: Tese de inovação não carregada. Recarregue a página.');
      setSavingCrm(false);
      return;
    }
    
    try {
      await Promise.all([
        base44.entities.CRMProject.create({
          corporate_id: effectiveCorporateId,
          startup_id: crmModal.startup_id,
          match_id: matchId,
          thesis_id: effectiveThesisId,
          project_name: `${crmForm.type === "Custom" ? crmForm.custom_type_label : crmForm.type} — ${startup?.name || ""}`,
          type: crmForm.type,
          custom_type_label: crmForm.type === "Custom" ? crmForm.custom_type_label : null,
          stage: "Shortlist",
          description: crmForm.description || null,
          fit_score: crmModal.fit_score || 0,
          include_in_super_crm: true,
          added_by_name: user?.full_name || user?.email || "Unknown",
        }),
        base44.entities.StartupMatch.update(matchId, { added_to_crm: true }),
      ]);
      setThesesMatches(prev => ({
        ...prev,
        [effectiveThesisId]: (prev[effectiveThesisId] || []).map(m => m.id === matchId ? { ...m, added_to_crm: true } : m)
      }));
      setCrmModal(null);
      const params = new URLSearchParams();
      if (effectiveThesisId) params.set('thesis_id', effectiveThesisId);
      if (effectiveCorporateId) params.set('corporate_id', effectiveCorporateId);
      navigate(createPageUrl('DiagnosticCRM') + '?' + params.toString());
    } catch (err) {
      console.error('Falha ao criar projeto no CRM:', err);
      alert('Não foi possível enviar ao CRM. Tente novamente.');
    } finally {
      setSavingCrm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ background: '#ECEEEA' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fce7ef' }}>
          <Zap className="w-8 h-8 animate-pulse" style={{ color: '#E10867' }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#111111' }}>Carregando radar…</h2>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>Buscando suas teses e startups</p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#111111' }}>Radar de Startups</h1>
        <p className="text-sm" style={{ color: '#4B4F4B' }}>Análise de aderência por tese de inovação</p>
      </div>

      {theses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold mb-1" style={{ color: '#111111' }}>Nenhuma tese criada</p>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>Crie uma tese de inovação para começar a gerar o radar de startups.</p>
        </div>
      ) : (
        <div>
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {theses.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedThesisId(t.id)}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
                style={{
                  background: selectedThesisId === t.id ? '#1E0B2E' : '#fff',
                  borderColor: selectedThesisId === t.id ? '#1E0B2E' : '#A7ADA7',
                  color: selectedThesisId === t.id ? '#fff' : '#111111'
                }}>
                <div className="text-xs opacity-75 mb-0.5">
                  {t.name || (t.macro_categories?.length > 0
                    ? `${t.macro_categories[0]}${t.macro_categories.length > 1 ? ` +${t.macro_categories.length - 1}` : ''}`
                    : `Tese`
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {selectedThesisId && theses.map(thesis => {
              if (thesis.id !== selectedThesisId) return null;

              const matches = thesesMatches[thesis.id] || [];
              const isRunning = runningMatching[thesis.id] || false;

              return (
                <div key={thesis.id} className="bg-white rounded-2xl border p-6" style={{ borderColor: '#B4D1D7' }}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-5 h-5" style={{ color: '#E10867' }} />
                        <h2 className="text-xl font-bold" style={{ color: '#111111' }}>
                          {thesis.name || 'Tese de Inovação'}
                        </h2>
                      </div>
                      <p className="text-sm mb-3" style={{ color: '#4B4F4B' }}>
                        {thesis.thesis_text?.split("\n")[0]}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(thesis.macro_categories || []).map(c => (
                          <span key={c} className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
                        ))}
                        {(thesis.tags || []).slice(0, 5).map(t => (
                          <span key={t} className="px-3 py-1 rounded-full text-xs"
                            style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {!thesis.matching_ran ? (
                        <Button
                          onClick={() => runMatching(thesis.id)}
                          disabled={isRunning}
                          className="text-white whitespace-nowrap"
                          style={{ background: '#E10867' }}>
                          {isRunning ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Gerando…
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 mr-1.5" />
                              Gerar Radar
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="text-xs font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                          ✓ {matches.length} startup{matches.length !== 1 ? 's' : ''} com fit
                        </div>
                      )}
                    </div>
                  </div>

                  {matches.length > 0 && (
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: '#ECEEEA' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matches
                          .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))
                          .map(match => {
                            const s = startups[match.startup_id];
                            if (!s) return null;
                            return (
                              <div key={match.id}
                                className="bg-gray-50 rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4"
                                style={{ borderColor: '#ECEEEA' }}
                                onClick={() => setSelectedStartup({ match, startup: s })}>
                                <div className="flex items-start gap-3 mb-3">
                                  {s.logo_url ? (
                                    <img src={s.logo_url} alt={s.name} className="w-10 h-10 rounded-lg object-contain border" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                                      style={{ background: '#fce7ef', color: '#E10867' }}>
                                      {s.name?.[0] || "?"}
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm" style={{ color: '#111111' }}>{s.name}</p>
                                    <p className="text-xs" style={{ color: '#4B4F4B' }}>{s.category}</p>
                                  </div>
                                  <FitScoreBadge score={match.fit_score || 0} />
                                </div>
                                <p className="text-xs line-clamp-2 mb-3" style={{ color: '#4B4F4B' }}>{s.description}</p>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={e => { e.stopPropagation(); handleFeedback(match, "relevant"); }}
                                    className="text-xs px-2 py-1 rounded border transition-all"
                                    style={{
                                      borderColor: match.feedback === "relevant" ? '#2C4425' : '#A7ADA7',
                                      background: match.feedback === "relevant" ? '#2C4425' : 'transparent',
                                      color: match.feedback === "relevant" ? '#fff' : '#4B4F4B'
                                    }}>👍</button>
                                  <button onClick={e => { e.stopPropagation(); handleFeedback(match, "irrelevant"); }}
                                    className="text-xs px-2 py-1 rounded border transition-all"
                                    style={{
                                      borderColor: match.feedback === "irrelevant" ? '#E10867' : '#A7ADA7',
                                      background: match.feedback === "irrelevant" ? '#fce7ef' : 'transparent',
                                      color: match.feedback === "irrelevant" ? '#E10867' : '#4B4F4B'
                                    }}>👎</button>
                                  <div className="flex-1" />
                                  <button
                                    onClick={e => { e.stopPropagation(); openCrmModal(match); }}
                                    disabled={match.added_to_crm}
                                    className="text-xs px-2.5 py-1 rounded font-medium transition-all"
                                    style={{
                                      background: match.added_to_crm ? '#ECEEEA' : '#E10867',
                                      color: match.added_to_crm ? '#A7ADA7' : '#fff'
                                    }}>
                                    {match.added_to_crm ? "✓" : "+ CRM"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedStartup && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedStartup(null)} />
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {selectedStartup.startup.logo_url ? (
                    <img src={selectedStartup.startup.logo_url} className="w-12 h-12 rounded-xl object-contain border" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                      style={{ background: '#fce7ef', color: '#E10867' }}>
                      {selectedStartup.startup.name?.[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-lg" style={{ color: '#111111' }}>{selectedStartup.startup.name}</h2>
                    <FitScoreBadge score={selectedStartup.match.fit_score || 0} />
                  </div>
                </div>
                <button onClick={() => setSelectedStartup(null)}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
              </div>

              <p className="text-sm mb-4" style={{ color: '#4B4F4B' }}>{selectedStartup.startup.description}</p>

              <div className="space-y-3 mb-5">
                {[
                  ["Categoria", selectedStartup.startup.category],
                  ["Vertical", selectedStartup.startup.vertical],
                  ["Modelo", selectedStartup.startup.business_model],
                  ["Estágio", selectedStartup.startup.stage],
                  ["Localização", [selectedStartup.startup.state, selectedStartup.startup.country].filter(Boolean).join(", ")],
                  ["Faixa de preço", selectedStartup.startup.price_range],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span style={{ color: '#4B4F4B' }}>{label}</span>
                    <span className="font-medium" style={{ color: '#111111' }}>{value}</span>
                  </div>
                ))}
              </div>

              {selectedStartup.match.fit_reasons?.length > 0 && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: '#ECEEEA' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#2C4425' }}>✓ Pontos de fit</p>
                  {selectedStartup.match.fit_reasons.map((r, i) => (
                    <p key={i} className="text-xs mb-1" style={{ color: '#4B4F4B' }}>• {r}</p>
                  ))}
                </div>
              )}

              {selectedStartup.match.risk_reasons?.length > 0 && (
                <div className="mb-5 p-3 rounded-xl" style={{ background: '#fce7ef' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#E10867' }}>⚠ Pontos de atenção</p>
                  {selectedStartup.match.risk_reasons.map((r, i) => (
                    <p key={i} className="text-xs mb-1" style={{ color: '#4B4F4B' }}>• {r}</p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                {selectedStartup.startup.website && (
                  <a href={selectedStartup.startup.website} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border w-full"
                    style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                    <ExternalLink className="w-4 h-4" /> Visitar site
                  </a>
                )}
                {selectedStartup.startup.contact_whatsapp && (
                  <a href={`https://wa.me/${selectedStartup.startup.contact_whatsapp.replace(/\D/g, "")}`}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border w-full"
                    style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                    <MessageCircle className="w-4 h-4" /> Pedir intro via Beta-i
                  </a>
                )}
                <button
                  onClick={() => { setSelectedStartup(null); openCrmModal(selectedStartup.match); }}
                  disabled={selectedStartup.match.added_to_crm}
                  className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl w-full font-semibold text-white"
                  style={{ background: selectedStartup.match.added_to_crm ? '#A7ADA7' : '#E10867' }}>
                  <Plus className="w-4 h-4" />
                  {selectedStartup.match.added_to_crm ? "Já no CRM" : "Enviar ao CRM"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {crmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <h3 className="font-bold text-lg mb-1" style={{ color: '#111111' }}>Criar projeto no CRM</h3>
            <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
              Com <strong>{startups[crmModal.startup_id]?.name}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#4B4F4B' }}>Tipo de projeto *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CRM_TYPES.map(t => (
                    <button key={t.value}
                      onClick={() => setCrmForm(f => ({ ...f, type: t.value }))}
                      className="flex items-center gap-2 p-2.5 rounded-xl border text-sm text-left transition-all"
                      style={{
                        borderColor: crmForm.type === t.value ? '#E10867' : '#A7ADA7',
                        background: crmForm.type === t.value ? '#fce7ef' : '#fff',
                        color: crmForm.type === t.value ? '#E10867' : '#111111'
                      }}>
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {crmForm.type === "Custom" && (
                <Input placeholder="Nome do tipo personalizado" value={crmForm.custom_type_label}
                  onChange={e => setCrmForm(f => ({ ...f, custom_type_label: e.target.value }))} />
              )}
              <Input placeholder="Descrição / notas (opcional)" value={crmForm.description}
                onChange={e => setCrmForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setCrmModal(null)} disabled={savingCrm}>Cancelar</Button>
              <Button onClick={saveCrm} disabled={!crmForm.type || savingCrm || (crmForm.type === "Custom" && !crmForm.custom_type_label)}
                className="text-white" style={{ background: '#E10867', border: 'none' }}>
                {savingCrm ? "Criando…" : "Criar projeto"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}