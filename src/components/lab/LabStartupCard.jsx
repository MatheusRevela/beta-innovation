import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Loader2, CheckCircle2, Rocket, ExternalLink, Tag,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Pencil, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LabEditModal from "./LabEditModal";

const confidenceColor = (c) => {
  if (c >= 80) return "#2C4425";
  if (c >= 60) return "#6B2FA0";
  return "#E10867";
};

export default function LabStartupCard({ lab, onEnriched, onPromoted, onDeleted, selected, onSelect, readOnly = false }) {
  const [enriching, setEnriching] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [localLab, setLocalLab] = useState(lab);

  const isEnriched = localLab.status === "enriched" || localLab.ai_enriched;
  const isPromoted = localLab.status === "promoted";

  const runEnrichment = async () => {
    setEnriching(true);
    setResult(null);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista sênior de inovação especialista no ecossistema de startups brasileiro e global.
Analise a startup "${localLab.name}"${localLab.website ? ` — site oficial: ${localLab.website}` : ""}.
${localLab.description ? `Descrição fornecida: "${localLab.description}"` : ""}
${localLab.category || localLab.business_model ? `Dados já cadastrados: ${JSON.stringify({ category: localLab.category, business_model: localLab.business_model, stage: localLab.stage })}` : ""}

${localLab.website ? "Acesse o site e extraia informações reais: produto/serviço, tecnologia usada, mercado atendido, modelo de negócio, clientes, diferenciais, localização e estágio." : ""}

Retorne TODOS os campos abaixo com base em pesquisa real:
- description: resumo executivo de 2-3 frases sobre o que a startup faz, qual problema resolve e para quem
- category: EXATAMENTE uma de: Agtech, Biotech, Cibersegurança, Comunicação, Construtech, Deeptech, Edtech, Energtech, ESG, Fashiotech, Fintech, Foodtech, Games, Govtech, Greentech, Healthtech, HRtech, IndTech, Insurtech, Legaltech, Logtech, Martech, Midiatech, Mobilidade, Pettech, Proptech, Real Estate, Regtech, Retailtech, Salestech, Security, Sportech, Supply Chain, Traveltech, Web3
- vertical: vertical específica (ex: "Telemedicina", "Open Banking", "Precision Agriculture")
- business_model: EXATAMENTE um de: SaaS, Hardware, Marketplace, Serviço, Plataforma, Outro
- stage: EXATAMENTE um de: Ideação, MVP, PMF, Scale, Growth
- state: estado brasileiro onde a startup opera (sigla, ex: SP, RJ, MG) ou "Internacional" se fora do Brasil
- contact_email: e-mail de contato encontrado no site (se disponível)
- tags: array de PELO MENOS 15 palavras-chave para matching com corporações — inclua: termos técnicos, tecnologias usadas (ex: "machine learning", "IoT"), verticais de mercado, problemas resolvidos, setores atendidos (ex: "agronegócio", "saúde"), tipo de cliente (B2B, B2C, B2B2C), tendências relacionadas (ex: "ESG", "automação") e funcionalidades do produto
- keywords: array de 3-5 frases curtas descrevendo os principais problemas que a startup resolve
- target_customers: quem são os clientes ideais (1 frase objetiva com perfil e setor)
- value_proposition: proposta de valor central em 1 frase direta e impactante
- founding_year: ano de fundação da startup (número inteiro, ex: 2018) se encontrado no site
- enrichment_confidence: número 0-100 indicando confiança geral do enriquecimento`,
      add_context_from_internet: !!localLab.website,
      response_json_schema: {
        type: "object",
        properties: {
          description: { type: "string" },
          category: { type: "string" },
          vertical: { type: "string" },
          business_model: { type: "string" },
          stage: { type: "string" },
          state: { type: "string" },
          contact_email: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          keywords: { type: "array", items: { type: "string" } },
          target_customers: { type: "string" },
          value_proposition: { type: "string" },
          enrichment_confidence: { type: "number" },
          founding_year: { type: "number" }
        }
      }
    });

    // Save same fields as Startup entity + lab-specific display fields
    const safeRes = {
      description: res.description,
      category: res.category,
      vertical: res.vertical,
      business_model: res.business_model,
      stage: res.stage,
      state: res.state,
      contact_email: res.contact_email,
      tags: res.tags,
      keywords: res.keywords,
      target_customers: res.target_customers,
      value_proposition: res.value_proposition,
      enrichment_confidence: res.enrichment_confidence,
      founding_year: res.founding_year,
    };

    await base44.entities.LabStartup.update(localLab.id, {
      ...safeRes,
      ai_enriched: true,
      ai_enriched_at: new Date().toISOString(),
      status: "enriched"
    });

    setResult(safeRes);
    setExpanded(true);
    setEnriching(false);
    const enriched = { ...localLab, ...safeRes, ai_enriched: true, status: "enriched" };
    setLocalLab(enriched);
    onEnriched?.(enriched);
  };

  const promote = async () => {
    setPromoting(true);
    const data = result || localLab;
    const newStartup = await base44.entities.Startup.create({
      name: localLab.name,
      website: localLab.website,
      description: data.description || localLab.description,
      category: data.category || localLab.category,
      vertical: data.vertical || localLab.vertical,
      business_model: data.business_model || localLab.business_model,
      stage: data.stage || localLab.stage,
      state: data.state || localLab.state,
      contact_email: data.contact_email || localLab.contact_email,
      founding_year: data.founding_year || localLab.founding_year,
      tags: data.tags || localLab.tags || [],
      keywords: data.keywords,
      value_proposition: data.value_proposition,
      target_customers: data.target_customers,
      ai_enriched: localLab.ai_enriched || !!result,
      ai_enriched_at: localLab.ai_enriched_at,
      is_active: false,
      is_deleted: false,
      source: "csv",
      enrichment_status: "pending"
    });

    await base44.entities.LabStartup.update(localLab.id, {
      status: "promoted",
      promoted_startup_id: newStartup.id,
      promoted_at: new Date().toISOString()
    });

    setPromoting(false);
    const promoted = { ...localLab, status: "promoted", promoted_startup_id: newStartup.id };
    setLocalLab(promoted);
    onPromoted?.(promoted);
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir "${localLab.name}" do laboratório?`)) return;
    setDeleting(true);
    await base44.entities.LabStartup.delete(localLab.id);
    onDeleted?.(localLab.id);
  };

  const handleSaved = (updated) => {
    setLocalLab(updated);
    onEnriched?.(updated);
  };

  if (isPromoted) {
    return (
      <div className="bg-white rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "#A7ADA7", opacity: 0.65 }}>
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#2C4425" }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "#111111" }}>{localLab.name}</p>
          <p className="text-xs" style={{ color: "#4B4F4B" }}>Promovida para a base de Startups</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#ECEEEA", color: "#4B4F4B" }}>Promovida</span>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50 ml-1 flex-shrink-0">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#E10867" }} /> : <Trash2 className="w-3.5 h-3.5" style={{ color: "#E10867" }} />}
        </button>
      </div>
    );
  }

  const displayData = result || (isEnriched ? localLab : null);

  return (
    <>
      <div
        className="bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
        style={{ borderColor: selected ? "#E10867" : "#A7ADA7", boxShadow: selected ? "0 0 0 2px #E1086740" : undefined }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#ECEEEA" }}>
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onSelect?.(localLab.id)}
            className="w-4 h-4 rounded flex-shrink-0 cursor-pointer accent-pink-600"
          />
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: "#fce7ef", color: "#E10867" }}>
            {localLab.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: "#111111" }}>{localLab.name}</p>
            {localLab.website && (
              <a href={localLab.website} target="_blank" rel="noreferrer"
                className="text-xs flex items-center gap-1 hover:underline truncate"
                style={{ color: "#4B4F4B" }}>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                {localLab.website.replace(/^https?:\/\//, "")}
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
          {/* Edit + Delete */}
          {!readOnly && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Editar">
              <Pencil className="w-3.5 h-3.5" style={{ color: "#6B2FA0" }} />
            </button>
            <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-red-50" title="Excluir">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#E10867" }} /> : <Trash2 className="w-3.5 h-3.5" style={{ color: "#E10867" }} />}
            </button>
          </div>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3">
          {(displayData?.description || localLab.description) && (
            <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#4B4F4B" }}>
              {displayData?.description || localLab.description}
            </p>
          )}

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
                {displayData.founding_year && (
                  <span className="px-2 py-0.5 rounded-full text-xs"
                    style={{ background: "#ECEEEA", color: "#4B4F4B" }}>🗓 {displayData.founding_year}</span>
                )}
              </div>

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

              <button onClick={() => setExpanded(e => !e)}
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
                {localLab.website ? "Buscando dados no site e na web…" : "Analisando com IA…"}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!readOnly && (
        <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: "#ECEEEA" }}>
          <Button size="sm" variant="outline" onClick={runEnrichment} disabled={enriching || promoting}
            className="flex-1 gap-1.5 text-xs h-8">
            {enriching
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Analisando…</>
              : isEnriched || result
              ? <><RefreshCw className="w-3 h-3" /> Re-analisar</>
              : <><Sparkles className="w-3 h-3" /> Enriquecer com IA</>
            }
          </Button>
          <Button size="sm" onClick={promote} disabled={promoting || enriching}
            className="flex-1 gap-1.5 text-xs h-8 text-white"
            style={{ background: "#2C4425", border: "none" }}>
            {promoting
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Promovendo…</>
              : <><Rocket className="w-3 h-3" /> Promover</>
            }
          </Button>
        </div>
        )}
      </div>

      {showEdit && (
        <LabEditModal
          lab={localLab}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}