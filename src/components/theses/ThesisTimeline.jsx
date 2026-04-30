import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lightbulb, Check, CheckCircle2, Clock } from "lucide-react";

export default function ThesisTimeline({ theses, onSelect, selectedIds, onGoToRadar }) {
  if (!theses || theses.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#ECEEEA' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B4F4B' }}>
          Evolução das Teses
        </p>
        <p className="text-xs" style={{ color: '#A7ADA7' }}>
          {theses.length} tese{theses.length > 1 ? 's' : ''}
        </p>
      </div>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5" style={{ background: '#ECEEEA' }} />
        <div className="space-y-3">
          {theses.map((t, idx) => {
            const isSelected = selectedIds.includes(t.id);
            const isLatest = idx === 0;
            const thesisName = t.name ||
              (t.macro_categories?.length > 0 ? t.macro_categories[0] : null) ||
              format(new Date(t.created_date), "'Tese de' MMM yyyy", { locale: ptBR });

            return (
              <div key={t.id} className="flex items-start gap-3 relative">
                {/* Dot */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all cursor-pointer"
                  style={{
                    background: isSelected ? '#6B2FA0' : isLatest ? '#fce7ef' : '#fff',
                    borderColor: isSelected ? '#6B2FA0' : isLatest ? '#E10867' : '#A7ADA7'
                  }}
                  onClick={() => onSelect(t.id)}
                  title={isSelected ? "Remover seleção" : "Selecionar para comparar"}>
                  <Lightbulb className="w-3.5 h-3.5"
                    style={{ color: isSelected ? '#fff' : '#E10867' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isLatest && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
                            style={{ background: '#E10867' }}>Recente</span>
                        )}
                        <span className="text-xs font-semibold truncate" style={{ color: '#111111' }}>
                          {thesisName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: '#A7ADA7' }}>
                          {format(new Date(t.created_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <span className="text-xs flex items-center gap-0.5"
                          style={{ color: t.matching_ran ? '#2C4425' : '#A7ADA7' }}>
                          {t.matching_ran
                            ? <><CheckCircle2 className="w-3 h-3" /> Matching</>
                            : <><Clock className="w-3 h-3" /> Pendente</>
                          }
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onSelect(t.id)}
                      className="px-2 py-0.5 rounded-lg text-xs border font-medium transition-all flex-shrink-0"
                      style={{
                        borderColor: isSelected ? '#6B2FA0' : '#A7ADA7',
                        background: isSelected ? '#f3e8ff' : 'transparent',
                        color: isSelected ? '#6B2FA0' : '#4B4F4B'
                      }}>
                      {isSelected ? <span className="flex items-center gap-0.5"><Check className="w-3 h-3 inline" />Selecionada</span> : "Comparar"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(t.macro_categories || []).slice(0, 3).map(c => (
                      <span key={c} className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
                    ))}
                    {(t.macro_categories || []).length > 3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
                        +{t.macro_categories.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}