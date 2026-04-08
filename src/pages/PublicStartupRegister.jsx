import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Loader2, Check, ArrowLeft, Building2, Upload, Image } from "lucide-react";
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

function calcCompleteness(form) {
  const fields = ["name","category","business_model","stage","state","description","website","contact_email","logo_url","cnpj","founding_year"];
  const tags = Array.isArray(form.tags) ? form.tags : (form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : []);
  const tagScore = tags.length > 0 ? 1 : 0;
  const filled = fields.filter(f => form[f] && String(form[f]).trim() !== "").length;
  return Math.round(((filled + tagScore) / (fields.length + 1)) * 100);
}

export default function PublicStartupRegister() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", cnpj: "", category: "", vertical: "", business_model: "",
    stage: "", description: "", website: "", contact_email: "",
    state: "", founding_year: "", tags: "", logo_url: "",
  });

  useEffect(() => {
    base44.auth.me().then(me => {
      setUser(me);
      setForm(f => ({ ...f, contact_email: me.email || "" }));
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
              logo_url: s.logo_url || "",
              _id: s.id,
            });
          }
        });
      }
    });
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("logo_url", file_url);
    setUploadingLogo(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const tagsArr = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
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
      tags: tagsArr,
      logo_url: form.logo_url || undefined,
      is_active: true,
      completeness_score: calcCompleteness({ ...form, tags: tagsArr }),
    };

    let startupId = form._id;
    if (startupId) {
      await base44.entities.Startup.update(startupId, payload);
    } else {
      const created = await base44.entities.Startup.create(payload);
      startupId = created.id;
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
    <div className="min-h-screen" style={{ background: '#ECEEEA' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(createPageUrl("StartupPortal"))}
            className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: '#4B4F4B' }}
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Portal
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#fce7ef' }}>
            <Building2 className="w-6 h-6" style={{ color: '#E10867' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>
              {form._id ? "Atualizar cadastro" : "Cadastro de Startup"}
            </h1>
            <p className="text-sm" style={{ color: '#4B4F4B' }}>
              Preencha as informações para aparecer no radar das corporates.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5" style={{ borderColor: '#A7ADA7' }}>

          {/* Logotipo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#E10867' }}>Logotipo</p>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ borderColor: form.logo_url ? '#E10867' : '#A7ADA7', background: '#ECEEEA' }}>
                {form.logo_url
                  ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  : <Image className="w-8 h-8" style={{ color: '#A7ADA7' }} />}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? "Enviando..." : "Carregar logo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                </label>
                <p className="text-xs mt-1.5" style={{ color: '#4B4F4B' }}>PNG, JPG ou SVG. Máximo 2MB.</p>
              </div>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: '#ECEEEA' }} />

          {/* Identidade */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#E10867' }}>Identidade</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Nome da Startup *</Label>
                <Input className="mt-1" value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ex: MinhaStartup" />
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>CNPJ</Label>
                <Input className="mt-1" value={form.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Ano de Fundação</Label>
                <Input className="mt-1" type="number" value={form.founding_year} onChange={e => update("founding_year", e.target.value)} placeholder="2020" />
              </div>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: '#ECEEEA' }} />

          {/* Classificação */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#E10867' }}>Classificação</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Categoria / Vertical</Label>
                <select value={form.category} onChange={e => update("category", e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" style={{ borderColor: '#A7ADA7' }}>
                  <option value="">Selecionar</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Modelo de Negócio</Label>
                <select value={form.business_model} onChange={e => update("business_model", e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" style={{ borderColor: '#A7ADA7' }}>
                  <option value="">Selecionar</option>
                  {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Estágio</Label>
                <select value={form.stage} onChange={e => update("stage", e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" style={{ borderColor: '#A7ADA7' }}>
                  <option value="">Selecionar</option>
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Estado</Label>
                <select value={form.state} onChange={e => update("state", e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none" style={{ borderColor: '#A7ADA7' }}>
                  <option value="">Selecionar</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: '#ECEEEA' }} />

          {/* Sobre */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#E10867' }}>Sobre</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Descrição da Solução</Label>
                <textarea value={form.description} onChange={e => update("description", e.target.value)}
                  rows={4} placeholder="O que sua startup faz? Qual problema resolve? Qual é seu diferencial?"
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
                  style={{ borderColor: '#A7ADA7' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Website</Label>
                  <Input className="mt-1" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://" />
                </div>
                <div>
                  <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>E-mail de Contato</Label>
                  <Input className="mt-1" type="email" value={form.contact_email} onChange={e => update("contact_email", e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Tags (separadas por vírgula)</Label>
                <Input className="mt-1" value={form.tags} onChange={e => update("tags", e.target.value)} placeholder="IA, automação, B2B, saúde" />
                <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>Tags ajudam as corporates a encontrar sua startup no radar de matching.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#ECEEEA' }}>
            <button
              type="button"
              onClick={() => navigate(createPageUrl("StartupPortal"))}
              className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1"
              style={{ color: '#4B4F4B' }}
            >
              <ArrowLeft className="w-4 h-4" /> Cancelar
            </button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !form.name || uploadingLogo}
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