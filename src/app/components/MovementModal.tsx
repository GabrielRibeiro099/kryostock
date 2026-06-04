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
import type { Product, Movement, MovementType } from "./types";

type FormData = {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  date: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => boolean | void;
  products: Product[];
  defaultProductId?: string;
};

const REASONS: Record<MovementType, string[]> = {
  entrada: ["Compra de fornecedor", "Devolução de cliente", "Transferência recebida", "Reposição de estoque", "Outro"],
  saida: ["Venda para cliente", "Transferência enviada", "Consumo interno", "Descarte", "Outro"],
  ajuste_positivo: ["Correção de inventário", "Contagem física", "Erro de lançamento", "Reposição manual", "Outro"],
  ajuste_negativo: ["Correção de inventário", "Contagem física", "Perda", "Avaria", "Outro"],
  correcao_inventario: ["Inventário físico", "Correção de contagem", "Auditoria de estoque", "Outro"],
};

export function MovementModal({ open, onClose, onSave, products, defaultProductId }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      productId: defaultProductId ?? "",
      type: "entrada",
      quantity: 1,
      reason: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (open) {
      reset({
        productId: defaultProductId ?? "",
        type: "entrada",
        quantity: 1,
        reason: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, defaultProductId]);

  const onSubmit = (data: FormData) => {
    const saved = onSave(data);
    if (saved !== false) onClose();
  };

  const selectedProduct = products.find((p) => p.id === watch("productId"));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>
            Informe o produto, tipo, quantidade e motivo da movimentação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Produto *</Label>
            <Select
              value={watch("productId")}
              onValueChange={(v) => setValue("productId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent>
                {products.filter((p) => p.isActive !== false).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.quantity} {p.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select
              value={watch("type")}
              onValueChange={(v) => setValue("type", v as MovementType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste_positivo">Ajuste positivo</SelectItem>
                <SelectItem value="ajuste_negativo">Ajuste negativo</SelectItem>
                <SelectItem value="correcao_inventario">Correção de inventário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="quantity">
              Quantidade *{selectedProduct && ` (atual: ${selectedProduct.quantity} ${selectedProduct.unit})`}
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              {...register("quantity", { valueAsNumber: true, required: true, min: 1 })}
              className={errors.quantity ? "border-destructive" : ""}
            />
          </div>

          <div className="space-y-1">
            <Label>Motivo *</Label>
            <Select
              value={watch("reason")}
              onValueChange={(v) => setValue("reason", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {REASONS[selectedType].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              {...register("date", { required: true })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              disabled={!watch("productId") || !watch("reason")}
            >
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
