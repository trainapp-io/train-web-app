interface StatCardProps {
  value: string;
  label: string;
  variant?: 'default' | 'primary' | 'pr';
}

export default function StatCard({ value, label, variant = 'default' }: StatCardProps) {
  const cls = variant === 'default'
    ? 'wla-stat-card'
    : `wla-stat-card wla-stat-card--${variant}`;
  return (
    <div className={cls}>
      <div className="wla-stat-card__value">{value}</div>
      <div className="wla-stat-card__label">{label}</div>
    </div>
  );
}
