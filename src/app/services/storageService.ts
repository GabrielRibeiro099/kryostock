import { initialCategories, initialMovements, initialProducts } from "../components/data";
import type { AppData, Category, Movement, Product, UserAccount } from "../components/types";
import { migrateUserPassword } from "./authService";

export const SCHEMA_VERSION = "1.0.0";

export const createDefaultAppData = (): AppData => ({
  schemaVersion: SCHEMA_VERSION,
  users: [],
  currentSession: null,
  inventory: {
    products: initialProducts,
    categories: initialCategories,
    movements: initialMovements,
  },
  settings: {
    darkMode: false,
    appName: "KryoStock",
    version: "1.0.0",
  },
});

function asArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

export function migrateMovementType(type: unknown): Movement["type"] {
  if (type === "entrada" || type === "saida" || type === "ajuste_positivo" || type === "ajuste_negativo" || type === "correcao_inventario") {
    return type;
  }
  if (type === "ajuste") return "ajuste_positivo";
  return "entrada";
}

export function normalizeAppData(raw: unknown): AppData {
  const defaults = createDefaultAppData();
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const inventory = data.inventory && typeof data.inventory === "object" ? data.inventory : {};

  const products = asArray<Product>(inventory.products ?? data.products, defaults.inventory.products).map((product) => ({
    ...product,
    name: product.name || "Produto sem nome",
    sku: product.sku || `SKU-${Date.now()}`,
    categoryId: product.categoryId || defaults.inventory.categories[0]?.id || "cat1",
    quantity: Number.isFinite(Number(product.quantity)) ? Number(product.quantity) : 0,
    minStock: Number.isFinite(Number(product.minStock)) ? Number(product.minStock) : 0,
    price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
    costPrice: Number.isFinite(Number(product.costPrice)) ? Number(product.costPrice) : 0,
    unit: product.unit || "un",
    location: product.location || "—",
    supplier: product.supplier || "—",
    createdAt: product.createdAt || new Date().toISOString().split("T")[0],
    updatedAt: product.updatedAt || new Date().toISOString().split("T")[0],
    isActive: product.isActive ?? true,
  }));
  const categories = asArray<Category>(inventory.categories ?? data.categories, defaults.inventory.categories);
  const movements = asArray<Movement>(inventory.movements ?? data.movements, defaults.inventory.movements).map((movement) => ({
    ...movement,
    type: migrateMovementType(movement.type),
    userId: movement.userId || "Usuário KryoStock",
  }));
  const users = asArray<UserAccount>(data.users, defaults.users).map(migrateUserPassword);
  const currentUserId = typeof data.currentUserId === "string" ? data.currentUserId : data.currentSession?.userId;
  const darkMode = typeof data.darkMode === "boolean" ? data.darkMode : Boolean(data.settings?.darkMode);

  return {
    schemaVersion: String(data.schemaVersion || SCHEMA_VERSION),
    users,
    currentSession: currentUserId ? { userId: currentUserId, loggedAt: data.currentSession?.loggedAt || new Date().toISOString() } : null,
    inventory: { products, categories, movements },
    settings: {
      darkMode,
      appName: "KryoStock",
      version: String(data.settings?.version || "1.0.0"),
    },
  };
}

export function buildAppData(args: {
  products: Product[];
  categories: Category[];
  movements: Movement[];
  users: UserAccount[];
  currentUserId: string | null;
  darkMode: boolean;
}): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    users: args.users.map(migrateUserPassword),
    currentSession: args.currentUserId ? { userId: args.currentUserId, loggedAt: new Date().toISOString() } : null,
    inventory: {
      products: args.products,
      categories: args.categories,
      movements: args.movements,
    },
    settings: {
      darkMode: args.darkMode,
      appName: "KryoStock",
      version: "1.0.0",
    },
  };
}

export function loadLocalFallback(): AppData {
  try {
    const raw = localStorage.getItem("kryostock_appData");
    if (raw) return normalizeAppData(JSON.parse(raw));
  } catch {}
  return normalizeAppData({
    products: safeLocal("kryostock_products", initialProducts),
    categories: safeLocal("kryostock_categories", initialCategories),
    movements: safeLocal("kryostock_movements", initialMovements),
    users: safeLocal("kryostock_users", []),
    currentUserId: safeLocal("kryostock_currentUserId", null),
    darkMode: safeLocal("kryostock_darkMode", false),
  });
}

function safeLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export async function loadPersistentData(): Promise<AppData | null> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch("/api/data", {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    return normalizeAppData(await response.json());
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function savePersistentData(data: AppData): Promise<boolean> {
  try {
    const response = await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data, null, 2),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function saveLocalFallback(data: AppData): void {
  try {
    localStorage.setItem("kryostock_appData", JSON.stringify(data));
    localStorage.setItem("kryostock_products", JSON.stringify(data.inventory.products));
    localStorage.setItem("kryostock_categories", JSON.stringify(data.inventory.categories));
    localStorage.setItem("kryostock_movements", JSON.stringify(data.inventory.movements));
    localStorage.setItem("kryostock_users", JSON.stringify(data.users));
    localStorage.setItem("kryostock_currentUserId", JSON.stringify(data.currentSession?.userId ?? null));
    localStorage.setItem("kryostock_darkMode", JSON.stringify(data.settings.darkMode));
  } catch {
    throw new Error("Não foi possível salvar os dados localmente.");
  }
}

export function downloadBackup(data: AppData): void {
  const exportData: AppData = { ...data, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kryostock-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File): Promise<AppData> {
  const text = await file.text();
  return normalizeAppData(JSON.parse(text));
}
