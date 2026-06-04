import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
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
import { Download, LogOut, Moon, Save, Sun, Upload, UserCircle, Shield, Settings as SettingsIcon } from "lucide-react";
import type { UserAccount } from "./types";

type Props = {
  user: UserAccount;
  onUpdateUser: (id: string, data: Partial<Pick<UserAccount, "name" | "avatarUrl" | "password">>) => void;
  onLogout: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
};

const brandLogo = "/kryostock-icon.png";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "KS";
}

export function Settings({ user, onUpdateUser, onLogout, onExportBackup, onImportBackup, darkMode, onToggleDarkMode }: Props) {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [pendingBackup, setPendingBackup] = useState<File | null>(null);

  const handleAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Escolha um arquivo de imagem válido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Selecione um backup JSON válido.");
      return;
    }
    setPendingBackup(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }
    if (password && password.length < 4) {
      toast.error("A nova senha precisa ter pelo menos 4 caracteres.");
      return;
    }
    onUpdateUser(user.id, {
      name: name.trim(),
      avatarUrl,
      ...(password ? { password } : {}),
    });
    setPassword("");
    toast.success("Configurações atualizadas no KryoStock.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={brandLogo} alt="Logo KryoStock" className="w-12 h-12 rounded-2xl object-contain" />
          <div>
            <h1>Configurações</h1>
            <p className="text-muted-foreground mt-1">Gerencie sua conta e preferências do KryoStock</p>
          </div>
        </div>
        <Button variant="outline" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair da conta
        </Button>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              Perfil do usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover border" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border">
                  {initials(name)}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-background hover:bg-accent transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  Trocar avatar
                </Label>
                <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                {avatarUrl && (
                  <button type="button" className="block text-sm text-muted-foreground hover:text-foreground" onClick={() => setAvatarUrl("")}>Remover avatar</button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="userName">Nome</Label>
              <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Deixe em branco para manter a atual" />
            </div>

            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Salvar alterações
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Sobre o KryoStock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                KryoStock é um aplicativo portátil de controle de estoque desenvolvido como projeto de portfólio em Engenharia de Software. O sistema permite gerenciar produtos, categorias, movimentações, relatórios e indicadores com persistência local de dados.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Aplicativo portátil para Windows",
                  "Dados salvos localmente",
                  "Interface clara e escura",
                  "Controle operacional de estoque",
                  "Versão 1.0.0",
                  "React • TypeScript • Vite",
                ].map((item) => (
                  <div key={item} className="rounded-xl border p-3 bg-card text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Conta local
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                As contas são usadas para identificar o usuário dentro do aplicativo e manter preferências como nome e avatar.
              </p>
              <p>
                A autenticação é local e adequada ao contexto portátil. Em produção, recomenda-se autenticação com backend seguro e criptografia reforçada.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Dados e preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={onExportBackup}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar backup
                </Button>
                <Label htmlFor="backupImport" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors text-sm text-foreground">
                  <Upload className="w-4 h-4" />
                  Importar backup
                </Label>
                <Input id="backupImport" type="file" accept="application/json,.json" className="hidden" onChange={handleImportBackup} />
                <Button variant="outline" onClick={onToggleDarkMode}>
                  {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {darkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                </Button>
              </div>
              <p>Use o backup JSON para manter uma cópia externa dos dados locais do KryoStock.</p>
            </CardContent>
          </Card>

        </div>
      </div>
      <AlertDialog open={!!pendingBackup} onOpenChange={(open) => !open && setPendingBackup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importar backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação substituirá os dados atuais do KryoStock pelo conteúdo do arquivo selecionado. Exporte um backup antes se quiser preservar os dados atuais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingBackup) onImportBackup(pendingBackup);
                setPendingBackup(null);
              }}
            >
              Importar backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
