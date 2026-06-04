import { describe, expect, it } from "vitest";
import { createProduct, deleteOrDeactivateProduct } from "../services/inventoryService";
import type { Category, Movement, Product } from "../components/types";

const categories: Category[] = [{ id: "cat1", name: "Ferragens", color: "#1d4ed8" }];
const product: Product = {
  id: "p1", name: "Parafuso", sku: "FER-001", categoryId: "cat1", quantity: 10, minStock: 2, price: 1, costPrice: 0.5, unit: "pç", location: "A1", supplier: "Fornecedor", createdAt: "2026-01-01", updatedAt: "2026-01-01", isActive: true
};

describe("inventoryService", () => {
  it("bloqueia SKU duplicado", () => {
    const { id, createdAt, updatedAt, ...productData } = product;
    const result = createProduct({ ...productData, sku: "FER-001" }, [product], categories);
    expect(result.result.ok).toBe(false);
  });

  it("inativa produto com histórico em vez de excluir", () => {
    const movements: Movement[] = [{ id: "m1", productId: "p1", type: "entrada", quantity: 1, reason: "Compra", date: "2026-01-02", userId: "Teste", previousQty: 9, newQty: 10 }];
    const result = deleteOrDeactivateProduct("p1", [product], movements);
    expect(result.action).toBe("deactivated");
    expect(result.products[0].isActive).toBe(false);
  });
});
