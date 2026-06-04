import { useEffect } from "react";
import type { AppData } from "../components/types";
import { saveLocalFallback, savePersistentData } from "../services/storageService";

export function usePersistentInventory(data: AppData, enabled: boolean, onLocalError?: () => void) {
  useEffect(() => {
    try {
      saveLocalFallback(data);
    } catch {
      onLocalError?.();
    }
    if (enabled) void savePersistentData(data);
  }, [data, enabled, onLocalError]);
}
