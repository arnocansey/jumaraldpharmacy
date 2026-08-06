"use client";

import React, { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSocket } from "@/hooks/useSocket";

const SocketContext = createContext<ReturnType<typeof useSocket> | null>(null);

export function useSocketContext() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used within SocketProvider");
  return ctx;
}

function SocketProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket();
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </SocketProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
