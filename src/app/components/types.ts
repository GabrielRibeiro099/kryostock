export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  quantity: number;
  minStock: number;
  price: number;
  costPrice: number;
  unit: string;
  location: string;
  supplier: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
};

export type MovementType = "entrada" | "saida" | "ajuste_positivo" | "ajuste_negativo" | "correcao_inventario";

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  passwordSalt?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Movement = {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  date: string;
  userId: string;
  previousQty: number;
  newQty: number;
};

export type CurrentSession = {
  userId: string;
  loggedAt: string;
};

export type AppSettings = {
  darkMode: boolean;
  appName: string;
  version: string;
};

export type AppData = {
  schemaVersion: string;
  users: UserAccount[];
  currentSession: CurrentSession | null;
  inventory: {
    products: Product[];
    categories: Category[];
    movements: Movement[];
  };
  settings: AppSettings;
  exportedAt?: string;
};

export type AppView = "dashboard" | "products" | "movements" | "categories" | "reports" | "settings";
