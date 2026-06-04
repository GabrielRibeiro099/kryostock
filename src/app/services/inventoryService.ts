import type { Category, Movement, Product } from "../components/types";
import { validateProductInput, type ValidationResult } from "./validationService";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">,
  products: Product[],
  categories: Category[]
): { result: ValidationResult; product?: Product } {
  const result = validateProductInput(data, products, categories);
  if (!result.ok) return { result };
  return {
    result,
    product: {
      ...data,
      name: data.name.trim(),
      sku: data.sku.trim(),
      unit: data.unit.trim(),
      supplier: data.supplier?.trim() || "—",
      location: data.location?.trim() || "—",
      isActive: data.isActive ?? true,
      id: `p${Date.now()}`,
      createdAt: today(),
      updatedAt: today(),
    },
  };
}

export function updateProduct(
  id: string,
  data: Omit<Product, "id" | "createdAt" | "updatedAt">,
  products: Product[],
  categories: Category[]
): { result: ValidationResult; products?: Product[] } {
  const result = validateProductInput(data, products, categories, id);
  if (!result.ok) return { result };
  return {
    result,
    products: products.map((product) =>
      product.id === id
        ? {
            ...product,
            ...data,
            name: data.name.trim(),
            sku: data.sku.trim(),
            unit: data.unit.trim(),
            supplier: data.supplier?.trim() || "—",
            location: data.location?.trim() || "—",
            isActive: data.isActive ?? product.isActive ?? true,
            updatedAt: today(),
          }
        : product
    ),
  };
}

export function deleteOrDeactivateProduct(
  id: string,
  products: Product[],
  movements: Movement[]
): { products: Product[]; action: "deleted" | "deactivated" | "not_found"; message: string } {
  const product = products.find((item) => item.id === id);
  if (!product) return { products, action: "not_found", message: "Produto não encontrado." };
  const hasMovements = movements.some((movement) => movement.productId === id);
  if (!hasMovements) {
    return { products: products.filter((item) => item.id !== id), action: "deleted", message: "Produto excluído." };
  }
  return {
    products: products.map((item) => (item.id === id ? { ...item, isActive: false, updatedAt: today() } : item)),
    action: "deactivated",
    message: "Produto possui histórico e foi inativado para preservar as movimentações.",
  };
}

export function reactivateProduct(id: string, products: Product[]): Product[] {
  return products.map((product) => (product.id === id ? { ...product, isActive: true, updatedAt: today() } : product));
}
