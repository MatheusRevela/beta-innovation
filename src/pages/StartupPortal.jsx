import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, FileText, Star, Loader2, ExternalLink, UserPlus, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StartupPortal() {
  const [user, setUser] = useState(null);
  const [startupUser, setStartupUser] = useState(null);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      // Busca vínculo da startup com o usuário
      const links = await base44.entities.StartupUser.filter({ user_email: me.email, status: "ativo" });
      if (links.length > 0) {
        setStartupUser(links[0]);
        const startups = await base44.entities.Startup.filter({ id: links[0].startup_id });
        if (startups.length > 0) setStartup(startups[0]);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
            <Rocket className="w-5 h-5" style={{ color: '#E10867' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Portal da Startup</h1>
            <p className="text-sm" style={{ color: '#4B4F4B' }}>
              Olá, {user?.full_name?.split(" ")[0] || "bem-vindo(a)"} 👋
            </p>
          </div>
        </div>
      </div>

      {!startup ? (
        /* Startup não vinculada ainda */
        <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>
            Sua startup ainda não está vinculada
          </h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: '#4B4F4B' }}>
            Cadastre sua startup na plataforma Beta-i para acessar oportunidades de conexão com corporates.
          </p>
          <Link to={createPageUrl("PublicStartupRegister")}>
            <Button className="text-white gap-2 px-6" style={{ background: '#E10867', border: 'none' }}>
              <UserPlus className="w-4 h-4" /> Cadastrar minha Startup
            </Button>
          </Link>
        </div>
      ) : (
        /* Startup vinculada */
        <div className="space-y-4">
          {/* Card da startup */}
          <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {startup.logo_url ? (
                  <img src={startup.logo_url} alt="Logo" className="w-14 h-14 rounded-xl object-contain border" style={{ borderColor: '#A7ADA7' }} />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ECEEEA' }}>
                    <Star className="w-7 h-7" style={{ color: '#E10867' }} />
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-lg" style={{ color: '#111111' }}>{startup.name}</h2>
                  {startup.category && (
                    <span className="inline-block text-xs px-2.5 py-0.5 rounded-full mt-1"
                      style={{ background: '#fce7ef', color: '#E10867' }}>
                      {startup.category}
                    </span>
                  )}
                  {startup.description && (
                    <p className="text-sm mt-2 max-w-md" style={{ color: '#4B4F4B' }}>{startup.description}</p>
                  )}
                </div>
              </div>
              <Link to={createPageUrl("PublicStartupRegister") + `?startup_id=${startup.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 flex-shrink-0" style={{ borderColor: '#A7ADA7' }}>
                  <FileText className="w-3.5 h-3.5" /> Atualizar cadastro
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t" style={{ borderColor: '#ECEEEA' }}>
              {startup.stage && (
                <div>
                  <p className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Estágio</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{startup.stage}</p>
                </div>
              )}
              {startup.business_model && (
                <div>
                  <p className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Modelo</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{startup.business_model}</p>
                </div>
              )}
              {startup.state && (
                <div>
                  <p className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Estado</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: '#111111' }}>{startup.state}</p>
                </div>
              )}
              {startup.website && (
                <div>
                  <p className="text-xs font-medium" style={{ color: '#4B4F4B' }}>Website</p>
                  <a href={startup.website} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold mt-0.5 flex items-center gap-1 hover:underline"
                    style={{ color: '#E10867' }}>
                    <ExternalLink className="w-3 h-3" /> Visitar
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Status de completude */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <p className="font-semibold text-sm mb-3" style={{ color: '#111111' }}>Completude do perfil</p>
            <div className="h-2 rounded-full" style={{ background: '#ECEEEA' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${startup.completeness_score || 40}%`, background: '#E10867' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#4B4F4B' }}>
              {startup.completeness_score || 40}% completo — quanto mais completo, maior sua visibilidade para as corporates.
            </p>
          </div>

          {/* CTA Diagnóstico */}
          <div className="bg-white rounded-2xl border p-5 flex items-center justify-between gap-4" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
                <Zap className="w-5 h-5" style={{ color: '#E10867' }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#111111' }}>Diagnóstico de Maturidade</p>
                <p className="text-xs" style={{ color: '#4B4F4B' }}>9 pilares · 35 perguntas · relatório com IA</p>
              </div>
            </div>
            <Link to={createPageUrl("StartupDiagnostic")}>
              <Button className="text-white gap-1 flex-shrink-0" style={{ background: '#E10867', border: 'none' }}>
                Fazer diagnóstico <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}