import React from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  borderColor: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  borderColor,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden p-6 rounded-2xl border ${borderColor} ${bg} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-20 ${color}`}>
        {icon}
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
        <div className="text-skin-text/80 text-sm font-medium uppercase tracking-wide">
          {label}
        </div>
      </div>
    </div>
  );
}
