import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
  LineChart,
  Line,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import type { Product, Category, Movement } from "./types";
import { getMonthlyMovementData } from "../services/reportService";

type Props = {
  products: Product[];
  categories: Category[];
  movements: Movement[];
};

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899", "#14b8a6"];

export function Reports({ products, categories, movements }: Props) {
  const categoryStats = useMemo(() => {
    return categories.map((cat, i) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id && p.isActive !== false);
      const totalItems = catProducts.reduce((a, p) => a + p.quantity, 0);
      const costValue = catProducts.reduce((a, p) => a + p.quantity * p.costPrice, 0);
      const saleValue = catProducts.reduce((a, p) => a + p.quantity * p.price, 0);
      const margin = costValue > 0 ? ((saleValue - costValue) / saleValue) * 100 : 0;
      return {
        name: cat.name,
        color: cat.color || COLORS[i % COLORS.length],
        products: catProducts.length,
        items: totalItems,
        costValue,
        saleValue,
        margin,
      };
    });
  }, [products, categories]);

  const topProducts = useMemo(() => {
    return [...products.filter((p) => p.isActive !== false)]
      .sort((a, b) => b.quantity * b.costPrice - a.quantity * a.costPrice)
      .slice(0, 8)
      .map((p) => ({
        ...p,
        totalCost: p.quantity * p.costPrice,
        totalSale: p.quantity * p.price,
        margin: p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0,
        catName: categories.find((c) => c.id === p.categoryId)?.name ?? "—",
      }));
  }, [products, categories]);

  const movementTrend = useMemo(() => {
    return getMonthlyMovementData(movements, 6).map((item) => ({
      month: item.mes,
      entradas: item.entradas,
      saidas: item.saidas,
    }));
  }, [movements]);

  const activeProducts = products.filter((p) => p.isActive !== false);
  const totalCostValue = activeProducts.reduce((a, p) => a + p.quantity * p.costPrice, 0);
  const totalSaleValue = activeProducts.reduce((a, p) => a + p.quantity * p.price, 0);
  const potentialProfit = totalSaleValue - totalCostValue;
  const overallMargin = totalSaleValue > 0 ? (potentialProfit / totalSaleValue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1>Relatórios</h1>
        <p className="text-muted-foreground mt-1">Análise completa do estoque</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground">Valor de Custo</p>
            <p className="text-2xl font-semibold mt-1">
              {totalCostValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground">Valor de Venda</p>
            <p className="text-2xl font-semibold mt-1 text-green-700">
              {totalSaleValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground">Lucro Potencial</p>
            <p className="text-2xl font-semibold mt-1 text-blue-600">
              {potentialProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-muted-foreground">Margem Média</p>
            <p className="text-2xl font-semibold mt-1 text-purple-600">{overallMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Valor por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryStats} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "Custo"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="costValue" name="Custo" radius={[0, 4, 4, 0]}>
                  {categoryStats.map((entry, i) => (
                    <Cell key={`reports-bar-${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Movement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Movimentações</CardTitle>
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
              <LineChart data={movementTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="saidas" name="Saídas" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Valor Custo</TableHead>
                <TableHead className="text-right">Valor Venda</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryStats.map((cat, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{cat.products}</TableCell>
                  <TableCell className="text-right">{cat.items}</TableCell>
                  <TableCell className="text-right">
                    {cat.costValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-right">
                    {cat.saleValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={cat.margin > 30 ? "outline" : "secondary"} className="text-xs">
                      {cat.margin.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Produtos por Valor</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Custo unit.</TableHead>
                <TableHead className="text-right">Total Custo</TableHead>
                <TableHead className="text-right">Total Venda</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground font-medium">{i + 1}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{p.catName}</TableCell>
                  <TableCell className="text-right text-sm">{p.quantity} {p.unit}</TableCell>
                  <TableCell className="text-right text-sm">
                    {p.costPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {p.totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-700">
                    {p.totalSale.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`text-sm font-medium ${p.margin > 30 ? "text-green-600" : "text-orange-600"}`}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
