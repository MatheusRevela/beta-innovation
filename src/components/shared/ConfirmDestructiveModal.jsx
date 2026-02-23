import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ConfirmDestructiveModal({ open, onClose, onConfirm, title, description, confirmWord = "EXCLUIR", loading }) {
  const [typed, setTyped] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#fce7ef' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: '#E10867' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base" style={{ color: '#111111' }}>{title}</h3>
            <p className="text-sm mt-1 mb-4" style={{ color: '#4B4F4B' }}>{description}</p>
            <p className="text-xs font-medium mb-2" style={{ color: '#4B4F4B' }}>
              Digite <strong style={{ color: '#E10867' }}>{confirmWord}</strong> para confirmar:
            </p>
            <Input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={confirmWord}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => { setTyped(""); onClose(); }} disabled={loading}>
            Cancelar
          </Button>
          <Button
            disabled={typed !== confirmWord || loading}
            onClick={() => { onConfirm(); setTyped(""); }}
            className="text-white"
            style={{ background: typed === confirmWord ? '#E10867' : '#A7ADA7', border: 'none' }}
          >
            {loading ? "Aguarde…" : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}