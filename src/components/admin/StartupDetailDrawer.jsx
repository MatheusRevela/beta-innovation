import { StatusDot } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { X, Edit, ExternalLink, Power, PowerOff } from "lucide-react";
import AIEnrichmentPanel from "@/components/admin/AIEnrichmentPanel";

export default function StartupDetailDrawer({ startup, onClose, onEdit, onToggleActive }) {
  if (!startup) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#ECEEEA' }}>
          <h2 className="font-bold text-lg" style={{ color: '#111111' }}>Detalhes da Startup</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-5">
            {startup.logo_url ? (
              <img src={startup.logo_url} className="w-14 h-14 rounded-xl object-contain border" />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: '#fce7ef', color: '#E10867' }}>
                {startup.name?.[0]}
              </div>
            )}
            <div>
              <h3 className="font-bold text-base" style={{ color: '#111111' }}>{startup.name}</h3>
              <p className="text-sm" style={{ color: '#4B4F4B' }}>{startup.category}{startup.vertical ? ` · ${startup.vertical}` : ""}</p>
              <StatusDot active={startup.is_active !== false} />
            </div>
          </div>

          {startup.description && (
            <p className="text-sm mb-5 leading-relaxed" style={{ color: '#4B4F4B' }}>{startup.description}</p>
          )}

          {/* Details */}
          <div className="space-y-2 mb-5">
            {[
              ["Modelo", startup.business_model],
              ["Estágio", startup.stage],
              ["Faixa de preço", startup.price_range],
              ["Localização", [startup.state, startup.country].filter(Boolean).join(", ")],
              ["E-mail", startup.contact_email],
              ["WhatsApp", startup.contact_whatsapp],
              ["Enriquecimento IA", startup.ai_enriched ? "✓ Enriquecida" : "Pendente"],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm py-1.5 border-b"
                style={{ borderColor: '#ECEEEA' }}>
                <span style={{ color: '#4B4F4B' }}>{label}</span>
                <span className="font-medium text-right" style={{ color: '#111111' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {startup.tags?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {startup.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-xs"
                    style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {startup.notes && (
            <div className="p-3 rounded-xl mb-5" style={{ background: '#ECEEEA' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4B4F4B' }}>Notas internas</p>
              <p className="text-sm" style={{ color: '#4B4F4B' }}>{startup.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {startup.website && (
              <a href={startup.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border w-full"
                style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                <ExternalLink className="w-4 h-4" /> Visitar site
              </a>
            )}
            <Button variant="outline" className="w-full" onClick={() => onEdit(startup)}
              style={{ borderColor: '#A7ADA7' }}>
              <Edit className="w-4 h-4 mr-2" /> Editar startup
            </Button>
            <Button variant="outline" className="w-full"
              onClick={() => onToggleActive(startup, startup.is_active === false)}
              style={{ borderColor: startup.is_active !== false ? '#A7ADA7' : '#2C4425', color: startup.is_active !== false ? '#4B4F4B' : '#2C4425' }}>
              {startup.is_active !== false
                ? <><PowerOff className="w-4 h-4 mr-2" /> Desativar</>
                : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}