import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { CRM_TYPES } from "@/components/ui/DesignTokens";
import { FitScoreBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Zap, Plus, ExternalLink, X, Map as MapIcon,
  Search, SlidersHorizontal, RefreshCw, GitCompare,
  Sparkles, ThumbsUp, ThumbsDown, CheckCircle2,
  ChevronRight, Target, Tag, TrendingUp, Building2,
  AlertTriangle, ArrowRight, Filter
} from "lucide-react";
import AIPrioritizationPanel from "@/components/radar/AIPrioritizationPanel";
import StartupComparePanel from "@/components/radar/StartupComparePanel";

const CATEGORY_FILTERS = ["Todas", "Fintech", "Healthtech", "Edtech", "Agtech", "Energtech", "HRtech", "Logtech", "Martech", "Retailtech", "Deeptech", "ESG", "Outro"];

function ScoreMini({ value, color }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#ECEEEA" }}>
        <div className="h-full rounded-full" style={{ width: `${value || 0}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{Math.round(value || 0)}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#E5E7E5" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "15" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-black leading-none" style={{ color: "#111111" }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>{label}</p>
      </div>
    </div>
  );
}

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

  // Filters
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [showFilters, setShowFilters] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState("all"); // all | relevant | irrelevant | none

  // Compare
  const [compareItems, setCompareItems] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  // AI prioritization reorder
  const [priorityOrder, setPriorityOrder] = useState(null); // array of match_ids

  useEffect(() => {
    if (hookLoading && !urlCorporateId) return;
    loadData();
  }, [urlCorporateId, hookCorporateId, hookLoading]);

  const loadData = async () => {
    const corpId = urlCorporateId || hookCorporateId;
    if (!corpId) { setLoading(false); return; }

    const [thesesData, allStartups] = await Promise.all([
      base44.entities.InnovationThesis.filter({ corporate_id: corpId }, "-created_date"),
      base44.entities.Startup.filter({ is_deleted: false }, "-created_date", 500),
    ]);
    setTheses(thesesData);
    if (!selectedThesisId && thesesData.length > 0) setSelectedThesisId(urlThesisId || thesesData[0].id);

    const map = {};
    allStartups.forEach(s => { map[s.id] = s; });
    setStartups(map);

    // Fetch all matches in parallel
    const matchResults = await Promise.all(
      thesesData.map(t =>
        t.matching_ran
          ? base44.entities.StartupMatch.filter({ thesis_id: t.id }, "-fit_score")
          : Promise.resolve([])
      )
    );
    const matchMap = {};
    thesesData.forEach((t, i) => { matchMap[t.id] = matchResults[i]; });
    setThesesMatches(matchMap);
    setLoading(false);
  };

  const runMatching = async (thesisId, force = false) => {
    setRunningMatching(prev => ({ ...prev, [thesisId]: true }));
    setPriorityOrder(null);
    try {
      await base44.functions.invoke('runThesisMatching', {
        thesisId,
        corporateId: urlCorporateId || hookCorporateId,
        force,
      });
      const [matches, updatedTheses] = await Promise.all([
        base44.entities.StartupMatch.filter({ thesis_id: thesisId }, "-fit_score"),
        base44.entities.InnovationThesis.filter({ corporate_id: urlCorporateId || hookCorporateId }, "-created_date"),
      ]);
      setThesesMatches(prev => ({ ...prev, [thesisId]: matches }));
      setTheses(updatedTheses);
    } catch (err) {
      console.error('Erro ao executar matching:', err);
      alert('Erro ao gerar radar. Tente novamente.');
    } finally {
      setRunningMatching(prev => ({ ...prev, [thesisId]: false }));
    }
  };

  const handleFeedback = async (match, feedback) => {
    const newFeedback = match.feedback === feedback ? null : feedback;
    await base44.entities.StartupMatch.update(match.id, { feedback: newFeedback });
    setThesesMatches(prev => ({
      ...prev,
      [match.thesis_id]: (prev[match.thesis_id] || []).map(m =>
        m.id === match.id ? { ...m, feedback: newFeedback } : m
      )
    }));
  };

  const openCrmModal = (match) => {
    setCrmModal(match);
    setCrmForm({ type: "", custom_type_label: "", description: "" });
  };

  const saveCrm = async () => {
    if (!crmModal || !crmForm.type) return;
    setSavingCrm(true);
    const startup = startups[crmModal.startup_id];
    const effectiveCorporateId = urlCorporateId || hookCorporateId;
    const effectiveThesisId = crmModal.thesis_id;
    if (!effectiveThesisId) { setSavingCrm(false); return; }
    try {
      await Promise.all([
        base44.entities.CRMProject.create({
          corporate_id: effectiveCorporateId,
          startup_id: crmModal.startup_id,
          match_id: crmModal.id,
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
        base44.entities.StartupMatch.update(crmModal.id, { added_to_crm: true }),
      ]);
      setThesesMatches(prev => ({
        ...prev,
        [effectiveThesisId]: (prev[effectiveThesisId] || []).map(m =>
          m.id === crmModal.id ? { ...m, added_to_crm: true } : m
        )
      }));
      setCrmModal(null);
      const p = new URLSearchParams();
      if (effectiveThesisId) p.set('thesis_id', effectiveThesisId);
      if (effectiveCorporateId) p.set('corporate_id', effectiveCorporateId);
      navigate(createPageUrl('DiagnosticCRM') + '?' + p.toString());
    } catch (err) {
      console.error('Falha ao criar projeto no CRM:', err);
      alert('Não foi possível enviar ao CRM. Tente novamente.');
    } finally {
      setSavingCrm(false);
    }
  };

  const toggleCompare = (match, startup) => {
    const exists = compareItems.find(i => i.match.id === match.id);
    if (exists) {
      setCompareItems(prev => prev.filter(i => i.match.id !== match.id));
    } else if (compareItems.length < 3) {
      setCompareItems(prev => [...prev, { match, startup }]);
    }
  };

  // Current thesis and its matches
  const currentThesis = theses.find(t => t.id === selectedThesisId);
  const rawMatches = thesesMatches[selectedThesisId] || [];

  const filteredMatches = useMemo(() => {
    // Deduplicate by startup_id defensively (keep highest fit_score)
    const deduped = new Map();
    for (const m of rawMatches) {
      const existing = deduped.get(m.startup_id);
      if (!existing || (m.fit_score || 0) > (existing.fit_score || 0)) {
        deduped.set(m.startup_id, m);
      }
    }
    let list = Array.from(deduped.values());

    // Apply priority order from AI
    if (priorityOrder) {
      const orderMap = {};
      priorityOrder.forEach((id, i) => { orderMap[id] = i; });
      list.sort((a, b) => {
        const ia = orderMap[a.id] ?? 999;
        const ib = orderMap[b.id] ?? 999;
        return ia !== ib ? ia - ib : (b.fit_score || 0) - (a.fit_score || 0);
      });
    } else {
      list.sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
    }

    // Filters
    if (minScore > 0) list = list.filter(m => (m.fit_score || 0) >= minScore);
    if (categoryFilter !== "Todas") list = list.filter(m => {
      const s = startups[m.startup_id];
      return s?.category === categoryFilter;
    });
    if (feedbackFilter === "relevant") list = list.filter(m => m.feedback === "relevant");
    if (feedbackFilter === "irrelevant") list = list.filter(m => m.feedback === "irrelevant");
    if (feedbackFilter === "none") list = list.filter(m => !m.feedback);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => {
        const s = startups[m.startup_id];
        return s?.name?.toLowerCase().includes(q) || s?.description?.toLowerCase().includes(q) || s?.category?.toLowerCase().includes(q);
      });
    }
    return list;
  }, [rawMatches, search, minScore, categoryFilter, feedbackFilter, priorityOrder, startups]);

  // Stats
  const totalMatches = rawMatches.length;
  const avgScore = totalMatches > 0 ? Math.round(rawMatches.reduce((s, m) => s + (m.fit_score || 0), 0) / totalMatches) : 0;
  const inCrm = rawMatches.filter(m => m.added_to_crm).length;
  const relevant = rawMatches.filter(m => m.feedback === "relevant").length;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#ECEEEA" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#fce7ef" }}>
          <MapIcon className="w-8 h-8" style={{ color: "#E10867" }} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold mb-1" style={{ color: "#111111" }}>Carregando Radar…</h2>
          <p className="text-sm" style={{ color: "#4B4F4B" }}>Buscando teses e startups</p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#E10867" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#ECEEEA" }}>
      {/* ── HEADER ── */}
      <div className="border-b" style={{ background: "#fff", borderColor: "#E5E7E5" }}>
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#fce7ef" }}>
                <MapIcon className="w-5 h-5" style={{ color: "#E10867" }} />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight" style={{ color: "#111111" }}>Radar de Startups</h1>
                <p className="text-xs" style={{ color: "#4B4F4B" }}>
                  Análise de aderência por tese de inovação
                </p>
              </div>
            </div>
            {compareItems.length > 0 && (
              <Button
                onClick={() => setShowCompare(true)}
                className="gap-2 text-white"
                style={{ background: "#6B2FA0", border: "none" }}>
                <GitCompare className="w-4 h-4" />
                Comparar ({compareItems.length}/3)
              </Button>
            )}
          </div>

          {/* Thesis tabs */}
          {theses.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mt-4 pb-0.5">
              {theses.map(t => {
                const isSelected = selectedThesisId === t.id;
                const mCount = (thesesMatches[t.id] || []).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedThesisId(t.id); setPriorityOrder(null); setSearch(""); }}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all relative"
                    style={{
                      background: isSelected ? "#1E0B2E" : "#fff",
                      borderColor: isSelected ? "#1E0B2E" : "#D1D5D1",
                      color: isSelected ? "#fff" : "#4B4F4B",
                    }}>
                    <span className="block text-xs font-semibold leading-tight">
                      {t.name || t.macro_categories?.[0] || "Tese"}
                    </span>
                    {t.matching_ran && (
                      <span className="block text-xs mt-0.5 opacity-70">
                        {mCount} startup{mCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {!t.matching_ran && (
                      <span className="block text-xs mt-0.5 opacity-60">Sem matching</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* ── SEM TESES ── */}
        {theses.length === 0 && (
          <div className="bg-white rounded-2xl border p-14 text-center" style={{ borderColor: "#E5E7E5" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "#fce7ef" }}>
              <MapIcon className="w-8 h-8" style={{ color: "#E10867" }} />
            </div>
            <h2 className="font-bold text-lg mb-2" style={{ color: "#111111" }}>Nenhuma tese de inovação criada</h2>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#4B4F4B" }}>
              Crie uma tese de inovação para que a IA possa mapear startups alinhadas à sua estratégia.
            </p>
            <Button onClick={() => navigate(createPageUrl("InnovationTheses"))}
              className="text-white gap-2" style={{ background: "#E10867", border: "none" }}>
              <Zap className="w-4 h-4" /> Criar Tese de Inovação
            </Button>
          </div>
        )}

        {/* ── TESE SELECIONADA ── */}
        {currentThesis && (
          <div className="space-y-5">

            {/* Thesis context card */}
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "#E5E7E5" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 flex-shrink-0" style={{ color: "#E10867" }} />
                    <h2 className="font-bold text-base" style={{ color: "#111111" }}>
                      {currentThesis.name || "Tese de Inovação"}
                    </h2>
                  </div>
                  {currentThesis.thesis_text && (
                    <p className="text-sm line-clamp-2 mb-3" style={{ color: "#4B4F4B" }}>
                      {currentThesis.thesis_text.split("\n")[0]}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(currentThesis.macro_categories || []).map(c => (
                      <span key={c} className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "#fce7ef", color: "#E10867" }}>{c}</span>
                    ))}
                    {(currentThesis.tags || []).slice(0, 6).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs"
                        style={{ background: "#ECEEEA", color: "#4B4F4B" }}>#{t}</span>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {!currentThesis.matching_ran ? (
                    <Button onClick={() => runMatching(currentThesis.id)}
                      disabled={runningMatching[currentThesis.id]}
                      className="text-white gap-2" style={{ background: "#E10867", border: "none" }}>
                      {runningMatching[currentThesis.id]
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando…</>
                        : <><Sparkles className="w-4 h-4" /> Gerar Radar com IA</>
                      }
                    </Button>
                  ) : (
                    <button
                      onClick={() => runMatching(currentThesis.id, true)}
                      disabled={runningMatching[currentThesis.id]}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all"
                      style={{ borderColor: "#D1D5D1", color: "#4B4F4B", background: "#FAFAFA" }}>
                      {runningMatching[currentThesis.id]
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <RefreshCw className="w-3.5 h-3.5" />}
                      {runningMatching[currentThesis.id] ? "Atualizando…" : "Refazer matching"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            {currentThesis.matching_ran && totalMatches > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Target} label="Startups encontradas" value={totalMatches} color="#E10867" />
                <StatCard icon={TrendingUp} label="Score médio de fit" value={avgScore} color="#6B2FA0" />
                <StatCard icon={CheckCircle2} label="Enviadas ao CRM" value={inCrm} color="#2C4425" />
                <StatCard icon={ThumbsUp} label="Marcadas relevantes" value={relevant} color="#B4D1D7" />
              </div>
            )}

            {/* AI Prioritization */}
            {currentThesis.matching_ran && rawMatches.length > 0 && (
              <AIPrioritizationPanel
                thesis={currentThesis}
                matches={rawMatches}
                startups={startups}
                onResultsReady={(ranked) => setPriorityOrder(ranked.map(r => r.match_id))}
              />
            )}

            {/* No matching yet */}
            {!currentThesis.matching_ran && !runningMatching[currentThesis.id] && (
              <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "#E5E7E5" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "#fce7ef" }}>
                  <Sparkles className="w-8 h-8" style={{ color: "#E10867" }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: "#111111" }}>
                  Radar ainda não gerado
                </h3>
                <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#4B4F4B" }}>
                  Clique em "Gerar Radar com IA" para que nossa IA analise e rankeie as startups mais alinhadas a esta tese.
                </p>
                <Button onClick={() => runMatching(currentThesis.id)}
                  className="text-white gap-2 px-8" style={{ background: "#E10867", border: "none" }}>
                  <Sparkles className="w-4 h-4" /> Gerar Radar com IA
                </Button>
              </div>
            )}

            {runningMatching[currentThesis.id] && (
              <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "#E5E7E5" }}>
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#E10867" }} />
                <h3 className="font-bold text-lg mb-2" style={{ color: "#111111" }}>IA analisando startups…</h3>
                <p className="text-sm" style={{ color: "#4B4F4B" }}>Isso pode levar alguns segundos. A IA está avaliando o fit de cada startup com sua tese.</p>
              </div>
            )}

            {/* Matches list */}
            {currentThesis.matching_ran && rawMatches.length > 0 && (
              <div>
                {/* Filters bar */}
                <div className="bg-white rounded-2xl border p-4 mb-4" style={{ borderColor: "#E5E7E5" }}>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#A7ADA7" }} />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome, categoria, descrição…"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:border-gray-400 transition-colors"
                        style={{ borderColor: "#D1D5D1" }}
                      />
                    </div>
                    <button
                      onClick={() => setShowFilters(f => !f)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all"
                      style={{
                        borderColor: showFilters ? "#6B2FA0" : "#D1D5D1",
                        color: showFilters ? "#6B2FA0" : "#4B4F4B",
                        background: showFilters ? "#f3e8ff" : "#fff",
                      }}>
                      <SlidersHorizontal className="w-4 h-4" />
                      Filtros
                      {(minScore > 0 || categoryFilter !== "Todas" || feedbackFilter !== "all") && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#E10867" }} />
                      )}
                    </button>
                  </div>

                  {showFilters && (
                    <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: "#ECEEEA" }}>
                      {/* Score filter */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold whitespace-nowrap" style={{ color: "#4B4F4B" }}>
                          Score mínimo: <strong style={{ color: "#E10867" }}>{minScore}+</strong>
                        </span>
                        <input type="range" min={0} max={90} step={10} value={minScore}
                          onChange={e => setMinScore(Number(e.target.value))}
                          className="flex-1 accent-[#E10867]" />
                      </div>

                      {/* Feedback filter */}
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#4B4F4B" }}>Filtrar por avaliação</p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { v: "all", l: "Todas" },
                            { v: "relevant", l: "👍 Relevantes" },
                            { v: "irrelevant", l: "👎 Irrelevantes" },
                            { v: "none", l: "Sem avaliação" },
                          ].map(({ v, l }) => (
                            <button key={v} onClick={() => setFeedbackFilter(v)}
                              className="px-3 py-1.5 rounded-full text-xs border font-medium transition-all"
                              style={{
                                borderColor: feedbackFilter === v ? "#6B2FA0" : "#D1D5D1",
                                background: feedbackFilter === v ? "#f3e8ff" : "#fff",
                                color: feedbackFilter === v ? "#6B2FA0" : "#4B4F4B",
                              }}>{l}</button>
                          ))}
                        </div>
                      </div>

                      {/* Category filter */}
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: "#4B4F4B" }}>Categoria</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {CATEGORY_FILTERS.map(c => (
                            <button key={c} onClick={() => setCategoryFilter(c)}
                              className="px-2.5 py-1 rounded-full text-xs border transition-all"
                              style={{
                                borderColor: categoryFilter === c ? "#E10867" : "#D1D5D1",
                                background: categoryFilter === c ? "#fce7ef" : "#fff",
                                color: categoryFilter === c ? "#E10867" : "#4B4F4B",
                              }}>{c}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compare mode hint */}
                {compareItems.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-4"
                    style={{ background: "#f3e8ff", border: "1px solid #6B2FA0" }}>
                    <GitCompare className="w-4 h-4 flex-shrink-0" style={{ color: "#6B2FA0" }} />
                    <p className="text-sm flex-1" style={{ color: "#6B2FA0" }}>
                      <strong>{compareItems.length}</strong> startup{compareItems.length !== 1 ? "s" : ""} selecionada{compareItems.length !== 1 ? "s" : ""} para comparação
                    </p>
                    {compareItems.length >= 2 && (
                      <Button size="sm" onClick={() => setShowCompare(true)}
                        className="text-white" style={{ background: "#6B2FA0", border: "none" }}>
                        Comparar
                      </Button>
                    )}
                    <button onClick={() => setCompareItems([])} className="p-1 rounded hover:bg-purple-200 transition-colors">
                      <X className="w-4 h-4" style={{ color: "#6B2FA0" }} />
                    </button>
                  </div>
                )}

                {/* Duplicate warning banner */}
                {rawMatches.length > new Set(rawMatches.map(m => m.startup_id)).size && (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
                    style={{ background: "#fffbeb", border: "1px solid #fcd34d" }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#d97706" }} />
                    <p className="text-sm flex-1" style={{ color: "#92400e" }}>
                      Detectamos startups duplicadas neste radar. Isso pode ocorrer quando o matching é rodado mais de uma vez.
                      <button onClick={() => runMatching(currentThesis.id, true)}
                        className="ml-2 underline font-semibold">Refazer matching</button> para corrigir.
                    </p>
                  </div>
                )}

                {/* Results summary */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold" style={{ color: "#4B4F4B" }}>
                    {filteredMatches.length} startup{filteredMatches.length !== 1 ? "s" : ""}
                    {priorityOrder && <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full"
                      style={{ background: "#f3e8ff", color: "#6B2FA0" }}>
                      <Sparkles className="w-3 h-3 inline mr-1" />Ordenado por IA
                    </span>}
                  </p>
                  {filteredMatches.length < rawMatches.length && (
                    <button onClick={() => { setSearch(""); setMinScore(0); setCategoryFilter("Todas"); setFeedbackFilter("all"); }}
                      className="text-xs underline" style={{ color: "#A7ADA7" }}>
                      Limpar filtros
                    </button>
                  )}
                </div>

                {filteredMatches.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "#E5E7E5" }}>
                    <Filter className="w-8 h-8 mx-auto mb-3" style={{ color: "#A7ADA7" }} />
                    <p className="font-semibold mb-1" style={{ color: "#111111" }}>Nenhuma startup encontrada</p>
                    <p className="text-sm" style={{ color: "#4B4F4B" }}>Ajuste os filtros para ver mais resultados.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMatches.map((match, idx) => {
                      const s = startups[match.startup_id];
                      if (!s) return null;
                      const isInCompare = compareItems.some(i => i.match.id === match.id);
                      const rankLabel = priorityOrder ? idx + 1 : null;

                      return (
                        <div key={match.id}
                          className="bg-white rounded-2xl border transition-all duration-200 flex flex-col cursor-pointer group"
                          style={{
                            borderColor: isInCompare ? "#6B2FA0" : match.feedback === "relevant" ? "#2C4425" : "#E5E7E5",
                            boxShadow: isInCompare ? "0 0 0 2px #6B2FA033" : "none",
                          }}
                          onClick={() => setSelectedStartup({ match, startup: s })}>

                          {/* Card header */}
                          <div className="p-4 flex items-start gap-3">
                            {rankLabel && (
                              <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: rankLabel <= 3 ? "#6B2FA0" : "#ECEEEA", color: rankLabel <= 3 ? "#fff" : "#4B4F4B" }}>
                                {rankLabel}
                              </span>
                            )}
                            {s.logo_url ? (
                              <img src={s.logo_url} alt={s.name}
                                className="w-10 h-10 rounded-xl object-contain border bg-gray-50 flex-shrink-0"
                                style={{ borderColor: "#E5E7E5" }} />
                            ) : (
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: "#fce7ef", color: "#E10867" }}>
                                {s.name?.[0] || "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-tight" style={{ color: "#111111" }}>{s.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {s.category && (
                                  <span className="text-xs px-1.5 py-0.5 rounded"
                                    style={{ background: "#ECEEEA", color: "#4B4F4B" }}>{s.category}</span>
                                )}
                                {s.stage && (
                                  <span className="text-xs" style={{ color: "#A7ADA7" }}>{s.stage}</span>
                                )}
                              </div>
                            </div>
                            <FitScoreBadge score={match.fit_score || 0} />
                          </div>

                          {/* Score bars */}
                          <div className="px-4 pb-3 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-16 flex-shrink-0" style={{ color: "#A7ADA7" }}>Tags</span>
                              <ScoreMini value={match.score_tags} color="#6B2FA0" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-16 flex-shrink-0" style={{ color: "#A7ADA7" }}>Modelo</span>
                              <ScoreMini value={match.score_modelo} color="#2C4425" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-16 flex-shrink-0" style={{ color: "#A7ADA7" }}>Impacto</span>
                              <ScoreMini value={match.score_impacto} color="#B4D1D7" />
                            </div>
                          </div>

                          {/* Description */}
                          <div className="px-4 pb-3">
                            <p className="text-xs line-clamp-2" style={{ color: "#4B4F4B" }}>{s.description}</p>
                          </div>

                          {/* Tags matched */}
                          {(match.tags_matched || []).length > 0 && (
                            <div className="px-4 pb-3 flex flex-wrap gap-1">
                              {match.tags_matched.slice(0, 3).map(t => (
                                <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                                  style={{ background: "#f3e8ff", color: "#6B2FA0" }}>#{t}</span>
                              ))}
                              {match.tags_matched.length > 3 && (
                                <span className="text-xs" style={{ color: "#A7ADA7" }}>+{match.tags_matched.length - 3}</span>
                              )}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-auto px-4 py-3 border-t flex items-center gap-1.5"
                            style={{ borderColor: "#F0F0F0" }}
                            onClick={e => e.stopPropagation()}>
                            {/* Feedback */}
                            <button
                              onClick={() => handleFeedback(match, "relevant")}
                              title="Relevante"
                              className="p-1.5 rounded-lg transition-all"
                              style={{
                                background: match.feedback === "relevant" ? "#dcfce7" : "#F5F5F5",
                                color: match.feedback === "relevant" ? "#2C4425" : "#A7ADA7",
                              }}>
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(match, "irrelevant")}
                              title="Irrelevante"
                              className="p-1.5 rounded-lg transition-all"
                              style={{
                                background: match.feedback === "irrelevant" ? "#fce7ef" : "#F5F5F5",
                                color: match.feedback === "irrelevant" ? "#E10867" : "#A7ADA7",
                              }}>
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Compare toggle */}
                            <button
                              onClick={() => toggleCompare(match, s)}
                              title={isInCompare ? "Remover da comparação" : "Adicionar à comparação"}
                              className="p-1.5 rounded-lg transition-all"
                              style={{
                                background: isInCompare ? "#f3e8ff" : "#F5F5F5",
                                color: isInCompare ? "#6B2FA0" : "#A7ADA7",
                                opacity: !isInCompare && compareItems.length >= 3 ? 0.4 : 1,
                              }}>
                              <GitCompare className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex-1" />

                            {/* Add to CRM */}
                            <button
                              onClick={() => openCrmModal(match)}
                              disabled={match.added_to_crm}
                              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all"
                              style={{
                                background: match.added_to_crm ? "#ECEEEA" : "#E10867",
                                color: match.added_to_crm ? "#A7ADA7" : "#fff",
                              }}>
                              {match.added_to_crm
                                ? <><CheckCircle2 className="w-3.5 h-3.5" /> CRM</>
                                : <><Plus className="w-3.5 h-3.5" /> CRM</>
                              }
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DETAIL SIDEBAR ── */}
      {selectedStartup && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedStartup(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

            {/* Sidebar header */}
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-start justify-between gap-4"
              style={{ borderColor: "#ECEEEA" }}>
              <div className="flex items-center gap-3">
                {selectedStartup.startup.logo_url ? (
                  <img src={selectedStartup.startup.logo_url} alt={selectedStartup.startup.name}
                    className="w-12 h-12 rounded-xl object-contain border" style={{ borderColor: "#E5E7E5" }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                    style={{ background: "#fce7ef", color: "#E10867" }}>
                    {selectedStartup.startup.name?.[0]}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-base leading-tight" style={{ color: "#111111" }}>
                    {selectedStartup.startup.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <FitScoreBadge score={selectedStartup.match.fit_score || 0} />
                    {selectedStartup.startup.stage && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                        {selectedStartup.startup.stage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStartup(null)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" style={{ color: "#A7ADA7" }} />
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">

              {/* Description */}
              <p className="text-sm leading-relaxed" style={{ color: "#4B4F4B" }}>
                {selectedStartup.startup.description || "Sem descrição disponível."}
              </p>

              {/* Score breakdown */}
              <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "#E5E7E5" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#4B4F4B" }}>
                  Breakdown do Score
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#4B4F4B" }}>Tags & Tecnologia (50%)</span>
                    </div>
                    <ScoreMini value={selectedStartup.match.score_tags} color="#6B2FA0" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#4B4F4B" }}>Modelo de Negócio (30%)</span>
                    </div>
                    <ScoreMini value={selectedStartup.match.score_modelo} color="#2C4425" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#4B4F4B" }}>Impacto Tecnológico (20%)</span>
                    </div>
                    <ScoreMini value={selectedStartup.match.score_impacto} color="#B4D1D7" />
                  </div>
                </div>
                {/* Tags matched */}
                {(selectedStartup.match.tags_matched || []).length > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: "#ECEEEA" }}>
                    <p className="text-xs mb-1.5" style={{ color: "#A7ADA7" }}>Tags em comum</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedStartup.match.tags_matched.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-xs"
                          style={{ background: "#f3e8ff", color: "#6B2FA0" }}>#{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="rounded-2xl border divide-y" style={{ borderColor: "#E5E7E5", divideColor: "#E5E7E5" }}>
                {[
                  ["Categoria", selectedStartup.startup.category],
                  ["Vertical", selectedStartup.startup.vertical],
                  ["Modelo de negócio", selectedStartup.startup.business_model],
                  ["Estágio", selectedStartup.startup.stage],
                  ["Localização", [selectedStartup.startup.state, selectedStartup.startup.country].filter(Boolean).join(", ")],
                  ["Faixa de preço", selectedStartup.startup.price_range],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span style={{ color: "#4B4F4B" }}>{label}</span>
                    <span className="font-medium text-right" style={{ color: "#111111" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Fit reasons */}
              {(selectedStartup.match.fit_reasons || []).length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#2C4425" }}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pontos de Fit
                  </p>
                  <ul className="space-y-1.5">
                    {selectedStartup.match.fit_reasons.map((r, i) => (
                      <li key={i} className="text-xs leading-snug flex items-start gap-1.5" style={{ color: "#166534" }}>
                        <span className="mt-0.5 flex-shrink-0">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk reasons */}
              {(selectedStartup.match.risk_reasons || []).length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                  <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "#E10867" }}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Pontos de Atenção
                  </p>
                  <ul className="space-y-1.5">
                    {selectedStartup.match.risk_reasons.map((r, i) => (
                      <li key={i} className="text-xs leading-snug flex items-start gap-1.5" style={{ color: "#dc2626" }}>
                        <span className="mt-0.5 flex-shrink-0">•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar footer actions */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4 space-y-2" style={{ borderColor: "#ECEEEA" }}>
              {selectedStartup.startup.website && (
                <a href={selectedStartup.startup.website} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border w-full font-medium transition-all hover:bg-gray-50"
                  style={{ borderColor: "#D1D5D1", color: "#111111" }}>
                  <ExternalLink className="w-4 h-4" /> Visitar site
                </a>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { toggleCompare(selectedStartup.match, selectedStartup.startup); }}
                  className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border font-medium transition-all"
                  style={{
                    borderColor: compareItems.some(i => i.match.id === selectedStartup.match.id) ? "#6B2FA0" : "#D1D5D1",
                    color: compareItems.some(i => i.match.id === selectedStartup.match.id) ? "#6B2FA0" : "#4B4F4B",
                    background: compareItems.some(i => i.match.id === selectedStartup.match.id) ? "#f3e8ff" : "#fff",
                  }}>
                  <GitCompare className="w-4 h-4" />
                  {compareItems.some(i => i.match.id === selectedStartup.match.id) ? "Remover" : "Comparar"}
                </button>
                <button
                  onClick={() => { setSelectedStartup(null); openCrmModal(selectedStartup.match); }}
                  disabled={selectedStartup.match.added_to_crm}
                  className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold text-white transition-all"
                  style={{ background: selectedStartup.match.added_to_crm ? "#A7ADA7" : "#E10867" }}>
                  {selectedStartup.match.added_to_crm
                    ? <><CheckCircle2 className="w-4 h-4" /> No CRM</>
                    : <><Plus className="w-4 h-4" /> Enviar ao CRM</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CRM MODAL ── */}
      {crmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fce7ef" }}>
                <Plus className="w-4 h-4" style={{ color: "#E10867" }} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: "#111111" }}>Criar projeto no CRM</h3>
                <p className="text-xs" style={{ color: "#4B4F4B" }}>
                  Startup: <strong>{startups[crmModal.startup_id]?.name}</strong>
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: "#4B4F4B" }}>Tipo de projeto *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CRM_TYPES.map(t => (
                    <button key={t.value}
                      onClick={() => setCrmForm(f => ({ ...f, type: t.value }))}
                      className="flex items-center gap-2 p-3 rounded-xl border text-sm text-left transition-all font-medium"
                      style={{
                        borderColor: crmForm.type === t.value ? "#E10867" : "#D1D5D1",
                        background: crmForm.type === t.value ? "#fce7ef" : "#FAFAFA",
                        color: crmForm.type === t.value ? "#E10867" : "#111111",
                      }}>
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {crmForm.type === "Custom" && (
                <Input placeholder="Nome do tipo personalizado"
                  value={crmForm.custom_type_label}
                  onChange={e => setCrmForm(f => ({ ...f, custom_type_label: e.target.value }))} />
              )}
              <Input placeholder="Descrição / notas (opcional)"
                value={crmForm.description}
                onChange={e => setCrmForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setCrmModal(null)} disabled={savingCrm}>Cancelar</Button>
              <Button onClick={saveCrm}
                disabled={!crmForm.type || savingCrm || (crmForm.type === "Custom" && !crmForm.custom_type_label)}
                className="text-white gap-2" style={{ background: "#E10867", border: "none" }}>
                {savingCrm ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando…</> : <><ArrowRight className="w-4 h-4" /> Criar projeto</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPARE PANEL ── */}
      {showCompare && compareItems.length >= 2 && (
        <StartupComparePanel
          items={compareItems}
          onClose={() => setShowCompare(false)}
          onOpenCrm={(match) => { setShowCompare(false); openCrmModal(match); }}
        />
      )}
    </div>
  );
}