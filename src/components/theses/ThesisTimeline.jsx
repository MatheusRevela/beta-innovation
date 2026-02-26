import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lightbulb, Map, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThesisTimeline({ theses, onSelect, selectedIds, onGoToRadar }) {
  if (theses.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border p-5 mb-6" style={{ borderColor: '#ECEEEA' }}>
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#4B4F4B' }}>
        Evolução das Teses
      </p>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background: '#ECEEEA' }} />
        <div className="space-y-4">
          {theses.map((t, idx) => {
            const isSelected = selectedIds.includes(t.id);
            const isLatest = idx === 0;
            return (
              <div key={t.id} className="flex items-start gap-4 relative">
                {/* Dot */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all"
                  style={{
                    background: isSelected ? '#E10867' : isLatest ? '#fce7ef' : '#fff',
                    borderColor: isSelected ? '#E10867' : isLatest ? '#E10867' : '#A7ADA7'
                  }}>
                  <Lightbulb className="w-3.5 h-3.5"
                    style={{ color: isSelected ? '#fff' : '#E10867' }} />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {isLatest && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full mr-2"
                          style={{ background: '#E10867', color: '#fff' }}>MAIS RECENTE</span>
                      )}
                      <span className="text-xs font-semibold" style={{ color: '#111111' }}>
                        Tese #{t.id?.slice(-6)}
                      </span>
                      <span className="text-xs ml-2" style={{ color: '#A7ADA7' }}>
                        {format(new Date(t.created_date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onSelect(t.id)}
                        className="px-2 py-0.5 rounded-lg text-xs border font-medium transition-all"
                        style={{
                          borderColor: isSelected ? '#6B2FA0' : '#A7ADA7',
                          background: isSelected ? '#F3EEF8' : 'transparent',
                          color: isSelected ? '#6B2FA0' : '#4B4F4B'
                        }}>
                        {isSelected ? <><Check className="w-3 h-3 inline mr-0.5" />Selecionada</> : "Comparar"}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: '#4B4F4B' }}>
                    {t.thesis_text?.split("\n")[0]?.substring(0, 120)}…
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(t.macro_categories || []).slice(0, 3).map(c => (
                      <span key={c} className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fce7ef', color: '#E10867' }}>{c}</span>
                    ))}
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