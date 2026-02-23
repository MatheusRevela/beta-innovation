import { MATURITY_LEVELS, STAGE_COLORS } from "@/components/ui/DesignTokens";

export function MaturityBadge({ level }) {
  const found = MATURITY_LEVELS.find(l => l.label === level);
  if (!found) return null;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block"
      style={{ background: found.color, color: found.textColor }}>
      {level}
    </span>
  );
}

export function StageBadge({ stage }) {
  const color = STAGE_COLORS[stage] || '#A7ADA7';
  const isDark = ['#E10867', '#2C4425', '#6B2FA0'].includes(color);
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block"
      style={{ background: color, color: isDark ? '#fff' : '#111111' }}>
      {stage}
    </span>
  );
}

export function StatusDot({ active }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: active ? '#2C4425' : '#4B4F4B' }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block"
        style={{ background: active ? '#2C4425' : '#A7ADA7' }} />
      {active ? 'Ativa' : 'Inativa'}
    </span>
  );
}

export function FitScoreBadge({ score }) {
  const color = score >= 75 ? '#E10867' : score >= 50 ? '#6B2FA0' : '#A7ADA7';
  const textColor = ['#E10867', '#6B2FA0'].includes(color) ? '#fff' : '#111';
  return (
    <span className="px-2 py-0.5 rounded-md text-xs font-bold tabular-nums"
      style={{ background: color, color: textColor }}>
      {score}%
    </span>
  );
}