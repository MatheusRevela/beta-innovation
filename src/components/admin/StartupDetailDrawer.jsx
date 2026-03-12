import { useState, useEffect } from "react";
import { StatusDot } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { X, Edit, ExternalLink, Power, PowerOff } from "lucide-react";
import AIEnrichmentPanel from "@/components/admin/AIEnrichmentPanel";
import { useCollabRole } from "@/components/hooks/useCollabRole";

export default function StartupDetailDrawer({ startup, onClose, onEdit, onToggleActive }) {
  const { canManageStartups } = useCollabRole();
  const [current, setCurrent] = useState(startup);
  useEffect(() => setCurrent(startup), [startup]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#ECEEEA' }}>
          <h2 className="font-bold text-lg" style={{ color: '#111111' }}>Detalhes da Startup</h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            {current.logo_url ? (
              <img src={current.logo_url} className="w-14 h-14 rounded-xl object-contain border" />
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                style={{ background: '#fce7ef', color: '#E10867' }}>
                {current.name?.[0]}
              </div>
            )}
            <div>
              <h3 className="font-bold text-base" style={{ color: '#111111' }}>{current.name}</h3>
              <p className="text-sm" style={{ color: '#4B4F4B' }}>
                {current.category}{current.vertical ? ` · ${current.vertical}` : ""}
              </p>
              <StatusDot active={current.is_active !== false} />
            </div>
          </div>

          {current.description && (
            <p className="text-sm leading-relaxed" style={{ color: '#4B4F4B' }}>{current.description}</p>
          )}

          {/* Details */}
          <div className="space-y-1">
            {[
              ["Modelo", current.business_model],
              ["Estágio", current.stage],
              ["Faixa de preço", current.price_range],
              ["Localização", [current.state, current.country].filter(Boolean).join(", ")],
              ["E-mail", current.contact_email],
              ["WhatsApp", current.contact_whatsapp],
              ["Enriquecimento IA", current.ai_enriched ? "✓ Enriquecida" : "Pendente"],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm py-1.5 border-b"
                style={{ borderColor: '#ECEEEA' }}>
                <span style={{ color: '#4B4F4B' }}>{label}</span>
                <span className="font-medium text-right" style={{ color: '#111111' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {current.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {current.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-xs"
                    style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {current.notes && (
            <div className="p-3 rounded-xl" style={{ background: '#ECEEEA' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4B4F4B' }}>Notas internas</p>
              <p className="text-sm" style={{ color: '#4B4F4B' }}>{current.notes}</p>
            </div>
          )}

          {/* AI Enrichment Panel */}
          <AIEnrichmentPanel
            startup={current}
            onEnriched={(updated) => setCurrent(updated)}
          />

          {/* Actions */}
          <div className="space-y-2">
            {current.website && (
              <a href={current.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border w-full"
                style={{ borderColor: '#A7ADA7', color: '#111111' }}>
                <ExternalLink className="w-4 h-4" /> Visitar site
              </a>
            )}
            <Button variant="outline" className="w-full" onClick={() => onEdit(current)}
              style={{ borderColor: '#A7ADA7' }}>
              <Edit className="w-4 h-4 mr-2" /> Editar startup
            </Button>
            <Button variant="outline" className="w-full"
              onClick={() => onToggleActive(current, current.is_active === false)}
              style={{
                borderColor: current.is_active !== false ? '#A7ADA7' : '#2C4425',
                color: current.is_active !== false ? '#4B4F4B' : '#2C4425'
              }}>
              {current.is_active !== false
                ? <><PowerOff className="w-4 h-4 mr-2" /> Desativar</>
                : <><Power className="w-4 h-4 mr-2" /> Ativar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}