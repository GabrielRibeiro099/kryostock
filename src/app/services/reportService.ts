import type { Category, Movement, Product } from "../components/types";

export function isEntry(type: Movement["type"]): boolean {
  return type === "entrada" || type === "ajuste_positivo";
}

export function isExit(type: Movement["type"]): boolean {
  return type === "saida" || type === "ajuste_negativo";
}

export function getActiveProducts(products: Product[]): Product[] {
  return products.filter((product) => product.isActive !== false);
}

export function getInventorySummary(products: Product[], movements: Movement[]) {
  const active = getActiveProducts(products);
  return {
    totalProducts: active.length,
    totalItems: active.reduce((sum, product) => sum + product.quantity, 0),
    lowStock: active.filter((product) => product.quantity <= product.minStock),
    outOfStock: active.filter((product) => product.quantity === 0),
    totalCostValue: active.reduce((sum, product) => sum + product.quantity * product.costPrice, 0),
    totalSaleValue: active.reduce((sum, product) => sum + product.quantity * product.price, 0),
    totalMovements: movements.length,
  };
}

export function getWeekMovementData(movements: Movement[]) {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const result = labels.map((day) => ({ day, entradas: 0, saidas: 0 }));
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  movements.forEach((movement) => {
    const date = new Date(`${movement.date}T00:00:00`);
    if (Number.isNaN(date.getTime()) || date < start) return;
    const index = date.getDay();
    if (isEntry(movement.type)) result[index].entradas += movement.quantity;
    if (isExit(movement.type)) result[index].saidas += movement.quantity;
  });
  return result;
}

export function getMonthlyMovementData(movements: Movement[], months = 6) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const now = new Date();
  return Array.from({ length: months }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthMovements = movements.filter((movement) => movement.date.startsWith(key));
    return {
      mes: formatter.format(date).replace(".", ""),
      entradas: monthMovements.filter((m) => isEntry(m.type)).reduce((sum, m) => sum + m.quantity, 0),
      saidas: monthMovements.filter((m) => isExit(m.type)).reduce((sum, m) => sum + m.quantity, 0),
      ajustes: monthMovements.filter((m) => m.type === "correcao_inventario").reduce((sum, m) => sum + m.quantity, 0),
    };
  });
}

export function getCategoryStats(products: Product[], categories: Category[]) {
  return categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id && p.isActive !== false);
    const totalItems = catProducts.reduce((a, p) => a + p.quantity, 0);
    const costValue = catProducts.reduce((a, p) => a + p.quantity * p.costPrice, 0);
    const saleValue = catProducts.reduce((a, p) => a + p.quantity * p.price, 0);
    const margin = saleValue > 0 ? ((saleValue - costValue) / saleValue) * 100 : 0;
    return { name: cat.name, products: catProducts.length, totalItems, costValue, saleValue, margin, color: cat.color };
  });
}

export function getTopMovedProducts(products: Product[], movements: Movement[]) {
  return products
    .filter((product) => product.isActive !== false)
    .map((product) => ({
      product,
      totalMovements: movements.filter((m) => m.productId === product.id).reduce((sum, m) => sum + m.quantity, 0),
    }))
    .sort((a, b) => b.totalMovements - a.totalMovements)
    .slice(0, 8);
}

export function getRecentMovements(movements: Movement[], limit = 8) {
  return [...movements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
