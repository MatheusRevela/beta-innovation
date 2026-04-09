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
import { Loader2, Zap, Search, Plus, ExternalLink, MessageCircle, X, Sparkles, GitCompareArrows } from "lucide-react";
import AIPrioritizationPanel from "@/components/radar/AIPrioritizationPanel";
import StartupComparePanel from "@/components/radar/StartupComparePanel";

export default function StartupRadar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const urlCorporateId = params.get("corporate_id");
  const thesisId = params.get("thesis_id");

  const { corporateId: hookCorporateId, loading: hookLoading } = useCorporateAccess();

  const [theses, setTheses] = useState([]);
  const [thesis, setThesis] = useState(null);
  const [matches, setMatches] = useState([]);
  const [startups, setStartups] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hookLoading && !urlCorporateId) return;
    const loadData = async () => {
      const corpId = urlCorporateId || hookCorporateId;
      const thesesData = await base44.entities.InnovationThesis.filter(
        { corporate_id: corpId },
        "-created_date"
      );
      setTheses(thesesData);
      if (thesisId) {
        const selectedThesis = thesesData.find(t => t.id === thesisId);
        if (selectedThesis) {
          setThesis(selectedThesis);
          if (selectedThesis.matching_ran) {
            const m = await base44.entities.StartupMatch.filter({ thesis_id: thesisId });
            setMatches(m);
            const all = await base44.entities.Startup.filter({ is_deleted: false });
            const map = {};
            all.forEach(s => { map[s.id] = s; });
            setStartups(map);
          } else {
            setMatches([]);
          }
        }
      }
      setLoading(false);
    };
    loadData();
  }, [sessionId, thesisId, urlCorporateId, hookCorporateId, hookLoading]);

  const loadMatches = async (thesisId) => {
    const m = await base44.entities.StartupMatch.filter({ thesis_id: thesisId });
    setMatches(m);
    const all = await base44.entities.Startup.filter({ is_deleted: false });
    const map = {};
    all.forEach(s => { map[s.id] = s; });
    setStartups(map);
    setLoading(false);
  };

  const switchThesis = (thesisId) => {
    navigate(createPageUrl('StartupRadar') + `?thesis_id=${thesisId}&corporate_id=${urlCorporateId || hookCorporateId}`);
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
    const effectiveCorporateId = urlCorporateId || resolvedCorpId || hookCorporateId;
    const effectiveThesisId = thesis?.id;
    const effectiveSessionId = session?.id;
    
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
          session_id: session?.id || null,
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
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, added_to_crm: true } : m));
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

  const handleAIPriority = (ranked) => {
    const map = {};
    ranked.forEach(r => { map[r.match_id] = r; });
    setAiPriorityMap(map);
  };

  const hasAIPriority = Object.keys(aiPriorityMap).length > 0;

  const categories = ["all", ...new Set(matches.map(m => m.category_match).filter(Boolean))];
  const filtered = matches
    .filter(m => selectedCategory === "all" || m.category_match === selectedCategory)
    .filter(m => {
      const s = startups[m.startup_id];
      return !search || (s?.name || "").toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (hasAIPriority) {
        const aScore = aiPriorityMap[a.id]?.priority_score ?? -1;
        const bScore = aiPriorityMap[b.id]?.priority_score ?? -1;
        return bScore - aScore;
      }
      return b.fit_score - a.fit_score;
    });

  const groupedByCategory = {};
  filtered.forEach(m => {
    const cat = m.category_match || "Geral";
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(m);
  });

  if (loading || runningMatching) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8" style={{ background: '#ECEEEA' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fce7ef' }}>
          <Zap className="w-8 h-8 animate-pulse" style={{ color: '#E10867' }} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#111111' }}>
            {runningMatching ? "IA realizando matching…" : "Carregando radar…"}
          </h2>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            {runningMatching
              ? "Analisando startups e construindo seu mapa personalizado"
              : "Buscando suas correspondências"}
          </p>
        </div>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>Radar de Startups</h1>
        <p className="text-sm" style={{ color: '#4B4F4B' }}>
          {filtered.length} startups selecionadas pela IA com base na sua tese de inovação
        </p>
      </div>

      {/* Thesis tabs */}
      {theses.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
          {theses.map(t => (
            <button key={t.id} onClick={() => switchThesis(t.id)}
              className="flex-shrink-0 px-4 py-3 rounded-xl border text-sm font-medium transition-all"
              style={{
                background: thesis?.id === t.id ? '#1E0B2E' : '#fff',
                borderColor: thesis?.id === t.id ? '#1E0B2E' : '#A7ADA7',
                color: thesis?.id === t.id ? '#fff' : '#111111'
              }}>
              <div className="text-xs opacity-75 mb-1">
                {t.name || (t.macro_categories?.length > 0
                  ? `${t.macro_categories[0]}${t.macro_categories.length > 1 ? ` +${t.macro_categories.length - 1}` : ''}`
                  : `Tese`
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {thesis && (
        <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: '#B4D1D7' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: '#E10867' }} />
            <span className="font-semibold text-sm">{thesis.name || 'Tese de Inovação'}</span>
          </div>
          <p className="text-sm mb-3" style={{ color: '#4B4F4B' }}>{thesis.thesis_text?.split("\n")[0]}</p>
          <div className="flex flex-wrap gap-1.5">
            {(thesis.macro_categories || []).map(c => (
              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
            ))}
            {(thesis.tags || []).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
            ))}
          </div>
        </div>
      )}

      {matches.length > 0 && thesis && (
        <AIPrioritizationPanel
          thesis={thesis}
          matches={matches}
          startups={startups}
          onResultsReady={handleAIPriority}
        />
      )}

      {hasAIPriority && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-medium"
          style={{ background: '#F3EEF8', color: '#6B2FA0' }}>
          <Sparkles className="w-3.5 h-3.5" />
          Lista reordenada pela IA com base nos seus critérios. Primeiros resultados são os mais prioritários.
          <button className="ml-auto underline" onClick={() => setAiPriorityMap({})}>Limpar</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A7ADA7' }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar startup…" className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(c => (
            <button key={c}
              onClick={() => setSelectedCategory(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                background: selectedCategory === c ? '#E10867' : '#fff',
                borderColor: selectedCategory === c ? '#E10867' : '#A7ADA7',
                color: selectedCategory === c ? '#fff' : '#4B4F4B'
              }}>
              {c === "all" ? "Todas" : c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold mb-1" style={{ color: '#111111' }}>Nenhuma startup encontrada</p>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            Conclua o diagnóstico ou aguarde o cadastro de startups pelo time Beta-i.
          </p>
        </div>
      )}

      {Object.entries(groupedByCategory).map(([cat, catMatches]) => (
        <div key={cat} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-bold text-base" style={{ color: '#111111' }}>{cat}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fce7ef', color: '#E10867' }}>
              {catMatches.length} startup{catMatches.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catMatches.map(match => {
              const s = startups[match.startup_id];
              if (!s) return null;
              return (
                <div key={match.id}
                  className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  style={{ borderColor: '#A7ADA7' }}
                  onClick={() => setSelectedStartup({ match, startup: s })}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.name} className="w-9 h-9 rounded-lg object-contain bg-gray-50 border" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ background: '#fce7ef', color: '#E10867' }}>
                            {s.name?.[0] || "?"}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm" style={{ color: '#111111' }}>{s.name}</p>
                          <p className="text-xs" style={{ color: '#4B4F4B' }}>{s.category || s.vertical || ""}</p>
                        </div>
                      </div>
                      <FitScoreBadge score={hasAIPriority && aiPriorityMap[match.id] ? aiPriorityMap[match.id].priority_score : (match.fit_score || 0)} />
                    </div>
                    {hasAIPriority && aiPriorityMap[match.id] && (
                      <p className="text-xs mb-2 flex items-center gap-1" style={{ color: '#6B2FA0' }}>
                        <Sparkles className="w-3 h-3 flex-shrink-0" />
                        {aiPriorityMap[match.id].reason}
                      </p>
                    )}
                    <p className="text-xs line-clamp-2 mb-3" style={{ color: '#4B4F4B' }}>{s.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(s.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: '#ECEEEA' }}>
                      <button onClick={e => { e.stopPropagation(); handleFeedback(match, "relevant"); }}
                        className="text-xs px-2 py-1 rounded-lg border transition-all"
                        style={{
                          borderColor: match.feedback === "relevant" ? '#2C4425' : '#A7ADA7',
                          background: match.feedback === "relevant" ? '#2C4425' : 'transparent',
                          color: match.feedback === "relevant" ? '#fff' : '#4B4F4B'
                        }}>👍</button>
                      <button onClick={e => { e.stopPropagation(); handleFeedback(match, "irrelevant"); }}
                        className="text-xs px-2 py-1 rounded-lg border transition-all"
                        style={{
                          borderColor: match.feedback === "irrelevant" ? '#E10867' : '#A7ADA7',
                          background: match.feedback === "irrelevant" ? '#fce7ef' : 'transparent',
                          color: match.feedback === "irrelevant" ? '#E10867' : '#4B4F4B'
                        }}>👎</button>
                      <div className="flex-1" />
                      <button
                        onClick={e => { e.stopPropagation(); toggleCompare(match, s); }}
                        title={compareList.find(i => i.match.id === match.id) ? "Remover do comparativo" : "Adicionar ao comparativo"}
                        className="text-xs px-2 py-1 rounded-lg border transition-all"
                        style={{
                          borderColor: compareList.find(i => i.match.id === match.id) ? '#6B2FA0' : '#A7ADA7',
                          background: compareList.find(i => i.match.id === match.id) ? '#F3EEF8' : 'transparent',
                          color: compareList.find(i => i.match.id === match.id) ? '#6B2FA0' : '#4B4F4B',
                          opacity: compareList.length >= 3 && !compareList.find(i => i.match.id === match.id) ? 0.4 : 1
                        }}
                        disabled={compareList.length >= 3 && !compareList.find(i => i.match.id === match.id)}>
                        ⚖
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); openCrmModal(match); }}
                        disabled={match.added_to_crm}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: match.added_to_crm ? '#ECEEEA' : '#E10867',
                          color: match.added_to_crm ? '#A7ADA7' : '#fff'
                        }}>
                        {match.added_to_crm ? "✓ CRM" : "+ CRM"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

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

      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
          style={{ background: '#1E0B2E', minWidth: 320 }}>
          <GitCompareArrows className="w-5 h-5 flex-shrink-0" style={{ color: '#E10867' }} />
          <div className="flex items-center gap-2 flex-1">
            {compareList.map(item => (
              <div key={item.match.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <span className="text-white text-xs font-medium truncate max-w-24">{item.startup.name}</span>
                <button onClick={() => toggleCompare(item.match, item.startup)} className="text-white/50 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowCompare(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ background: '#E10867', color: '#fff' }}>
            Comparar {compareList.length > 1 ? `(${compareList.length})` : ""}
          </button>
        </div>
      )}

      {showCompare && (
        <StartupComparePanel
          items={compareList}
          onClose={() => setShowCompare(false)}
          onOpenCrm={(match) => { setShowCompare(false); openCrmModal(match); }}
        />
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

  function toggleCompare(match, startup) {
    setCompareList(prev => {
      const exists = prev.find(i => i.match.id === match.id);
      if (exists) return prev.filter(i => i.match.id !== match.id);
      if (prev.length >= 3) {
        alert("Máximo de 3 startups para comparar.");
        return prev;
      }
      return [...prev, { match, startup }];
    });
  }
}