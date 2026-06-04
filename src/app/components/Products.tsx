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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
import { Plus, Search, MoreVertical, Pencil, Trash2, Package, Filter } from "lucide-react";
import type { Product, Category } from "./types";
import { ProductModal } from "./ProductModal";

type Props = {
  products: Product[];
  categories: Category[];
  onAdd: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => boolean | void;
  onEdit: (id: string, data: Omit<Product, "id" | "createdAt" | "updatedAt">) => boolean | void;
  onDelete: (id: string) => void;
  onReactivate?: (id: string) => void;
};

export function Products({ products, categories, onAdd, onEdit, onDelete, onReactivate }: Props) {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [filterActive, setFilterActive] = useState("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "all" || p.categoryId === filterCategory;
      const matchStock =
        filterStock === "all" ||
        (filterStock === "low" && p.quantity <= p.minStock && p.quantity > 0) ||
        (filterStock === "out" && p.quantity === 0) ||
        (filterStock === "ok" && p.quantity > p.minStock);
      const matchActive =
        filterActive === "all" ||
        (filterActive === "active" && p.isActive !== false) ||
        (filterActive === "inactive" && p.isActive === false);
      return matchSearch && matchCat && matchStock && matchActive;
    });
  }, [products, search, filterCategory, filterStock, filterActive]);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const getCategoryColor = (id: string) => categories.find((c) => c.id === id)?.color ?? "#888";

  const getStockStatus = (p: Product) => {
    if (p.quantity === 0) return { label: "Zerado", variant: "destructive" as const };
    if (p.quantity <= p.minStock) return { label: "Baixo", variant: "secondary" as const };
    return { label: "OK", variant: "outline" as const };
  };

  const handleSave = (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const saved = editProduct ? onEdit(editProduct.id, data) : onAdd(data);
    if (saved === false) return false;
    setEditProduct(null);
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Produtos</h1>
          <p className="text-muted-foreground mt-1">{products.filter((p) => p.isActive !== false).length} produtos ativos • {products.length} no total</p>
        </div>
        <Button onClick={() => { setEditProduct(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
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
                placeholder="Buscar por nome, SKU ou fornecedor..."
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStock} onValueChange={setFilterStock}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo estoque</SelectItem>
                <SelectItem value="ok">Normal</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="out">Zerado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mb-3 opacity-30" />
              <p>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Mín.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const status = getStockStatus(p);
                    const catColor = getCategoryColor(p.categoryId);
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{p.name} {p.isActive === false && <Badge variant="secondary" className="ml-2 text-[10px]">Inativo</Badge>}</p>
                            <p className="text-xs text-muted-foreground">{p.supplier}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{p.sku}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                            <span className="text-sm">{getCategoryName(p.categoryId)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{p.quantity} {p.unit}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{p.minStock}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {p.costPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.location}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditProduct(p); setModalOpen(true); }}>
                                <Pencil className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              {p.isActive === false && onReactivate ? (
                                <DropdownMenuItem onClick={() => onReactivate(p.id)}>
                                  <Package className="w-4 h-4 mr-2" /> Reativar
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> {p.isActive === false ? "Excluir" : "Excluir/Inativar"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        onSave={handleSave}
        product={editProduct}
        categories={categories}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ou inativar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se o produto possuir movimentações, ele será inativado para preservar o histórico. Se não possuir histórico, será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
