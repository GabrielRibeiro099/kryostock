import type { Category, Product } from "../components/types";

export type ValidationResult = { ok: true; warning?: string } | { ok: false; message: string };

function isValidNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value);
}

export function validateProductInput(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">,
  products: Product[],
  categories: Category[],
  editingId?: string
): ValidationResult {
  const name = data.name?.trim();
  const sku = data.sku?.trim();
  if (!name) return { ok: false, message: "Informe o nome do produto." };
  if (!sku) return { ok: false, message: "Informe o SKU do produto." };
  if (!data.categoryId || !categories.some((category) => category.id === data.categoryId)) {
    return { ok: false, message: "Selecione uma categoria válida." };
  }
  if (!data.unit?.trim()) return { ok: false, message: "Informe a unidade do produto." };

  const duplicatedSku = products.some(
    (product) => product.id !== editingId && product.sku.trim().toLowerCase() === sku.toLowerCase()
  );
  if (duplicatedSku) return { ok: false, message: "Já existe um produto cadastrado com este SKU." };

  const numericFields: Array<[keyof Pick<Product, "quantity" | "minStock" | "costPrice" | "price">, string]> = [
    ["quantity", "estoque"],
    ["minStock", "estoque mínimo"],
    ["costPrice", "preço de custo"],
    ["price", "preço de venda"],
  ];
  for (const [field, label] of numericFields) {
    if (!isValidNumber(data[field]) || data[field] < 0) {
      return { ok: false, message: `Informe um valor válido para ${label}.` };
    }
  }

  if (data.price < data.costPrice) {
    return { ok: true, warning: "Preço de venda menor que o custo. Produto salvo, mas revise a margem." };
  }
  return { ok: true };
}

export function validateCategoryInput(data: Omit<Category, "id">, categories: Category[], editingId?: string): ValidationResult {
  const name = data.name?.trim();
  if (!name) return { ok: false, message: "Informe o nome da categoria." };
  const duplicated = categories.some(
    (category) => category.id !== editingId && category.name.trim().toLowerCase() === name.toLowerCase()
  );
  if (duplicated) return { ok: false, message: "Já existe uma categoria com este nome." };
  return { ok: true };
}
