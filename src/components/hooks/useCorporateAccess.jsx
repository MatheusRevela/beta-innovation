import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Hook central de acesso à corporate.
 * Retorna: { loading, corporate, member, isGestor, hasSuperCRMAccess, corporateId }
 */
export function useCorporateAccess() {
  const [loading, setLoading] = useState(true);
  const [corporate, setCorporate] = useState(null);
  const [member, setMember] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      if (!me) { setLoading(false); return; }

      // 1. Encontrar membership ativa (sort by created_date desc para pegar a mais recente)
      const memberships = await base44.entities.CorporateMember.filter({ email: me.email, status: "active" }, "-created_date");

      if (memberships.length > 0) {
        const mem = memberships[0];
        const corps = await base44.entities.Corporate.filter({ id: mem.corporate_id });
        setMember(mem);
        if (corps.length > 0) setCorporate(corps[0]);
      }
    } catch (_) {
      // silently fail — user sees empty state
    } finally {
      setLoading(false);
    }
  };

  const isGestor = member?.role === "gestor";
  // Bug fix: se não tem membership, NÃO concede acesso ao SuperCRM
  const hasSuperCRMAccess = member != null && member.super_crm_access !== false;
  const corporateId = corporate?.id || null;

  return { loading, corporate, member, isGestor, hasSuperCRMAccess, corporateId, reload: load };
}