import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Tag, Globe, Zap } from "lucide-react";

export default function AIEnrichmentPanel({ startup, onEnriched }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const runEnrichment = async () => {
    setLoading(true);
    setResult(null);
    setApplied(false);

    const websiteContext = startup.website
      ? `Site oficial: ${startup.website}.`
      : "";

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de inovação especialista em ecossistema de startups. 
Analise a startup "${startup.name}" e gere um enriquecimento completo dos dados.
${websiteContext}
Dados existentes: ${JSON.stringify({ category: startup.category, description: startup.description, tags: startup.tags, business_model: startup.business_model, stage: startup.stage })}.

Retorne:
- description: resumo executivo claro e direto de 2-3 frases sobre o que a startup faz e qual problema resolve
- category: categoria principal — escolha EXATAMENTE uma destas opções: Agtech, Biotech, Cibersegurança, Comunicação, Construtech, Deeptech, Edtech, Energtech, ESG, Fashiotech, Fintech, Foodtech, Games, Govtech, Greentech, Healthtech, HRtech, IndTech, Insurtech, Legaltech, Logtech, Martech, Midiatech, Mobilidade, Pettech, Proptech, Real Estate, Regtech, Retailtech, Salestech, Security, Sportech, Supply Chain, Traveltech, Web3
- vertical: vertical específica dentro da categoria (ex: "Telemedicina", "Open Banking", "Precision Agriculture")
- business_model: um de ["SaaS", "Hardware", "Marketplace", "Serviço", "Plataforma", "Outro"]
- stage: um de ["Ideação", "MVP", "PMF", "Scale", "Growth"]
- tags: array de PELO MENOS 15 palavras-chave relevantes para matching com corporações. Inclua: termos técnicos, verticais de mercado, tecnologias usadas, problemas resolvidos, setores atendidos, modelos de negócio, tipo de cliente, palavras-chave do produto e tendências relacionadas (em português ou inglês)
- keywords: array de 3-5 problemas que a startup resolve (frases curtas)
- target_customers: quem são os clientes ideais (1 frase)
- value_proposition: proposta de valor central (1 frase objetiva)
- enrichment_confidence: número 0-100 indicando confiança do enriquecimento`,
      add_context_from_internet: !!startup.website,
      file_urls: startup.website ? [] : undefined,
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

    setResult(res);
    setLoading(false);
  };

  const applyEnrichment = async () => {
    setApplying(true);
    await base44.entities.Startup.update(startup.id, {
      description: result.description,
      category: result.category,
      vertical: result.vertical,
      business_model: result.business_model,
      stage: result.stage,
      tags: result.tags,
      ai_enriched: true,
      ai_enriched_at: new Date().toISOString(),
      enrichment_status: "done"
    });
    setApplied(true);
    setApplying(false);
    if (onEnriched) onEnriched({ ...startup, ...result, ai_enriched: true });
  };

  const confidenceColor = (c) => {
    if (c >= 80) return '#2C4425';
    if (c >= 60) return '#6B2FA0';
    return '#E10867';
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#A7ADA7' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: '#1E0B2E' }}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: '#a78bfa' }} />
          <span className="text-sm font-semibold text-white">Enriquecimento por IA</span>
          {startup.ai_enriched && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(44,68,37,0.5)', color: '#86efac' }}>
              ✓ Já enriquecida
            </span>
          )}
        </div>
        <Button size="sm" onClick={runEnrichment} disabled={loading}
          className="text-white text-xs h-7 px-3"
          style={{ background: '#E10867', border: 'none' }}>
          {loading
            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analisando…</>
            : startup.ai_enriched
            ? <><RefreshCw className="w-3 h-3 mr-1" /> Re-analisar</>
            : <><Zap className="w-3 h-3 mr-1" /> Analisar com IA</>
          }
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-6 text-center" style={{ background: '#faf8ff' }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: '#6B2FA0' }} />
          <p className="text-sm font-medium" style={{ color: '#1E0B2E' }}>Analisando com IA…</p>
          <p className="text-xs mt-1" style={{ color: '#4B4F4B' }}>
            {startup.website ? "Buscando dados no site e na internet" : "Processando dados existentes"}
          </p>
        </div>
      )}

      {/* No result yet */}
      {!loading && !result && (
        <div className="p-5 text-center" style={{ background: '#fafafa' }}>
          {!startup.website && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 mx-auto max-w-xs"
              style={{ background: '#FEF3C7' }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#92400E' }} />
              <p className="text-xs" style={{ color: '#92400E' }}>Sem site cadastrado — qualidade pode ser menor</p>
            </div>
          )}
          <p className="text-sm" style={{ color: '#4B4F4B' }}>
            Clique em "Analisar com IA" para gerar descrição, tags, categoria e muito mais automaticamente.
          </p>
        </div>
      )}

      {/* Result */}
      {!loading && result && (
        <div className="p-4 space-y-4" style={{ background: '#fafafa' }}>
          {/* Confidence */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold" style={{ color: '#4B4F4B' }}>Confiança</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: '#ECEEEA' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${result.enrichment_confidence}%`, background: confidenceColor(result.enrichment_confidence) }} />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: confidenceColor(result.enrichment_confidence) }}>
              {result.enrichment_confidence}%
            </span>
          </div>

          {/* Value proposition */}
          {result.value_proposition && (
            <div className="p-3 rounded-xl" style={{ background: '#fce7ef' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#E10867' }}>Proposta de valor</p>
              <p className="text-sm leading-relaxed" style={{ color: '#111111' }}>{result.value_proposition}</p>
            </div>
          )}

          {/* Description */}
          {result.description && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4B4F4B' }}>Resumo executivo</p>
              <p className="text-sm leading-relaxed" style={{ color: '#111111' }}>{result.description}</p>
            </div>
          )}

          {/* Category + model + stage */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Categoria", val: result.category },
              { label: "Modelo", val: result.business_model },
              { label: "Estágio", val: result.stage },
            ].map(({ label, val }) => val && (
              <div key={label} className="p-2 rounded-lg text-center" style={{ background: '#ECEEEA' }}>
                <p className="text-xs mb-0.5" style={{ color: '#4B4F4B' }}>{label}</p>
                <p className="text-xs font-semibold" style={{ color: '#111111' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Target customers */}
          {result.target_customers && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#4B4F4B' }}>
                <Globe className="w-3 h-3 inline mr-1" />Clientes alvo
              </p>
              <p className="text-xs" style={{ color: '#111111' }}>{result.target_customers}</p>
            </div>
          )}

          {/* Keywords */}
          {result.keywords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#4B4F4B' }}>Problemas que resolve</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.map(k => (
                  <span key={k} className="px-2 py-0.5 rounded text-xs"
                    style={{ background: '#ede9f6', color: '#6B2FA0' }}>{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {result.tags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#4B4F4B' }}>
                <Tag className="w-3 h-3 inline mr-1" />Tags para matching
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-xs"
                    style={{ background: '#ECEEEA', color: '#4B4F4B' }}>#{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {applied ? (
            <div className="flex items-center gap-2 justify-center py-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#2C4425' }} />
              <span className="text-sm font-semibold" style={{ color: '#2C4425' }}>Dados aplicados com sucesso!</span>
            </div>
          ) : (
            <Button onClick={applyEnrichment} disabled={applying} className="w-full text-white font-semibold"
              style={{ background: '#2C4425', border: 'none' }}>
              {applying
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aplicando…</>
                : "Aplicar dados à startup"
              }
            </Button>
          )}
        </div>
      )}
    </div>
  );
}