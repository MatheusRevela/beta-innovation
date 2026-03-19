import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useCollabRole } from "@/components/hooks/useCollabRole";
import PageHeader from "@/components/shared/PageHeader";
import ConfirmDestructiveModal from "@/components/shared/ConfirmDestructiveModal";
import { StatusDot } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Search, Trash2, Loader2, ChevronUp, ChevronDown,
  Edit, Eye, Power, PowerOff, AlertCircle, X, ShieldCheck
} from "lucide-react";
import StartupFormModal from "@/components/admin/StartupFormModal";
import StartupDetailDrawer from "@/components/admin/StartupDetailDrawer";
import DuplicatesModal from "@/components/admin/DuplicatesModal";
import StartupVerificationBadge from "@/components/admin/StartupVerificationBadge";
import VerificationDrawer from "@/components/admin/VerificationDrawer";

const PAGE_SIZE = 50;

const SORT_FIELDS = [
  { key: "name", label: "Nome" },
  { key: "category", label: "Categoria" },
  { key: "quality_score", label: "Qualidade" },
  { key: "created_date", label: "Data cadastro" },
];

export default function StartupManagement() {
  const { isReadOnly, canManageStartups, loaded } = useCollabRole();
  const [startups, setStartups] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filtersKey, setFiltersKey] = useState("sm_filters");
  const [filters, setFilters] = useState({});

  // Issue #12 — Prefixar chave do localStorage com ID do usuário
  useEffect(() => {
    base44.auth.me().then(me => {
      const key = `sm_filters_${me?.id || 'anon'}`;
      setFiltersKey(key);
      try { setFilters(JSON.parse(localStorage.getItem(key) || "{}")); } catch { setFilters({}); }
    });
  }, []);
  const [sort, setSort] = useState({ field: "created_date", dir: "desc" });
  const [showForm, setShowForm] = useState(false);
  const [editStartup, setEditStartup] = useState(null);
  const [viewStartup, setViewStartup] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [duplicatesModal, setDuplicatesModal] = useState(false);
  const [enrichingId, setEnrichingId] = useState(null);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [verificationDrawer, setVerificationDrawer] = useState(null);
  const searchTimeout = useRef(null);

  const persistFilters = (f) => {
    localStorage.setItem(filtersKey, JSON.stringify(f));
    setFilters(f);
  };

  const fetchStartups = useCallback(async (pg = 0, q = search, f = filters, s = sort) => {
    setLoading(true);
    let query = { is_deleted: false };
    if (f.is_active !== undefined && f.is_active !== "") query.is_active = f.is_active === "true";
    if (f.category) query.category = f.category;
    if (f.stage) query.stage = f.stage;
    if (f.business_model) query.business_model = f.business_model;

    const sortStr = `${s.dir === "desc" ? "-" : ""}${s.field}`;
    let all = await base44.entities.Startup.filter(query, sortStr, PAGE_SIZE + PAGE_SIZE * pg);
    if (q) {
      all = all.filter(st =>
        st.name?.toLowerCase().includes(q.toLowerCase()) ||
        st.description?.toLowerCase().includes(q.toLowerCase()) ||
        (st.tags || []).some(t => t.toLowerCase().includes(q.toLowerCase()))
      );
    }
    setTotal(all.length);
    setStartups(all.slice(pg * PAGE_SIZE, (pg + 1) * PAGE_SIZE));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStartups(page, search, filters, sort);
  }, [page, sort]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
      fetchStartups(0, searchInput, filters, sort);
    }, 350);
  }, [searchInput]);

  const handleSort = (field) => {
    const newSort = sort.field === field && sort.dir === "asc"
      ? { field, dir: "desc" }
      : { field, dir: "asc" };
    setSort(newSort);
    setPage(0);
  };

  const handleFilter = (key, val) => {
    const newF = { ...filters, [key]: val };
    if (val === "") delete newF[key];
    persistFilters(newF);
    setPage(0);
    fetchStartups(0, search, newF, sort);
  };

  const clearFilters = () => {
    persistFilters({});
    setSearchInput("");
    setSearch("");
    setPage(0);
    fetchStartups(0, "", {}, sort);
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === startups.length ? [] : startups.map(s => s.id));

  const bulkToggleActive = async (activate) => {
    const user = await base44.auth.me();
    await Promise.all(selected.map(async (id) => {
      await base44.entities.Startup.update(id, { is_active: activate });
      await base44.entities.AuditLog.create({
        action: activate ? "activate" : "deactivate",
        entity_type: "Startup",
        entity_id: id,
        entity_name: startups.find(s => s.id === id)?.name,
        user_email: user?.email
      });
    }));
    setSelected([]);
    fetchStartups(page, search, filters, sort);
  };

  const bulkDelete = async () => {
    setDeletingBulk(true);
    const user = await base44.auth.me();
    for (const id of selected) {
      const s = startups.find(st => st.id === id);
      await base44.entities.Startup.update(id, {
        is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.email
      });
      await base44.entities.AuditLog.create({
        action: "bulk_delete", entity_type: "Startup", entity_id: id,
        entity_name: s?.name, user_email: user?.email, user_role: user?.role
      });
    }
    setSelected([]);
    setDeletingBulk(false);
    setBulkDeleteModal(false);
    fetchStartups(page, search, filters, sort);
  };

  const verifyAll = async () => {
    setVerifyingAll(true);
    const res = await base44.functions.invoke('verifyStartup', { verify_all: true });
    setVerifyingAll(false);
    const { alerts, total } = res.data || {};
    alert(`Verificação concluída: ${total} startups verificadas, ${alerts} com alertas.`);
    fetchStartups(page, search, filters, sort);
  };

  const enrichStartup = async (startup) => {
    if (!startup.website) return;
    setEnrichingId(startup.id);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Pesquise informações sobre a startup "${startup.name}" com site ${startup.website} e retorne dados estruturados. Busque no site e na internet.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          description: { type: "string" },
          category: { type: "string" },
          vertical: { type: "string" },
          business_model: { type: "string", enum: ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"] },
          tags: { type: "array", items: { type: "string" } },
          stage: { type: "string", enum: ["Ideação", "MVP", "PMF", "Scale", "Growth"] },
          state: { type: "string" },
          country: { type: "string" }
        }
      }
    });
    await base44.entities.Startup.update(startup.id, {
      ...res,
      ai_enriched: true,
      ai_enriched_at: new Date().toISOString(),
      enrichment_status: "done"
    });
    setEnrichingId(null);
    fetchStartups(page, search, filters, sort);
  };

  const SortIcon = ({ field }) => {
    if (sort.field !== field) return <ChevronUp className="w-3 h-3 opacity-30" />;
    return sort.dir === "asc"
      ? <ChevronUp className="w-3 h-3" style={{ color: '#E10867' }} />
      : <ChevronDown className="w-3 h-3" style={{ color: '#E10867' }} />;
  };

  const activeFiltersCount = Object.keys(filters).filter(k => filters[k] !== "").length + (search ? 1 : 0);

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      <PageHeader
        title="Gestão de Startups"
        badge={`${total} cadastradas`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {loaded && canManageStartups && (
              <Button variant="outline" onClick={() => setDuplicatesModal(true)} style={{ borderColor: '#A7ADA7' }}>
                <AlertCircle className="w-4 h-4 mr-1.5" /> Duplicatas
              </Button>
            )}
            {loaded && canManageStartups && (
              <Button variant="outline" onClick={verifyAll} disabled={verifyingAll} style={{ borderColor: '#A7ADA7' }}>
                {verifyingAll
                  ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  : <ShieldCheck className="w-4 h-4 mr-1.5" />
                }
                {verifyingAll ? "Verificando…" : "Verificar Todas"}
              </Button>
            )}
            {loaded && canManageStartups && (
              <Button onClick={() => { setEditStartup(null); setShowForm(true); }}
                className="text-white" style={{ background: '#E10867', border: 'none' }}>
                <Plus className="w-4 h-4 mr-1.5" /> Nova Startup
              </Button>
            )}
          </div>
        }
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A7ADA7' }} />
          <Input value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por nome, descrição, tags…" className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filters.is_active ?? ""} onChange={e => handleFilter("is_active", e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" style={{ borderColor: '#A7ADA7' }}>
            <option value="">Todas</option>
            <option value="true">Ativas</option>
            <option value="false">Inativas</option>
          </select>
          <select value={filters.stage ?? ""} onChange={e => handleFilter("stage", e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" style={{ borderColor: '#A7ADA7' }}>
            <option value="">Estágio</option>
            {["Ideação", "MVP", "PMF", "Scale", "Growth"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.business_model ?? ""} onChange={e => handleFilter("business_model", e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm" style={{ borderColor: '#A7ADA7' }}>
            <option value="">Modelo</option>
            {["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border"
              style={{ borderColor: '#E10867', color: '#E10867' }}>
              <X className="w-3.5 h-3.5" /> Limpar ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && loaded && canManageStartups && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl"
          style={{ background: '#fce7ef', border: '1px solid #E10867' }}>
          <span className="text-sm font-semibold" style={{ color: '#E10867' }}>
            {selected.length} selecionada{selected.length > 1 ? "s" : ""}
          </span>
          <Button size="sm" variant="outline" onClick={() => bulkToggleActive(true)} style={{ borderColor: '#2C4425', color: '#2C4425' }}>
            <Power className="w-3.5 h-3.5 mr-1" /> Ativar
          </Button>
          <Button size="sm" variant="outline" onClick={() => bulkToggleActive(false)} style={{ borderColor: '#A7ADA7' }}>
            <PowerOff className="w-3.5 h-3.5 mr-1" /> Desativar
          </Button>
          <Button size="sm" onClick={() => setBulkDeleteModal(true)}
            className="text-white" style={{ background: '#E10867', border: 'none' }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
          </Button>
          <button onClick={() => setSelected([])} className="ml-auto text-xs" style={{ color: '#4B4F4B' }}>Cancelar</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#A7ADA7' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#ECEEEA', borderBottom: `1px solid #A7ADA7` }}>
                {canManageStartups && (
                <th className="p-3 w-10">
                  <Checkbox checked={selected.length === startups.length && startups.length > 0}
                    onCheckedChange={toggleAll} />
                </th>
                )}
                {SORT_FIELDS.map(f => (
                  <th key={f.key} className="p-3 text-left">
                    <button className="flex items-center gap-1 font-semibold text-xs uppercase tracking-wide"
                      style={{ color: '#4B4F4B' }} onClick={() => handleSort(f.key)}>
                      {f.label} <SortIcon field={f.key} />
                    </button>
                  </th>
                ))}
                <th className="p-3 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: '#4B4F4B' }}>Status</th>
                <th className="p-3 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: '#4B4F4B' }}>Verificação</th>
                <th className="p-3 text-left text-xs uppercase tracking-wide font-semibold" style={{ color: '#4B4F4B' }}>Enriquecimento</th>
                <th className="p-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: '#E10867' }} />
                </td></tr>
              )}
              {!loading && startups.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="font-semibold" style={{ color: '#111111' }}>Nenhuma startup encontrada</p>
                  <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>Altere os filtros ou adicione novas startups</p>
                </td></tr>
              )}
              {!loading && startups.map(startup => (
                <tr key={startup.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#ECEEEA' }}>
                  {canManageStartups && (
                  <td className="p-3">
                    <Checkbox checked={selected.includes(startup.id)}
                      onCheckedChange={() => toggleSelect(startup.id)} />
                  </td>
                  )}
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {startup.logo_url ? (
                        <img src={startup.logo_url} className="w-8 h-8 rounded-lg object-contain border" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#fce7ef', color: '#E10867' }}>
                          {startup.name?.[0]}
                        </div>
                      )}
                      <span className="font-medium" style={{ color: '#111111' }}>{startup.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: '#4B4F4B' }}>{startup.category || "—"}</td>
                  <td className="p-3">
                    {startup.quality_score !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ background: '#ECEEEA' }}>
                          <div className="h-full rounded-full" style={{
                            width: `${startup.quality_score}%`,
                            background: startup.quality_score >= 70 ? '#2C4425' : startup.quality_score >= 40 ? '#6B2FA0' : '#E10867'
                          }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: '#4B4F4B' }}>{startup.quality_score}%</span>
                      </div>
                    ) : <span className="text-xs" style={{ color: '#A7ADA7' }}>N/A</span>}
                  </td>
                  <td className="p-3 text-xs" style={{ color: '#4B4F4B' }}>
                    {new Date(startup.created_date).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="p-3"><StatusDot active={startup.is_active !== false} /></td>
                  <td className="p-3">
                    <StartupVerificationBadge
                      startup={startup}
                      onClick={() => setVerificationDrawer(startup)}
                    />
                  </td>
                  <td className="p-3">
                    {startup.ai_enriched
                      ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ECEEEA', color: '#2C4425' }}>✓ Enriquecida</span>
                      : startup.website
                      ? <button onClick={() => enrichStartup(startup)} disabled={enrichingId === startup.id}
                          className="text-xs px-2 py-0.5 rounded-full border transition-all"
                          style={{ borderColor: '#E10867', color: '#E10867' }}>
                          {enrichingId === startup.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Enriquecer"}
                        </button>
                      : <span className="text-xs" style={{ color: '#A7ADA7' }}>Sem site</span>}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewStartup(startup)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Eye className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
                      </button>
                      {canManageStartups && (
                      <button onClick={() => { setEditStartup(startup); setShowForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <Edit className="w-3.5 h-3.5" style={{ color: '#A7ADA7' }} />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: '#ECEEEA' }}>
            <span className="text-xs" style={{ color: '#4B4F4B' }}>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Anterior</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= total}>Próximo</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmDestructiveModal
        open={bulkDeleteModal}
        onClose={() => setBulkDeleteModal(false)}
        onConfirm={bulkDelete}
        loading={deletingBulk}
        title={`Excluir ${selected.length} startup${selected.length > 1 ? "s" : ""}?`}
        description="Esta ação fará exclusão lógica (soft delete). Os registros serão mantidos para auditoria mas não aparecerão mais na plataforma."
        confirmWord="EXCLUIR"
      />

      {showForm && (
        <StartupFormModal
          startup={editStartup}
          onClose={() => { setShowForm(false); setEditStartup(null); }}
          onSaved={() => { setShowForm(false); setEditStartup(null); fetchStartups(page, search, filters, sort); }}
        />
      )}

      {viewStartup && (
        <StartupDetailDrawer
          startup={viewStartup}
          onClose={() => setViewStartup(null)}
          onEdit={(s) => { setViewStartup(null); setEditStartup(s); setShowForm(true); }}
          onToggleActive={async (s, val) => {
            await base44.entities.Startup.update(s.id, { is_active: val });
            setViewStartup({ ...s, is_active: val });
            fetchStartups(page, search, filters, sort);
          }}
        />
      )}

      {duplicatesModal && (
        <DuplicatesModal onClose={() => { setDuplicatesModal(false); fetchStartups(page, search, filters, sort); }} />
      )}

      {verificationDrawer && (
        <VerificationDrawer
          startup={verificationDrawer}
          onClose={() => setVerificationDrawer(null)}
          onUpdated={() => fetchStartups(page, search, filters, sort)}
        />
      )}
    </div>
  );
}