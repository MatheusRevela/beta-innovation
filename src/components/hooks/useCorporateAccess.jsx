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

    // 2. Fallback: gestor que criou a corporate via onboarding antigo (contact_email ou created_by)
    const [corpsByEmail, corpsByCreator] = await Promise.all([
      base44.entities.Corporate.filter({ contact_email: me.email }),
      base44.entities.Corporate.filter({ created_by: me.email }),
    ]);
    const allCorps = [...corpsByEmail, ...corpsByCreator];
    const seen = new Set();
    const unique = allCorps.filter(c => seen.has(c.id) ? false : seen.add(c.id));

    if (unique.length > 0) {
      const corp = unique[0];
      // Criar membership de gestor automaticamente para migração
      const existingMem = await base44.entities.CorporateMember.filter({ corporate_id: corp.id, email: me.email });
      let mem;
      if (existingMem.length === 0) {
        mem = await base44.entities.CorporateMember.create({
          corporate_id: corp.id,
          email: me.email,
          role: "gestor",
          super_crm_access: true,
          status: "active"
        });
      } else {
        mem = existingMem[0];
      }
      setCorporate(corp);
      setMember(mem);
    }

    setLoading(false);
  };

  const isGestor = member?.role === "gestor";
  const hasSuperCRMAccess = member?.super_crm_access !== false;
  const corporateId = corporate?.id || null;

  return { loading, corporate, member, isGestor, hasSuperCRMAccess, corporateId, reload: load };
}