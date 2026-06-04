import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
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
import { Plus, Pencil, Trash2, Tag, AlertTriangle } from "lucide-react";
import type { Category, Product } from "./types";

type Props = {
  categories: Category[];
  products: Product[];
  onAdd: (data: Omit<Category, "id">) => boolean | void;
  onEdit: (id: string, data: Omit<Category, "id">) => boolean | void;
  onDelete: (id: string) => void;
};

const PRESET_COLORS = [
  "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#ec4899",
  "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4",
];

export function Categories({ categories, products, onAdd, onEdit, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditCat(cat);
      setName(cat.name);
      setColor(cat.color);
    } else {
      setEditCat(null);
      setName("");
      setColor(PRESET_COLORS[0]);
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const saved = editCat ? onEdit(editCat.id, { name: name.trim(), color }) : onAdd({ name: name.trim(), color });
    if (saved !== false) setModalOpen(false);
  };

  const getProductCount = (catId: string) => products.filter((p) => p.categoryId === catId).length;
  const getTotalStock = (catId: string) =>
    products.filter((p) => p.categoryId === catId).reduce((a, p) => a + p.quantity, 0);
  const getTotalValue = (catId: string) =>
    products.filter((p) => p.categoryId === catId).reduce((a, p) => a + p.quantity * p.costPrice, 0);

  const deletingCat = categories.find((c) => c.id === deleteId);
  const deletingProductCount = deleteId ? getProductCount(deleteId) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Categorias</h1>
          <p className="text-muted-foreground mt-1">{categories.length} categorias cadastradas</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const count = getProductCount(cat.id);
          const stock = getTotalStock(cat.id);
          const value = getTotalValue(cat.id);
          return (
            <Card key={cat.id} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: cat.color }} />
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + "20" }}>
                      <Tag className="w-4 h-4" style={{ color: cat.color }} />
                    </div>
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openModal(cat)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(cat.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-semibold">{count}</p>
                    <p className="text-xs text-muted-foreground">Produtos</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-semibold">{stock}</p>
                    <p className="text-xs text-muted-foreground">Em estoque</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-semibold">
                      {value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de criação/edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCat ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editCat ? "Atualize o nome e a cor da categoria." : "Defina o nome e a cor para a nova categoria."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="catName">Nome *</Label>
              <Input
                id="catName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Eletrônicos"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "#030213" : "transparent",
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <div className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
              <span className="text-sm">{name || "Prévia da categoria"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {editCat ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{deletingCat?.name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {deletingProductCount > 0 ? (
                  <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      Esta categoria possui <strong>{deletingProductCount} produto(s)</strong> vinculado(s).
                      A exclusão será bloqueada para preservar a consistência do estoque.
                    </p>
                  </div>
                ) : null}
                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
