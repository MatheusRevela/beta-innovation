import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Zap, Map, Briefcase, ArrowRight, Star, ChevronRight,
  BarChart3, Shield, Sparkles, Target, Building2, Database
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    color: "#fce7ef",
    iconColor: "#E10867",
    title: "Diagnóstico de Maturidade",
    desc: "Avalie 6 pilares de inovação com questões calibradas e receba uma síntese executiva gerada por IA em minutos."
  },
  {
    icon: Map,
    color: "#ede9f6",
    iconColor: "#6B2FA0",
    title: "Radar de Startups",
    desc: "A IA mapeia startups do nosso banco curado e gera uma tese de inovação personalizada para a sua empresa."
  },
  {
    icon: Briefcase,
    color: "#e8f0e6",
    iconColor: "#2C4425",
    title: "CRM de Inovação",
    desc: "Gerencie todo o pipeline de parcerias, PoCs e investimentos com startups em um kanban intuitivo."
  },
  {
    icon: BarChart3,
    color: "#e8f4f7",
    iconColor: "#1E6B8A",
    title: "Relatórios Executivos",
    desc: "Dashboards e relatórios prontos para apresentar ao board o avanço da agenda de inovação aberta."
  },
];

const STEPS = [
  { num: "01", title: "Onboarding", desc: "Cadastre sua empresa e defina objetivos de inovação em 4 passos rápidos." },
  { num: "02", title: "Diagnóstico IA", desc: "Responda 24 perguntas sobre 6 pilares e receba seu score de maturidade com recomendações personalizadas." },
  { num: "03", title: "Radar de Startups", desc: "A IA gera sua tese de inovação e sugere startups do portfólio Beta-i com maior fit para seus desafios." },
  { num: "04", title: "Pipeline ativo", desc: "Adicione startups ao CRM, acompanhe tarefas e avance nas negociações com seu gestor Beta-i." },
];

const STATS = [
  { value: "+500", label: "Startups no radar" },
  { value: "6", label: "Pilares de inovação" },
  { value: "98%", label: "Satisfação dos clientes" },
  { value: "15+", label: "Anos de ecossistema" },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        setLoading(false);
        // Auto-redirect logged-in users to their portal
        if (u?.role === "admin") {
          navigate(createPageUrl("AdminDashboard"));
        } else if (u?.role === "startup_user") {
          navigate(createPageUrl("StartupPortal"));
        } else if (u?.role === "user") {
          base44.entities.CorporateMember.filter({ email: u.email, status: "active" }).then(members => {
            if (members.length > 0) navigate(createPageUrl("Dashboard"));
            else navigate(createPageUrl("ChooseProfile"));
          });
          return;
        }
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCTA = () => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl("Home"));
      return;
    }
    if (user.role === "admin") {
      navigate(createPageUrl("AdminDashboard"));
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  const handleEnter = () => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl("Home"));
      return;
    }
    if (user.role === "admin") {
      navigate(createPageUrl("AdminDashboard"));
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#ECEEEA', fontFamily: 'Inter, sans-serif' }}>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: '#A7ADA7' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E10867' }}>
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm" style={{ color: '#111111' }}>Beta-i</span>
              <span className="text-xs ml-1.5 font-medium" style={{ color: '#4B4F4B' }}>Innovation OS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              user ? (
                <Button onClick={handleEnter} className="text-white text-sm px-5" style={{ background: '#E10867', border: 'none' }}>
                  {user.role === 'admin' ? 'Console Admin' : 'Meu Portal'} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <>
                  <button onClick={() => base44.auth.redirectToLogin(createPageUrl("Home"))}
                    className="text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: '#111111' }}>
                    Entrar
                  </button>
                  <Button onClick={handleCTA} className="text-white text-sm px-5" style={{ background: '#E10867', border: 'none' }}>
                    Começar grátis
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: '#E10867', filter: 'blur(80px)' }} />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10" style={{ background: '#6B2FA0', filter: 'blur(60px)' }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: '#fce7ef', color: '#E10867' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma B2B de Inovação Aberta
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-6 max-w-4xl mx-auto"
            style={{ color: '#111111', letterSpacing: '-0.02em' }}>
            Meça, conecte e{" "}
            <span style={{ color: '#E10867' }}>acelere</span>{" "}
            sua inovação
          </h1>
          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#4B4F4B' }}>
            O Beta-i Innovation OS é a plataforma que conecta grandes corporações às melhores startups do ecossistema — com diagnóstico de maturidade, IA e gestão de pipeline em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleCTA} size="lg"
              className="text-white px-10 text-base font-semibold h-12"
              style={{ background: '#E10867', border: 'none' }}>
              {user ? (user.role === 'admin' ? 'Ir para o Console' : 'Ir para o Portal') : 'Iniciar diagnóstico grátis'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <a href="#como-funciona">
              <Button variant="outline" size="lg"
                className="text-base h-12 px-8"
                style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                Como funciona
              </Button>
            </a>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border" style={{ borderColor: '#A7ADA7' }}>
                <p className="text-2xl font-black" style={{ color: '#E10867' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#E10867' }}>Capacidades</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: '#111111' }}>Tudo que você precisa para inovar</h2>
            <p className="text-base mt-3 max-w-xl mx-auto" style={{ color: '#4B4F4B' }}>
              Da avaliação de maturidade ao fechamento de parcerias, o Innovation OS cobre toda a jornada.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border p-6 hover:shadow-lg transition-shadow"
                  style={{ borderColor: '#A7ADA7' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: f.color }}>
                    <Icon className="w-6 h-6" style={{ color: f.iconColor }} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: '#111111' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#4B4F4B' }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="py-20" style={{ background: '#ECEEEA' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#E10867' }}>Processo</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ color: '#111111' }}>Como funciona?</h2>
            <p className="text-base mt-3 max-w-xl mx-auto" style={{ color: '#4B4F4B' }}>
              4 etapas para transformar sua empresa em uma máquina de inovação aberta.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px z-0"
                    style={{ background: 'linear-gradient(to right, #A7ADA7, transparent)' }} />
                )}
                <div className="bg-white rounded-2xl border p-6 relative z-10 h-full"
                  style={{ borderColor: '#A7ADA7' }}>
                  <span className="text-4xl font-black leading-none" style={{ color: '#fce7ef' }}>{step.num}</span>
                  <h3 className="font-bold text-base mt-3 mb-2" style={{ color: '#111111' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#4B4F4B' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20" style={{ background: '#1E0B2E' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(225,8,103,0.2)', color: '#ff6fa8' }}>
            <Target className="w-3.5 h-3.5" />
            Resultados em semanas, não anos
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Pronto para acelerar<br />sua inovação aberta?
          </h2>
          <p className="text-base text-white/70 mb-10 max-w-lg mx-auto">
            Junte-se a empresas que já usam o Beta-i Innovation OS para conectar tecnologia ao negócio com velocidade e precisão.
          </p>
          <Button onClick={handleCTA} size="lg"
            className="text-white px-12 text-base font-semibold h-12"
            style={{ background: '#E10867', border: 'none' }}>
            {user ? 'Ir para o Portal' : 'Iniciar gratuitamente'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t" style={{ background: '#111111', borderColor: '#333' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#E10867' }}>
              <Star className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-sm font-semibold">Beta-i Innovation OS</span>
          </div>
          <p className="text-xs" style={{ color: '#666' }}>© 2025 Beta-i. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}