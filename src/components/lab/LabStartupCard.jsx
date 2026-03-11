import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, CheckCircle2, Rocket, ExternalLink, Tag, AlertTriangle, RefreshCw, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const confidenceColor = (c) => {
  if (c >= 80) return "#2C4425";
  if (c >= 60) return "#6B2FA0";
  return "#E10867";
};

export default function LabStartupCard({ lab, onEnriched, onPromoted }) {
  const [enriching, setEnriching] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const isEnriched = lab.status === "enriched" || lab.ai_enriched;
  const isPromoted = lab.status === "promoted";

  const runEnrichment = async () => {
    setEnriching(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de inovação especialista em ecossistema de startups.
Analise a startup "${lab.name}" e gere um enriquecimento completo dos dados.
${lab.website ? `Site oficial: ${lab.website}.` : ""}
${lab.description ? `Descrição existente: ${lab.description}.` : ""}

Retorne:
- description: resumo executivo claro e direto de 2-3 frases sobre o que a startup faz e qual problema resolve
- category: categoria principal (ex: HealthTech, FinTech, AgTech, EdTech, CleanTech, LogTech, HRTech, LegalTech, RetailTech, PropTech, etc.)
- vertical: vertical específica dentro da categoria (ex: "Telemedicina", "Open Banking", "Precision Agriculture")
- business_model: um de ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"]
- stage: um de ["Ideação", "MVP", "PMF", "Scale", "Growth"]
- tags: array de PELO MENOS 15 palavras-chave relevantes para matching com corporações
- keywords: array de 3-5 problemas que a startup resolve (frases curtas)
- target_customers: quem são os clientes ideais (1 frase)
- value_proposition: proposta de valor central (1 frase objetiva)
- enrichment_confidence: número 0-100 indicando confiança do enriquecimento`,
      add_context_from_internet: !!lab.website,
      response_json_schema: {
        type: "object",
        properties: {
          description: { type: "string" },
          category: { type: "string" },
          vertical: { type: "string" },
          business_model: { type: "string" },
          stage: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          keywords: { type: "array", items: { type: "string" } },
          target_customers: { type: "string" },
          value_proposition: { type: "string" },
          enrichment_confidence: { type: "number" }
        }
      }
    });

    await base44.entities.LabStartup.update(lab.id, {
      ...res,
      ai_enriched: true,
      ai_enriched_at: new Date().toISOString(),
      status: "enriched"
    });

    setResult(res);
    setExpanded(true);
    setEnriching(false);
    onEnriched?.({ ...lab, ...res, ai_enriched: true, status: "enriched" });
  };

  const promote = async () => {
    setPromoting(true);
    const data = result || lab;
    const newStartup = await base44.entities.Startup.create({
      name: lab.name,
      website: lab.website,
      description: data.description || lab.description,
      category: data.category || lab.category,
      vertical: data.vertical || lab.vertical,
      business_model: data.business_model || lab.business_model,
      stage: data.stage || lab.stage,
      tags: data.tags || lab.tags || [],
      keywords: data.keywords,
      value_proposition: data.value_proposition,
      target_customers: data.target_customers,
      ai_enriched: lab.ai_enriched || !!result,
      ai_enriched_at: lab.ai_enriched_at,
      enrichment_status: lab.ai_enriched || result ? "done" : "pending",
      is_active: true,
      is_deleted: false
    });

    await base44.entities.LabStartup.update(lab.id, {
      status: "promoted",
      promoted_startup_id: newStartup.id,
      promoted_at: new Date().toISOString()
    });

    setPromoting(false);
    onPromoted?.({ ...lab, status: "promoted", promoted_startup_id: newStartup.id });
  };

  if (isPromoted) {
    return (
      <div className="bg-white rounded-2xl border p-4 flex items-center gap-3 opacity-60" style={{ borderColor: "#A7ADA7" }}>
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#2C4425" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#111111" }}>{lab.name}</p>
          <p className="text-xs" style={{ color: "#4B4F4B" }}>Promovida para a base de Startups</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#ECEEEA", color: "#4B4F4B" }}>Promovida</span>
      </div>
    );
  }

  const displayData = result || (isEnriched ? lab : null);

  return (
    <div className="bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md" style={{ borderColor: "#A7ADA7" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#ECEEEA" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: "#fce7ef", color: "#E10867" }}>
          {lab.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: "#111111" }}>{lab.name}</p>
          {lab.website && (
            <a href={lab.website} target="_blank" rel="noreferrer"
              className="text-xs flex items-center gap-1 hover:underline truncate"
              style={{ color: "#4B4F4B" }}>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              {lab.website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
        {/* Status badge */}
        {isEnriched && !result && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{ background: "#F3EEF8", color: "#6B2FA0" }}>✦ Enriquecida</span>
        )}
        {result && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
            style={{ background: "#d1fae5", color: "#065f46" }}>✓ Nova análise</span>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Description */}
        {(displayData?.description || lab.description) && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#4B4F4B" }}>
            {displayData?.description || lab.description}
          </p>
        )}

        {/* Enriched data preview */}
        {displayData && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {displayData.category && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: "#fce7ef", color: "#E10867" }}>{displayData.category}</span>
              )}
              {displayData.business_model && (
                <span className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "#ECEEEA", color: "#4B4F4B" }}>{displayData.business_model}</span>
              )}
              {displayData.stage && (
                <span className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "#ECEEEA", color: "#4B4F4B" }}>{displayData.stage}</span>
              )}
            </div>

            {/* Confidence bar */}
            {displayData.enrichment_confidence != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#4B4F4B" }}>Confiança IA</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: "#ECEEEA" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${displayData.enrichment_confidence}%`, background: confidenceColor(displayData.enrichment_confidence) }} />
                </div>
                <span className="text-xs font-bold" style={{ color: confidenceColor(displayData.enrichment_confidence) }}>
                  {displayData.enrichment_confidence}%
                </span>
              </div>
            )}

            {/* Expandable details */}
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs" style={{ color: "#6B2FA0" }}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Ocultar detalhes" : "Ver detalhes"}
            </button>

            {expanded && (
              <div className="space-y-2 pt-1">
                {displayData.value_proposition && (
                  <div className="p-2.5 rounded-xl" style={{ background: "#fce7ef" }}>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: "#E10867" }}>Proposta de valor</p>
                    <p className="text-xs" style={{ color: "#111111" }}>{displayData.value_proposition}</p>
                  </div>
                )}
                {displayData.tags?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#4B4F4B" }}>
                      <Tag className="w-3 h-3" /> Tags ({displayData.tags.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {displayData.tags.slice(0, 12).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: "#ECEEEA", color: "#4B4F4B" }}>#{t}</span>
                      ))}
                      {displayData.tags.length > 12 && (
                        <span className="text-xs" style={{ color: "#A7ADA7" }}>+{displayData.tags.length - 12}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* No enrichment yet */}
        {!displayData && !enriching && (
          <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#FEF3C7" }}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#92400E" }} />
            <p className="text-xs" style={{ color: "#92400E" }}>Ainda não enriquecida pela IA</p>
          </div>
        )}

        {enriching && (
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "#F3EEF8" }}>
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: "#6B2FA0" }} />
            <p className="text-xs font-medium" style={{ color: "#6B2FA0" }}>
              {lab.website ? "Buscando dados no site e na web…" : "Analisando com IA…"}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: "#ECEEEA" }}>
        <Button
          size="sm"
          variant="outline"
          onClick={runEnrichment}
          disabled={enriching || promoting}
          className="flex-1 gap-1.5 text-xs h-8">
          {enriching
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Analisando…</>
            : isEnriched || result
            ? <><RefreshCw className="w-3 h-3" /> Re-analisar</>
            : <><Sparkles className="w-3 h-3" /> Enriquecer com IA</>
          }
        </Button>
        <Button
          size="sm"
          onClick={promote}
          disabled={promoting || enriching}
          className="flex-1 gap-1.5 text-xs h-8 text-white"
          style={{ background: "#2C4425", border: "none" }}>
          {promoting
            ? <><Loader2 className="w-3 h-3 animate-spin" /> Promovendo…</>
            : <><Rocket className="w-3 h-3" /> Promover para Startups</>
          }
        </Button>
      </div>
    </div>
  );
}