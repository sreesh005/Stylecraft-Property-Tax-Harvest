import React from 'react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number | undefined;
  subtitle?: string | null;
  icon?: React.ReactNode;
  badge?: string | number | null;
  badgeColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = "bg-blue-50 text-blue-700 border-blue-200"
}) => {
  return (
    <div id={id} className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</span>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{value !== undefined && value !== null ? value : "—"}</span>
        {badge && (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
