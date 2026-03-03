import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, ChevronRight, Star, Building2, User, Target, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = [
  { id: 1, label: "Empresa", icon: Building2 },
  { id: 2, label: "Responsável", icon: User },
  { id: 3, label: "Objetivos", icon: Target },
  { id: 4, label: "Acesso", icon: Users },
  { id: 5, label: "LGPD", icon: Shield },
];

const OBJECTIVES = [
  "Crescimento e novos negócios",
  "Eficiência operacional",
  "Gestão de risco",
  "ESG e sustentabilidade",
  "Transformação digital",
  "P&D colaborativo",
  "Acesso a startups e tecnologias",
  "Cultura de inovação",
];

const SIZES = ["Startup", "Pequena (<50 func.)", "Média (50–500 func.)", "Grande (500–5000 func.)", "Enterprise (+5000 func.)"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState([]);
  const [form, setForm] = useState({
    company_name: "", trade_name: "", cnpj: "", sector: "", size: "", website: "",
    contact_name: "", contact_email: "", contact_role: "", contact_phone: "",
    state: "", country: "Brasil", innovation_objectives: [], lgpd_consent: false
  });

  useState(() => {
    base44.auth.me().then(me => {
      if (me?.email) setForm(f => ({ ...f, contact_email: me.email }));
    });
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleObjective = (obj) => {
    setForm(f => {
      const arr = f.innovation_objectives.includes(obj)
        ? f.innovation_objectives.filter(o => o !== obj)
        : [...f.innovation_objectives, obj];
      return { ...f, innovation_objectives: arr };
    });
  };

  const awardBadge = (badge) => {
    setBadges(prev => prev.includes(badge) ? prev : [...prev, badge]);
  };

  const next = async () => {
    if (step === 2) awardBadge("🏢 Empresa cadastrada");
    if (step === 3) awardBadge("🎯 Objetivos definidos");
    if (step < 5) { setStep(s => s + 1); return; }

    setLoading(true);
    const me = await base44.auth.me();
    const corp = await base44.entities.Corporate.create({
      ...form,
      lgpd_consent_date: new Date().toISOString(),
      onboarding_completed: true,
      onboarding_step: 5
    });
    // Create CorporateMember as gestor
    await base44.entities.CorporateMember.create({
      corporate_id: corp.id,
      email: me.email,
      role: "gestor",
      super_crm_access: true,
      status: "active"
    });
    awardBadge("✅ Onboarding concluído");
    setLoading(false);
    navigate(createPageUrl("Diagnostic") + `?corporate_id=${corp.id}`);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;
  const isManager = form.is_manager !== false; // default true

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
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>Bem-vindo(a) ao Expand</h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            Diagnóstico de Maturidade em Inovação — em 4 passos simples
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {STEPS.map(s => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all`}
                    style={{
                      background: done ? '#2C4425' : active ? '#E10867' : '#A7ADA7',
                      color: '#fff'
                    }}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-xs hidden sm:block" style={{ color: active ? '#E10867' : '#4B4F4B' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 rounded-full mt-1" style={{ background: '#A7ADA7' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#E10867' }} />
          </div>
        </div>

        {/* Badges earned */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {badges.map(b => (
              <span key={b} className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: '#fce7ef', color: '#E10867' }}>{b}</span>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 animate-fade-in-up" style={{ borderColor: '#A7ADA7' }}>
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg" style={{ color: '#111111' }}>1/4 — Dados da Empresa</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Razão Social *</Label>
                  <Input value={form.company_name} onChange={e => update("company_name", e.target.value)} placeholder="Ex: Empresa S.A." />
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <Input value={form.trade_name} onChange={e => update("trade_name", e.target.value)} />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input value={form.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
                </div>
                <div>
                  <Label>Setor</Label>
                  <Input value={form.sector} onChange={e => update("sector", e.target.value)} placeholder="Ex: Energia, Saúde" />
                </div>
                <div>
                  <Label>Porte</Label>
                  <select value={form.size} onChange={e => update("size", e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
                    <option value="">Selecionar</option>
                    {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://" />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={form.state} onChange={e => update("state", e.target.value)} placeholder="SP" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg" style={{ color: '#111111' }}>2/4 — Responsável pelo Diagnóstico</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Nome *</Label>
                  <Input value={form.contact_name} onChange={e => update("contact_name", e.target.value)} />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.contact_email} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <Label>Cargo</Label>
                  <Input value={form.contact_role} onChange={e => update("contact_role", e.target.value)} placeholder="Gerente de Inovação" />
                </div>
                <div>
                  <Label>Telefone / WhatsApp</Label>
                  <Input value={form.contact_phone} onChange={e => update("contact_phone", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-lg" style={{ color: '#111111' }}>3/4 — Objetivos de Inovação</h2>
              <p className="text-sm" style={{ color: '#4B4F4B' }}>Selecione os objetivos que mais se alinham à sua empresa:</p>
              <div className="grid grid-cols-2 gap-2">
                {OBJECTIVES.map(obj => {
                  const selected = form.innovation_objectives.includes(obj);
                  return (
                    <button key={obj}
                      onClick={() => toggleObjective(obj)}
                      className="flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-all"
                      style={{
                        borderColor: selected ? '#E10867' : '#A7ADA7',
                        background: selected ? '#fce7ef' : '#fff',
                        color: selected ? '#E10867' : '#111111'
                      }}>
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: selected ? '#E10867' : '#A7ADA7', background: selected ? '#E10867' : 'transparent' }}>
                        {selected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span>{obj}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-bold text-lg" style={{ color: '#111111' }}>4/4 — Consentimento LGPD</h2>
              <div className="rounded-xl p-4 text-sm space-y-2" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                <p>Seus dados serão utilizados <strong>exclusivamente</strong> para fins de diagnóstico de maturidade de inovação e direcionamento de soluções personalizadas pela Beta-i Brasil.</p>
                <p>Não compartilharemos suas informações com terceiros sem seu consentimento explícito. Você pode solicitar a exclusão dos seus dados a qualquer momento.</p>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="lgpd"
                  checked={form.lgpd_consent}
                  onCheckedChange={v => update("lgpd_consent", v)}
                />
                <Label htmlFor="lgpd" className="text-sm cursor-pointer" style={{ color: '#111111' }}>
                  Concordo com o tratamento dos meus dados conforme a LGPD (Lei nº 13.709/2018) e a Política de Privacidade da Beta-i Brasil.
                </Label>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="text-sm"
              style={{ color: '#4B4F4B' }}
            >
              Voltar depois
            </Button>
            <Button
              onClick={next}
              disabled={
                loading ||
                (step === 1 && !form.company_name) ||
                (step === 2 && !form.contact_name) ||
                (step === 4 && !form.lgpd_consent)
              }
              className="gap-2 text-white px-6"
              style={{ background: '#E10867', border: 'none' }}
            >
              {loading ? "Salvando…" : step === 4 ? "Iniciar Diagnóstico" : "Próximo"}
              {!loading && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#4B4F4B' }}>
          Beta-i Brasil · 10 anos conectando inovação aberta
        </p>
      </div>
    </div>
  );
}