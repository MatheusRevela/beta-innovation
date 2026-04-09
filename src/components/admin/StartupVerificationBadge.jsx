import { AlertTriangle, Clock, WifiOff, Wifi } from "lucide-react";

/**
 * Badge compacto exibido na tabela de startups.
 * Mostra status da última verificação automática.
 */
export default function StartupVerificationBadge({ startup, onClick }) {
  const { verification_status, last_verified_at, verification_alert, website } = startup;

  if (!website) {
    return (
      <span className="text-xs" style={{ color: '#A7ADA7' }}>Sem site</span>
    );
  }

  if (!last_verified_at) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
        style={{ borderColor: '#A7ADA7', color: '#A7ADA7' }}
        title="Nunca verificado — clique para verificar"
      >
        <Clock className="w-3 h-3" />
        Não verificado
      </button>
    );
  }

  if (verification_alert) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
        style={{ background: '#FFF3E0', borderColor: '#E65100', color: '#E65100' }}
        title={verification_status?.observations || "Site offline — clique para revisar"}
      >
        <WifiOff className="w-3 h-3" />
        Site offline
      </button>
    );
  }

  if (verification_status?.site_online) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
        style={{ background: '#e8f5e9', borderColor: '#2C4425', color: '#2C4425' }}
        title={`OK — ${verification_status?.response_time_ms}ms`}
      >
        <Wifi className="w-3 h-3" />
        Online
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
      style={{ background: '#fce7ef', borderColor: '#E10867', color: '#E10867' }}
      title={verification_status?.observations}
    >
      <AlertTriangle className="w-3 h-3" />
      Problema
    </button>
  );
}