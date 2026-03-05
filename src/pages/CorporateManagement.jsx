import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Eye, Zap, ChevronRight } from "lucide-react";

export default function CorporateManagement() {
  const [corporates, setCorporates] = useState([]);
  const [sessions, setSessions] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const corps = await base44.entities.Corporate.list("-created_date");
    setCorporates(corps);
    const allSessions = await base44.entities.DiagnosticSession.filter({ status: "completed" });
    const sessMap = {};
    allSessions.forEach(s => {
      if (!sessMap[s.corporate_id] || new Date(s.completed_at) > new Date(sessMap[s.corporate_id].completed_at)) {
        sessMap[s.corporate_id] = s;
      }
    });
    setSessions(sessMap);
    setLoading(false);
  };

  const filtered = corporates.filter(c =>
    !search ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.sector?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      <PageHeader title="Empresas Corporates" badge={`${corporates.length}`} />

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A7ADA7' }} />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail, setor…" className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#A7ADA7' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#ECEEEA', borderBottom: '1px solid #A7ADA7' }}>
                {["Empresa", "Setor", "Porte", "Contato", "Diagnóstico", "Ações"].map(h => (
                  <th key={h} className="p-3 text-left text-xs uppercase font-semibold tracking-wide"
                    style={{ color: '#4B4F4B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12" style={{ color: '#4B4F4B' }}>
                  Nenhuma empresa encontrada
                </td></tr>
              )}
              {filtered.map(corp => {
                const sess = sessions[corp.id];
                return (
                  <tr key={corp.id} className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#ECEEEA' }}>
                    <td className="p-3">
                      <p className="font-medium" style={{ color: '#111111' }}>{corp.trade_name || corp.company_name}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{corp.company_name}</p>
                    </td>
                    <td className="p-3 text-xs" style={{ color: '#4B4F4B' }}>{corp.sector || "—"}</td>
                    <td className="p-3 text-xs" style={{ color: '#4B4F4B' }}>{corp.size || "—"}</td>
                    <td className="p-3">
                      <p className="text-xs" style={{ color: '#111111' }}>{corp.contact_name}</p>
                      <p className="text-xs" style={{ color: '#4B4F4B' }}>{corp.contact_email}</p>
                    </td>
                    <td className="p-3">
                      {sess ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm" style={{ color: '#E10867' }}>{sess.overall_score}%</span>
                          <MaturityBadge level={sess.maturity_level} />
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: '#A7ADA7' }}>Não realizado</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Link to={createPageUrl("CorporateDetail") + `?corporate_id=${corp.id}`}>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-gray-50 transition-colors"
                          style={{ borderColor: '#A7ADA7', color: '#4B4F4B' }}>
                          Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}