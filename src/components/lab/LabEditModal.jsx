import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

const CATEGORY_OPTIONS = [
  "Agtech", "Biotech", "Cibersegurança", "Comunicação", "Construtech",
  "Deeptech", "Edtech", "Energtech", "ESG", "Fashiotech", "Fintech",
  "Foodtech", "Games", "Govtech", "Greentech", "Healthtech", "HRtech",
  "IndTech", "Insurtech", "Legaltech", "Logtech", "Martech", "Midiatech",
  "Mobilidade", "Pettech", "Proptech", "Real Estate", "Regtech",
  "Retailtech", "Salestech", "Security", "Sportech", "Supply Chain",
  "Traveltech", "Web3"
];
const BM_OPTIONS = ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"];
const STAGE_OPTIONS = ["Ideação", "MVP", "PMF", "Scale", "Growth"];

export default function LabEditModal({ lab, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: lab.name || "",
    website: lab.website || "",
    description: lab.description || "",
    category: lab.category || "",
    vertical: lab.vertical || "",
    business_model: lab.business_model || "",
    stage: lab.stage || "",
    value_proposition: lab.value_proposition || "",
    target_customers: lab.target_customers || "",
    tags: (lab.tags || []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const updated = {
      name: form.name,
      website: form.website,
      description: form.description,
      category: form.category,
      vertical: form.vertical,
      business_model: form.business_model,
      stage: form.stage,
      value_proposition: form.value_proposition,
      target_customers: form.target_customers,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };
    await base44.entities.LabStartup.update(lab.id, updated);
    setSaving(false);
    onSaved?.({ ...lab, ...updated });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#ECEEEA" }}>
          <h3 className="font-bold text-lg" style={{ color: "#111111" }}>Editar Startup</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" style={{ color: "#A7ADA7" }} />
          </button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Nome *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome da startup" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Site</label>
              <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Descrição</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Descreva brevemente a startup…"
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-1"
                style={{ borderColor: "#A7ADA7" }} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Categoria</label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="ex: HealthTech" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Vertical</label>
              <Input value={form.vertical} onChange={e => setForm(f => ({ ...f, vertical: e.target.value }))} placeholder="ex: Telemedicina" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Modelo de Negócio</label>
              <select value={form.business_model} onChange={e => setForm(f => ({ ...f, business_model: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white"
                style={{ borderColor: "#A7ADA7" }}>
                <option value="">Selecionar…</option>
                {BM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Estágio</label>
              <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none bg-white"
                style={{ borderColor: "#A7ADA7" }}>
                <option value="">Selecionar…</option>
                {STAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Proposta de Valor</label>
              <Input value={form.value_proposition} onChange={e => setForm(f => ({ ...f, value_proposition: e.target.value }))} placeholder="1 frase objetiva" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Clientes-Alvo</label>
              <Input value={form.target_customers} onChange={e => setForm(f => ({ ...f, target_customers: e.target.value }))} placeholder="Quem são os clientes ideais" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold block mb-1" style={{ color: "#4B4F4B" }}>Tags <span style={{ color: "#A7ADA7" }}>(separadas por vírgula)</span></label>
              <textarea value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                rows={2} placeholder="IA, automação, SaaS, B2B, sustentabilidade…"
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none outline-none focus:ring-1"
                style={{ borderColor: "#A7ADA7" }} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "#ECEEEA" }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={!form.name || saving} className="text-white gap-1.5" style={{ background: "#E10867", border: "none" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando…</> : <><Save className="w-4 h-4" /> Salvar alterações</>}
          </Button>
        </div>
      </div>
    </div>
  );
}