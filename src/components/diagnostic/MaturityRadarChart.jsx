import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { DIAGNOSTIC_PILLARS } from "./DiagnosticQuestions";

export default function MaturityRadarChart({ pillarScores, size = 300 }) {
  const data = DIAGNOSTIC_PILLARS.map(p => ({
    subject: p.name.split(" ")[0],
    fullName: p.name,
    score: pillarScores?.[p.id] ?? 0,
    fullMark: 100
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border rounded-xl shadow-lg px-3 py-2 text-xs"
          style={{ borderColor: '#A7ADA7' }}>
          <p className="font-semibold text-sm mb-0.5" style={{ color: '#111111' }}>{d.fullName}</p>
          <p style={{ color: '#E10867' }}>Score: <strong>{d.score}%</strong></p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#A7ADA7" strokeOpacity={0.5} />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#4B4F4B', fontSize: 11, fontWeight: 500 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Maturidade"
          dataKey="score"
          stroke="#E10867"
          fill="#E10867"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ fill: '#E10867', r: 4 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}