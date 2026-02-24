import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle } from "lucide-react";

export default function DuplicatesModal({ onClose }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(null);

  useEffect(() => {
    findDuplicates();
  }, []);

  const findDuplicates = async () => {
    setLoading(true);
    const all = await base44.entities.Startup.filter({ is_deleted: false });
    const seen = {};
    const duplicateGroups = [];
    all.forEach(s => {
      const key = s.name?.toLowerCase().trim();
      if (!key) return;
      if (!seen[key]) seen[key] = [];
      seen[key].push(s);
    });
    Object.values(seen).forEach(group => {
      if (group.length > 1) duplicateGroups.push(group);
    });
    setGroups(duplicateGroups);
    setLoading(false);
  };

  const markDuplicate = async (startup, keepId) => {
    setMerging(startup.id);
    await base44.entities.Startup.update(startup.id, {
      is_duplicate: true,
      duplicate_of: keepId,
      is_deleted: true,
      deleted_at: new Date().toISOString()
    });
    await findDuplicates();
    setMerging(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" style={{ color: '#E10867' }} />
            <h2 className="font-bold text-lg" style={{ color: '#111111' }}>Detecção de Duplicatas</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">✅</div>
              <p className="font-semibold" style={{ color: '#111111' }}>Nenhuma duplicata encontrada!</p>
              <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>Todos os nomes de startups são únicos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm mb-4" style={{ color: '#4B4F4B' }}>
                {groups.length} grupo{groups.length > 1 ? "s" : ""} de possíveis duplicatas encontrado{groups.length > 1 ? "s" : ""}.
                Clique em "Manter" para definir o registro principal e marcar os outros como duplicatas.
              </p>
              {groups.map((group, gi) => (
                <div key={gi} className="border rounded-xl p-4" style={{ borderColor: '#A7ADA7' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: '#E10867' }}>
                    Grupo: "{group[0].name}"
                  </p>
                  <div className="space-y-2">
                    {group.map(startup => (
                      <div key={startup.id} className="flex items-center justify-between p-2.5 rounded-lg"
                        style={{ background: '#ECEEEA' }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: '#111111' }}>{startup.name}</p>
                          <p className="text-xs" style={{ color: '#4B4F4B' }}>
                            {startup.category || "—"} · {new Date(startup.created_date).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {group.map(other => other.id !== startup.id && (
                            <Button key={other.id} size="sm"
                              onClick={() => markDuplicate(startup, other.id)}
                              disabled={merging === startup.id}
                              variant="outline" style={{ borderColor: '#E10867', color: '#E10867' }}>
                              {merging === startup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "É duplicata"}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: '#ECEEEA' }}>
          <Button onClick={onClose} variant="outline">Fechar</Button>
        </div>
      </div>
    </div>
  );
}