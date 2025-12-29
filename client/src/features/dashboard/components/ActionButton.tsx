import { PlusIcon } from "@heroicons/react/24/outline";

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  color: string;
}

export default function ActionButton({
  label,
  onClick,
  color,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-xl border ${color} font-bold transition-all duration-200 flex items-center gap-2 bg-transparent`}
    >
      <PlusIcon className="w-5 h-5" />
      {label}
    </button>
  );
}
