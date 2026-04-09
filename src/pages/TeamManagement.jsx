import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users, Plus, Loader2, Trash2, Shield, User,
  Eye, EyeOff, Check, X, Clock
} from "lucide-react";

export default function TeamManagement() {
  const { loading: accessLoading, corporate, member, isGestor } = useCorporateAccess();
  const [members, setMembers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("usuario");
  const [inviting, setInviting] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!accessLoading && corporate) loadMembers();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporate]);

  const loadMembers = async () => {
    setLoading(true);
    const all = await base44.entities.CorporateMember.filter({ corporate_id: corporate.id });
    setMembers(all.filter(m => m.status === "active"));
    setPendingRequests(all.filter(m => m.status === "pending"));
    setLoading(false);
  };

  const invite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setInviting(true);
    // Check if already member (normalize case on both sides)
    const existing = members.find(m => m.email?.toLowerCase() === email) ||
      pendingRequests.find(m => m.email?.toLowerCase() === email);
    if (!existing) {
      // Use inviteUser to send email notification, then create CorporateMember as active
      const newMember = await base44.entities.CorporateMember.create({
        corporate_id: corporate.id,
        email,
        role: inviteRole,
        super_crm_access: true,
        status: "active",
        invited_by: member?.email
      });
      // Send platform invite so user gets email notification
      base44.users.inviteUser(email, "user").catch(() => {}); // best-effort
      setMembers(prev => [...prev, newMember]);
    }
    setInviteEmail("");
    setInviting(false);
  };

  const toggleSuperCRM = async (mem) => {
    setSavingId(mem.id);
    const updated = await base44.entities.CorporateMember.update(mem.id, {
      super_crm_access: !mem.super_crm_access
    });
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSavingId(null);
  };

  const changeRole = async (mem, role) => {
    setSavingId(mem.id);
    const updated = await base44.entities.CorporateMember.update(mem.id, { role });
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSavingId(null);
  };

  const removeMember = async (mem) => {
    await base44.entities.CorporateMember.delete(mem.id);
    setMembers(prev => prev.filter(m => m.id !== mem.id));
  };

  const approveRequest = async (req) => {
    setSavingId(req.id);
    const updated = await base44.entities.CorporateMember.update(req.id, { status: "active" });
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    setMembers(prev => [...prev, updated]);
    setSavingId(null);
  };

  const rejectRequest = async (req) => {
    await base44.entities.CorporateMember.update(req.id, { status: "rejected" });
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
  };

  if (accessLoading || loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  if (!isGestor) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
        <Shield className="w-7 h-7" style={{ color: '#E10867' }} />
      </div>
      <h2 className="font-bold text-lg mb-2">Acesso restrito</h2>
      <p className="text-sm" style={{ color: '#4B4F4B' }}>Somente o gestor da empresa pode gerenciar membros.</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fce7ef' }}>
          <Users className="w-5 h-5" style={{ color: '#E10867' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Gestão de Equipe</h1>
          <p className="text-sm" style={{ color: '#4B4F4B' }}>{corporate?.company_name || corporate?.trade_name}</p>
        </div>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#fed7aa', background: '#fff7ed' }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" style={{ color: '#ea580c' }} />
            <h2 className="font-semibold text-sm" style={{ color: '#9a3412' }}>
              {pendingRequests.length} solicitação(ões) de vinculação pendentes
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between gap-3 bg-white rounded-xl p-3 border" style={{ borderColor: '#fed7aa' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: '#fce7ef', color: '#E10867' }}>
                    {req.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{req.email}</p>
                    <p className="text-xs" style={{ color: '#4B4F4B' }}>Quer se vincular como {req.role}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => approveRequest(req)} disabled={savingId === req.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                    style={{ background: '#2C4425' }}>
                    <Check className="w-3.5 h-3.5" /> Aprovar
                  </button>
                  <button onClick={() => rejectRequest(req)} disabled={savingId === req.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{ borderColor: '#A7ADA7', color: '#4B4F4B' }}>
                    <X className="w-3.5 h-3.5" /> Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite new member */}
      <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#A7ADA7' }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>Convidar novo membro</h2>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@empresa.com"
            type="email"
            className="flex-1 min-w-48"
            onKeyDown={e => e.key === "Enter" && invite()}
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: '#A7ADA7' }}>
            <option value="usuario">Usuário</option>
            <option value="gestor">Gestor</option>
          </select>
          <Button onClick={invite} disabled={inviting || !inviteEmail.trim()}
            className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
            {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </Button>
        </div>
        <p className="text-xs mt-2" style={{ color: '#A7ADA7' }}>
          Usuários com mesmo domínio de email da empresa podem solicitar vinculação automaticamente.
        </p>
      </div>

      {/* Members list */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#A7ADA7' }}>
        <h2 className="font-semibold text-sm mb-4" style={{ color: '#111111' }}>
          Membros ativos ({members.length})
        </h2>
        <div className="space-y-3">
          {members.map(mem => {
            const isCurrentUser = mem.email === member?.email;
            return (
              <div key={mem.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: '#ECEEEA' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: mem.role === "gestor" ? '#fce7ef' : '#ECEEEA', color: mem.role === "gestor" ? '#E10867' : '#4B4F4B' }}>
                  {mem.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: '#111111' }}>{mem.email}</p>
                    {isCurrentUser && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>você</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: mem.role === "gestor" ? '#fce7ef' : '#f3e8ff', color: mem.role === "gestor" ? '#E10867' : '#6B2FA0' }}>
                      {mem.role === "gestor" ? "🛡 Gestor" : "👤 Usuário"}
                    </span>
                    <span className="text-xs flex items-center gap-0.5"
                      style={{ color: mem.super_crm_access !== false ? '#2C4425' : '#A7ADA7' }}>
                      {mem.super_crm_access !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      SuperCRM
                    </span>
                  </div>
                </div>
                {!isCurrentUser && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Toggle SuperCRM */}
                    <button
                      onClick={() => toggleSuperCRM(mem)}
                      disabled={savingId === mem.id}
                      title={mem.super_crm_access !== false ? "Revogar acesso ao SuperCRM" : "Liberar acesso ao SuperCRM"}
                      className="p-1.5 rounded-lg border transition-all hover:bg-gray-50"
                      style={{ borderColor: '#ECEEEA' }}>
                      {savingId === mem.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                        mem.super_crm_access !== false ? <Eye className="w-3.5 h-3.5" style={{ color: '#2C4425' }} /> : <EyeOff className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />}
                    </button>
                    {/* Toggle role */}
                    <button
                      onClick={() => changeRole(mem, mem.role === "gestor" ? "usuario" : "gestor")}
                      disabled={savingId === mem.id}
                      title={mem.role === "gestor" ? "Rebaixar para usuário" : "Promover a gestor"}
                      className="p-1.5 rounded-lg border transition-all hover:bg-gray-50"
                      style={{ borderColor: '#ECEEEA' }}>
                      {mem.role === "gestor" ? <User className="w-3.5 h-3.5" style={{ color: '#6B2FA0' }} /> : <Shield className="w-3.5 h-3.5" style={{ color: '#E10867' }} />}
                    </button>
                    {/* Remove */}
                    <button
                      onClick={() => removeMember(mem)}
                      className="p-1.5 rounded-lg border transition-all hover:bg-red-50"
                      style={{ borderColor: '#ECEEEA' }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: '#A7ADA7' }}>
              Nenhum membro ainda. Convide alguém acima.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}