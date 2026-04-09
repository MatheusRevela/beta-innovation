import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useCorporateAccess } from "@/components/hooks/useCorporateAccess";

import { MaturityBadge } from "@/components/shared/StatusBadge";
import { Zap, Plus, ChevronRight, Loader2, Clock, CheckCircle2, PlayCircle, Hourglass, XCircle, Lock, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_CONFIG = {
  draft: { label: "Rascunho", icon: Clock, color: "#A7ADA7", bg: "#F5F5F5" },
  in_progress: { label: "Em andamento", icon: PlayCircle, color: "#6B2FA0", bg: "#f3e8ff" },
  processing: { label: "Processando IA", icon: Hourglass, color: "#E10867", bg: "#fce7ef" },
  completed: { label: "Concluído", icon: CheckCircle2, color: "#2C4425", bg: "#e8f5e9" },
  abandoned: { label: "Abandonado", icon: XCircle, color: "#9E9E9E", bg: "#F5F5F5" },
};

export default function MyDiagnostics() {
  const navigate = useNavigate();
  const { loading: accessLoading, corporate, isGestor } = useCorporateAccess();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessLoading && corporate) loadSessions();
    else if (!accessLoading) setLoading(false);
  }, [accessLoading, corporate]);

  const loadSessions = async () => {
    const all = await base44.entities.DiagnosticSession.filter({ corporate_id: corporate.id }, "-created_date");
    setSessions(all);
    setLoading(false);
  };

  const startNew = () => {
    if (corporate) {
      navigate(createPageUrl("Diagnostic") + `?corporate_id=${corporate.id}`);
    } else {
      navigate(createPageUrl("Onboarding"));
    }
  };

  const resume = (session) => {
    navigate(createPageUrl("Diagnostic") + `?session_id=${session.id}&corporate_id=${session.corporate_id}`);
  };

  if (loading || accessLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#E10867' }} />
    </div>
  );

  const completed = sessions.filter(s => s.status === "completed");
  const ongoing = sessions.filter(s => ["draft", "in_progress", "processing"].includes(s.status));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>Meus Diagnósticos</h1>
          <p className="text-sm mt-1" style={{ color: '#4B4F4B' }}>
            {sessions.length} diagnóstico{sessions.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        {isGestor && (
          <Button onClick={startNew} className="text-white gap-2" style={{ background: '#E10867', border: 'none' }}>
            <Plus className="w-4 h-4" /> Novo Diagnóstico
          </Button>
        )}
        {!isGestor && corporate && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: '#ECEEEA', color: '#4B4F4B' }}>
            <Lock className="w-3.5 h-3.5" /> Somente o gestor pode criar
          </div>
        )}
      </div>

      {!corporate && (
        <div className="bg-white rounded-2xl border p-8 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="font-bold text-lg mb-2">Configure sua empresa primeiro</h2>
          <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>Complete o onboarding para iniciar diagnósticos.</p>
          <Button onClick={() => navigate(createPageUrl("Onboarding"))} className="text-white" style={{ background: '#E10867', border: 'none' }}>
            Iniciar Onboarding
          </Button>
        </div>
      )}

      {corporate && sessions.length === 0 && (
        <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#A7ADA7' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#fce7ef' }}>
            <Zap className="w-7 h-7" style={{ color: '#E10867' }} />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: '#111111' }}>Nenhum diagnóstico ainda</h2>
          {isGestor ? (
            <>
              <p className="text-sm mb-5" style={{ color: '#4B4F4B' }}>Inicie o primeiro diagnóstico de maturidade da sua empresa.</p>
              <Button onClick={startNew} className="text-white px-8" style={{ background: '#E10867', border: 'none' }}>
                Iniciar diagnóstico <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <p className="text-sm" style={{ color: '#4B4F4B' }}>O gestor da sua empresa ainda não realizou o diagnóstico de maturidade.</p>
          )}
        </div>
      )}

      {ongoing.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: '#4B4F4B' }}>Em andamento</h2>
          <div className="space-y-3">
            {ongoing.map(s => <SessionCard key={s.id} session={s} onResume={() => resume(s)} />)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: '#4B4F4B' }}>Concluídos</h2>
          <div className="space-y-3">
            {completed.map(s => <SessionCard key={s.id} session={s} onResume={() => resume(s)} />)}
          </div>
        </div>
      )}

      {/* AI Readiness Scan upsell */}
      {completed.length > 0 && (
        <div className="mt-8 rounded-2xl border-2 p-6 flex items-center gap-5"
          style={{ borderColor: '#6B2FA0', background: 'linear-gradient(135deg, #1E0B2E08, #6B2FA012)' }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#f3e8ff' }}>
            <Brain className="w-6 h-6" style={{ color: '#6B2FA0' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm mb-0.5" style={{ color: '#1E0B2E' }}>Próximo passo: AI Readiness Scan</p>
            <p className="text-xs" style={{ color: '#4B4F4B' }}>
              Avalie a prontidão de IA da sua empresa em 9 dimensões. Enriquece sua Tese de Inovação com insights específicos sobre IA.
            </p>
          </div>
          <Button onClick={() => navigate(createPageUrl('AIReadinessScan'))} size="sm"
            className="text-white flex-shrink-0" style={{ background: '#6B2FA0', border: 'none' }}>
            Iniciar <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onResume }) {
  const cfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  const isCompleted = session.status === "completed";
  const canResume = ["draft", "in_progress"].includes(session.status); // used for button label/style

  const dateStr = session.completed_at
    ? format(new Date(session.completed_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })
    : format(new Date(session.created_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="bg-white rounded-2xl border p-5 flex items-center justify-between gap-4" style={{ borderColor: '#A7ADA7' }}>
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
          <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold" style={{ color: '#111111' }}>
              Diagnóstico #{session.id?.slice(-6)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <p className="text-xs" style={{ color: '#4B4F4B' }}>
            {isCompleted ? `Concluído em ${dateStr}` : `Iniciado em ${dateStr}`}
          </p>
          {isCompleted && session.overall_score != null && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-black" style={{ color: '#E10867' }}>{session.overall_score}</span>
              <span className="text-xs" style={{ color: '#4B4F4B' }}>/ 100</span>
              <MaturityBadge level={session.maturity_level} />
            </div>
          )}
          {!isCompleted && session.current_pillar_index > 0 && (
            <p className="text-xs mt-0.5" style={{ color: '#6B2FA0' }}>
              Pilar {session.current_pillar_index + 1} de 6
            </p>
          )}
        </div>
      </div>
      <Button
        onClick={onResume}
        variant={isCompleted ? "outline" : "default"}
        size="sm"
        className={isCompleted ? "" : "text-white"}
        style={isCompleted ? { borderColor: '#A7ADA7' } : { background: '#E10867', border: 'none' }}
      >
        {isCompleted ? "Ver resultado" : "Continuar"}
        <ChevronRight className="w-3.5 h-3.5 ml-1" />
      </Button>
    </div>
  );
}