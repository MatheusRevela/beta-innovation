import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Retorna as permissões do colaborador logado.
 * collaborator_role ausente = admin puro = acesso total.
 *
 * Regras:
 *  credenciais   → somente visualização (isReadOnly)
 *  scouting      → Lab + StartupManagement com edição plena
 *  gestor_projetos → CorporateManagement + CRM com edição plena
 *  gestor_master  → tudo, igual ao admin puro
 */
export function useCollabRole() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u ?? null));
  }, []);

  const loaded = user !== undefined;
  const collabRole = user?.collaborator_role ?? null;
  // role=admin da plataforma sempre tem acesso total, independente de collaborator_role
  const isPlatformAdmin = user?.role === "admin";
  const isFullAdmin = isPlatformAdmin || !collabRole || collabRole === "gestor_master";

  const isReadOnly          = collabRole === "credenciais";
  const canManageStartups   = isFullAdmin || collabRole === "scouting";
  const canManageLab        = isFullAdmin || collabRole === "scouting";
  const canManageCorporates = isFullAdmin || collabRole === "gestor_projetos";
  const canManageCRM        = isFullAdmin || collabRole === "gestor_projetos";
  const canManageColabs     = isFullAdmin;

  return {
    collabRole, loaded,
    isReadOnly,
    canManageStartups,
    canManageLab,
    canManageCorporates,
    canManageCRM,
    canManageColabs,
  };
}