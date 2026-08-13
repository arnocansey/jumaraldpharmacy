"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSocket } from "@/hooks/useSocket";
import { useSocketAutoInvalidate } from "@/hooks/useSocketAutoInvalidate";
import { I18nProvider } from "@/hooks/useI18n";

const SocketContext = createContext<ReturnType<typeof useSocket> | null>(null);

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}

function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

function SocketAutoInvalidateListener() {
  useSocketAutoInvalidate();
  return null;
}

function SocketProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket();
  return (
    <SocketContext.Provider value={socket}>
      <SocketAutoInvalidateListener />
      {children}
    </SocketContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SocketProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
              <ServiceWorkerRegistration />
              {children}
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </SocketProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
