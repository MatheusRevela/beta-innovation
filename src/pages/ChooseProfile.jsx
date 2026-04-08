import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Star, Building2, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChooseProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(u => {
        setUser(u);
        // Se já tem papel definido, redireciona diretamente
        if (u?.role === "admin") {
          navigate(createPageUrl("AdminDashboard"));
          return;
        }
        if (u?.role === "startup_user") {
          navigate(createPageUrl("StartupPortal"));
          return;
        }
        if (u?.role === "user") {
          // Verifica se já tem corporate vinculada
          base44.entities.CorporateMember.filter({ email: u.email, status: "active" }).then(members => {
            if (members.length > 0) {
              navigate(createPageUrl("Dashboard"));
            } else {
              setLoading(false);
            }
          });
          return;
        }
        setLoading(false);
      })
      .catch(() => {
        base44.auth.redirectToLogin(createPageUrl("ChooseProfile"));
      });
  }, []);

  const handleChoose = async (type) => {
    setChoosing(type);
    if (type === "corporate") {
      navigate(createPageUrl("Onboarding"));
    } else {
      // Muda role para startup_user e vai para cadastro
      await base44.auth.updateMe({ role: "startup_user" });
      navigate(createPageUrl("PublicStartupRegister"));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#ECEEEA' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#ECEEEA' }}>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#E10867' }}>
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#111111' }}>Beta-i Innovation OS</span>
          </div>
          <h1 className="text-2xl font-black mt-4" style={{ color: '#111111' }}>
            Bem-vindo(a), {user?.full_name?.split(" ")[0] || "usuário"} 👋
          </h1>
          <p className="text-sm mt-2" style={{ color: '#4B4F4B' }}>
            Para personalizar sua experiência, nos diga quem você é:
          </p>
        </div>

        {/* Cards de escolha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Grande Empresa */}
          <button
            onClick={() => handleChoose("corporate")}
            disabled={!!choosing}
            className="group relative bg-white rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            style={{ borderColor: choosing === "corporate" ? '#E10867' : '#A7ADA7' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#fce7ef' }}>
              <Building2 className="w-7 h-7" style={{ color: '#E10867' }} />
            </div>
            <h2 className="font-black text-base mb-1" style={{ color: '#111111' }}>Grande Empresa</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4B4F4B' }}>
              Sou de uma corporação e quero descobrir startups, fazer diagnósticos de inovação e gerir parcerias.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: '#E10867' }}>
              {choosing === "corporate"
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Entrando…</>
                : <>Começar <ArrowRight className="w-3.5 h-3.5" /></>}
            </div>
          </button>

          {/* Startup */}
          <button
            onClick={() => handleChoose("startup")}
            disabled={!!choosing}
            className="group relative bg-white rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
            style={{ borderColor: choosing === "startup" ? '#2C4425' : '#A7ADA7' }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: '#e8f0e6' }}>
              <Rocket className="w-7 h-7" style={{ color: '#2C4425' }} />
            </div>
            <h2 className="font-black text-base mb-1" style={{ color: '#111111' }}>Startup</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4B4F4B' }}>
              Sou fundador(a) ou membro de uma startup e quero aparecer no radar de corporações parceiras.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: '#2C4425' }}>
              {choosing === "startup"
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Entrando…</>
                : <>Começar <ArrowRight className="w-3.5 h-3.5" /></>}
            </div>
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#4B4F4B' }}>
          Você poderá alterar isso depois em suas configurações de perfil.
        </p>
      </div>
    </div>
  );
}