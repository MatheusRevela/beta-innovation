import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link, useNavigate } from "react-router-dom";
import { Rocket, FileText, Star, Loader2, ExternalLink, UserPlus, Zap, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

function calcCompleteness(s) {
  const fields = ["name","category","business_model","stage","state","description","website","contact_email","logo_url","cnpj","founding_year"];
  const tagScore = s.tags?.length > 0 ? 1 : 0;
  const filled = fields.filter(f => s[f] && String(s[f]).trim() !== "").length;
  return Math.round(((filled + tagScore) / (fields.length + 1)) * 100);
}

export default function StartupPortal() {
  const [user, setUser] = useState(null);
  const [startup, setStartup] = useState(null);
  const [diagnosticSession, setDiagnosticSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const links = await base44.entities.StartupUser.filter({ user_email: me.email, status: "ativo" });
      if (links.length > 0) {
        const startups = await base44.entities.Startup.filter({ id: links[0].startup_id });
        if (startups.length > 0) {
          const s = startups[0];
          setStartup(s);
          const sessions = await base44.entities.StartupDiagnosticSession.filter({
            startup_id: s.id,
            diagnostic_type: "maturidade_startup"
          });
          const completed = sessions.find(sess => sess.status === "completed");
          if (completed) setDiagnosticSession(completed);
        }
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

  const pct = startup ? calcCompleteness(startup) : 0;

  const threeMonthsMs = 3 * 30 * 24 * 60 * 60 * 1000;
  const diagnosticLocked = diagnosticSession?.completed_at &&
    (Date.now() - new Date(diagnosticSession.completed_at).getTime()) < threeMonthsMs;
  const nextDiagnosticDate = diagnosticLocked
    ? new Date(new Date(diagnosticSession.completed_at).getTime() + threeMonthsMs)
    : null;

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

          {/* Completude calculada ao vivo */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm" style={{ color: '#111111' }}>Completude do perfil</p>
              <span className="text-sm font-bold" style={{ color: pct >= 80 ? '#2C4425' : '#E10867' }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full mb-2" style={{ background: '#ECEEEA' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: pct >= 80 ? '#2C4425' : '#E10867' }} />
            </div>

            {/* Níveis de gamificação */}
            <div className="grid grid-cols-4 gap-2 mt-3 mb-3">
              {[
                { label: 'Básico', min: 0, max: 40, emoji: '⚪', desc: 'Invisível no radar' },
                { label: 'Bronze', min: 40, max: 60, emoji: '🥉', desc: 'Visibilidade limitada' },
                { label: 'Prata', min: 60, max: 80, emoji: '🥈', desc: 'Aparece em matchings' },
                { label: 'Ouro', min: 80, max: 101, emoji: '🥇', desc: 'Prioridade máxima' },
              ].map(tier => {
                const active = pct >= tier.min && pct < tier.max;
                const done = pct >= tier.max;
                return (
                  <div key={tier.label} className="text-center p-2 rounded-xl border-2 transition-all"
                    style={{ borderColor: active ? '#E10867' : done ? '#2C4425' : '#ECEEEA', background: active ? '#fce7ef' : done ? '#e8f0e6' : '#ECEEEA' }}>
                    <p className="text-lg">{tier.emoji}</p>
                    <p className="text-xs font-bold" style={{ color: active ? '#E10867' : done ? '#2C4425' : '#4B4F4B' }}>{tier.label}</p>
                    <p className="text-[10px]" style={{ color: '#4B4F4B' }}>{tier.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl text-xs" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
              💡 <strong>Como funciona?</strong> Quanto mais completo seu perfil, mais visível você fica para corporates em nosso radar de inovação. Perfis <strong>Ouro</strong> recebem badge de destaque e aparecem primeiro nos matchings.
            </div>
          </div>

          {/* Diagnóstico */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
                  <Zap className="w-5 h-5" style={{ color: '#E10867' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111111' }}>Diagnóstico de Maturidade</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>9 pilares · 35 perguntas · relatório com IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {diagnosticSession && (
                  <Link to={createPageUrl("StartupDiagnostic")}>
                    <Button variant="outline" size="sm" className="gap-1 flex-shrink-0" style={{ borderColor: '#A7ADA7' }}>
                      Ver resultado <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                )}
                {diagnosticLocked ? (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                    <Lock className="w-3.5 h-3.5" />
                    Refazer em {nextDiagnosticDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </div>
                ) : (
                  <Link to={createPageUrl("StartupDiagnostic")}>
                    <Button className="text-white gap-1 flex-shrink-0" style={{ background: '#E10867', border: 'none' }}>
                      {diagnosticSession ? 'Refazer diagnóstico' : 'Fazer diagnóstico'} <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Nota do diagnóstico */}
            {diagnosticSession && (
              <div className="mt-3 pt-3 border-t flex items-center gap-3" style={{ borderColor: '#ECEEEA' }}>
                <div className="text-2xl font-black" style={{ color: '#E10867' }}>{diagnosticSession.overall_score}</div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#111111' }}>{diagnosticSession.maturity_level}</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>
                    Score geral · {new Date(diagnosticSession.completed_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}