import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

interface Props {
  currentRating?: number; // Örn: 6.5
  onRate: (rating: number) => void;
}

export default function StarRating({ currentRating = 0, onRate }: Props) {
  const [hover, setHover] = useState(0);

  // Görüntülenecek puan (Hover varsa o, yoksa kayıtlı puan)
  const displayRating = hover || currentRating || 0;

  return (
    <div className="flex items-center gap-1 select-none">
      <div className="flex relative">
        {[...Array(10)].map((_, index) => {
          const starValue = index + 1;

          return (
            <div key={index} className="relative w-6 h-6 cursor-pointer group">
              {/* Yıldızın Görseli (Alt Katman) 
                 - Tam dolu mu?
                 - Yarım mı?
                 - Boş mu?
              */}
              <div className="absolute inset-0 pointer-events-none">
                {displayRating >= starValue ? (
                  // Tam Dolu Yıldız
                  <StarIcon className="w-6 h-6 text-skin-primary" />
                ) : displayRating >= starValue - 0.5 ? (
                  // Yarım Dolu Yıldız (Maskeleme ile)
                  <div className="relative w-6 h-6">
                    <StarOutline className="absolute w-6 h-6 text-skin-muted" />
                    <div className="absolute inset-0 overflow-hidden w-[50%]">
                      <StarIcon className="w-6 h-6 text-skin-primary" />
                    </div>
                  </div>
                ) : (
                  // Boş Yıldız
                  <StarOutline className="w-6 h-6 text-skin-muted" />
                )}
              </div>

              {/* Tıklama Alanları (Üst Katman - Görünmez)
                 Her yıldızın üzerinde görünmez iki buton vardır.
              */}

              {/* Sol Yarım (Buçuklu Puan: X.5) */}
              <div
                className="absolute left-0 top-0 w-1/2 h-full z-20"
                onMouseEnter={() => setHover(starValue - 0.5)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onRate(starValue - 0.5)}
              />

              {/* Sağ Yarım (Tam Puan: X.0) */}
              <div
                className="absolute right-0 top-0 w-1/2 h-full z-20"
                onMouseEnter={() => setHover(starValue)}
                onMouseLeave={() => setHover(0)}
                onClick={() => onRate(starValue)}
              />
            </div>
          );
        })}
      </div>

      {/* Puan Yazısı */}
      <span className="ml-3 text-lg font-bold text-skin-primary w-10 text-center">
        {displayRating.toFixed(1)}
      </span>
    </div>
  );
}
