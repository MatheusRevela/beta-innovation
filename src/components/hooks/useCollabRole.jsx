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
  const [collabRole, setCollabRole] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(u => setCollabRole(u?.collaborator_role ?? null));
  }, []);

  const loaded = collabRole !== undefined;
  const isReadOnly      = collabRole === "credenciais";
  const canManageStartups   = !collabRole || collabRole === "scouting"         || collabRole === "gestor_master";
  const canManageLab        = !collabRole || collabRole === "scouting"         || collabRole === "gestor_master";
  const canManageCorporates = !collabRole || collabRole === "gestor_projetos"  || collabRole === "gestor_master";
  const canManageCRM        = !collabRole || collabRole === "gestor_projetos"  || collabRole === "gestor_master";
  const canManageColabs     = !collabRole || collabRole === "gestor_master";

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