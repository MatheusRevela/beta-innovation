import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CRM_TYPES, PIPELINE_STAGES } from "@/components/ui/DesignTokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Search, Plus } from "lucide-react";

export default function AddManualStartupModal({ thesis, corporate, onClose, onAdded }) {
  const [tab, setTab] = useState("existing"); // "existing" | "manual"
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [type, setType] = useState("PoC");
  const [customType, setCustomType] = useState("");
  const [stage, setStage] = useState("Shortlist");
  const [saving, setSaving] = useState(false);

  // Manual startup fields
  const [manualName, setManualName] = useState("");
  const [manualSite, setManualSite] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualDesc, setManualDesc] = useState("");

  const searchStartups = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const all = await base44.entities.Startup.filter({ is_deleted: false });
    const q = query.toLowerCase();
    setResults(all.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q))
    ).slice(0, 10));
    setSearching(false);
  };

  const save = async () => {
    setSaving(true);
    let startupId = selected?.id;

    if (tab === "manual") {
      if (!manualName.trim()) { setSaving(false); return; }
      const created = await base44.entities.Startup.create({
        name: manualName.trim(),
        website: manualSite,
        category: manualCategory,
        description: manualDesc,
        is_active: true,
      });
      startupId = created.id;
    }

    if (!startupId) { setSaving(false); return; }

    const startupName = tab === "manual" ? manualName : selected.name;
    const proj = await base44.entities.CRMProject.create({
      corporate_id: corporate.id,
      startup_id: startupId,
      session_id: thesis.id,
      project_name: `${type === "Custom" ? customType : type} — ${startupName}`,
      type,
      custom_type_label: type === "Custom" ? customType : undefined,
      stage,
      include_in_super_crm: true,
    });
    setSaving(false);
    onAdded(proj, startupId, tab === "manual" ? { id: startupId, name: manualName, category: manualCategory } : selected);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <h2 className="font-bold text-base" style={{ color: '#111111' }}>Adicionar Startup ao CRM</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: '#ECEEEA' }}>
          {[{ k: "existing", label: "Buscar existente" }, { k: "manual", label: "Adicionar manualmente" }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: tab === t.k ? '#E10867' : '#4B4F4B',
                borderBottom: tab === t.k ? '2px solid #E10867' : '2px solid transparent',
                background: 'none'
              }}>{t.label}</button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === "existing" ? (
            <>
              <div className="flex gap-2">
                <Input value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Nome, categoria ou tag…"
                  onKeyDown={e => e.key === "Enter" && searchStartups()} />
                <Button onClick={searchStartups} disabled={searching} className="text-white flex-shrink-0"
                  style={{ background: '#1E0B2E', border: 'none' }}>
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
              {results.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.map(s => (
                    <div key={s.id}
                      onClick={() => setSelected(s)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all"
                      style={{
                        borderColor: selected?.id === s.id ? '#E10867' : '#ECEEEA',
                        background: selected?.id === s.id ? '#fce7ef' : '#fff'
                      }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{ background: '#fce7ef', color: '#E10867' }}>{s.name?.[0]}</div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{s.name}</p>
                        <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{s.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#4B4F4B' }}>Nome da Startup *</label>
                <Input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Ex: TechSolutions Ltda" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#4B4F4B' }}>Website</label>
                <Input value={manualSite} onChange={e => setManualSite(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#4B4F4B' }}>Categoria</label>
                <Input value={manualCategory} onChange={e => setManualCategory(e.target.value)} placeholder="Ex: HealthTech, Agritech…" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: '#4B4F4B' }}>Descrição</label>
                <Input value={manualDesc} onChange={e => setManualDesc(e.target.value)} placeholder="Breve descrição da startup" />
              </div>
            </>
          )}

          {/* Project config */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#4B4F4B' }}>Tipo de projeto</label>
            <div className="flex flex-wrap gap-1.5">
              {CRM_TYPES.filter(ct => ct.value !== "Custom").map(ct => (
                <button key={ct.value} onClick={() => setType(ct.value)}
                  className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all"
                  style={{
                    background: type === ct.value ? '#1E0B2E' : '#fff',
                    borderColor: type === ct.value ? '#1E0B2E' : '#A7ADA7',
                    color: type === ct.value ? '#fff' : '#4B4F4B'
                  }}>{ct.label}</button>
              ))}
              <button onClick={() => setType("Custom")}
                className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all"
                style={{
                  background: type === "Custom" ? '#1E0B2E' : '#fff',
                  borderColor: type === "Custom" ? '#1E0B2E' : '#A7ADA7',
                  color: type === "Custom" ? '#fff' : '#4B4F4B'
                }}>✏️ Personalizado</button>
            </div>
            {type === "Custom" && (
              <Input className="mt-2" value={customType} onChange={e => setCustomType(e.target.value)}
                placeholder="Nome do tipo…" />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: '#4B4F4B' }}>Estágio inicial</label>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map(s => (
                <button key={s} onClick={() => setStage(s)}
                  className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all"
                  style={{
                    background: stage === s ? '#1E0B2E' : '#fff',
                    borderColor: stage === s ? '#1E0B2E' : '#A7ADA7',
                    color: stage === s ? '#fff' : '#4B4F4B'
                  }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex gap-2 justify-end" style={{ borderColor: '#ECEEEA' }}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || (tab === "existing" && !selected) || (tab === "manual" && !manualName.trim())}
            className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}