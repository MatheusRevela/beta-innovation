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
    const me = await base44.auth.me();
    if (!me) { setLoading(false); return; }

    // 1. Encontrar membership ativa
    const memberships = await base44.entities.CorporateMember.filter({ email: me.email, status: "active" });

    if (memberships.length > 0) {
      const mem = memberships[0];
      const corps = await base44.entities.Corporate.filter({ id: mem.corporate_id });
      setMember(mem);
      if (corps.length > 0) setCorporate(corps[0]);
      setLoading(false);
      return;
    }

    // Issue #5 — Fallback removido: criação automática de membership foi movida para Onboarding.
    // Usuários sem membership ativa simplesmente não têm acesso a uma corporate.
    setLoading(false);
  };

  const isGestor = member?.role === "gestor";
  const hasSuperCRMAccess = member?.super_crm_access !== false;
  const corporateId = corporate?.id || null;

  return { loading, corporate, member, isGestor, hasSuperCRMAccess, corporateId, reload: load };
}