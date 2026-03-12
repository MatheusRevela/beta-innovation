import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCollabRole } from "@/components/hooks/useCollabRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FlaskConical, Upload, Search, Sparkles, Loader2,
  Plus, CheckCircle2, Clock, Rocket, Trash2, X
} from "lucide-react";
import LabImportModal from "@/components/lab/LabImportModal";
import LabStartupCard from "@/components/lab/LabStartupCard";

const TABS = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendentes" },
  { id: "enriched", label: "Enriquecidas" },
  { id: "promoted", label: "Promovidas" },
];

export default function Laboratorio() {
  const { isReadOnly, canManageLab } = useCollabRole();
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showImport, setShowImport] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualForm, setManualForm] = useState({ name: "", website: "", description: "" });
  const [savingManual, setSavingManual] = useState(false);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [enrichingProgress, setEnrichingProgress] = useState({ done: 0, total: 0 });
  const [selected, setSelected] = useState(new Set());
  const [deletingBulk, setDeletingBulk] = useState(false);

  useEffect(() => { loadLabs(); }, []);

  const loadLabs = async () => {
    setLoading(true);
    const data = await base44.entities.LabStartup.list("-created_date", 200);
    setLabs(data);
    setLoading(false);
  };

  const addManual = async () => {
    if (!manualForm.name) return;
    setSavingManual(true);
    const created = await base44.entities.LabStartup.create({
      ...manualForm,
      source: "manual",
      status: "pending"
    });
    setLabs(prev => [created, ...prev]);
    setManualForm({ name: "", website: "", description: "" });
    setShowAddManual(false);
    setSavingManual(false);
  };

  const handleEnriched = (updated) => {
    setLabs(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
  };

  const handlePromoted = (updated) => {
    setLabs(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l));
  };

  const handleDeleted = (id) => {
    setLabs(prev => prev.filter(l => l.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(l => l.id)));
    }
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    if (!confirm(`Excluir ${selected.size} startup${selected.size !== 1 ? "s" : ""} do laboratório?`)) return;
    setDeletingBulk(true);
    for (const id of selected) {
      await base44.entities.LabStartup.delete(id);
    }
    setLabs(prev => prev.filter(l => !selected.has(l.id)));
    setSelected(new Set());
    setDeletingBulk(false);
  };

  const enrichAllPending = async () => {
    const pending = labs.filter(l => l.status === "pending" && !l.ai_enriched);
    if (!pending.length) return;
    setEnrichingAll(true);
    setEnrichingProgress({ done: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      const lab = pending[i];
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise a startup "${lab.name}"${lab.website ? ` (site: ${lab.website})` : ""}${lab.description ? `. Descrição: ${lab.description}` : ""}.
Retorne: description (2-3 frases), category, vertical, business_model (SaaS/Hardware/Marketplace/Serviço/Plataforma/Outro), stage (Ideação/MVP/PMF/Scale/Growth), tags (array de 15+ palavras-chave), keywords (3-5 problemas), target_customers (1 frase), value_proposition (1 frase), enrichment_confidence (0-100).`,
          add_context_from_internet: !!lab.website,
          response_json_schema: {
            type: "object",
            properties: {
              description: { type: "string" },
              category: { type: "string" },
              vertical: { type: "string" },
              business_model: { type: "string" },
              stage: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              keywords: { type: "array", items: { type: "string" } },
              target_customers: { type: "string" },
              value_proposition: { type: "string" },
              enrichment_confidence: { type: "number" }
            }
          }
        });
        const safeRes = {
          description: res.description,
          category: res.category,
          vertical: res.vertical,
          business_model: res.business_model,
          stage: res.stage,
          tags: res.tags,
          keywords: res.keywords,
          target_customers: res.target_customers,
          value_proposition: res.value_proposition,
          enrichment_confidence: res.enrichment_confidence,
        };
        await base44.entities.LabStartup.update(lab.id, {
          ...safeRes,
          ai_enriched: true,
          ai_enriched_at: new Date().toISOString(),
          status: "enriched"
        });
        setLabs(prev => prev.map(l => l.id === lab.id ? { ...l, ...safeRes, ai_enriched: true, status: "enriched" } : l));
      } catch (_) { /* continue */ }
      setEnrichingProgress({ done: i + 1, total: pending.length });
    }
    setEnrichingAll(false);
  };

  const filtered = labs
    .filter(l => tab === "all" || l.status === tab)
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.website || "").toLowerCase().includes(search.toLowerCase()));

  const allFilteredSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id));

  const counts = {
    all: labs.length,
    pending: labs.filter(l => l.status === "pending").length,
    enriched: labs.filter(l => l.status === "enriched").length,
    promoted: labs.filter(l => l.status === "promoted").length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "#1E0B2E" }}>
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#111111" }}>Laboratório de Startups</h1>
            <p className="text-sm" style={{ color: "#4B4F4B" }}>
              Importe, enriqueça com IA e promova startups para a base oficial
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAddManual(true)} className="gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
          <Button onClick={() => setShowImport(true)} className="gap-1.5 text-sm text-white"
            style={{ background: "#E10867", border: "none" }}>
            <Upload className="w-4 h-4" /> Importar CSV
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: FlaskConical, label: "Total no Lab", value: counts.all, color: "#1E0B2E" },
          { icon: Clock, label: "Pendentes", value: counts.pending, color: "#E10867" },
          { icon: Sparkles, label: "Enriquecidas", value: counts.enriched, color: "#6B2FA0" },
          { icon: Rocket, label: "Promovidas", value: counts.promoted, color: "#2C4425" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4 flex items-center gap-3"
            style={{ borderColor: "#A7ADA7" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: "#111111" }}>{value}</p>
              <p className="text-xs" style={{ color: "#4B4F4B" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enrich all banner */}
      {counts.pending > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border mb-6"
          style={{ background: "#F3EEF8", borderColor: "#d8b4fe" }}>
          <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: "#6B2FA0" }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#1E0B2E" }}>
              {counts.pending} startup{counts.pending !== 1 ? "s" : ""} aguardando enriquecimento
            </p>
            {enrichingAll && (
              <p className="text-xs mt-0.5" style={{ color: "#6B2FA0" }}>
                Processando {enrichingProgress.done}/{enrichingProgress.total}…
              </p>
            )}
          </div>
          {enrichingAll ? (
            <div className="flex items-center gap-2">
              <div className="w-28 h-2 rounded-full" style={{ background: "#ddd6fe" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${(enrichingProgress.done / enrichingProgress.total) * 100}%`, background: "#6B2FA0" }} />
              </div>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#6B2FA0" }} />
            </div>
          ) : (
            <Button size="sm" onClick={enrichingAll ? null : enrichAllPending}
              className="text-white gap-1.5 flex-shrink-0"
              style={{ background: "#6B2FA0", border: "none" }}>
              <Sparkles className="w-3.5 h-3.5" /> Enriquecer todas com IA
            </Button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border mb-4"
          style={{ background: "#fce7ef", borderColor: "#E10867" }}>
          <span className="text-sm font-semibold flex-1" style={{ color: "#E10867" }}>
            {selected.size} startup{selected.size !== 1 ? "s" : ""} selecionada{selected.size !== 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())} className="gap-1.5 text-xs h-7">
            <X className="w-3 h-3" /> Desmarcar
          </Button>
          <Button size="sm" onClick={deleteSelected} disabled={deletingBulk}
            className="gap-1.5 text-xs h-7 text-white"
            style={{ background: "#E10867", border: "none" }}>
            {deletingBulk
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Excluindo…</>
              : <><Trash2 className="w-3 h-3" /> Excluir selecionadas</>
            }
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A7ADA7" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar startup no laboratório…" className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                background: tab === t.id ? "#1E0B2E" : "#fff",
                borderColor: tab === t.id ? "#1E0B2E" : "#A7ADA7",
                color: tab === t.id ? "#fff" : "#4B4F4B"
              }}>
              {t.label} {counts[t.id] > 0 && `(${counts[t.id]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#E10867" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border" style={{ borderColor: "#A7ADA7" }}>
          <div className="text-5xl mb-4">🧪</div>
          <p className="font-semibold text-lg mb-1" style={{ color: "#111111" }}>Laboratório vazio</p>
          <p className="text-sm mb-5" style={{ color: "#4B4F4B" }}>
            Importe um CSV ou adicione startups manualmente para começar
          </p>
          <Button onClick={() => setShowImport(true)} className="text-white gap-1.5"
            style={{ background: "#E10867", border: "none" }}>
            <Upload className="w-4 h-4" /> Importar CSV
          </Button>
        </div>
      ) : (
        <>
          {/* Select all row */}
          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll}
              className="w-4 h-4 rounded cursor-pointer accent-pink-600" />
            <span className="text-xs" style={{ color: "#4B4F4B" }}>
              {allFilteredSelected ? "Desmarcar todas" : "Selecionar todas"} ({filtered.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(lab => (
              <LabStartupCard
                key={lab.id}
                lab={lab}
                onEnriched={handleEnriched}
                onPromoted={handlePromoted}
                onDeleted={handleDeleted}
                selected={selected.has(lab.id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        </>
      )}

      {/* Add manual modal */}
      {showAddManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-up">
            <h3 className="font-bold text-lg mb-4" style={{ color: "#111111" }}>Adicionar startup manualmente</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Nome *</label>
                <Input placeholder="Nome da startup" value={manualForm.name}
                  onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Site</label>
                <Input placeholder="https://..." value={manualForm.website}
                  onChange={e => setManualForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Descrição (opcional)</label>
                <textarea
                  placeholder="Breve descrição do que a startup faz…"
                  value={manualForm.description}
                  onChange={e => setManualForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-1"
                  style={{ borderColor: "#A7ADA7" }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setShowAddManual(false)} disabled={savingManual}>Cancelar</Button>
              <Button onClick={addManual} disabled={!manualForm.name || savingManual}
                className="text-white gap-1.5" style={{ background: "#E10867", border: "none" }}>
                {savingManual ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : <><Plus className="w-4 h-4" /> Adicionar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <LabImportModal
          onClose={() => setShowImport(false)}
          onImported={loadLabs}
        />
      )}
    </div>
  );
}