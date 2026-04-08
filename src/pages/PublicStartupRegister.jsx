import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Star, ChevronRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "Agtech","Biotech","Cibersegurança","Edtech","Energtech","ESG","Fintech",
  "Foodtech","Govtech","Greentech","Healthtech","HRtech","IndTech","Insurtech",
  "Legaltech","Logtech","Martech","Mobilidade","Proptech","Retailtech","Salestech","Web3","Outro"
];
const STAGES = ["Ideação","MVP","PMF","Scale","Growth"];
const MODELS = ["SaaS","Hardware","Marketplace","Serviço","Plataforma","Outro"];
const STATES = ["SP","RJ","MG","RS","PR","SC","BA","CE","GO","PE","DF","AM","PA","ES","MT","MS","RN","PB","AL","SE","PI","RO","AC","AP","RR","TO","MA","Internacional"];

export default function PublicStartupRegister() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", cnpj: "", category: "", vertical: "", business_model: "",
    stage: "", description: "", website: "", contact_email: "",
    state: "", founding_year: "", tags: "",
  });

  useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      setForm(f => ({ ...f, contact_email: me.email || "" }));
      // Se vier um startup_id como param, carrega os dados existentes
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("startup_id");
      if (sid) {
        base44.entities.Startup.filter({ id: sid }).then(res => {
          if (res[0]) {
            const s = res[0];
            setForm({
              name: s.name || "",
              cnpj: s.cnpj || "",
              category: s.category || "",
              vertical: s.vertical || "",
              business_model: s.business_model || "",
              stage: s.stage || "",
              description: s.description || "",
              website: s.website || "",
              contact_email: s.contact_email || me.email || "",
              state: s.state || "",
              founding_year: s.founding_year || "",
              tags: (s.tags || []).join(", "),
              _id: s.id,
            });
          }
        });
      }
    });
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      name: form.name,
      cnpj: form.cnpj,
      category: form.category,
      vertical: form.vertical,
      business_model: form.business_model,
      stage: form.stage,
      description: form.description,
      website: form.website,
      contact_email: form.contact_email,
      state: form.state,
      founding_year: form.founding_year ? Number(form.founding_year) : undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      is_active: true,
    };

    let startupId = form._id;
    if (startupId) {
      await base44.entities.Startup.update(startupId, payload);
    } else {
      const created = await base44.entities.Startup.create(payload);
      startupId = created.id;
      // Vincula o usuário como admin da startup
      await base44.entities.StartupUser.create({
        startup_id: startupId,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: "admin_startup",
        status: "ativo",
        invited_at: new Date().toISOString(),
        activated_at: new Date().toISOString(),
      });
    }

    setSaved(true);
    setLoading(false);
    setTimeout(() => navigate(createPageUrl("StartupPortal")), 1500);
  };

  if (saved) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#ECEEEA' }}>
      <div className="bg-white rounded-2xl border p-10 text-center max-w-sm" style={{ borderColor: '#A7ADA7' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#e8f0e6' }}>
          <Check className="w-8 h-8" style={{ color: '#2C4425' }} />
        </div>
        <h2 className="font-bold text-lg" style={{ color: '#111111' }}>Cadastro salvo!</h2>
        <p className="text-sm mt-2" style={{ color: '#4B4F4B' }}>Redirecionando para o seu portal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#ECEEEA' }}>
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E10867' }}>
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#111111' }}>Beta-i Innovation OS</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>
            {form._id ? "Atualizar cadastro" : "Cadastro de Startup"}
          </h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            Preencha as informações da sua startup para aparecer no radar das corporates.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-4" style={{ borderColor: '#A7ADA7' }}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome da Startup *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ex: MinhaStartup" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <Label>Ano de Fundação</Label>
              <Input type="number" value={form.founding_year} onChange={e => update("founding_year", e.target.value)} placeholder="2020" />
            </div>
            <div>
              <Label>Categoria / Vertical</Label>
              <select value={form.category} onChange={e => update("category", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Modelo de Negócio</Label>
              <select value={form.business_model} onChange={e => update("business_model", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label>Estágio</Label>
              <select value={form.stage} onChange={e => update("stage", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label>Estado</Label>
              <select value={form.state} onChange={e => update("state", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                <option value="">Selecionar</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label>Descrição da Solução</Label>
              <textarea value={form.description} onChange={e => update("description", e.target.value)}
                rows={3} placeholder="O que sua startup faz? Qual problema resolve?"
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                style={{ borderColor: '#A7ADA7' }} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label>E-mail de Contato</Label>
              <Input type="email" value={form.contact_email} onChange={e => update("contact_email", e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="IA, automação, B2B, saúde" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.name}
              className="gap-2 text-white px-8"
              style={{ background: '#E10867', border: 'none' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              {loading ? "Salvando..." : form._id ? "Salvar alterações" : "Cadastrar Startup"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}