export default function PageHeader({ title, subtitle, actions, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>{title}</h1>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ background: '#fce7ef', color: '#E10867' }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm" style={{ color: '#4B4F4B' }}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}