import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserPlus, Trash2, Shield, FlaskConical, Briefcase,
  Crown, Eye, X, Loader2, Mail, Users
} from "lucide-react";

export const COLLAB_ROLES = [
  {
    value: "credenciais",
    label: "Credenciais",
    icon: Eye,
    color: "#4B4F4B",
    bg: "#F3F4F3",
    description: "Visualiza toda a área de gestão. Sem permissão para modificações."
  },
  {
    value: "scouting",
    label: "Scouting",
    icon: FlaskConical,
    color: "#6B2FA0",
    bg: "#F5EEFF",
    description: "Acesso total ao Laboratório e gestão de Startups."
  },
  {
    value: "gestor_projetos",
    label: "Gestor de Projetos",
    icon: Briefcase,
    color: "#2C4425",
    bg: "#EAF2E9",
    description: "Modifica Corporates e gerencia projetos ativos no CRM."
  },
  {
    value: "gestor_master",
    label: "Gestor Master",
    icon: Crown,
    color: "#E10867",
    bg: "#FCE7EF",
    description: "Acesso completo à plataforma, equivalente ao administrador."
  },
];

function InviteModal({ onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("scouting");
  const [loading, setLoading] = useState(false);

  const invite = async () => {
    setLoading(true);
    await base44.users.inviteUser(email, "admin");
    // Store pending role assignment to apply after user accepts invite
    const pending = JSON.parse(localStorage.getItem("pending_collab_roles") || "{}");
    pending[email.toLowerCase()] = selectedRole;
    localStorage.setItem("pending_collab_roles", JSON.stringify(pending));
    setLoading(false);
    onInvited();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#ECEEEA" }}>
          <h3 className="font-bold text-lg" style={{ color: "#111111" }}>Convidar Colaborador</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: "#4B4F4B" }}>E-mail *</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colaborador@email.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-2" style={{ color: "#4B4F4B" }}>Credencial *</label>
            <div className="space-y-2">
              {COLLAB_ROLES.map(r => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSelectedRole(r.value)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all"
                    style={{
                      background: isSelected ? r.bg : "#FAFAFA",
                      borderColor: isSelected ? r.color : "#ECEEEA"
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: isSelected ? "white" : "#ECEEEA" }}>
                      <Icon className="w-4 h-4" style={{ color: r.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: r.color }}>{r.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>{r.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "#ECEEEA" }}>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            onClick={invite}
            disabled={!email || loading}
            className="text-white gap-1.5"
            style={{ background: "#E10867", border: "none" }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Convidando…</>
              : <><Mail className="w-4 h-4" /> Enviar Convite</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Colaboradores() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    const [all, me] = await Promise.all([
      base44.entities.User.list(),
      base44.auth.me()
    ]);
    setUsers(all.filter(u => u.role === "admin"));
    setCurrentUser(me);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId, newRole) => {
    setUpdating(userId);
    await base44.entities.User.update(userId, { collaborator_role: newRole });
    await load();
    setUpdating(null);
  };

  const removeAccess = async (userId) => {
    if (!confirm("Remover acesso à área de gestão? O usuário perderá todas as permissões de colaborador.")) return;
    setUpdating(userId);
    await base44.entities.User.update(userId, { role: "user", collaborator_role: null });
    await load();
    setUpdating(null);
  };

  const getRoleConfig = (u) => {
    if (u.collaborator_role) return COLLAB_ROLES.find(r => r.value === u.collaborator_role);
    return { value: "admin", label: "Admin", icon: Shield, color: "#E10867", bg: "#FCE7EF" };
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111111" }}>Colaboradores</h1>
          <p className="text-sm mt-1" style={{ color: "#4B4F4B" }}>
            Gerencie sua equipe de gestão e as credenciais de acesso de cada colaborador.
          </p>
        </div>
        <Button
          onClick={() => setShowInvite(true)}
          className="text-white gap-2"
          style={{ background: "#E10867", border: "none" }}
        >
          <UserPlus className="w-4 h-4" /> Convidar Colaborador
        </Button>
      </div>

      {/* Role legend cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {COLLAB_ROLES.map(r => {
          const Icon = r.icon;
          const count = users.filter(u => u.collaborator_role === r.value).length;
          return (
            <div key={r.value} className="rounded-xl p-4 border"
              style={{ background: r.bg, borderColor: r.color + "33" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white">
                  <Icon className="w-4 h-4" style={{ color: r.color }} />
                </div>
                <span className="font-semibold text-sm" style={{ color: r.color }}>{r.label}</span>
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: "#4B4F4B" }}>{r.description}</p>
              <p className="text-xs font-bold" style={{ color: r.color }}>
                {count} pessoa{count !== 1 ? "s" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#ECEEEA" }}>
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#ECEEEA" }}>
          <Users className="w-4 h-4 text-gray-400" />
          <h2 className="font-semibold text-sm" style={{ color: "#111111" }}>
            Equipe de Gestão ({users.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#E10867" }} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium" style={{ color: "#4B4F4B" }}>Nenhum colaborador ainda</p>
            <p className="text-xs mt-1" style={{ color: "#A7ADA7" }}>Convide alguém para sua equipe de gestão</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#A7ADA7" }}>Colaborador</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: "#A7ADA7" }}>Credencial</th>
                <th className="text-left px-5 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: "#A7ADA7" }}>Membro desde</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const rc = getRoleConfig(u);
                const Icon = rc?.icon || Shield;
                const isMe = u.id === currentUser?.id;
                const isOwner = !u.collaborator_role;

                return (
                  <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#ECEEEA" }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "#E10867" }}>
                          <span className="text-white text-xs font-bold">
                            {(u.full_name || u.email || "U")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: "#111111" }}>{u.full_name || "–"}</p>
                          <p className="text-xs" style={{ color: "#A7ADA7" }}>{u.email}</p>
                        </div>
                        {isMe && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                            você
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {!isOwner && !isMe ? (
                        <select
                          value={u.collaborator_role || ""}
                          onChange={e => changeRole(u.id, e.target.value)}
                          disabled={updating === u.id}
                          className="border rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer"
                          style={{
                            borderColor: (rc?.color || "#A7ADA7") + "66",
                            color: rc?.color || "#4B4F4B",
                            background: rc?.bg || "#F3F4F3"
                          }}
                        >
                          {COLLAB_ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: rc?.bg || "#FCE7EF", color: rc?.color || "#E10867" }}>
                          <Icon className="w-3 h-3" />
                          {rc?.label || "Admin"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs" style={{ color: "#A7ADA7" }}>
                        {u.created_date ? new Date(u.created_date).toLocaleDateString("pt-BR") : "–"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {!isOwner && !isMe && (
                        <button
                          onClick={() => removeAccess(u.id)}
                          disabled={updating === u.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                          title="Remover acesso"
                        >
                          {updating === u.id
                            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            : <Trash2 className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvited={load} />}
    </div>
  );
}