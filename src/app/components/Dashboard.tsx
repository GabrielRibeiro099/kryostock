import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCcw,
  ChevronRight,
} from "lucide-react";
import type { Product, Category, Movement } from "./types";
import { getWeekMovementData, isEntry, isExit } from "../services/reportService";

type Props = {
  products: Product[];
  categories: Category[];
  movements: Movement[];
  onNavigate: (view: string) => void;
};

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];

export function Dashboard({ products, categories, movements, onNavigate }: Props) {
  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive !== false);
    const totalProducts = activeProducts.length;
    const lowStock = activeProducts.filter((p) => p.quantity <= p.minStock);
    const outOfStock = activeProducts.filter((p) => p.quantity === 0);
    const totalValue = activeProducts.reduce((acc, p) => acc + p.quantity * p.costPrice, 0);
    const totalSalesValue = activeProducts.reduce((acc, p) => acc + p.quantity * p.price, 0);

    const last30Days = movements.slice(-8);
    const entries = movements.filter((m) => isEntry(m.type)).reduce((a, m) => a + m.quantity, 0);
    const exits = movements.filter((m) => isExit(m.type)).reduce((a, m) => a + m.quantity, 0);

    return { totalProducts, lowStock, outOfStock, totalValue, totalSalesValue, last30Days, entries, exits };
  }, [products, movements]);

  const categoryData = useMemo(() => {
    return categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id && p.isActive !== false);
      const total = catProducts.reduce((a, p) => a + p.quantity, 0);
      const value = catProducts.reduce((a, p) => a + p.quantity * p.costPrice, 0);
      return { name: cat.name, total, value, color: cat.color };
    });
  }, [products, categories]);

  const movementChartData = useMemo(() => getWeekMovementData(movements), [movements]);

  const recentMovements = [...movements].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu estoque</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-3xl font-semibold mt-1">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-1">{categories.length} categorias</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-3xl font-semibold mt-1 text-orange-600">{stats.lowStock.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.outOfStock.length} sem estoque</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-50">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor do Estoque</p>
                <p className="text-3xl font-semibold mt-1">
                  {stats.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Custo total</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Movimentações</p>
                <p className="text-3xl font-semibold mt-1">{movements.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{stats.entries} entradas · {stats.exits} saídas</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Movimentações da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                Entradas
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                Saídas
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={movementChartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="total"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`dashboard-pie-${entry.name}-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v} un`, "Qtd"]} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {categoryData.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span>{cat.total} un</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Alertas de Estoque
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("products")} className="text-xs">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta no momento</p>
            ) : (
              stats.lowStock.slice(0, 5).map((p) => {
                const pct = Math.min((p.quantity / p.minStock) * 100, 100);
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[200px]">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{p.quantity}/{p.minStock}</span>
                        <Badge variant={p.quantity === 0 ? "destructive" : "secondary"} className="text-xs">
                          {p.quantity === 0 ? "Zerado" : "Baixo"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Últimas Movimentações</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("movements")} className="text-xs">
              Ver todas <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMovements.map((m) => {
              const product = products.find((p) => p.id === m.productId);
              const icons = {
                entrada: <ArrowUpCircle className="w-4 h-4 text-green-500" />,
                saida: <ArrowDownCircle className="w-4 h-4 text-red-500" />,
                ajuste_positivo: <RotateCcw className="w-4 h-4 text-blue-500" />,
                ajuste_negativo: <RotateCcw className="w-4 h-4 text-blue-500" />,
                correcao_inventario: <RotateCcw className="w-4 h-4 text-blue-500" />,
              };
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0">{icons[m.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{m.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">
                      {m.type === "saida" ? "-" : "+"}{m.quantity} {product?.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.date}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
