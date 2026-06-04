import type { Category, Product, Movement } from "./types";

export const initialCategories: Category[] = [
  { id: "cat1", name: "Ferragens", color: "#1d4ed8" },
  { id: "cat2", name: "Elétricos", color: "#0f766e" },
  { id: "cat3", name: "Hidráulicos", color: "#2563eb" },
  { id: "cat4", name: "Embalagens", color: "#7c3aed" },
  { id: "cat5", name: "Segurança", color: "#ea580c" },
  { id: "cat6", name: "Organização", color: "#64748b" },
];

export const initialProducts: Product[] = [
  { id: "p1", name: "Parafuso sextavado M6", sku: "FER-001", categoryId: "cat1", quantity: 500, minStock: 200, price: 0.5, costPrice: 0.22, unit: "pç", location: "Gaveta F-01", supplier: "Metais SP", createdAt: "2026-01-10", updatedAt: "2026-05-20", isActive: true },
  { id: "p2", name: "Arruela lisa M6", sku: "FER-002", categoryId: "cat1", quantity: 750, minStock: 250, price: 0.18, costPrice: 0.07, unit: "pç", location: "Gaveta F-02", supplier: "Metais SP", createdAt: "2026-01-10", updatedAt: "2026-05-20", isActive: true },
  { id: "p3", name: "Fita isolante preta", sku: "ELE-001", categoryId: "cat2", quantity: 34, minStock: 20, price: 8.9, costPrice: 5.4, unit: "un", location: "Prateleira E-01", supplier: "Elétrica Norte", createdAt: "2026-02-02", updatedAt: "2026-05-24", isActive: true },
  { id: "p4", name: "Disjuntor bipolar 32A", sku: "ELE-002", categoryId: "cat2", quantity: 8, minStock: 12, price: 42.9, costPrice: 28.5, unit: "un", location: "Prateleira E-02", supplier: "Elétrica Norte", createdAt: "2026-02-15", updatedAt: "2026-05-22", isActive: true },
  { id: "p5", name: "Mangueira hidráulica 1/2", sku: "HID-001", categoryId: "cat3", quantity: 18, minStock: 10, price: 19.9, costPrice: 11.8, unit: "m", location: "Rack H-01", supplier: "HidroPeças", createdAt: "2026-03-01", updatedAt: "2026-05-18", isActive: true },
  { id: "p6", name: "Conector hidráulico reto", sku: "HID-002", categoryId: "cat3", quantity: 12, minStock: 15, price: 14.9, costPrice: 8.2, unit: "un", location: "Gaveta H-03", supplier: "HidroPeças", createdAt: "2026-03-05", updatedAt: "2026-05-18", isActive: true },
  { id: "p7", name: "Etiqueta térmica 100x150", sku: "EMB-001", categoryId: "cat4", quantity: 22, minStock: 10, price: 55.0, costPrice: 36.0, unit: "rolo", location: "Prateleira B-01", supplier: "PrintPack", createdAt: "2026-03-18", updatedAt: "2026-05-27", isActive: true },
  { id: "p8", name: "Bobina plástica transparente", sku: "EMB-002", categoryId: "cat4", quantity: 6, minStock: 8, price: 119.9, costPrice: 82.0, unit: "bob", location: "Área B-02", supplier: "PackSul", createdAt: "2026-04-01", updatedAt: "2026-05-27", isActive: true },
  { id: "p9", name: "Luva de proteção nitrílica", sku: "SEG-001", categoryId: "cat5", quantity: 40, minStock: 25, price: 7.9, costPrice: 4.2, unit: "par", location: "Armário S-01", supplier: "EPI Brasil", createdAt: "2026-04-08", updatedAt: "2026-05-30", isActive: true },
  { id: "p10", name: "Caixa organizadora 30L", sku: "ORG-001", categoryId: "cat6", quantity: 9, minStock: 6, price: 49.9, costPrice: 31.0, unit: "un", location: "Área O-01", supplier: "Organiza Pro", createdAt: "2026-04-15", updatedAt: "2026-05-30", isActive: true },
];

export const initialMovements: Movement[] = [
  { id: "m1", productId: "p1", type: "entrada", quantity: 200, reason: "Reposição de fornecedor", date: "2026-05-20", userId: "Usuário KryoStock", previousQty: 300, newQty: 500 },
  { id: "m2", productId: "p4", type: "saida", quantity: 6, reason: "Consumo interno", date: "2026-05-22", userId: "Usuário KryoStock", previousQty: 14, newQty: 8 },
  { id: "m3", productId: "p7", type: "entrada", quantity: 10, reason: "Reposição de estoque", date: "2026-05-27", userId: "Usuário KryoStock", previousQty: 12, newQty: 22 },
  { id: "m4", productId: "p8", type: "saida", quantity: 4, reason: "Separação para embalagem", date: "2026-05-27", userId: "Usuário KryoStock", previousQty: 10, newQty: 6 },
  { id: "m5", productId: "p6", type: "ajuste_negativo", quantity: 3, reason: "Contagem física", date: "2026-05-18", userId: "Usuário KryoStock", previousQty: 15, newQty: 12 },
  { id: "m6", productId: "p10", type: "correcao_inventario", quantity: 9, reason: "Inventário físico", date: "2026-05-30", userId: "Usuário KryoStock", previousQty: 7, newQty: 9 },
];
