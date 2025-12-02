import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { entertainmentService } from '../features/entertainment/services/entertainmentService';
import { toast } from 'react-toastify';

export default function EntertainmentDetailPage() {
  const { type, id } = useParams(); // URL'den type ve id'yi al
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null); // Şimdilik any yapalım, detay tiplerini sonra ayarlarız
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id || !type) return;
      
      setLoading(true);
      try {
        let result;
        if (type === 'tv') {
          result = await entertainmentService.getTvDetail(Number(id));
        } else {
          result = await entertainmentService.getMovieDetail(Number(id));
        }
        setData(result);
      } catch (error) {
        toast.error('İçerik bulunamadı.');
        navigate('/entertainment'); // Geri at
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [type, id, navigate]);

  if (loading) {
    return <div className="text-white text-center mt-20">Yükleniyor...</div>;
  }

  if (!data) return null;

  const bgImage = data.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
    : null;

  return (
    <div className="text-white">
      {/* Arka Plan Görseli (Blur Efektli) */}
      {bgImage && (
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-center opacity-20 -z-10 blur-sm"
          style={{ backgroundImage: `url(${bgImage})` }}
        ></div>
      )}

      <div className="max-w-5xl mx-auto bg-gray-900/80 p-8 rounded-2xl shadow-2xl backdrop-blur-md border border-gray-700">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Poster */}
          <div className="w-full md:w-1/3 shrink-0">
            <img 
              src={data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : 'https://via.placeholder.com/500x750'} 
              alt={data.display_name} 
              className="w-full rounded-xl shadow-lg border border-gray-600"
            />
          </div>

          {/* Bilgiler */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 text-blue-400">{data.display_name}</h1>
            <p className="text-gray-400 italic mb-6 text-lg">{data.tagline}</p>

            <div className="flex items-center gap-4 mb-6">
              <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg font-bold border border-yellow-500/40">
                ⭐ {data.vote_average?.toFixed(1)}
              </span>
              <span className="text-gray-300">
                {data.display_date?.split('-')[0]}
              </span>
              <span className="uppercase bg-gray-700 px-2 py-1 rounded text-xs">
                {type}
              </span>
            </div>

            <h3 className="text-xl font-bold mb-2">Özet</h3>
            <p className="text-gray-300 leading-relaxed mb-8">
              {data.overview || 'Özet bilgisi bulunmuyor.'}
            </p>

            {/* Aksiyon Butonları (Henüz Fonksiyonsuz) */}
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition shadow-lg shadow-blue-900/50">
                + Takip Et / İzleyeceğim
              </button>
              <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition">
                İzledim (Tek Seferlik)
              </button>
            </div>

            {/* Dizi ise Sezonları Göster */}
            {type === 'tv' && data.seasons && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Sezonlar</h3>
                <div className="flex gap-2 overflow-x-auto pb-4">
                  {data.seasons.map((season: any) => (
                    season.season_number > 0 && (
                      <div key={season.id} className="min-w-[100px] bg-gray-800 p-2 rounded-lg text-center border border-gray-700 cursor-pointer hover:bg-gray-700">
                        <div className="text-sm font-bold text-gray-200">{season.name}</div>
                        <div className="text-xs text-gray-500">{season.episode_count} Bölüm</div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}