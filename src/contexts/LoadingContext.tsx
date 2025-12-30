import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface LoadingContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
  loadingMessage: string;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [message, setMessage] = useState("Loading...");

  const startLoading = useCallback((msg?: string) => {
    if (msg) setMessage(msg);
    setLoadingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const isLoading = loadingCount > 0;

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading, loadingMessage: message }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider");
  }
  return context;
}
