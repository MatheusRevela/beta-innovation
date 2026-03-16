import { useState, useEffect } from "react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { CRM_TYPES } from "@/components/ui/DesignTokens";
import { FitScoreBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, Search, Plus, ExternalLink, MessageCircle, X, Sparkles, GitCompareArrows } from "lucide-react";
import AIPrioritizationPanel from "@/components/radar/AIPrioritizationPanel";
import StartupComparePanel from "@/components/radar/StartupComparePanel";

export default function StartupRadar() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const urlCorporateId = params.get("corporate_id");
  const thesisId = params.get("thesis_id");

  const { corporateId: hookCorporateId, loading: hookLoading } = useCorporateAccess();

  const [thesis, setThesis] = useState(null);
  const [matches, setMatches] = useState([]);
  const [startups, setStartups] = useState({});
  const [loading, setLoading] = useState(true);
  const [runningMatching, setRunningMatching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [crmModal, setCrmModal] = useState(null);
  const [crmForm, setCrmForm] = useState({ type: "", custom_type_label: "", description: "" });
  const [savingCrm, setSavingCrm] = useState(false);
  const [session, setSession] = useState(null);
  const [resolvedCorpId, setResolvedCorpId] = useState(null);
  const [aiPriorityMap, setAiPriorityMap] = useState({}); // match_id -> { priority_score, reason }
  const [compareList, setCompareList] = useState([]); // up to 3 items { match, startup }
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    // Aguarda o hook resolver antes de chamar loadData para evitar double-run de matching
    if (hookLoading && !urlCorporateId) return;
    loadData();
  }, [sessionId, urlCorporateId, hookCorporateId, hookLoading]);

  const loadData = async () => {
    setLoading(true);

    // Prioridade: URL param > hook (CorporateMember)
    const resolvedCorporateId = urlCorporateId || hookCorporateId || null;
    const resolvedSessionId = sessionId;

    if (!resolvedCorporateId) {
      setLoading(false);
      return;
    }

    const [sessions, theses] = await Promise.all([
      resolvedSessionId
        ? base44.entities.DiagnosticSession.filter({ id: resolvedSessionId })
        : base44.entities.DiagnosticSession.filter({ corporate_id: resolvedCorporateId, status: "completed" }, "-completed_at", 1),
      thesisId
        ? base44.entities.InnovationThesis.filter({ id: thesisId })
        : base44.entities.InnovationThesis.filter({ corporate_id: resolvedCorporateId })
    ]);

    const sess = sessions[0];
    const th = thesisId
      ? theses[0]
      : theses.find(t => t.session_id === (resolvedSessionId || sess?.id)) || theses[0];

    setResolvedCorpId(resolvedCorporateId);
    setSession(sess);
    setThesis(th);

    if (!th && sess) {
      await generateThesisWithIds(sess, resolvedCorporateId, resolvedSessionId || sess?.id);
      return;
    }
    if (th && th.matching_ran) {
      await loadMatches(th.id);
    } else if (th) {
      await runMatchingWithIds(th, resolvedCorporateId, resolvedSessionId || sess?.id);
    }
    setLoading(false);
  };

  const generateThesisWithIds = async (sess, corpId, sessId) => {
    setRunningMatching(true);
    const prompt = `Com base nos resultados de diagnóstico de maturidade de inovação abaixo, gere uma tese de inovação para a empresa.

Score geral: ${sess.overall_score}% — Nível: ${sess.maturity_level}
Scores por pilar: ${JSON.stringify(sess.pillar_scores)}
Síntese: ${sess.ai_synthesis || "N/A"}

Gere a tese identificando:
1. As macrocategorias de inovação mais relevantes para esta empresa (com base nos pilares mais fracos e oportunidades)
2. Top 5 prioridades estratégicas
3. Tags para matching com startups

Responda em JSON:
{
  "thesis_text": "string (2-3 parágrafos)",
  "macro_categories": ["categoria1", "categoria2", "categoria3", "categoria4", "categoria5"],
  "top_priorities": ["prioridade1", "prioridade2", "prioridade3", "prioridade4", "prioridade5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "sectors": ["setor1", "setor2", "setor3"]
}`;

    const thesisData = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          thesis_text: { type: "string" },
          macro_categories: { type: "array", items: { type: "string" } },
          top_priorities: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          sectors: { type: "array", items: { type: "string" } }
        }
      }
    });

    const newThesis = await base44.entities.InnovationThesis.create({
      corporate_id: corpId,
      session_id: sessId,
      ...thesisData
    });
    setThesis(newThesis);
    await runMatchingWithIds(newThesis, corpId, sessId);
  };

  const runMatchingWithIds = async (th, corpId, sessId) => {
    setRunningMatching(true);
    const allStartups = await base44.entities.Startup.filter({ is_deleted: false, is_active: true });
    if (allStartups.length === 0) {
      setRunningMatching(false);
      setLoading(false);
      return;
    }

    const startupMap = {};
    allStartups.forEach(s => { startupMap[s.id] = s; });
    setStartups(startupMap);

    // ── ESTÁGIO 1: Pré-filtro leve sobre TODAS as startups ──
    // Envia apenas ID + tags + categoria (compacto) para o LLM selecionar os candidatos mais promissores
    const thesisContext = `Tese: ${th.thesis_text?.substring(0, 300) || ""}
Macrocategorias: ${(th.macro_categories || []).join(", ")}
Prioridades: ${(th.top_priorities || []).join(", ")}
Tags: ${(th.tags || []).join(", ")}
Setores: ${(th.sectors || []).join(", ")}`;

    const compactSummaries = allStartups.map(s =>
      `${s.id}|${s.name}|${s.category || ""}|${s.vertical || ""}|${(s.tags || []).join(",")}`
    ).join("\n");

    const preFilterPrompt = `Você é especialista em matching de inovação aberta.

TESE DE INOVAÇÃO:
${thesisContext}

BASE DE STARTUPS (ID|Nome|Categoria|Vertical|Tags):
${compactSummaries}

Analise TODAS as startups acima e selecione os IDs das TOP 120 com MAIOR potencial de fit com a tese, baseando-se nas tags, categorias e verticais.
Retorne APENAS os IDs, ordenados do maior para o menor potencial.

Responda em JSON: { "startup_ids": ["id1", "id2", ...] }`;

    let preFilteredIds = [];
    try {
      const preFilterResult = await base44.integrations.Core.InvokeLLM({
        prompt: preFilterPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            startup_ids: { type: "array", items: { type: "string" } }
          }
        }
      });
      preFilteredIds = (preFilterResult?.startup_ids || []).filter(id => startupMap[id]);
    } catch (e) {
      // Fallback: pega as primeiras 120 se o pré-filtro falhar
      preFilteredIds = allStartups.slice(0, 120).map(s => s.id);
    }

    // ── ESTÁGIO 2: Análise detalhada apenas nas startups pré-selecionadas ──
    const candidateStartups = preFilteredIds.slice(0, 120).map(id => startupMap[id]).filter(Boolean);

    const startupSummaries = candidateStartups.map(s =>
      `ID:${s.id} | Nome:${s.name} | Categoria:${s.category || ""} | Vertical:${s.vertical || ""} | Tags:${(s.tags || []).join(",")} | Desc:${(s.description || "").substring(0, 200)}`
    ).join("\n");

    const matchPrompt = `Você é um especialista em inovação aberta e matching tese-startup.

TESE DE INOVAÇÃO DA EMPRESA:
${th.thesis_text}
Macrocategorias: ${(th.macro_categories || []).join(", ")}
Prioridades: ${(th.top_priorities || []).join(", ")}
Tags da tese: ${(th.tags || []).join(", ")}
Setores: ${(th.sectors || []).join(", ")}

STARTUPS PRÉ-SELECIONADAS (candidatos com maior potencial):
${startupSummaries}

METODOLOGIA DE SCORING OBRIGATÓRIA:
Para cada startup, calcule o fit_score (0-100) usando EXATAMENTE os seguintes pesos ponderados:

1. ALINHAMENTO DE TAGS (peso 50%): Avalie 0-100 a sobreposição semântica entre as tags/categoria/vertical da startup e as tags/macrocategorias da tese. Considere sinônimos e termos relacionados. Startups sem nenhuma tag relevante devem receber ≤20 neste critério.

2. RELEVÂNCIA DO MODELO DE NEGÓCIO (peso 30%): Avalie 0-100 se o modelo de negócio da startup (SaaS, Marketplace, Hardware, etc.) e seu setor são compatíveis com os objetivos estratégicos e prioridades da tese. Considere o estágio da startup e viabilidade de parceria corporativa.

3. POTENCIAL DE IMPACTO TECNOLÓGICO (peso 20%): Avalie 0-100 o potencial desta startup de gerar impacto tecnológico real e inovação incremental ou disruptiva para a empresa, baseado na descrição da solução e das prioridades estratégicas da tese.

CÁLCULO: fit_score = (score_tags × 0.50) + (score_modelo × 0.30) + (score_impacto × 0.20)
Arredonde para inteiro. Inclua apenas startups com fit_score ≥ 40.
Selecione as TOP 30-50 com maior fit_score final.

Para cada startup selecionada, forneça:
- fit_reasons: explique os principais pontos de alinhamento, mencionando especificamente tags coincidentes e o porquê do modelo de negócio ser relevante
- risk_reasons: aponte lacunas ou incompatibilidades reais
- tags_matched: liste apenas as tags que realmente coincidem com a tese
- category_match: qual macrocategoria da tese esta startup atende melhor

Responda em JSON:
{
  "matches": [
    {
      "startup_id": "string",
      "fit_score": number,
      "score_tags": number,
      "score_modelo": number,
      "score_impacto": number,
      "category_match": "string",
      "fit_reasons": ["reason1", "reason2"],
      "risk_reasons": ["risk1"],
      "tags_matched": ["tag1"]
    }
  ]
}`;

    let matchData;
    try {
      matchData = await base44.integrations.Core.InvokeLLM({
        prompt: matchPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  startup_id: { type: "string" },
                  fit_score: { type: "number" },
                  score_tags: { type: "number" },
                  score_modelo: { type: "number" },
                  score_impacto: { type: "number" },
                  category_match: { type: "string" },
                  fit_reasons: { type: "array", items: { type: "string" } },
                  risk_reasons: { type: "array", items: { type: "string" } },
                  tags_matched: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });
    } catch (e) {
      matchData = { matches: [] };
    }

    const validMatches = (matchData?.matches || []).slice(0, 50).filter(m => startupMap[m.startup_id]);
    const savedMatches = await Promise.all(
      validMatches.map(m => base44.entities.StartupMatch.create({
        corporate_id: corpId,
        thesis_id: th.id,
        session_id: sessId,
        startup_id: m.startup_id,
        fit_score: m.fit_score,
        score_tags: m.score_tags,
        score_modelo: m.score_modelo,
        score_impacto: m.score_impacto,
        fit_reasons: m.fit_reasons,
        risk_reasons: m.risk_reasons,
        category_match: m.category_match,
        tags_matched: m.tags_matched
      }))
    );

    await base44.entities.InnovationThesis.update(th.id, { matching_ran: true, matching_ran_at: new Date().toISOString() });
    setMatches(savedMatches);
    setRunningMatching(false);
    setLoading(false);
  };



  const loadMatches = async (thesisId) => {
    const m = await base44.entities.StartupMatch.filter({ thesis_id: thesisId });
    setMatches(m);
    const allIds = [...new Set(m.map(x => x.startup_id))];
    const all = await base44.entities.Startup.filter({ is_deleted: false });
    const map = {};
    all.forEach(s => { map[s.id] = s; });
    setStartups(map);
    setLoading(false);
  };

  const handleFeedback = async (match, feedback) => {
    await base44.entities.StartupMatch.update(match.id, { feedback });
    setMatches(prev => prev.map(m => m.id === match.id ? { ...m, feedback } : m));
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
    const me = await base44.auth.me();
    await Promise.all([
      base44.entities.CRMProject.create({
        corporate_id: effectiveCorporateId,
        startup_id: crmModal.startup_id,
        match_id: matchId,
        session_id: session?.id || null,
        project_name: `${crmForm.type === "Custom" ? crmForm.custom_type_label : crmForm.type} — ${startup?.name || ""}`,
        type: crmForm.type,
        custom_type_label: crmForm.custom_type_label,
        description: crmForm.description,
        fit_score: crmModal.fit_score,
        include_in_super_crm: true,
        added_by_name: me.full_name || me.email,
      }),
      base44.entities.StartupMatch.update(matchId, { added_to_crm: true }),
    ]);
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, added_to_crm: true } : m));
    setCrmModal(null);
    setSavingCrm(false);
  };

  const toggleCompare = (match, startup) => {
    setCompareList(prev => {
      const exists = prev.find(i => i.match.id === match.id);
      if (exists) return prev.filter(i => i.match.id !== match.id);
      if (prev.length >= 3) return prev;
      return [...prev, { match, startup }];
    });
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
      // If AI prioritization ran, sort by priority_score first
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>Radar de Startups</h1>
        <p className="text-sm" style={{ color: '#4B4F4B' }}>
          {filtered.length} startups selecionadas pela IA com base na sua tese de inovação
        </p>
      </div>

      {/* Thesis summary */}
      {thesis && (
        <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: '#B4D1D7' }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" style={{ color: '#E10867' }} />
            <span className="font-semibold text-sm">Tese de Inovação</span>
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

      {/* AI Prioritization Panel */}
      {matches.length > 0 && thesis && (
        <AIPrioritizationPanel
          thesis={thesis}
          matches={matches}
          startups={startups}
          onResultsReady={handleAIPriority}
        />
      )}

      {/* AI Priority notice */}
      {hasAIPriority && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-medium"
          style={{ background: '#F3EEF8', color: '#6B2FA0' }}>
          <Sparkles className="w-3.5 h-3.5" />
          Lista reordenada pela IA com base nos seus critérios. Primeiros resultados são os mais prioritários.
          <button className="ml-auto underline" onClick={() => setAiPriorityMap({})}>Limpar</button>
        </div>
      )}

      {/* Filters */}
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold mb-1" style={{ color: '#111111' }}>Nenhuma startup encontrada</p>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            Conclua o diagnóstico ou aguarde o cadastro de startups pelo time Beta-i.
          </p>
        </div>
      )}

      {/* Radar by category */}
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
                    {/* Feedback + CTA */}
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

      {/* Startup detail drawer */}
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

      {/* Compare floating bar */}
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

      {/* Compare modal */}
      {showCompare && (
        <StartupComparePanel
          items={compareList}
          onClose={() => setShowCompare(false)}
          onOpenCrm={(match) => { setShowCompare(false); openCrmModal(match); }}
        />
      )}

      {/* CRM Modal */}
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