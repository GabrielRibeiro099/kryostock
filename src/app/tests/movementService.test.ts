import { describe, expect, it } from "vitest";
import { applyMovement, deleteMovement } from "../services/movementService";
import type { Product } from "../components/types";

const product: Product = {
  id: "p1",
  name: "Parafuso",
  sku: "FER-001",
  categoryId: "cat1",
  quantity: 10,
  minStock: 2,
  price: 1,
  costPrice: 0.5,
  unit: "pç",
  location: "A1",
  supplier: "Fornecedor",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  isActive: true,
};

describe("movementService", () => {
  it("entrada aumenta estoque", () => {
    const result = applyMovement({ productId: "p1", type: "entrada", quantity: 5, reason: "Compra", date: "2026-01-02" }, [product], "Gabriel");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.products[0].quantity).toBe(15);
  });

  it("bloqueia saída maior que estoque", () => {
    const result = applyMovement({ productId: "p1", type: "saida", quantity: 50, reason: "Venda", date: "2026-01-02" }, [product], "Gabriel");
    expect(result.ok).toBe(false);
  });

  it("correção de inventário define estoque final", () => {
    const result = applyMovement({ productId: "p1", type: "correcao_inventario", quantity: 3, reason: "Inventário", date: "2026-01-02" }, [product], "Gabriel");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.products[0].quantity).toBe(3);
  });

  it("exclui movimentação e recalcula estoque", () => {
    const entrada = applyMovement({ productId: "p1", type: "entrada", quantity: 5, reason: "Compra", date: "2026-01-02" }, [product], "Gabriel");
    expect(entrada.ok).toBe(true);
    if (!entrada.ok) return;

    const saida = applyMovement({ productId: "p1", type: "saida", quantity: 3, reason: "Venda", date: "2026-01-03" }, entrada.products, "Gabriel");
    expect(saida.ok).toBe(true);
    if (!saida.ok) return;

    const result = deleteMovement(entrada.movement.id, saida.products, [entrada.movement, saida.movement]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.products[0].quantity).toBe(7);
      expect(result.movements[0].previousQty).toBe(10);
      expect(result.movements[0].newQty).toBe(7);
    }
  });
});
