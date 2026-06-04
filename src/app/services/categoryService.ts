import type { Category, Product } from "../components/types";
import { validateCategoryInput, type ValidationResult } from "./validationService";

export function createCategory(data: Omit<Category, "id">, categories: Category[]): { result: ValidationResult; category?: Category } {
  const result = validateCategoryInput(data, categories);
  if (!result.ok) return { result };
  return { result, category: { ...data, name: data.name.trim(), id: `cat${Date.now()}` } };
}

export function updateCategory(id: string, data: Omit<Category, "id">, categories: Category[]): { result: ValidationResult; categories?: Category[] } {
  const result = validateCategoryInput(data, categories, id);
  if (!result.ok) return { result };
  return {
    result,
    categories: categories.map((category) => (category.id === id ? { ...category, ...data, name: data.name.trim() } : category)),
  };
}

export function canDeleteCategory(id: string, products: Product[]): { ok: true } | { ok: false; linkedProducts: number; message: string } {
  const linkedProducts = products.filter((product) => product.categoryId === id).length;
  if (linkedProducts > 0) {
    return { ok: false, linkedProducts, message: `Não é possível excluir: ${linkedProducts} produto(s) usam esta categoria.` };
  }
  return { ok: true };
}
