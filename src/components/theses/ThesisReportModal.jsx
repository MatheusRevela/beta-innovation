import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, X, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

export default function ThesisReportModal({ thesis, corporate, onClose }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(thesis.cached_report || null);
  const [exporting, setExporting] = useState(false);

  const generateReport = async (force = false) => {
    if (!force && thesis.cached_report) {
      setReport(thesis.cached_report);
      return;
    }
    setLoading(true);
    const prompt = `Você é um analista de inovação estratégica da Beta-i.

Gere um relatório executivo resumido sobre a tese de inovação abaixo.

EMPRESA: ${corporate?.company_name || "N/A"} — ${corporate?.sector || ""}
TESE:
${thesis.thesis_text}

Macrocategorias: ${(thesis.macro_categories || []).join(", ")}
Top Prioridades: ${(thesis.top_priorities || []).join(", ")}
Setores de interesse: ${(thesis.sectors || []).join(", ")}
Tags de matching: ${(thesis.tags || []).join(", ")}

Gere o relatório com as seções:
1. Sumário Executivo (2-3 frases)
2. Contexto Estratégico (o que motivou essa tese, 1 parágrafo)
3. Macrocategorias e Justificativas (para cada macrocategoria, 1-2 frases de justificativa)
4. Prioridades Imediatas (top 3 ações concretas a tomar agora)
5. Startups a Buscar (perfil ideal de startup para cada macrocategoria, 1 frase cada)
6. Riscos e Pontos de Atenção (2-3 riscos)

Responda em JSON:
{
  "executive_summary": "string",
  "strategic_context": "string",
  "categories_justification": [{"category": "string", "justification": "string"}],
  "immediate_priorities": ["string", "string", "string"],
  "startup_profiles": [{"category": "string", "profile": "string"}],
  "risks": ["string", "string", "string"]
}`;

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            strategic_context: { type: "string" },
            categories_justification: { type: "array", items: { type: "object", properties: { category: { type: "string" }, justification: { type: "string" } } } },
            immediate_priorities: { type: "array", items: { type: "string" } },
            startup_profiles: { type: "array", items: { type: "object", properties: { category: { type: "string" }, profile: { type: "string" } } } },
            risks: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReport(result);
      await base44.entities.InnovationThesis.update(thesis.id, {
        cached_report: result,
        cached_report_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!report) return;
    setExporting(true);

    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 0;

      const addPage = () => {
        doc.addPage();
        y = margin;
      };

      const checkY = (needed = 10) => {
        if (y + needed > pageH - margin) addPage();
      };

      const drawText = (text, x, fontSize, color, style = "normal", maxWidth = contentW) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
        doc.setFont("helvetica", style);
        const lines = doc.splitTextToSize(String(text || ""), maxWidth);
        checkY(lines.length * (fontSize * 0.4));
        doc.text(lines, x, y);
        y += lines.length * (fontSize * 0.4) + 1;
      };

      // ---- COVER ----
      // Header bar
      doc.setFillColor(225, 8, 103); // #E10867
      doc.rect(0, 0, pageW, 52, "F");

      // Beta-i label
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.text("Beta-i Innovation OS", margin, 16);

      // Report type
      doc.setFontSize(9);
      doc.setTextColor(255, 200, 220);
      doc.text("Relatório Executivo de Inovação", margin, 23);

      // Title
      const titleText = `Tese de Inovação: ${thesis.top_priorities?.[0] || thesis.macro_categories?.[0] || "Relatório Executivo"}`;
      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      const titleLines = doc.splitTextToSize(titleText, contentW);
      doc.text(titleLines, margin, 34);

      // Company + date
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 220, 235);
      const dateStr = format(new Date(thesis.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      doc.text(`${corporate?.company_name || ""} · ${dateStr}`, margin, 48);

      y = 64;

      // ---- EXECUTIVE SUMMARY ----
      // Colored block
      doc.setFillColor(252, 231, 239);
      doc.roundedRect(margin, y, contentW, 2, 1, 1, "F");
      y += 5;
      drawText("SUMÁRIO EXECUTIVO", margin, 8, [225, 8, 103], "bold");
      y += 1;
      drawText(report.executive_summary, margin, 10, [30, 30, 30], "normal");
      y += 6;

      // ---- STRATEGIC CONTEXT ----
      checkY(20);
      drawText("CONTEXTO ESTRATÉGICO", margin, 8, [75, 79, 75], "bold");
      y += 1;
      drawText(report.strategic_context, margin, 10, [50, 50, 50], "normal");
      y += 6;

      // ---- MACRO CATEGORIES ----
      if (report.categories_justification?.length > 0) {
        checkY(16);
        drawText("MACROCATEGORIAS", margin, 8, [75, 79, 75], "bold");
        y += 2;
        report.categories_justification.forEach((c) => {
          checkY(14);
          // accent bar
          doc.setFillColor(225, 8, 103);
          doc.rect(margin, y - 3, 2, 10, "F");
          drawText(c.category, margin + 5, 10, [17, 17, 17], "bold", contentW - 5);
          drawText(c.justification, margin + 5, 9.5, [75, 79, 75], "normal", contentW - 5);
          y += 3;
        });
        y += 3;
      }

      // ---- IMMEDIATE PRIORITIES ----
      if (report.immediate_priorities?.length > 0) {
        checkY(16);
        drawText("PRIORIDADES IMEDIATAS", margin, 8, [75, 79, 75], "bold");
        y += 2;
        report.immediate_priorities.forEach((p, i) => {
          checkY(12);
          doc.setFillColor(107, 47, 160);
          doc.circle(margin + 3, y - 1.5, 3, "F");
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text(String(i + 1), margin + 2.2, y - 0.3);
          drawText(p, margin + 9, 10, [30, 30, 30], "normal", contentW - 9);
          y += 2;
        });
        y += 3;
      }

      // ---- STARTUP PROFILES ----
      if (report.startup_profiles?.length > 0) {
        checkY(16);
        drawText("PERFIL DE STARTUPS A BUSCAR", margin, 8, [75, 79, 75], "bold");
        y += 2;
        report.startup_profiles.forEach((sp) => {
          checkY(14);
          doc.setFillColor(240, 248, 251);
          const blockH = 14;
          doc.roundedRect(margin, y - 4, contentW, blockH, 2, 2, "F");
          doc.setDrawColor(180, 209, 215);
          doc.roundedRect(margin, y - 4, contentW, blockH, 2, 2, "S");
          drawText(sp.category, margin + 3, 9.5, [30, 58, 76], "bold", contentW - 6);
          drawText(sp.profile, margin + 3, 9, [75, 79, 75], "normal", contentW - 6);
          y += 4;
        });
        y += 3;
      }

      // ---- RISKS ----
      if (report.risks?.length > 0) {
        checkY(16);
        drawText("RISCOS E PONTOS DE ATENÇÃO", margin, 8, [75, 79, 75], "bold");
        y += 2;
        report.risks.forEach((r) => {
          checkY(12);
          doc.setFontSize(11);
          doc.setTextColor(220, 38, 38);
          doc.text("⚠", margin, y + 0.5);
          drawText(r, margin + 6, 9.5, [75, 79, 75], "normal", contentW - 6);
          y += 2;
        });
      }

      // ---- FOOTER on each page ----
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(245, 245, 245);
        doc.rect(0, pageH - 10, pageW, 10, "F");
        doc.setFontSize(7.5);
        doc.setTextColor(167, 173, 167);
        doc.setFont("helvetica", "normal");
        doc.text("Beta-i Innovation OS — Confidencial", margin, pageH - 4);
        doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 4, { align: "right" });
      }

      const fileName = `tese-inovacao-${(thesis.top_priorities?.[0] || "relatorio").toLowerCase().replace(/\s+/g, "-")}.pdf`;
      doc.save(fileName);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#ECEEEA' }}>
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: '#111111' }}>
              <FileText className="w-5 h-5" style={{ color: '#E10867' }} />
              Tese de Inovação: {thesis.top_priorities?.[0] || thesis.macro_categories?.[0] || "Relatório Executivo"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>
              {format(new Date(thesis.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" style={{ color: '#A7ADA7' }} /></button>
        </div>

        <div className="p-5">
          {!report && !loading && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
                <FileText className="w-7 h-7" style={{ color: '#E10867' }} />
              </div>
              <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>
                A IA irá gerar um relatório executivo completo com sumário, contexto estratégico, prioridades e perfil de startups.
              </p>
              <Button onClick={generateReport} className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
                <FileText className="w-4 h-4" /> Gerar Relatório com IA
              </Button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#E10867' }} />
              <p className="text-sm" style={{ color: '#4B4F4B' }}>IA gerando relatório executivo…</p>
            </div>
          )}

          {report && (
            <div className="space-y-5">
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl" style={{ background: '#fce7ef' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#E10867' }}>Sumário Executivo</p>
                <p className="text-sm" style={{ color: '#111111' }}>{report.executive_summary}</p>
              </div>

              {/* Strategic Context */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#4B4F4B' }}>Contexto Estratégico</p>
                <p className="text-sm" style={{ color: '#4B4F4B' }}>{report.strategic_context}</p>
              </div>

              {/* Categories justification */}
              {report.categories_justification?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Macrocategorias</p>
                  <div className="space-y-2">
                    {report.categories_justification.map((c, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl" style={{ background: '#ECEEEA' }}>
                        <div className="w-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: '#E10867', alignSelf: 'stretch', minHeight: 20 }} />
                        <div>
                          <p className="text-xs font-semibold" style={{ color: '#111111' }}>{c.category}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{c.justification}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate priorities */}
              {report.immediate_priorities?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Prioridades Imediatas</p>
                  <div className="space-y-2">
                    {report.immediate_priorities.map((p, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: '#6B2FA0' }}>{i + 1}</span>
                        <p className="text-sm" style={{ color: '#111111' }}>{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Startup profiles */}
              {report.startup_profiles?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Perfil de Startups a Buscar</p>
                  <div className="space-y-2">
                    {report.startup_profiles.map((sp, i) => (
                      <div key={i} className="p-3 rounded-xl border" style={{ borderColor: '#B4D1D7', background: '#f0f8fb' }}>
                        <p className="text-xs font-semibold" style={{ color: '#1e3a4c' }}>{sp.category}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#4B4F4B' }}>{sp.profile}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {report.risks?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#4B4F4B' }}>Riscos e Pontos de Atenção</p>
                  <div className="space-y-2">
                    {report.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: '#fef2f2' }}>
                        <span className="text-sm flex-shrink-0">⚠️</span>
                        <p className="text-xs" style={{ color: '#4B4F4B' }}>{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setReport(null); generateReport(true); }} size="sm">
                  Regenerar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPDF}
                  disabled={exporting}
                  className="gap-1.5"
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Exportar PDF
                </Button>
                <Button onClick={onClose} size="sm" className="text-white" style={{ background: '#E10867', border: 'none' }}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}