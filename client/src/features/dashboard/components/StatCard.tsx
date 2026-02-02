import React from "react";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
}

export default function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden p-6 rounded-2xl border border-skin-border/50 bg-skin-surface shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-skin-primary/30">
      <div className="absolute top-0 right-0 p-4 opacity-25 text-skin-secondary [&>svg]:w-12 [&>svg]:h-12">
        {icon}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        {/* Value: Color: Primary */}
        <div className="text-4xl font-black text-skin-text drop-shadow-sm">
          {value}
        </div>

        {/* Label: Color: Normal text color */}
        <div className="text-skin-text/70 text-sm font-bold uppercase tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
}
