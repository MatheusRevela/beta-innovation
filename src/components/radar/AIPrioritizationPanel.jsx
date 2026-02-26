import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, X, ChevronDown, ChevronUp } from "lucide-react";

const STAGES = ["Ideação", "MVP", "PMF", "Scale", "Growth"];
const BUSINESS_MODELS = ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"];
const PRICE_RANGES = ["Gratuito", "Até R$10k/ano", "R$10k–R$50k/ano", "R$50k–R$200k/ano", "Acima de R$200k/ano"];
const INVESTMENT_TYPES = ["PoC", "PDI", "Investimento", "Parceria", "Acompanhamento"];

export default function AIPrioritizationPanel({ thesis, matches, startups, onPrioritized }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [criteria, setCriteria] = useState({
    stages: [],
    business_models: [],
    price_ranges: [],
    investment_type: "",
    extra_context: "",
  });

  const toggleItem = (key, value) => {
    setCriteria(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value]
    }));
  };

  const runPrioritization = async () => {
    setLoading(true);
    const startupSummaries = matches.slice(0, 30).map(m => {
      const s = startups[m.startup_id];
      if (!s) return null;
      return `ID:${m.id} | Startup:${s.name} | Fit atual:${m.fit_score} | Estágio:${s.stage || "N/A"} | Modelo:${s.business_model || "N/A"} | Preço:${s.price_range || "N/A"} | Categoria:${s.category || ""} | Tags:${(s.tags || []).join(",")}`;
    }).filter(Boolean).join("\n");

    const criteriaText = [
      criteria.stages.length ? `Estágio preferido: ${criteria.stages.join(", ")}` : null,
      criteria.business_models.length ? `Modelo de negócio: ${criteria.business_models.join(", ")}` : null,
      criteria.price_ranges.length ? `Faixa de investimento: ${criteria.price_ranges.join(", ")}` : null,
      criteria.investment_type ? `Tipo de engajamento desejado: ${criteria.investment_type}` : null,
      criteria.extra_context ? `Contexto adicional: ${criteria.extra_context}` : null,
    ].filter(Boolean).join("\n");

    const prompt = `Você é um especialista em inovação aberta. Re-priorize as startups abaixo com base nos critérios definidos pelo usuário.

TESE DE INOVAÇÃO:
${thesis.thesis_text?.split("\n")[0]}
Macrocategorias: ${(thesis.macro_categories || []).join(", ")}

CRITÉRIOS DE PRIORIZAÇÃO DO USUÁRIO:
${criteriaText || "Sem critérios específicos — use apenas a tese como guia."}

STARTUPS COM FIT ATUAL:
${startupSummaries}

Retorne um novo ranking ajustado com score de prioridade (0-100) para cada startup, levando em conta os critérios do usuário + aderência à tese.

JSON:
{
  "ranked": [
    { "match_id": "string", "priority_score": number, "priority_reason": "string (1 linha)" }
  ]
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
                priority_reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    const priorityMap = {};
    (result?.ranked || []).forEach(r => {
      priorityMap[r.match_id] = { score: r.priority_score, reason: r.priority_reason };
    });

    onPrioritized(priorityMap);
    setLoading(false);
    setOpen(false);
  };

  const hasAnyCriteria = criteria.stages.length > 0 || criteria.business_models.length > 0 ||
    criteria.price_ranges.length > 0 || criteria.investment_type || criteria.extra_context;

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all"
        style={{
          background: open ? '#1E0B2E' : '#fff',
          borderColor: open ? '#1E0B2E' : '#A7ADA7',
          color: open ? '#fff' : '#111111'
        }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: open ? '#fce7ef' : '#E10867' }} />
          <span className="font-semibold text-sm">Priorização por IA</span>
          {hasAnyCriteria && !open && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fce7ef', color: '#E10867' }}>
              Critérios ativos
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-2 bg-white border rounded-2xl p-5 space-y-5" style={{ borderColor: '#ECEEEA' }}>
          <p className="text-xs" style={{ color: '#4B4F4B' }}>
            Defina critérios para a IA re-priorizar as startups do radar com base nos seus objetivos específicos.
          </p>

          {/* Estágio */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#111111' }}>Estágio da startup</p>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(s => (
                <button key={s} onClick={() => toggleItem("stages", s)}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={{
                    background: criteria.stages.includes(s) ? '#1E0B2E' : '#fff',
                    borderColor: criteria.stages.includes(s) ? '#1E0B2E' : '#A7ADA7',
                    color: criteria.stages.includes(s) ? '#fff' : '#4B4F4B'
                  }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Modelo de negócio */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#111111' }}>Modelo de negócio</p>
            <div className="flex flex-wrap gap-1.5">
              {BUSINESS_MODELS.map(m => (
                <button key={m} onClick={() => toggleItem("business_models", m)}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={{
                    background: criteria.business_models.includes(m) ? '#6B2FA0' : '#fff',
                    borderColor: criteria.business_models.includes(m) ? '#6B2FA0' : '#A7ADA7',
                    color: criteria.business_models.includes(m) ? '#fff' : '#4B4F4B'
                  }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Faixa de investimento */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#111111' }}>Faixa de investimento</p>
            <div className="flex flex-wrap gap-1.5">
              {PRICE_RANGES.map(p => (
                <button key={p} onClick={() => toggleItem("price_ranges", p)}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={{
                    background: criteria.price_ranges.includes(p) ? '#2C4425' : '#fff',
                    borderColor: criteria.price_ranges.includes(p) ? '#2C4425' : '#A7ADA7',
                    color: criteria.price_ranges.includes(p) ? '#fff' : '#4B4F4B'
                  }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Tipo de engajamento */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#111111' }}>Tipo de engajamento desejado</p>
            <div className="flex flex-wrap gap-1.5">
              {INVESTMENT_TYPES.map(t => (
                <button key={t} onClick={() => setCriteria(p => ({ ...p, investment_type: p.investment_type === t ? "" : t }))}
                  className="px-2.5 py-1 rounded-full text-xs border transition-all"
                  style={{
                    background: criteria.investment_type === t ? '#E10867' : '#fff',
                    borderColor: criteria.investment_type === t ? '#E10867' : '#A7ADA7',
                    color: criteria.investment_type === t ? '#fff' : '#4B4F4B'
                  }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Contexto livre */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: '#111111' }}>Contexto adicional (opcional)</p>
            <textarea
              value={criteria.extra_context}
              onChange={e => setCriteria(p => ({ ...p, extra_context: e.target.value }))}
              placeholder="Ex: Precisamos de uma solução já validada com clientes enterprise no Brasil…"
              rows={2}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none resize-none"
              style={{ borderColor: '#A7ADA7' }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={runPrioritization} disabled={loading}
              className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Priorizando…" : "Priorizar com IA"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}