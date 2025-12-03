interface ProdStatusBadgeProps {
  status?: string;
}

export default function ProdStatusBadge({ status }: ProdStatusBadgeProps) {
  if (!status) return null;

  switch (status) {
    case "Ended":
      return (
        <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-md text-xs font-medium border border-red-500/30 whitespace-nowrap">
          Sona Erdi
        </span>
      );
    case "Returning Series":
      return (
        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-md text-xs font-medium border border-green-500/30 whitespace-nowrap">
          Devam Ediyor
        </span>
      );
    case "Canceled":
      return (
        <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-md text-xs font-medium border border-gray-500/30 whitespace-nowrap">
          İptal Edildi
        </span>
      );
    case "In Production":
      return (
        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-md text-xs font-medium border border-yellow-500/30 whitespace-nowrap">
          Yapım Aşamasında
        </span>
      );
    case "Released": // Filmler için
      return (
        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs font-medium border border-blue-500/30 whitespace-nowrap">
          Vizyonda / Çıktı
        </span>
      );
    default:
      return (
        <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md text-xs font-medium border border-gray-600 whitespace-nowrap">
          {status}
        </span>
      );
  }
}
