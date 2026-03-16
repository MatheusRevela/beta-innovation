import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { PIPELINE_STAGES, STAGE_COLORS, CRM_TYPES } from "@/components/ui/DesignTokens";
import { StageBadge } from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CRMBoard() {
  const [projects, setProjects] = useState([]);
  const [startups, setStartups] = useState({});
  const [corporates, setCorporates] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ps, ss, cs] = await Promise.all([
      base44.entities.CRMProject.list("-created_date", 500),
      base44.entities.Startup.filter({ is_deleted: false }),
      base44.entities.Corporate.list()
    ]);
    setProjects(ps);
    const sm = {}; ss.forEach(s => { sm[s.id] = s; }); setStartups(sm);
    const cm = {}; cs.forEach(c => { cm[c.id] = c; }); setCorporates(cm);
    setLoading(false);
  };

  const filtered = projects.filter(p => {
    if (!search) return true;
    const s = startups[p.startup_id];
    const c = corporates[p.corporate_id];
    return (
      p.project_name?.toLowerCase().includes(search.toLowerCase()) ||
      s?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c?.company_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const stageGroups = {};
  PIPELINE_STAGES.forEach(s => { stageGroups[s] = []; });
  filtered.forEach(p => { if (stageGroups[p.stage]) stageGroups[p.stage].push(p); });

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  return (
    <div className="max-w-full px-4 sm:px-6 py-8">
      <PageHeader title="CRM Board" subtitle="Todos os projetos de inovação" badge={`${projects.length}`} />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A7ADA7' }} />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por projeto, startup, empresa…" className="pl-9" />
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {PIPELINE_STAGES.map(stage => {
            const cols = stageGroups[stage] || [];
            const stageColor = STAGE_COLORS[stage];
            return (
              <div key={stage} className="w-64 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: stageColor }} />
                  <span className="font-semibold text-sm" style={{ color: '#111111' }}>{stage}</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: '#ECEEEA', color: '#4B4F4B' }}>{cols.length}</span>
                </div>
                <div className="space-y-3">
                  {cols.map(proj => {
                    const startup = startups[proj.startup_id];
                    const corp = corporates[proj.corporate_id];
                    const typeObj = CRM_TYPES.find(t => t.value === proj.type);
                    return (
                      <div key={proj.id} className="bg-white rounded-xl border p-3"
                        style={{ borderColor: '#A7ADA7' }}>
                        <div className="flex items-start gap-2 mb-2">
                          {startup?.logo_url ? (
                            <img src={startup.logo_url} className="w-7 h-7 rounded-lg object-contain border" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: '#fce7ef', color: '#E10867' }}>
                              {startup?.name?.[0] || "?"}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="font-medium text-xs truncate" style={{ color: '#111111' }}>{proj.project_name}</p>
                            <p className="text-xs truncate" style={{ color: '#4B4F4B' }}>{startup?.name || "—"}</p>
                          </div>
                        </div>
                        {corp && (
                          <p className="text-xs truncate mb-2" style={{ color: '#A7ADA7' }}>
                            🏢 {corp.trade_name || corp.company_name}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                            {typeObj?.icon} {proj.type === "Custom" ? proj.custom_type_label : proj.type}
                          </span>
                          {proj.fit_score && (
                            <span className="text-xs font-bold" style={{ color: '#E10867' }}>{proj.fit_score}%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {cols.length === 0 && (
                    <div className="text-center py-6 rounded-xl border-2 border-dashed" style={{ borderColor: '#ECEEEA' }}>
                      <p className="text-xs" style={{ color: '#A7ADA7' }}>Sem projetos</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}