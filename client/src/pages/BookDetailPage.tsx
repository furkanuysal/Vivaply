import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { booksService } from "../features/knowledge/services/booksService";
import { ReadStatus } from "../features/knowledge/types";
import { toast } from "react-toastify";
import StarRating from "../features/entertainment/components/StarRating"; // Ortak bileşeni kullanıyoruz
import ConfirmDialog from "../components/ConfirmDialog"; // Ortak bileşen

export default function BookDetailPage() {
  const { id } = useParams(); // Google Book ID
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Kişisel Not
  const [reviewText, setReviewText] = useState("");

  // Dropdown Menü Durumu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Confirmation Dialog State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(
    null
  );

  // Helper: Buton Tasarımı (Renk/İkon)
  const getStatusButtonConfig = (status: ReadStatus) => {
    switch (status) {
      case ReadStatus.Reading:
        return {
          color: "bg-green-600 text-white border-green-500",
          icon: "📖",
        };
      case ReadStatus.PlanToRead:
        return { color: "bg-blue-600 text-white border-blue-500", icon: "📚" };
      case ReadStatus.Completed:
        return {
          color: "bg-purple-600 text-white border-purple-500",
          icon: "🏆",
        };
      case ReadStatus.Dropped:
        return { color: "bg-red-600 text-white border-red-500", icon: "🛑" };
      case ReadStatus.OnHold:
        return {
          color: "bg-yellow-600 text-white border-yellow-500",
          icon: "⏸️",
        };
      default:
        return { color: "bg-blue-600 hover:bg-blue-700 text-white", icon: "" };
    }
  };

  // Helper: Buton Metni
  const getStatusLabel = (status: number) => {
    switch (status) {
      case ReadStatus.PlanToRead:
        return "Okuyacağım";
      case ReadStatus.Reading:
        return "Okuyorum";
      case ReadStatus.Completed:
        return "Bitti";
      case ReadStatus.OnHold:
        return "Ara Verdim";
      case ReadStatus.Dropped:
        return "Bıraktım";
      default:
        return "+ Kütüphaneye Ekle";
    }
  };

  // Puan Verme (Backend'e Puan Endpoint'i ekleyince aktifleşecek)
  const handleRate = async (rating: number) => {
    if (!data) return;
    // TODO: Backend'e 'RateBook' endpoint'i ekleyince burayı açacağız.
    // Şimdilik sadece UI'da gösterelim.
    setData((prev: any) => ({ ...prev, userRating: rating }));
    toast.success(`Puan verildi: ${rating}/10 ⭐ (Simülasyon)`);
  };

  // Listeden Kaldırma
  const handleRemoveClick = () => {
    if (!data) return;
    setConfirmTitle("Kütüphaneden Kaldır");
    setConfirmMessage(
      "Bu kitabı kütüphanenizden ve okuma listenizden kaldırmak istediğinize emin misiniz?"
    );
    setOnConfirmAction(() => executeRemove);
    setIsConfirmOpen(true);
    setIsDropdownOpen(false);
  };

  const executeRemove = async () => {
    if (!data || !id) return;
    try {
      await booksService.removeBook(id);
      toast.info("Kitap kütüphaneden kaldırıldı.");

      // UI Güncelle: Statüyü 0 (None) yap
      setData((prev: any) => ({
        ...prev,
        userStatus: 0,
        userRating: 0,
        userReview: "",
      }));
    } catch (error: any) {
      toast.error("Silme işlemi başarısız.");
    }
  };

  // Statü Değiştirme / Ekleme
  const handleStatusChange = async (newStatus: ReadStatus) => {
    if (!data) return;
    setIsDropdownOpen(false);

    if (data.userStatus === newStatus) return;

    try {
      if (!data.userStatus || data.userStatus === 0) {
        // 1. Durum: Hiç ekli değilse -> TRACK (Ekle)
        await booksService.trackBook({
          googleBookId: data.id,
          title: data.title,
          authors: data.authors,
          coverUrl: data.coverUrl,
          pageCount: data.pageCount,
          status: newStatus,
        });
        toast.success("Kütüphaneye eklendi! 🎉");
      } else {
        // 2. Durum: Zaten ekliyse -> UPDATE (Güncelle)
        await booksService.updateStatus(data.id, newStatus);
        toast.info("Durum güncellendi.");
      }

      // UI Güncelle
      setData((prev: any) => ({ ...prev, userStatus: newStatus }));
    } catch (error: any) {
      toast.error("İşlem başarısız.");
    }
  };

  // Yorum Kaydetme
  const handleSaveReview = async () => {
    // TODO: Backend'e 'AddBookReview' ekleyince burayı bağlayacağız.
    toast.success("Notunuz kaydedildi! 📝 (Simülasyon)");
    setData((prev: any) => ({ ...prev, userReview: reviewText }));
  };

  // Veri Yükleme
  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await booksService.getBookDetail(id);
        setData(result);
        setReviewText(result.userReview || "");
      } catch (error) {
        toast.error("Kitap bulunamadı.");
        navigate("/books"); // Geri at
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [id, navigate]);

  if (loading)
    return <div className="text-white text-center mt-20">Yükleniyor...</div>;
  if (!data) return null;

  const bgImage = data.coverUrl?.replace("http:", "https:") || null;
  const statusConfig = getStatusButtonConfig(data.userStatus);

  // Dropdown Seçenekleri
  const statusOptions = [
    ReadStatus.Reading,
    ReadStatus.PlanToRead,
    ReadStatus.Completed,
    ReadStatus.OnHold,
    ReadStatus.Dropped,
  ];

  return (
    <div className="text-white pb-20">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          if (onConfirmAction) onConfirmAction();
        }}
        title={confirmTitle}
        message={confirmMessage}
      />

      {/* Arkaplan Blur */}
      {bgImage && (
        <div
          className="fixed inset-0 w-full h-full bg-cover bg-center opacity-20 -z-10 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="max-w-5xl mx-auto bg-gray-900/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700 mt-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Kapak */}
          <div className="w-full md:w-1/3 shrink-0 flex justify-center md:justify-start">
            <img
              src={
                data.coverUrl?.replace("http:", "https:") ||
                "https://via.placeholder.com/300x450"
              }
              alt={data.title}
              className="w-64 md:w-full rounded-xl shadow-lg border border-gray-600 object-cover"
            />
          </div>

          {/* Bilgiler */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-blue-400">
              {data.title}
            </h1>
            <p className="text-xl text-gray-300 mb-4 font-medium">
              {data.authors?.join(", ") || "Bilinmeyen Yazar"}
            </p>

            <div className="flex items-center gap-4 mb-6 flex-wrap">
              {/* Google Rating */}
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg font-bold border border-yellow-500/40">
                Google: ⭐ {(data.averageRating || 0).toFixed(1)}
              </span>

              {/* User Rating */}
              <div className="relative group">
                <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg font-bold border border-blue-500/40 cursor-pointer flex items-center gap-2">
                  Benim Puanım: ★ {data.userRating || 0}
                </span>
                {/* Hover Yıldızları */}
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 p-3 rounded-xl shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-max">
                  <StarRating
                    currentRating={data.userRating}
                    onRate={handleRate}
                  />
                </div>
              </div>

              <span className="text-gray-400">
                {data.publishedDate?.split("-")[0]}
              </span>
              <span className="text-gray-400 font-mono text-sm border border-gray-600 px-2 py-0.5 rounded">
                {data.pageCount} Sayfa
              </span>
            </div>

            {/* HTML İçeren Açıklama (Google Books HTML dönebilir) */}
            <h3 className="text-xl font-bold mb-2">Özet</h3>
            <div
              className="text-gray-300 leading-relaxed mb-8 text-sm max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 pr-2"
              dangerouslySetInnerHTML={{
                __html: data.description || "Özet bilgisi bulunmuyor.",
              }}
            />

            <div className="flex flex-col gap-6">
              {/* Aksiyon Butonları */}
              <div className="flex gap-4 relative">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2 min-w-[200px] justify-between ${
                      statusConfig.color
                    } ${
                      !data.userStatus
                        ? "hover:scale-105 shadow-blue-900/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {statusConfig.icon && <span>{statusConfig.icon}</span>}
                      {getStatusLabel(data.userStatus || 0)}
                    </div>
                    <span className="text-xs opacity-70 ml-2">▼</span>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                      {statusOptions.map((statusValue) => (
                        <button
                          key={statusValue}
                          onClick={() => handleStatusChange(statusValue)}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-700 transition flex justify-between items-center ${
                            data.userStatus === statusValue
                              ? "text-green-400 font-bold bg-gray-700/50"
                              : "text-gray-300"
                          }`}
                        >
                          {getStatusLabel(statusValue)}
                          {data.userStatus === statusValue && <span>✓</span>}
                        </button>
                      ))}

                      {/* Sil Butonu (Sadece ekliyse göster) */}
                      {data.userStatus !== 0 &&
                        data.userStatus !== undefined && (
                          <>
                            <div className="border-t border-gray-700 my-1"></div>
                            <button
                              onClick={handleRemoveClick}
                              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center gap-2"
                            >
                              <span>🗑️</span> Kütüphaneden Kaldır
                            </button>
                          </>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Kişisel Not Alanı */}
              <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 w-full">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                    Kişisel Notlarım
                  </p>
                  {data.userReview !== reviewText && (
                    <button
                      onClick={handleSaveReview}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                    >
                      Kaydet
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full bg-gray-900/50 text-gray-200 text-sm p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none transition"
                  rows={3}
                  placeholder="Bu kitap hakkında ne düşünüyorsun?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
