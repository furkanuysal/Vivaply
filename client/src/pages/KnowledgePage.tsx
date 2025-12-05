import { useState, useEffect } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { booksService } from "../features/knowledge/services/booksService";
import BookCard from "../features/knowledge/components/BookCard";
import type { BookContentDto } from "../features/knowledge/types";

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookContentDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Sayfa açılınca varsayılan önerileri getir (Boş durmasın)
  useEffect(() => {
    // Google Books'ta "subject:fiction" veya "subject:popular" gibi aramalarla öneri listesi oluşturabiliriz
    performSearch("subject:fiction");
  }, []);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const data = await booksService.searchBooks(searchQuery);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await performSearch(query);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 🟢 Başlık ve Arama Alanı */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-white">Kitap Keşfet</h1>

        {/* Arama Kutusu */}
        <form onSubmit={handleSearch} className="relative w-full">
          <input
            type="text"
            placeholder="Kitap adı, yazar veya tür ara... (Örn: Harry Potter, Psychology)"
            className="w-full bg-gray-800 border border-gray-700 text-white px-5 py-4 rounded-xl pl-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <MagnifyingGlassIcon className="w-6 h-6 text-gray-400 absolute left-4 top-4" />
          <button
            type="submit"
            className="absolute right-3 top-2.5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-lg font-medium transition"
          >
            Ara
          </button>
        </form>
      </div>

      {/* 🔴 Sonuçlar Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Başlık (Arama yaptıysa 'Sonuçlar', yapmadıysa 'Önerilenler') */}
          <h2 className="text-xl font-semibold text-gray-300 border-l-4 border-blue-500 pl-3">
            {query ? `"${query}" için sonuçlar` : "Sizin için Önerilenler"}
          </h2>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {results.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10 bg-gray-800/30 rounded-xl border border-gray-700/50">
              Sonuç bulunamadı. Başka bir kelime deneyin.
            </div>
          )}
        </>
      )}
    </div>
  );
}
