import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { Shield, Database, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.role === "admin") {
        navigate(createPageUrl("AdminDashboard"));
      }
    }).catch(() => {});
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin(createPageUrl("AdminLogin"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0d0618' }}>
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border p-10 text-center"
          style={{ background: '#1E0B2E', borderColor: 'rgba(107,47,160,0.4)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(107,47,160,0.25)' }}>
            <Database className="w-8 h-8" style={{ color: '#a78bfa' }} />
          </div>

          <h1 className="text-2xl font-black text-white mb-2">Console Admin</h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Área restrita para a equipe interna da Beta-i.
          </p>

          <ul className="space-y-2.5 mb-8 text-left">
            {[
              "Gestão de startups e corporates",
              "CRM Board consolidado",
              "Relatórios e analytics",
              "Audit log de ações"
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: '#6B2FA0' }} />
                {item}
              </li>
            ))}
          </ul>

          <Button onClick={handleLogin} className="w-full h-12 font-semibold text-white text-base"
            style={{ background: '#6B2FA0', border: 'none' }}>
            <Shield className="w-4 h-4 mr-2" />
            Entrar com conta Beta-i
          </Button>

          <p className="text-xs mt-5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Acesso autorizado apenas para membros da equipe Beta-i
          </p>
        </div>
      </div>
    </div>
  );
}