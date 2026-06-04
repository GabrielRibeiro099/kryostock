import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { Product, Category } from "./types";

type FormData = Omit<Product, "id" | "createdAt" | "updatedAt">;

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => boolean | void;
  product?: Product | null;
  categories: Category[];
};

const UNITS = ["un", "pç", "cx", "pct", "kg", "g", "L", "mL", "m", "resma"];

export function ProductModal({ open, onClose, onSave, product, categories }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      quantity: 0,
      minStock: 5,
      price: 0,
      costPrice: 0,
      unit: "un",
      location: "",
      supplier: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        quantity: product.quantity,
        minStock: product.minStock,
        price: product.price,
        costPrice: product.costPrice,
        unit: product.unit,
        location: product.location,
        supplier: product.supplier,
        isActive: product.isActive ?? true,
      });
    } else {
      reset({
        name: "",
        sku: "",
        categoryId: "",
        quantity: 0,
        minStock: 5,
        price: 0,
        costPrice: 0,
        unit: "un",
        location: "",
        supplier: "",
        isActive: true,
      });
    }
  }, [product, open]);

  const onSubmit = (data: FormData) => {
    const saved = onSave({ ...data, isActive: data.isActive ?? true });
    if (saved !== false) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          <DialogDescription>
            {product ? "Atualize as informações do produto." : "Preencha os dados para cadastrar um novo produto."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                {...register("name", { required: true })}
                placeholder="Ex: Notebook Dell Inspiron"
                className={errors.name ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sku">SKU / Código *</Label>
              <Input
                id="sku"
                {...register("sku", { required: true })}
                placeholder="Ex: ELE-001"
                className={errors.sku ? "border-destructive" : ""}
              />
            </div>

            <div className="space-y-1">
              <Label>Categoria *</Label>
              <Select
                value={watch("categoryId")}
                onValueChange={(v) => setValue("categoryId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="quantity">Quantidade Inicial</Label>
              <Input
                id="quantity"
                type="number"
                min={0}
                {...register("quantity", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                min={0}
                {...register("minStock", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="costPrice">Preço de Custo (R$) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min={0}
                {...register("costPrice", { valueAsNumber: true, required: true })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">Preço de Venda (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min={0}
                {...register("price", { valueAsNumber: true, required: true })}
              />
            </div>

            <div className="space-y-1">
              <Label>Unidade</Label>
              <Select
                value={watch("unit")}
                onValueChange={(v) => setValue("unit", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Ex: Prateleira A1"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="supplier">Fornecedor</Label>
              <Input
                id="supplier"
                {...register("supplier")}
                placeholder="Nome do fornecedor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{product ? "Salvar" : "Criar Produto"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
