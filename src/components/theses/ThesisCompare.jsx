import { X, Map } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

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

const COLUMN_COLORS = ['#E10867', '#6B2FA0', '#2C4425'];

export default function ThesisCompare({ theses, onClose }) {
  if (theses.length < 2) return null;

  const rows = [
    {
      label: "Data de criação",
      render: t => (
        <span className="text-xs text-gray-600">
          {format(new Date(t.created_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
        </span>
      )
    },
    {
      label: "Macrocategorias",
      render: t => <TagCloud items={t.macro_categories} color="#E10867" bg="#fce7ef" />
    },
    {
      label: "Prioridades",
      render: t => (
        <div className="space-y-1">
          {(t.top_priorities || []).map((p, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: '#6B2FA0', fontSize: 9 }}>{i + 1}</span>
              <span className="text-xs" style={{ color: '#4B4F4B' }}>{p}</span>
            </div>
          ))}
          {(!t.top_priorities || t.top_priorities.length === 0) && (
            <span className="text-xs" style={{ color: '#A7ADA7' }}>—</span>
          )}
        </div>
      )
    },
    {
      label: "Setores",
      render: t => <TagCloud items={t.sectors} color="#1e3a4c" bg="#B4D1D7" />
    },
    {
      label: "Tags de Matching",
      render: t => <TagCloud items={t.tags?.slice(0, 10)} color="#4B4F4B" bg="#ECEEEA" />
    },
    {
      label: "Diagnóstico",
      render: t => (
        <span className="text-xs" style={{ color: t.session_id ? '#6B2FA0' : '#A7ADA7' }}>
          {t.session_id ? "✓ Vinculado" : "Sem diagnóstico"}
        </span>
      )
    },
    {
      label: "Matching",
      render: t => (
        <span className="text-xs font-semibold" style={{ color: t.matching_ran ? '#2C4425' : '#A7ADA7' }}>
          {t.matching_ran ? "✓ Realizado" : "Pendente"}
        </span>
      )
    },
    {
      label: "Resumo",
      render: t => (
        <p className="text-xs leading-relaxed line-clamp-4" style={{ color: '#4B4F4B' }}>
          {t.thesis_text?.split("\n")[0] || "—"}
        </p>
      )
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0" style={{ borderColor: '#ECEEEA' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: '#111111' }}>
              Comparação de Teses
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>
              Comparando {theses.length} teses lado a lado
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" style={{ color: '#A7ADA7' }} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ background: '#111111' }}>
                <th className="text-left p-3 text-xs font-semibold w-36 flex-shrink-0"
                  style={{ color: '#A7ADA7' }}>Campo</th>
                {theses.map((t, i) => {
                  const name = t.name ||
                    (t.macro_categories?.length > 0 ? t.macro_categories[0] : null) ||
                    format(new Date(t.created_date), "'Tese de' MMM yyyy", { locale: ptBR });
                  return (
                    <th key={t.id} className="text-left p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: COLUMN_COLORS[i] || '#4B4F4B' }}>
                          {i + 1}
                        </div>
                        <span className="font-semibold truncate max-w-[140px]" style={{ color: '#fff' }}>{name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={row.label}
                  className="border-b"
                  style={{
                    borderColor: '#ECEEEA',
                    background: rowIdx % 2 === 0 ? '#fff' : '#FAFAFA'
                  }}>
                  <td className="p-3 font-semibold text-xs align-top flex-shrink-0" style={{ color: '#4B4F4B' }}>
                    {row.label}
                  </td>
                  {theses.map(t => (
                    <td key={t.id} className="p-3 align-top">
                      {row.render(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end" style={{ borderColor: '#ECEEEA' }}>
          <Button onClick={onClose} variant="outline" style={{ borderColor: '#A7ADA7' }}>Fechar</Button>
        </div>
      </div>
    </div>
  );
}