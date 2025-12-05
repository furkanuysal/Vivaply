import { useNavigate } from "react-router-dom";
import { ReadStatus, type BookContentDto } from "../types";

interface Props {
  book: BookContentDto;
}

export default function BookCard({ book }: Props) {
  const navigate = useNavigate();

  const imageUrl =
    book.coverUrl?.replace("http:", "https:") ||
    "https://via.placeholder.com/128x192?text=No+Cover";

  // Durum Etiketi Rengi
  const getStatusColor = (status: ReadStatus) => {
    switch (status) {
      case ReadStatus.Reading:
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case ReadStatus.Completed:
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case ReadStatus.PlanToRead:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-700 text-gray-400";
    }
  };

  const getStatusLabel = (status: ReadStatus) => {
    switch (status) {
      case ReadStatus.Reading:
        return "Okunuyor";
      case ReadStatus.Completed:
        return "Bitti";
      case ReadStatus.PlanToRead:
        return "Listede";
      case ReadStatus.Dropped:
        return "Bırakıldı";
      default:
        return "";
    }
  };

  // İlerleme Yüzdesi
  const progress =
    book.pageCount > 0
      ? Math.min((book.currentPage / book.pageCount) * 100, 100)
      : 0;

  return (
    <div
      onClick={() => navigate(`/knowledge/${book.id}`)}
      className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 border border-gray-700 group cursor-pointer flex flex-col h-full"
    >
      {/* Kapak */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={book.title}
          className="w-full h-full object-cover"
        />
        {/* Hover Butonu */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-700">
            İncele
          </button>
        </div>
      </div>

      {/* Bilgiler */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3
            className="text-white font-bold text-sm line-clamp-2 mb-1"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-gray-400 text-xs line-clamp-1">
            {book.authors.join(", ") || "Yazar Yok"}
          </p>
        </div>

        <div className="mt-3 space-y-2">
          {/* Durum Varsa Göster */}
          {book.userStatus !== ReadStatus.None && (
            <div className="flex justify-between items-center">
              <span
                className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(
                  book.userStatus
                )}`}
              >
                {getStatusLabel(book.userStatus)}
              </span>
              {/* İlerleme % */}
              {book.userStatus === ReadStatus.Reading && (
                <span className="text-xs text-gray-300 font-mono">
                  {Math.round(progress)}%
                </span>
              )}
            </div>
          )}

          {/* İlerleme Barı (Sadece Okunuyorsa) */}
          {book.userStatus === ReadStatus.Reading && (
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
