import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App.tsx";
import "@/lib/i18n";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <App />
      </Suspense>
    </QueryClientProvider>
  </StrictMode>,
);
