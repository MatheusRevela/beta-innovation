import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";
import { FitScoreBadge } from "@/components/shared/StatusBadge";

const STAGES = ["Ideação", "MVP", "PMF", "Scale", "Growth"];
const SECTORS = ["AgriTech", "HealthTech", "FinTech", "EdTech", "CleanTech", "LogTech", "HRTech", "RetailTech", "PropTech", "LegalTech", "Segurança", "IA & Dados", "IoT", "Indústria 4.0", "Outro"];
const PRICE_RANGES = ["Gratuito", "Até R$10k/ano", "R$10k–R$50k/ano", "R$50k–R$200k/ano", "Acima de R$200k/ano"];

export default function AIPrioritizationPanel({ thesis, matches, startups, onResultsReady }) {
  const [open, setOpen] = useState(false);
  const [stages, setStages] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [priceRanges, setPriceRanges] = useState([]);
  const [customPriority, setCustomPriority] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const toggle = (arr, setArr, val) =>
    setArr(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  const runPrioritization = async () => {
    setLoading(true);
    const matchSummaries = matches.map(m => {
      const s = startups[m.startup_id];
      return `ID:${m.id} | Startup:${s?.name || ""} | Estágio:${s?.stage || ""} | Categoria:${s?.category || ""} | Tags:${(s?.tags || []).join(",")} | FitScore:${m.fit_score} | PreçoRange:${s?.price_range || ""}`;
    }).join("\n");

    const prompt = `Você é um especialista em inovação aberta e venture scouting.

TESE DE INOVAÇÃO:
${thesis.thesis_text}
Macrocategorias: ${(thesis.macro_categories || []).join(", ")}
Prioridades: ${(thesis.top_priorities || []).join(", ")}

CRITÉRIOS DE PRIORIZAÇÃO DEFINIDOS PELO USUÁRIO:
- Estágios preferidos: ${stages.length > 0 ? stages.join(", ") : "Todos"}
- Setores de interesse: ${sectors.length > 0 ? sectors.join(", ") : "Todos"}
- Faixas de investimento aceitáveis: ${priceRanges.length > 0 ? priceRanges.join(", ") : "Todas"}
- Critério adicional: ${customPriority || "Nenhum"}

STARTUPS DISPONÍVEIS NO RADAR:
${matchSummaries}

Com base nos critérios do usuário, priorize e rankeie as TOP 10 startups. Para cada uma, explique em 1 frase por que ela é a escolha certa dado os critérios.

Responda em JSON:
{
  "ranked": [
    {
      "match_id": "string",
      "priority_score": number (0-100, levando em conta fit_score + critérios do usuário),
      "reason": "string (1 frase explicando a priorização)"
    }
  ],
  "summary": "string (2-3 frases sobre o resultado da priorização)"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          ranked: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match_id: { type: "string" },
                priority_score: { type: "number" },
                reason: { type: "string" }
              }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    setResults(result);
    onResultsReady(result.ranked);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border mb-6 overflow-hidden" style={{ borderColor: '#6B2FA0' }}>
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#6B2FA0' }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm" style={{ color: '#111111' }}>Priorização Inteligente por IA</p>
          <p className="text-xs" style={{ color: '#4B4F4B' }}>Defina critérios e a IA re-rankeia as startups do radar</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#A7ADA7' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#A7ADA7' }} />}
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4" style={{ borderColor: '#ECEEEA' }}>
          {/* Criteria */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Estágio preferido</p>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(s => (
                <button key={s} onClick={() => toggle(stages, setStages, s)}
                  className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all"
                  style={{
                    borderColor: stages.includes(s) ? '#6B2FA0' : '#A7ADA7',
                    background: stages.includes(s) ? '#6B2FA0' : 'transparent',
                    color: stages.includes(s) ? '#fff' : '#4B4F4B'
                  }}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Setor de interesse</p>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map(s => (
                <button key={s} onClick={() => toggle(sectors, setSectors, s)}
                  className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all"
                  style={{
                    borderColor: sectors.includes(s) ? '#E10867' : '#A7ADA7',
                    background: sectors.includes(s) ? '#fce7ef' : 'transparent',
                    color: sectors.includes(s) ? '#E10867' : '#4B4F4B'
                  }}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#4B4F4B' }}>Faixa de investimento</p>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_RANGES.map(p => (
                <button key={p} onClick={() => toggle(priceRanges, setPriceRanges, p)}
                  className="px-2.5 py-1 rounded-full text-xs border font-medium transition-all"
                  style={{
                    borderColor: priceRanges.includes(p) ? '#2C4425' : '#A7ADA7',
                    background: priceRanges.includes(p) ? '#2C4425' : 'transparent',
                    color: priceRanges.includes(p) ? '#fff' : '#4B4F4B'
                  }}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#4B4F4B' }}>Critério adicional (texto livre)</p>
            <input
              value={customPriority}
              onChange={e => setCustomPriority(e.target.value)}
              placeholder="Ex: prefiro startups com produto pronto para pilotar em 30 dias…"
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none"
              style={{ borderColor: '#A7ADA7' }}
            />
          </div>

          <Button onClick={runPrioritization} disabled={loading || matches.length === 0}
            className="w-full text-white gap-2" style={{ background: '#6B2FA0', border: 'none' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "IA analisando critérios…" : "Priorizar com IA"}
          </Button>

          {/* Results summary */}
          {results?.summary && (
            <div className="p-3 rounded-xl text-sm" style={{ background: '#F3EEF8', color: '#3B145A' }}>
              <p className="font-semibold text-xs mb-1" style={{ color: '#6B2FA0' }}>Análise da IA</p>
              {results.summary}
            </div>
          )}

          {/* Ranked list preview */}
          {results?.ranked?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: '#4B4F4B' }}>Top {results.ranked.length} priorizadas</p>
              {results.ranked.slice(0, 5).map((r, idx) => {
                const m = matches.find(x => x.id === r.match_id);
                const s = m ? startups[m.startup_id] : null;
                if (!s) return null;
                return (
                  <div key={r.match_id} className="flex items-start gap-2.5 p-2.5 rounded-xl border"
                    style={{ borderColor: '#ECEEEA', background: '#fafafa' }}>
                    <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: '#6B2FA0', color: '#fff' }}>{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs" style={{ color: '#111111' }}>{s.name}</p>
                        <FitScoreBadge score={r.priority_score} />
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{r.reason}</p>
                    </div>
                  </div>
                );
              })}
              {results.ranked.length > 5 && (
                <p className="text-xs text-center" style={{ color: '#A7ADA7' }}>+{results.ranked.length - 5} mais — veja na lista abaixo</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}