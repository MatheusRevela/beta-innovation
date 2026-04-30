import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UserCheck, Search, Loader2, CheckCircle2, XCircle,
  ExternalLink, ChevronDown, ChevronUp, Clock
} from "lucide-react";

export default function StartupPendingApproval() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("pending");
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.LabStartup.filter({ source: "self_register" }, "-created_date", 200);
    setLabs(data);
    setLoading(false);
  };

  const approve = async (lab) => {
    if (!confirm(`Aprovar "${lab.name}" e enviar para a base de Startups?`)) return;
    setActioningId(lab.id);
    try {
      const newStartup = await base44.entities.Startup.create({
        name: lab.name,
        website: lab.website,
        description: lab.description,
        category: lab.category,
        vertical: lab.vertical,
        business_model: lab.business_model,
        stage: lab.stage,
        state: lab.state,
        contact_email: lab.contact_email,
        founding_year: lab.founding_year,
        tags: lab.tags || [],
        keywords: lab.keywords,
        value_proposition: lab.value_proposition,
        target_customers: lab.target_customers,
        logo_url: lab.logo_url,
        cnpj: lab.cnpj,
        is_active: false,
        is_deleted: false,
        source: "self_register",
        ai_enriched: lab.ai_enriched || false,
        enrichment_status: "pending",
      });

      if (lab.registered_by_email) {
        await base44.entities.StartupUser.create({
          startup_id: newStartup.id,
          user_email: lab.registered_by_email,
          user_name: lab.registered_by_name || lab.registered_by_email,
          role: "admin_startup",
          status: "ativo",
          invited_at: new Date().toISOString(),
          activated_at: new Date().toISOString(),
        });
      }

      await base44.entities.LabStartup.update(lab.id, {
        status: "promoted",
        promoted_startup_id: newStartup.id,
        promoted_at: new Date().toISOString(),
      });

      setLabs(prev => prev.map(l => l.id === lab.id
        ? { ...l, status: "promoted", promoted_startup_id: newStartup.id }
        : l
      ));
    } finally {
      setActioningId(null);
    }
  };

  const reject = async (lab) => {
    if (!confirm(`Rejeitar o cadastro de "${lab.name}"?`)) return;
    setActioningId(lab.id);
    await base44.entities.LabStartup.update(lab.id, { status: "rejected" });
    setLabs(prev => prev.map(l => l.id === lab.id ? { ...l, status: "rejected" } : l));
    setActioningId(null);
  };

  const TABS = [
    { id: "pending", label: "Aguardando aprovação" },
    { id: "promoted", label: "Aprovadas" },
    { id: "rejected", label: "Rejeitadas" },
  ];

  const counts = {
    pending: labs.filter(l => l.status === "pending").length,
    promoted: labs.filter(l => l.status === "promoted").length,
    rejected: labs.filter(l => l.status === "rejected").length,
  };

  const filtered = labs
    .filter(l => l.status === tab)
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        (l.contact_email || "").toLowerCase().includes(q) ||
        (l.category || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#2C4425" }}>
          <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#111111" }}>Aprovação de Startups</h1>
          <p className="text-sm" style={{ color: "#4B4F4B" }}>
            Startups cadastradas pela plataforma aguardando aprovação para a base oficial
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Aguardando", value: counts.pending, color: "#E10867", bg: "#fce7ef" },
          { label: "Aprovadas", value: counts.promoted, color: "#2C4425", bg: "#e8f0e6" },
          { label: "Rejeitadas", value: counts.rejected, color: "#6B2FA0", bg: "#F3EEF8" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#A7ADA7" }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#A7ADA7" }} />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar pelo nome, email ou categoria…" className="pl-9" />
        </div>
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                background: tab === t.id ? "#1E0B2E" : "#fff",
                borderColor: tab === t.id ? "#1E0B2E" : "#A7ADA7",
                color: tab === t.id ? "#fff" : "#4B4F4B"
              }}>
              {t.label} {counts[t.id] > 0 && `(${counts[t.id]})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#E10867" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border" style={{ borderColor: "#A7ADA7" }}>
          <div className="text-5xl mb-4">
            {tab === "pending" ? "🕐" : tab === "promoted" ? "✅" : "❌"}
          </div>
          <p className="font-semibold text-lg mb-1" style={{ color: "#111111" }}>
            {tab === "pending" ? "Nenhuma startup aguardando aprovação"
              : tab === "promoted" ? "Nenhuma startup aprovada ainda"
              : "Nenhuma startup rejeitada"}
          </p>
          <p className="text-sm" style={{ color: "#4B4F4B" }}>
            {tab === "pending" ? "Quando startups se cadastrarem pela plataforma, aparecerão aqui." : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(lab => (
            <StartupApprovalCard
              key={lab.id}
              lab={lab}
              tab={tab}
              actioning={actioningId === lab.id}
              onApprove={() => approve(lab)}
              onReject={() => reject(lab)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StartupApprovalCard({ lab, tab, actioning, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#A7ADA7" }}>
      <div className="flex items-start gap-4 p-5">
        <div className="flex-shrink-0">
          {lab.logo_url ? (
            <img src={lab.logo_url} alt={lab.name}
              className="w-14 h-14 rounded-xl object-contain border" style={{ borderColor: "#ECEEEA" }} />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl"
              style={{ background: "#fce7ef", color: "#E10867" }}>
              {lab.name?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-base" style={{ color: "#111111" }}>{lab.name}</h3>
              {lab.registered_by_email && (
                <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>
                  Cadastrado por: <span className="font-medium">{lab.registered_by_name || lab.registered_by_email}</span>
                  {" — "}{lab.registered_by_email}
                </p>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" style={{ color: "#A7ADA7" }} />
                <span className="text-xs" style={{ color: "#A7ADA7" }}>
                  {new Date(lab.created_date).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
            {tab === "promoted" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{ background: "#e8f0e6", color: "#2C4425" }}>✓ Aprovada</span>
            )}
            {tab === "rejected" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0"
                style={{ background: "#fce7ef", color: "#E10867" }}>✗ Rejeitada</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {lab.category && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "#fce7ef", color: "#E10867" }}>{lab.category}</span>
            )}
            {lab.business_model && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: "#ECEEEA", color: "#4B4F4B" }}>{lab.business_model}</span>
            )}
            {lab.stage && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: "#ECEEEA", color: "#4B4F4B" }}>{lab.stage}</span>
            )}
            {lab.state && (
              <span className="px-2 py-0.5 rounded-full text-xs"
                style={{ background: "#ECEEEA", color: "#4B4F4B" }}>📍 {lab.state}</span>
            )}
          </div>

          {lab.description && (
            <p className="text-sm mt-2 line-clamp-2" style={{ color: "#4B4F4B" }}>{lab.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {lab.website && (
              <a href={lab.website} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ color: "#1E0B2E" }}>
                <ExternalLink className="w-3 h-3" /> {lab.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {lab.contact_email && (
              <span className="text-xs" style={{ color: "#4B4F4B" }}>✉ {lab.contact_email}</span>
            )}
            {lab.cnpj && (
              <span className="text-xs" style={{ color: "#4B4F4B" }}>CNPJ: {lab.cnpj}</span>
            )}
          </div>

          {lab.tags?.length > 0 && (
            <button onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs mt-2" style={{ color: "#6B2FA0" }}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Ocultar tags" : `Ver ${lab.tags.length} tags`}
            </button>
          )}
          {expanded && lab.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lab.tags.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: "#ECEEEA", color: "#4B4F4B" }}>#{t}</span>
              ))}
            </div>
          )}
        </div>

        {tab === "pending" && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button size="sm" onClick={onApprove} disabled={actioning}
              className="gap-1.5 text-white text-xs h-8 w-32"
              style={{ background: "#2C4425", border: "none" }}>
              {actioning
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><CheckCircle2 className="w-3 h-3" /> Aprovar</>
              }
            </Button>
            <Button size="sm" variant="outline" onClick={onReject} disabled={actioning}
              className="gap-1.5 text-xs h-8 w-32"
              style={{ borderColor: "#E10867", color: "#E10867" }}>
              <XCircle className="w-3 h-3" /> Rejeitar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}