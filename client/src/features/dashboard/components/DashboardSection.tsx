import React from "react";

export default function DashboardSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-slide-up">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-skin-text">
        <span className="p-2 bg-skin-surface rounded-lg text-skin-primary">
          {icon}
        </span>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {children}
      </div>
    </div>
  );
}
