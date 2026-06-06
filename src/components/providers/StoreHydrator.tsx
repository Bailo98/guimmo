"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

type PersistedAppStore = typeof useAppStore & {
  persist: {
    rehydrate: () => Promise<void> | void;
  };
};

export function StoreHydrator() {
  useEffect(() => {
    void (useAppStore as PersistedAppStore).persist.rehydrate();
  }, []);

  return null;
}
