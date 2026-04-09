import { X, ExternalLink } from "lucide-react";

const ScoreBar = ({ value, color = "#E10867" }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value || 0}%`, background: color }}
      />
    </div>
    <span className="text-xs font-bold w-7 text-right" style={{ color: "#111111" }}>
      {Math.round(value || 0)}
    </span>
  </div>
);

const Row = ({ label, children, accent }) => (
  <div className={`grid border-b last:border-0`} style={{ gridTemplateColumns: "140px repeat(3, 1fr)", borderColor: "#ECEEEA" }}>
    <div
      className="py-3 px-3 text-xs font-semibold flex items-start"
      style={{ color: "#4B4F4B", background: accent ? "#F9F9F8" : "#fff" }}
    >
      {label}
    </div>
    {children}
  </div>
);

const Cell = ({ children, accent }) => (
  <div
    className="py-3 px-3 text-xs border-l flex flex-col gap-1"
    style={{ borderColor: "#ECEEEA", background: accent ? "#F9F9F8" : "#fff" }}
  >
    {children}
  </div>
);

export default function StartupComparePanel({ items, onClose, onOpenCrm }) {
  const cols = items.slice(0, 3);
  const empty = Array(3 - cols.length).fill(null);

  const allCols = [...cols, ...empty];

  const HeaderCell = ({ item }) => {
    if (!item) return <div className="py-4 px-3 border-l" style={{ borderColor: "#ECEEEA" }} />;
    const { match, startup } = item;
    return (
      <div className="py-4 px-3 border-l flex flex-col items-center text-center gap-2" style={{ borderColor: "#ECEEEA" }}>
        {startup.logo_url ? (
          <img src={startup.logo_url} alt={startup.name} className="w-10 h-10 rounded-xl object-contain border bg-gray-50" />
        ) : (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "#fce7ef", color: "#E10867" }}>
            {startup.name?.[0]}
          </div>
        )}
        <p className="font-bold text-sm leading-tight" style={{ color: "#111111" }}>{startup.name}</p>
        <p className="text-xs" style={{ color: "#4B4F4B" }}>{startup.category || startup.vertical || ""}</p>
        {startup.website && (
          <a href={startup.website} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs underline" style={{ color: "#E10867" }}>
            <ExternalLink className="w-3 h-3" /> Site
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#ECEEEA" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "#111111" }}>Comparativo de Startups</h2>
            <p className="text-xs" style={{ color: "#4B4F4B" }}>Análise lado a lado de até 3 startups selecionadas</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" style={{ color: "#A7ADA7" }} />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <div className="min-w-full">
            {/* Sticky column headers */}
            <div className="grid sticky top-0 z-10 border-b"
              style={{ gridTemplateColumns: "140px repeat(3, 1fr)", borderColor: "#ECEEEA", background: "#fff" }}>
              <div className="py-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Critério</div>
              {allCols.map((item, i) => <HeaderCell key={i} item={item} />)}
            </div>

            {/* Fit Score Total */}
            <Row label="🎯 Fit Score Total" accent>
              {allCols.map((item, i) => (
                <Cell key={i} accent>
                  {item ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-2xl font-black" style={{ color: "#E10867" }}>
                        {Math.round(item.match.fit_score || 0)}
                      </span>
                      <ScoreBar value={item.match.fit_score} color="#E10867" />
                    </div>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Score Tags */}
            <Row label="🏷️ Tags (50%)">
              {allCols.map((item, i) => (
                <Cell key={i}>
                  {item ? (
                    <div className="flex flex-col gap-1">
                      <ScoreBar value={item.match.score_tags} color="#6B2FA0" />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(item.match.tags_matched || []).slice(0, 4).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: "#F3EEF8", color: "#6B2FA0" }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Score Modelo */}
            <Row label="💼 Modelo de Neg. (30%)" accent>
              {allCols.map((item, i) => (
                <Cell key={i} accent>
                  {item ? (
                    <div className="flex flex-col gap-1">
                      <ScoreBar value={item.match.score_modelo} color="#2C4425" />
                      <span className="text-xs font-medium mt-1" style={{ color: "#111111" }}>
                        {item.startup.business_model || "—"}
                      </span>
                    </div>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Score Impacto */}
            <Row label="⚡ Impacto Tec. (20%)">
              {allCols.map((item, i) => (
                <Cell key={i}>
                  {item ? (
                    <ScoreBar value={item.match.score_impacto} color="#B4D1D7" />
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Estágio */}
            <Row label="📈 Estágio" accent>
              {allCols.map((item, i) => (
                <Cell key={i} accent>
                  {item ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: "#ECEEEA", color: "#4B4F4B" }}>
                      {item.startup.stage || "—"}
                    </span>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Localização */}
            <Row label="📍 Localização">
              {allCols.map((item, i) => (
                <Cell key={i}>
                  {item ? (
                    <span style={{ color: "#4B4F4B" }}>
                      {[item.startup.state, item.startup.country].filter(Boolean).join(", ") || "—"}
                    </span>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Preço */}
            <Row label="💰 Faixa de Preço" accent>
              {allCols.map((item, i) => (
                <Cell key={i} accent>
                  {item ? (
                    <span style={{ color: "#4B4F4B" }}>{item.startup.price_range || "—"}</span>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Pontos Fortes */}
            <Row label="✅ Pontos Fortes">
              {allCols.map((item, i) => (
                <Cell key={i}>
                  {item ? (
                    <ul className="space-y-1">
                      {(item.match.fit_reasons || []).slice(0, 3).map((r, j) => (
                        <li key={j} className="text-xs leading-snug" style={{ color: "#2C4425" }}>• {r}</li>
                      ))}
                      {!(item.match.fit_reasons?.length) && <li className="text-xs" style={{ color: "#A7ADA7" }}>—</li>}
                    </ul>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Riscos */}
            <Row label="⚠️ Pontos de Atenção" accent>
              {allCols.map((item, i) => (
                <Cell key={i} accent>
                  {item ? (
                    <ul className="space-y-1">
                      {(item.match.risk_reasons || []).slice(0, 3).map((r, j) => (
                        <li key={j} className="text-xs leading-snug" style={{ color: "#E10867" }}>• {r}</li>
                      ))}
                      {!(item.match.risk_reasons?.length) && <li className="text-xs" style={{ color: "#A7ADA7" }}>—</li>}
                    </ul>
                  ) : <span className="text-gray-200">—</span>}
                </Cell>
              ))}
            </Row>

            {/* Ações */}
            <Row label="Ações">
              {allCols.map((item, i) => (
                <Cell key={i}>
                  {item ? (
                    <button
                      onClick={() => onOpenCrm(item.match)}
                      disabled={item.match.added_to_crm}
                      className="w-full text-xs px-2 py-1.5 rounded-lg font-medium transition-all"
                      style={{
                        background: item.match.added_to_crm ? "#ECEEEA" : "#E10867",
                        color: item.match.added_to_crm ? "#A7ADA7" : "#fff"
                      }}>
                      {item.match.added_to_crm ? "✓ No CRM" : "+ Enviar ao CRM"}
                    </button>
                  ) : null}
                </Cell>
              ))}
            </Row>
          </div>
        </div>
      </div>
    </div>
  );
}