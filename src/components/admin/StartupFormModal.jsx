import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2, Sparkles, Globe } from "lucide-react";

const FIELDS = {
  category: [
    "Agtech", "Biotech", "Cibersegurança", "Comunicação", "Construtech",
    "Deeptech", "Edtech", "Energtech", "ESG", "Fashiotech", "Fintech",
    "Foodtech", "Games", "Govtech", "Greentech", "Healthtech", "HRtech",
    "IndTech", "Insurtech", "Legaltech", "Logtech", "Martech", "Midiatech",
    "Mobilidade", "Pettech", "Proptech", "Real Estate", "Regtech",
    "Retailtech", "Salestech", "Security", "Sportech", "Supply Chain",
    "Traveltech", "Web3"
  ],
  business_model: ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"],
  stage: ["Ideação", "MVP", "PMF", "Scale", "Growth"],
  price_range: ["Gratuito", "Até R$10k/ano", "R$10k–R$50k/ano", "R$50k–R$200k/ano", "Acima de R$200k/ano"],
};

const EMPTY = {
  name: "", category: "", vertical: "", business_model: "", description: "",
  website: "", contact_email: "", contact_whatsapp: "", state: "", country: "Brasil",
  stage: "", price_range: "", tags: "", logo_url: "", notes: "", is_active: true
};

