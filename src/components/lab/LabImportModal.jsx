import { useState, useRef } from "react";
import { X, Upload, Download, CheckCircle2, AlertTriangle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const CSV_TEMPLATE = `nome,site,descricao
Startup Exemplo,https://exemplo.com,Plataforma de inovação para empresas
Outra Startup,https://outra.com.br,
`;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  return lines.slice(1).map(line => {
    // handle quoted fields
    const cols = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuote = !inQuote; continue; }
      if (line[i] === "," && !inQuote) { cols.push(cur.trim()); cur = ""; continue; }
      cur += line[i];
    }
    cols.push(cur.trim());
    const obj = {};
    header.forEach((h, i) => { obj[h] = cols[i] || ""; });
    return obj;
  }).filter(r => r.nome);
}

export default function LabImportModal({ onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      if (!parsed.length) {
        setError("Nenhuma linha válida encontrada. Verifique o formato do CSV.");
        setRows([]);
      } else {
        setRows(parsed);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "template_startups_laboratorio.csv";
    a.click();
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setSaving(true);
    const valid = rows.filter(r => r.nome);
    await base44.entities.LabStartup.bulkCreate(
      valid.map(r => ({
        name: r.nome,
        website: r.site || r.website || "",
        description: r.descricao || r.description || "",
        source: "csv",
        status: "pending"
      }))
    );
    setSaving(false);
    setDone(true);
    setTimeout(() => { onImported?.(); onClose(); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#ECEEEA" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: "#111111" }}>Importar Startups via CSV</h2>
            <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>Importe em lote para o Laboratório</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" style={{ color: "#A7ADA7" }} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Download template */}
          <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "#B4D1D7", background: "#f0f9fb" }}>
            <FileText className="w-8 h-8 flex-shrink-0" style={{ color: "#2C4425" }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#111111" }}>Planilha template</p>
              <p className="text-xs" style={{ color: "#4B4F4B" }}>Colunas: <strong>nome</strong>, <strong>site</strong>, <strong>descricao</strong></p>
            </div>
            <Button size="sm" variant="outline" onClick={downloadTemplate} className="flex-shrink-0 gap-1.5">
              <Download className="w-4 h-4" /> Baixar
            </Button>
          </div>

          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-pink-300"
            style={{ borderColor: "#A7ADA7" }}>
            <Upload className="w-8 h-8" style={{ color: "#A7ADA7" }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "#111111" }}>
                {fileName ? fileName : "Clique para selecionar o CSV"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#4B4F4B" }}>Apenas arquivos .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#fce7ef" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#E10867" }} />
              <p className="text-xs" style={{ color: "#E10867" }}>{error}</p>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#4B4F4B" }}>
                {rows.length} startup{rows.length !== 1 ? "s" : ""} encontrada{rows.length !== 1 ? "s" : ""}
              </p>
              <div className="max-h-40 overflow-y-auto rounded-xl border divide-y" style={{ borderColor: "#ECEEEA" }}>
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "#fce7ef", color: "#E10867" }}>{r.nome?.[0]?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#111111" }}>{r.nome}</p>
                      <p className="text-xs truncate" style={{ color: "#4B4F4B" }}>{r.site || "—"}</p>
                    </div>
                    {r.nome && r.site ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#2C4425" }} />
                    ) : (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#E10867" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "#ECEEEA" }}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            onClick={handleImport}
            disabled={!rows.length || saving || done}
            className="text-white gap-1.5"
            style={{ background: "#E10867", border: "none" }}>
            {done
              ? <><CheckCircle2 className="w-4 h-4" /> Importado!</>
              : saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando…</>
              : <><Upload className="w-4 h-4" /> Importar {rows.length > 0 ? `${rows.length} startups` : ""}</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}