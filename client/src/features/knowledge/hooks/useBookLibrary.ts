import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { booksApi } from "@/features/knowledge/api/booksApi";
import { ReadStatus, type BookContentDto } from "@/features/knowledge/types";

interface UseBookLibraryOptions {
  onRefreshSuccess: () => string;
  onLoadError: () => string;
}

export function useBookLibrary({
  onRefreshSuccess,
  onLoadError,
}: UseBookLibraryOptions) {
  const [books, setBooks] = useState<BookContentDto[]>([]);
  const [filterStatus, setFilterStatus] = useState<ReadStatus | 0>(
    ReadStatus.Reading,
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await booksApi.getLibrary();
      setBooks(data);
    } catch {
      toast.error(onLoadError());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await booksApi.getLibrary();
      setBooks(data);
      toast.success(onRefreshSuccess());
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredItems = useMemo(
    () =>
      (filterStatus === 0
        ? books
        : books.filter((item) => item.userStatus === filterStatus)
      ).filter((item) => {
        if (!searchQuery) return true;
        return item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      }),
    [books, filterStatus, searchQuery],
  );

  return {
    books,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    loading,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    filteredItems,
    handleRefresh,
  };
}
