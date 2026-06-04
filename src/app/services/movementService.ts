import type { Movement, MovementType, Product } from "../components/types";

let movementCounter = 0;

function createMovementId(): string {
  movementCounter += 1;
  return `m${Date.now()}-${movementCounter}`;
}

export type MovementInput = { productId: string; type: MovementType; quantity: number; reason: string; date: string };
export type MovementResult =
  | { ok: true; movement: Movement; products: Product[]; label: string }
  | { ok: false; message: string };

export type DeleteMovementResult =
  | { ok: true; movements: Movement[]; products: Product[] }
  | { ok: false; message: string };

export function movementTypeLabel(type: MovementType): string {
  const labels: Record<MovementType, string> = {
    entrada: "Entrada",
    saida: "Saída",
    ajuste_positivo: "Ajuste positivo",
    ajuste_negativo: "Ajuste negativo",
    correcao_inventario: "Correção de inventário",
  };
  return labels[type];
}

function calculateNextQuantity(type: MovementType, previousQty: number, quantity: number): number {
  if (type === "entrada" || type === "ajuste_positivo") return previousQty + quantity;
  if (type === "saida" || type === "ajuste_negativo") return previousQty - quantity;
  if (type === "correcao_inventario") return quantity;
  return previousQty;
}

export function applyMovement(input: MovementInput, products: Product[], userName: string): MovementResult {
  const product = products.find((item) => item.id === input.productId);
  if (!product) return { ok: false, message: "Produto não encontrado." };
  if (product.isActive === false) return { ok: false, message: "Produto inativo não pode receber nova movimentação." };
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) return { ok: false, message: "Informe uma quantidade válida." };
  if (!input.date) return { ok: false, message: "Informe uma data válida." };
  if (!input.reason.trim()) return { ok: false, message: "Informe o motivo da movimentação." };

  const previousQty = product.quantity;
  const newQty = calculateNextQuantity(input.type, previousQty, input.quantity);

  if (newQty < 0) {
    return { ok: false, message: "Movimentação não registrada: quantidade maior que o estoque disponível." };
  }

  const movement: Movement = {
    id: createMovementId(),
    ...input,
    reason: input.reason.trim(),
    userId: userName || "Usuário KryoStock",
    previousQty,
    newQty,
  };
  return {
    ok: true,
    movement,
    products: products.map((item) => (item.id === input.productId ? { ...item, quantity: newQty, updatedAt: input.date } : item)),
    label: movementTypeLabel(input.type),
  };
}

export function deleteMovement(movementId: string, products: Product[], movements: Movement[]): DeleteMovementResult {
  const targetIndex = movements.findIndex((movement) => movement.id === movementId);
  if (targetIndex < 0) return { ok: false, message: "Movimentação não encontrada." };

  const target = movements[targetIndex];
  const product = products.find((item) => item.id === target.productId);
  if (!product) return { ok: false, message: "Produto relacionado à movimentação não foi encontrado." };

  try {
    const nextMovements = movements.filter((movement) => movement.id !== movementId);
    let runningQty = target.previousQty;

    const recalculatedMovements = nextMovements.map((movement, index) => {
      if (movement.productId !== target.productId || index < targetIndex) return movement;

      const newQty = calculateNextQuantity(movement.type, runningQty, movement.quantity);
      if (newQty < 0) {
        throw new Error("A exclusão deixaria o histórico posterior com estoque negativo.");
      }

      const updated: Movement = {
        ...movement,
        previousQty: runningQty,
        newQty,
      };
      runningQty = newQty;
      return updated;
    });

    const latestDate = new Date().toISOString().split("T")[0];
    return {
      ok: true,
      movements: recalculatedMovements,
      products: products.map((item) =>
        item.id === target.productId
          ? { ...item, quantity: runningQty, updatedAt: latestDate }
          : item
      ),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível excluir a movimentação.",
    };
  }
}
