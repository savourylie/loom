"use client";

import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import type { StoreApi } from "zustand";
import { useStore } from "zustand";
import { createAppStore, type AppState } from "@/store/app-store";

type StoreContextValue = StoreApi<AppState>;

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreContextValue | null>(null);

  if (!storeRef.current) {
    storeRef.current = createAppStore();
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore<T>(selector: (store: AppState) => T): T {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error("useAppStore must be used within StoreProvider");
  }

  return useStore(store, selector);
}
