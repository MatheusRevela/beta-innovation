import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  X, Loader2, Wifi, WifiOff, ShieldCheck,
  Mail, CheckCircle2, AlertTriangle, ExternalLink,
  ThumbsUp, ThumbsDown, RotateCcw
} from "lucide-react";

/**
 * Painel lateral de revisão de verificação de uma startup.
 * Permite:
 *   - Ver o resultado da última verificação automática
 *   - Disparar nova verificação individual
 *   - Aprovar (confirmar que está tudo OK) → limpa alerta
 *   - Desativar (problema confirmado) → is_active = false
 *   - Adicionar observações manuais
 */
export default function VerificationDrawer({ startup, onClose, onUpdated }) {
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState(startup.manual_review?.notes || "");
  const [result, setResult] = useState(null);

  const vs = result || startup.verification_status;
  const lastVerified = startup.last_verified_at;

  const runVerification = async () => {
    setVerifying(true);
    setResult(null);
    const res = await base44.functions.invoke('verifyStartup', { startup_id: startup.id });
    setResult(res.data?.result || null);
    setVerifying(false);
    onUpdated();
  };

  const handleApprove = async () => {
    setSaving(true);
    const me = await base44.auth.me();
    await base44.entities.Startup.update(startup.id, {
      verification_alert: false,
      manual_review: {
        reviewed_at: new Date().toISOString(),
        reviewed_by: me.email,
        approved: true,
        notes: notes || "Revisado manualmente — sem problemas identificados."
      }
    });
    setSaving(false);
    onUpdated();
    onClose();
  };

  const handleDeactivate = async () => {
    if (!confirm("Desativar esta startup? Ela deixará de aparecer no Radar e nos matchings.")) return;
    setSaving(true);
    const me = await base44.auth.me();
    await base44.entities.Startup.update(startup.id, {
      is_active: false,
      verification_alert: false,
      manual_review: {
        reviewed_at: new Date().toISOString(),
        reviewed_by: me.email,
        approved: false,
        notes: notes || "Desativada após verificação detectar problema no site."
      }
    });
    setSaving(false);
    onUpdated();
    onClose();
  };

  const formatDate = (iso) => iso ? new Date(iso).toLocaleString("pt-BR") : "—";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#ECEEEA" }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: "#E10867" }} />
            <h2 className="font-bold text-base" style={{ color: "#111111" }}>Verificação de Site</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4" style={{ color: "#4B4F4B" }} />
          </button>
        </div>

        <div className="flex-1 px-5 py-5 space-y-5">
          {/* Startup info */}
          <div className="flex items-center gap-3">
            {startup.logo_url ? (
              <img src={startup.logo_url} className="w-10 h-10 rounded-xl object-contain border" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ background: '#fce7ef', color: '#E10867' }}>
                {startup.name?.[0]}
              </div>
            )}
            <div>
              <p className="font-semibold text-sm" style={{ color: "#111111" }}>{startup.name}</p>
              {startup.website && (
                <a href={startup.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs flex items-center gap-1 hover:underline" style={{ color: "#E10867" }}>
                  {startup.website} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Last verification result */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "#ECEEEA", background: "#FAFAFA" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A7ADA7" }}>
                Última Verificação
              </p>
              <span className="text-xs" style={{ color: "#4B4F4B" }}>
                {lastVerified ? formatDate(lastVerified) : "Nunca verificado"}
              </span>
            </div>

            {vs ? (
              <div className="space-y-2.5">
                <CheckRow
                  icon={vs.site_online ? Wifi : WifiOff}
                  label="Site online"
                  ok={vs.site_online}
                  detail={vs.site_online ? `${vs.response_time_ms}ms` : vs.observations}
                />
                <CheckRow
                  icon={ShieldCheck}
                  label="SSL (HTTPS)"
                  ok={vs.ssl_valid}
                  detail={vs.ssl_valid ? "Certificado válido" : "HTTP sem criptografia"}
                />
                <CheckRow
                  icon={Mail}
                  label="Contato cadastrado"
                  ok={vs.has_contact}
                  detail={vs.has_contact ? "Email ou WhatsApp" : "Nenhum contato"}
                />
                {vs.observations && (
                  <p className="text-xs mt-1 px-2 py-1.5 rounded-lg" style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                    📋 {vs.observations}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "#A7ADA7" }}>
                {verifying ? "Verificando…" : "Nenhuma verificação registrada."}
              </p>
            )}
          </div>

          {/* Manual review history */}
          {startup.manual_review?.reviewed_at && (
            <div className="rounded-2xl border p-4" style={{ borderColor: "#ECEEEA" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#A7ADA7" }}>
                Última Revisão Manual
              </p>
              <div className="flex items-center gap-2 mb-1">
                {startup.manual_review.approved
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#2C4425" }} />
                  : <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#E10867" }} />
                }
                <span className="text-xs font-medium" style={{ color: startup.manual_review.approved ? "#2C4425" : "#E10867" }}>
                  {startup.manual_review.approved ? "Aprovada" : "Desativada"}
                </span>
                <span className="text-xs ml-auto" style={{ color: "#A7ADA7" }}>
                  {formatDate(startup.manual_review.reviewed_at)}
                </span>
              </div>
              <p className="text-xs" style={{ color: "#4B4F4B" }}>
                por {startup.manual_review.reviewed_by}
              </p>
              {startup.manual_review.notes && (
                <p className="text-xs mt-2 italic" style={{ color: "#4B4F4B" }}>
                  "{startup.manual_review.notes}"
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "#4B4F4B" }}>
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Site em manutenção, contato confirmado via LinkedIn…"
              className="w-full rounded-xl border px-3 py-2 text-sm resize-none outline-none focus:ring-1"
              style={{ borderColor: "#A7ADA7" }}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t px-5 py-4 space-y-2" style={{ borderColor: "#ECEEEA" }}>
          {/* Re-verify */}
          <Button
            onClick={runVerification}
            disabled={verifying || saving || !startup.website}
            variant="outline"
            className="w-full gap-2"
            style={{ borderColor: "#A7ADA7" }}
          >
            {verifying
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando…</>
              : <><RotateCcw className="w-4 h-4" /> Verificar Agora</>
            }
          </Button>

          {/* Approve */}
          <Button
            onClick={handleApprove}
            disabled={saving || verifying}
            className="w-full gap-2 text-white"
            style={{ background: "#2C4425", border: "none" }}
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ThumbsUp className="w-4 h-4" />
            }
            Marcar como OK (sem problemas)
          </Button>

          {/* Deactivate */}
          {startup.is_active !== false && (
            <Button
              onClick={handleDeactivate}
              disabled={saving || verifying}
              variant="outline"
              className="w-full gap-2"
              style={{ borderColor: "#E10867", color: "#E10867" }}
            >
              <ThumbsDown className="w-4 h-4" />
              Confirmar problema e desativar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckRow({ icon: Icon, label, ok, detail }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: ok ? "#e8f5e9" : "#fce7ef" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: ok ? "#2C4425" : "#E10867" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: "#111111" }}>{label}</p>
        {detail && <p className="text-xs truncate" style={{ color: "#4B4F4B" }}>{detail}</p>}
      </div>
      <span className="text-xs font-semibold flex-shrink-0"
        style={{ color: ok ? "#2C4425" : "#E10867" }}>
        {ok ? "✓" : "✗"}
      </span>
    </div>
  );
}