export default function StartupFormModal({ startup, onClose, onSaved }) {
  const [form, setForm] = useState(startup ? { ...startup, tags: startup.tags || [] } : { ...EMPTY, tags: [] });
  const [saving, setSaving] = useState(false);
  const [aiUrl, setAiUrl] = useState(startup?.website || "");
  const [aiDesc, setAiDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTags = (raw) => {
    const newTags = raw.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    setForm(f => ({ ...f, tags: [...new Set([...(f.tags || []), ...newTags])] }));
    setTagInput("");
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const analyzeWithAI = async () => {
    if (!aiUrl) return;
    setAnalyzing(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de inovação especialista em ecossistema de startups. Analise a startup com site: ${aiUrl}.
${aiDesc ? `Contexto adicional fornecido: "${aiDesc}"` : ""}
Acesse o site e extraia o máximo de informações possíveis para pré-preencher um cadastro de startup.
Retorne todos os campos que conseguir identificar com precisão.

Para o campo "tags", gere PELO MENOS 15 tags de alta qualidade para maximizar o matching com corporações. 
Inclua: termos técnicos, verticais de mercado, tecnologias usadas, problemas resolvidos, setores atendidos, modelos de negócio, tipo de cliente, palavras-chave do produto e tendências relacionadas.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          vertical: { type: "string" },
          business_model: { type: "string", enum: ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"] },
          stage: { type: "string", enum: ["Ideação", "MVP", "PMF", "Scale", "Growth"] },
          tags: { type: "array", items: { type: "string" }, description: "Mínimo de 15 tags para matching" },
          contact_email: { type: "string" },
          state: { type: "string" },
          country: { type: "string" },
        }
      }
    });

    setForm(f => {
      const existingTags = f.tags || [];
      const newTags = res.tags?.length ? res.tags.map(t => t.trim().toLowerCase()) : [];
      return {
        ...f,
        website: aiUrl,
        name: res.name || f.name,
        description: res.description || f.description,
        category: res.category || f.category,
        vertical: res.vertical || f.vertical,
        business_model: res.business_model || f.business_model,
        stage: res.stage || f.stage,
        tags: [...new Set([...existingTags, ...newTags])],
        contact_email: res.contact_email || f.contact_email,
        state: res.state || f.state,
        country: res.country || f.country,
      };
    });
    setAnalyzing(false);
  };

  const save = async () => {
    setSaving(true);
    const data = {
      ...form,
      tags: form.tags || [],
      is_active: form.is_active !== false
    };
    if (startup?.id) {
      await base44.entities.Startup.update(startup.id, data);
    } else {
      await base44.entities.Startup.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <h2 className="font-bold text-lg" style={{ color: '#111111' }}>
            {startup ? "Editar Startup" : "Nova Startup"}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* AI Assistant */}
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#c4b5fd', background: '#faf8ff' }}>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: '#6B2FA0' }} />
              <span className="text-sm font-semibold" style={{ color: '#1E0B2E' }}>Assistente de Cadastro Inteligente</span>
            </div>
            <p className="text-xs" style={{ color: '#4B4F4B' }}>
              Cole a URL da startup e opcionalmente uma descrição adicional. Nossa IA preencherá automaticamente todos os campos.
            </p>
            <div className="flex gap-2">
              <Input
                value={aiUrl}
                onChange={e => setAiUrl(e.target.value)}
                placeholder="https://exemplo.com"
                className="flex-1"
                style={{ borderColor: '#A7ADA7' }}
              />
              <Button onClick={analyzeWithAI} disabled={!aiUrl || analyzing}
                className="text-white whitespace-nowrap"
                style={{ background: '#6B2FA0', border: 'none' }}>
                {analyzing
                  ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Analisando…</>
                  : <><Globe className="w-4 h-4 mr-1.5" />Analisar Site</>}
              </Button>
            </div>
            <textarea
              value={aiDesc}
              onChange={e => setAiDesc(e.target.value)}
              rows={3}
              placeholder="[OPCIONAL] Cole aqui uma descrição adicional da startup que você já tenha (ex: do LinkedIn, database, etc.). Isso ajudará a IA a fazer uma análise mais precisa."
              className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              style={{ borderColor: '#A7ADA7', background: 'white' }}
            />
            <p className="text-xs" style={{ color: '#6B2FA0' }}>
              💡 Dica: Quanto mais contexto você fornecer, melhor será a análise da IA.
            </p>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Nome da startup" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select value={form.category} onChange={e => update("category", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {FIELDS.category.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label>Vertical</Label>
              <Input value={form.vertical} onChange={e => update("vertical", e.target.value)} placeholder="Ex: Diagnóstico" />
            </div>
            <div>
              <Label>Modelo de Negócio</Label>
              <select value={form.business_model} onChange={e => update("business_model", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {FIELDS.business_model.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label>Estágio</Label>
              <select value={form.stage} onChange={e => update("stage", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {FIELDS.stage.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)}
                rows={3} placeholder="Descreva a solução em 2-3 frases"
                className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: '#A7ADA7' }} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={form.logo_url} onChange={e => update("logo_url", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>E-mail de contato</Label>
              <Input type="email" value={form.contact_email} onChange={e => update("contact_email", e.target.value)} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.contact_whatsapp} onChange={e => update("contact_whatsapp", e.target.value)} placeholder="+55 11 99999-9999" />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={form.state} onChange={e => update("state", e.target.value)} placeholder="SP" />
            </div>
            <div>
              <Label>Faixa de preço</Label>
              <select value={form.price_range} onChange={e => update("price_range", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {FIELDS.price_range.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Tags para Matching</Label>
              {form.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2 mt-1">
                  {form.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors ml-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTags(tagInput); } }}
                  placeholder="Digite tags separadas por vírgula"
                  style={{ borderColor: '#A7ADA7' }}
                />
                <Button type="button" variant="outline" onClick={() => addTags(tagInput)} disabled={!tagInput}
                  style={{ borderColor: '#A7ADA7', flexShrink: 0 }}>
                  +
                </Button>
              </div>
              <p className="text-xs mt-1" style={{ color: '#A7ADA7' }}>
                Você pode colar uma lista de tags ou digitá-las separadas por vírgula. Ex: "vendas, marketing, crm".
              </p>
            </div>
            <div className="col-span-2">
              <Label>Notas internas</Label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
                rows={2} className="w-full border rounded-md px-3 py-2 text-sm resize-none" style={{ borderColor: '#A7ADA7' }} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active !== false}
                onChange={e => update("is_active", e.target.checked)} className="rounded" />
              <Label htmlFor="is_active" className="cursor-pointer">Startup ativa (aparece em matchings)</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t" style={{ borderColor: '#ECEEEA' }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={!form.name || saving}
            className="text-white" style={{ background: '#E10867', border: 'none' }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" />Salvando…</> : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}