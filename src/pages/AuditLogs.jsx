import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ACTION_COLORS = {
  create: { bg: '#ECEEEA', color: '#2C4425' },
  update: { bg: '#ECEEEA', color: '#3B145A' },
  delete: { bg: '#fce7ef', color: '#E10867' },
  bulk_delete: { bg: '#fce7ef', color: '#E10867' },
  activate: { bg: '#ECEEEA', color: '#2C4425' },
  deactivate: { bg: '#ECEEEA', color: '#4B4F4B' },
};

export default function AuditLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    base44.auth.me().then(me => {
      if (me?.role !== 'admin') { navigate(createPageUrl('Dashboard')); return; }
      base44.entities.AuditLog.list("-created_date", 500).then(l => {
        setLogs(l);
        setLoading(false);
      });
    });
  }, []);

  const filtered = logs.filter(l => {
    if (!search) return true;
    return (
      l.entity_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader title="Audit Log" subtitle="Histórico de ações na plataforma" badge={`${logs.length}`} />

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A7ADA7' }} />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por ação, entidade, usuário…" className="pl-9" />
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
                {["Data/Hora", "Ação", "Entidade", "Nome", "Usuário"].map(h => (
                  <th key={h} className="p-3 text-left text-xs uppercase font-semibold tracking-wide"
                    style={{ color: '#4B4F4B' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12" style={{ color: '#4B4F4B' }}>
                  Nenhum log encontrado
                </td></tr>
              )}
              {filtered.map(log => {
                const ac = ACTION_COLORS[log.action] || { bg: '#ECEEEA', color: '#4B4F4B' };
                return (
                  <tr key={log.id} className="border-b hover:bg-gray-50" style={{ borderColor: '#ECEEEA' }}>
                    <td className="p-3 text-xs" style={{ color: '#4B4F4B' }}>
                      {new Date(log.created_date).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: ac.bg, color: ac.color }}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-medium" style={{ color: '#4B4F4B' }}>{log.entity_type}</td>
                    <td className="p-3 text-xs" style={{ color: '#111111' }}>{log.entity_name || log.entity_id || "—"}</td>
                    <td className="p-3 text-xs" style={{ color: '#4B4F4B' }}>{log.user_email || "—"}</td>
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