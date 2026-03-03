import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Star, Search, Loader2, CheckCircle2, ChevronRight } from "lucide-react";

export default function JoinCorporate() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [mode, setMode] = useState(null); // null | "join" | "create"
  const [searchEmail, setSearchEmail] = useState("");
  const [suggestedCorps, setSuggestedCorps] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [requestSent, setRequestSent] = useState(null); // corporate name
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(user => {
      setMe(user);
      setLoading(false);
      // Auto-suggest by email domain
      if (user?.email) {
        const domain = user.email.split("@")[1];
        const isGeneric = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com", "icloud.com"].includes(domain);
        if (!isGeneric) autoSuggest(domain);
      }
    });
  }, []);

  const autoSuggest = async (domain) => {
    setLoadingSuggestions(true);
    // Find all active members with the same domain and get their corporates
    const members = await base44.entities.CorporateMember.filter({ status: "active" });
    const domainMembers = members.filter(m => m.email?.split("@")[1] === domain);
    if (domainMembers.length > 0) {
      const corpIds = [...new Set(domainMembers.map(m => m.corporate_id))];
      const corpPromises = corpIds.map(id => base44.entities.Corporate.filter({ id }));
      const results = await Promise.all(corpPromises);
      const corps = results.flat();
      setSuggestedCorps(corps);
    }
    setLoadingSuggestions(false);
  };

  const searchByEmail = async () => {
    if (!searchEmail.trim()) return;
    setLoadingSuggestions(true);
    const domain = searchEmail.includes("@") ? searchEmail.split("@")[1] : searchEmail;
    await autoSuggest(domain);
    setLoadingSuggestions(false);
  };

  const requestJoin = async (corp) => {
    // Check if there's already a pending/active request
    const existing = await base44.entities.CorporateMember.filter({ corporate_id: corp.id, email: me.email });
    if (existing.length === 0) {
      await base44.entities.CorporateMember.create({
        corporate_id: corp.id,
        email: me.email,
        role: "usuario",
        super_crm_access: true,
        status: "pending"
      });
    }
    setRequestSent(corp.company_name || corp.trade_name);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#ECEEEA' }}>
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#ECEEEA' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#E10867' }}>
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ color: '#111111' }}>Beta-i Innovation OS</span>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#111111' }}>Bem-vindo(a)!</h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            Sua conta ainda não está vinculada a uma empresa.
          </p>
        </div>

        {requestSent ? (
          <div className="bg-white rounded-2xl border p-8 text-center animate-fade-in-up" style={{ borderColor: '#A7ADA7' }}>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#2C4425' }} />
            <h2 className="font-bold text-lg mb-2">Solicitação enviada!</h2>
            <p className="text-sm mb-2" style={{ color: '#4B4F4B' }}>
              Sua solicitação para se juntar a <strong>{requestSent}</strong> foi enviada.
            </p>
            <p className="text-sm mb-6" style={{ color: '#4B4F4B' }}>
              Aguarde o gestor da empresa aprovar seu acesso.
            </p>
            <Button variant="outline" onClick={() => navigate(createPageUrl("Dashboard"))}>
              Ir para o Dashboard
            </Button>
          </div>
        ) : mode === null ? (
          <div className="space-y-4 animate-fade-in-up">
            {/* Auto-suggested companies */}
            {suggestedCorps.length > 0 && (
              <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#B4D1D7', background: '#f0f8fb' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>
                  🏢 Empresa(s) encontrada(s) com seu domínio de email:
                </p>
                {suggestedCorps.map(corp => (
                  <div key={corp.id} className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border mb-2" style={{ borderColor: '#ECEEEA' }}>
                    <div>
                      <p className="font-medium text-sm">{corp.company_name || corp.trade_name}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{corp.sector}</p>
                    </div>
                    <Button size="sm" onClick={() => requestJoin(corp)}
                      className="text-white" style={{ background: '#E10867', border: 'none' }}>
                      Solicitar acesso
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border p-6" style={{ borderColor: '#A7ADA7' }}>
              <h2 className="font-bold text-lg mb-5" style={{ color: '#111111' }}>Como deseja prosseguir?</h2>
              <div className="space-y-3">
                <button onClick={() => setMode("join")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-purple-400"
                  style={{ borderColor: '#A7ADA7' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f3e8ff' }}>
                    <Search className="w-5 h-5" style={{ color: '#6B2FA0' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#111111' }}>Vincular-me a uma empresa existente</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>Solicitar acesso a uma empresa já cadastrada</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#A7ADA7' }} />
                </button>

                <button onClick={() => navigate(createPageUrl("Onboarding"))}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:border-red-400"
                  style={{ borderColor: '#A7ADA7' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#fce7ef' }}>
                    <Building2 className="w-5 h-5" style={{ color: '#E10867' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#111111' }}>Sou gestor — cadastrar nova empresa</p>
                    <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>Criar uma nova corporate e tornar-me gestor</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#A7ADA7' }} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border p-6 animate-fade-in-up" style={{ borderColor: '#A7ADA7' }}>
            <button onClick={() => setMode(null)} className="text-sm mb-4 flex items-center gap-1" style={{ color: '#4B4F4B' }}>
              ← Voltar
            </button>
            <h2 className="font-bold text-lg mb-4" style={{ color: '#111111' }}>Buscar empresa</h2>
            <div className="flex gap-2 mb-4">
              <Input
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                placeholder="Digite o domínio ou email da empresa"
                onKeyDown={e => e.key === "Enter" && searchByEmail()}
              />
              <Button onClick={searchByEmail} disabled={loadingSuggestions}
                className="text-white" style={{ background: '#E10867', border: 'none' }}>
                {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {suggestedCorps.map(corp => (
              <div key={corp.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border mb-2" style={{ borderColor: '#ECEEEA' }}>
                <div>
                  <p className="font-medium text-sm">{corp.company_name || corp.trade_name}</p>
                  <p className="text-xs" style={{ color: '#4B4F4B' }}>{corp.sector}</p>
                </div>
                <Button size="sm" onClick={() => requestJoin(corp)}
                  className="text-white" style={{ background: '#E10867', border: 'none' }}>
                  Solicitar acesso
                </Button>
              </div>
            ))}
            {suggestedCorps.length === 0 && !loadingSuggestions && searchEmail && (
              <p className="text-sm text-center py-4" style={{ color: '#A7ADA7' }}>
                Nenhuma empresa encontrada. Peça ao gestor para te adicionar diretamente.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}