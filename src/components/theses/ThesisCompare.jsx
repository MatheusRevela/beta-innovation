import { X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function TagCloud({ items, color, bg }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(items || []).map(item => (
        <span key={item} className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: bg, color }}>{item}</span>
      ))}
      {(!items || items.length === 0) && (
        <span className="text-xs" style={{ color: '#A7ADA7' }}>—</span>
      )}
    </div>
  );
}

export default function ThesisCompare({ theses, onClose }) {
  if (theses.length < 2) return null;

  const rows = [
    { label: "Data", render: t => format(new Date(t.created_date), "dd/MM/yyyy", { locale: ptBR }) },
    { label: "Macrocategorias", render: t => <TagCloud items={t.macro_categories} color="#E10867" bg="#fce7ef" /> },
    { label: "Top Prioridades", render: t => <TagCloud items={t.top_priorities} color="#3B145A" bg="#F3EEF8" /> },
    { label: "Setores", render: t => <TagCloud items={t.sectors} color="#1e3a4c" bg="#B4D1D7" /> },
    { label: "Tags", render: t => <TagCloud items={t.tags?.slice(0, 8)} color="#4B4F4B" bg="#ECEEEA" /> },
    { label: "Matching", render: t => (
      <span className="text-xs font-semibold" style={{ color: t.matching_ran ? '#2C4425' : '#A7ADA7' }}>
        {t.matching_ran ? "✓ Realizado" : "Pendente"}
      </span>
    )},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <h2 className="font-bold text-lg" style={{ color: '#111111' }}>
            Comparação de Teses ({theses.length})
          </h2>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#ECEEEA' }}>
                <th className="text-left p-3 font-semibold text-xs w-32" style={{ color: '#4B4F4B' }}>Campo</th>
                {theses.map((t, i) => (
                  <th key={t.id} className="text-left p-3 font-semibold text-xs" style={{ color: '#111111' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: i === 0 ? '#E10867' : '#6B2FA0' }}>
                        {i + 1}
                      </div>
                      Tese #{t.id?.slice(-6)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label} className="border-b" style={{ borderColor: '#ECEEEA' }}>
                  <td className="p-3 font-semibold text-xs align-top" style={{ color: '#4B4F4B' }}>
                    {row.label}
                  </td>
                  {theses.map(t => (
                    <td key={t.id} className="p-3 align-top">
                      {row.render(t)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3 font-semibold text-xs align-top" style={{ color: '#4B4F4B' }}>Resumo</td>
                {theses.map(t => (
                  <td key={t.id} className="p-3 align-top">
                    <p className="text-xs line-clamp-4" style={{ color: '#4B4F4B' }}>
                      {t.thesis_text?.split("\n")[0]}
                    </p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}