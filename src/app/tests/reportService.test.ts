import { describe, expect, it } from "vitest";
import { getInventorySummary, getMonthlyMovementData } from "../services/reportService";
import type { Movement, Product } from "../components/types";

const products: Product[] = [
  { id: "p1", name: "A", sku: "A", categoryId: "c1", quantity: 10, minStock: 2, price: 3, costPrice: 1, unit: "un", location: "", supplier: "", createdAt: "", updatedAt: "", isActive: true },
  { id: "p2", name: "B", sku: "B", categoryId: "c1", quantity: 0, minStock: 1, price: 2, costPrice: 1, unit: "un", location: "", supplier: "", createdAt: "", updatedAt: "", isActive: false },
];
const movements: Movement[] = [
  { id: "m1", productId: "p1", type: "entrada", quantity: 4, reason: "Compra", date: new Date().toISOString().slice(0, 7) + "-01", userId: "U", previousQty: 6, newQty: 10 },
];

describe("reportService", () => {
  it("calcula valor total apenas de produtos ativos", () => {
    expect(getInventorySummary(products, movements).totalCostValue).toBe(10);
  });

  it("gera dados mensais determinísticos sem valores aleatórios", () => {
    const first = getMonthlyMovementData(movements, 1);
    const second = getMonthlyMovementData(movements, 1);
    expect(first).toEqual(second);
  });
});
