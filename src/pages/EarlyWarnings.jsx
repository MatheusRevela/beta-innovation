import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Clock, Building2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EarlyWarnings() {
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    // Busca projetos ativos e verifica os que estão parados
    const projects = await base44.entities.CRMProject.filter({ is_active: true });
    const now = new Date();
    const stalled = projects.filter(p => {
      if (!p.updated_date) return false;
      const daysSince = (now - new Date(p.updated_date)) / (1000 * 60 * 60 * 24);
      return daysSince > 14;
    }).map(p => ({
      ...p,
      daysSince: Math.floor((now - new Date(p.updated_date)) / (1000 * 60 * 60 * 24))
    })).sort((a, b) => b.daysSince - a.daysSince);
    setWarnings(stalled);
    setLoading(false);
  };

  const runCheck = async () => {
    setRunning(true);
    await base44.functions.invoke("earlyWarnings", {});
    await load();
    setRunning(false);
  };

  useEffect(() => { load(); }, []);

  const getSeverity = (days) => {
    if (days > 30) return { label: "Crítico", color: "#dc2626", bg: "#fef2f2" };
    if (days > 21) return { label: "Alto", color: "#d97706", bg: "#fffbeb" };
    return { label: "Atenção", color: "#2563eb", bg: "#eff6ff" };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Early Warnings</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            Projetos sem atualização há mais de 14 dias
          </p>
        </div>
        <Button onClick={runCheck} disabled={running} className="gap-2 text-white" style={{ background: '#E10867', border: 'none' }}>
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? "Verificando..." : "Verificar agora"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
        </div>
      ) : warnings.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">✅</div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Tudo em dia</h2>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>Nenhum projeto parado há mais de 14 dias.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium mb-4" style={{ color: '#4B4F4B' }}>
            {warnings.length} projeto{warnings.length !== 1 ? 's' : ''} com alertas
          </p>
          {warnings.map(w => {
            const sev = getSeverity(w.daysSince);
            return (
              <div key={w.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: sev.bg }}>
                      <AlertTriangle className="w-5 h-5" style={{ color: sev.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#111111' }}>{w.project_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#4B4F4B' }}>
                          <Building2 className="w-3 h-3" /> {w.stage || "Sem etapa"}
                        </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: '#4B4F4B' }}>
                          <Clock className="w-3 h-3" /> {w.daysSince} dias sem atualização
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: sev.bg, color: sev.color }}>
                    {sev.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}