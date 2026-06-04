import { useState, useMemo } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, RotateCcw, TrendingUp, Trash2 } from "lucide-react";
import type { Product, Category, Movement } from "./types";
import { MovementModal } from "./MovementModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type Props = {
  movements: Movement[];
  products: Product[];
  categories: Category[];
  onAdd: (data: Omit<Movement, "id" | "previousQty" | "newQty" | "userId">) => boolean | void;
  onDelete: (id: string) => boolean | void;
};

export function Movements({ movements, products, categories, onAdd, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);

  const filtered = useMemo(() => {
    return [...movements].reverse().filter((m) => {
      const product = products.find((p) => p.id === m.productId);
      const matchSearch =
        product?.name.toLowerCase().includes(search.toLowerCase()) ||
        m.reason.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || m.type === filterType;
      return matchSearch && matchType;
    });
  }, [movements, products, search, filterType]);

  const stats = useMemo(() => {
    const entries = movements.filter((m) => m.type === "entrada");
    const exits = movements.filter((m) => m.type === "saida");
    const adjustments = movements.filter((m) => m.type === "ajuste_positivo" || m.type === "ajuste_negativo" || m.type === "correcao_inventario");
    return {
      totalEntries: entries.reduce((a, m) => a + m.quantity, 0),
      totalExits: exits.reduce((a, m) => a + m.quantity, 0),
      totalAdjustments: adjustments.length,
    };
  }, [movements]);

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const typeConfig = {
    entrada: { label: "Entrada", color: "text-green-600", bg: "bg-green-50", icon: <ArrowUpCircle className="w-4 h-4" /> },
    saida: { label: "Saída", color: "text-red-600", bg: "bg-red-50", icon: <ArrowDownCircle className="w-4 h-4" /> },
    ajuste_positivo: { label: "Ajuste +", color: "text-blue-600", bg: "bg-blue-50", icon: <RotateCcw className="w-4 h-4" /> },
    ajuste_negativo: { label: "Ajuste -", color: "text-blue-600", bg: "bg-blue-50", icon: <RotateCcw className="w-4 h-4" /> },
    correcao_inventario: { label: "Inventário", color: "text-blue-600", bg: "bg-blue-50", icon: <RotateCcw className="w-4 h-4" /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Movimentações</h1>
          <p className="text-muted-foreground mt-1">Histórico de entradas, saídas e ajustes</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <ArrowUpCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="font-semibold">{stats.totalEntries} unidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <ArrowDownCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Saídas</p>
                <p className="font-semibold">{stats.totalExits} unidades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ajustes</p>
                <p className="font-semibold">{stats.totalAdjustments} registros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por produto ou motivo..."
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
                <SelectItem value="ajuste_positivo">Ajustes positivos</SelectItem>
                  <SelectItem value="ajuste_negativo">Ajustes negativos</SelectItem>
                  <SelectItem value="correcao_inventario">Correções de inventário</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Anterior</TableHead>
                  <TableHead className="text-right">Novo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const product = getProduct(m.productId);
                  const cfg = typeConfig[m.type];
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{m.date}</TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                          {cfg.icon}
                          {cfg.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{product?.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{product?.sku ?? ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className={`text-right font-semibold text-sm ${cfg.color}`}>
                        {(m.type === "saida" || m.type === "ajuste_negativo") ? "-" : m.type === "correcao_inventario" ? "=" : "+"}{m.quantity} {product?.unit ?? ""}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{m.previousQty}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{m.newQty}</TableCell>
                      <TableCell className="text-sm">{m.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.userId}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir movimentação"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setMovementToDelete(m)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <MovementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onAdd}
        products={products}
      />

      <AlertDialog open={Boolean(movementToDelete)} onOpenChange={(open) => !open && setMovementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o registro selecionado e recalcula o estoque do produto relacionado.
              O KryoStock bloqueará a exclusão se ela deixar o histórico inconsistente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (!movementToDelete) return;
                const deleted = onDelete(movementToDelete.id);
                if (deleted !== false) setMovementToDelete(null);
              }}
            >
              Excluir movimentação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
