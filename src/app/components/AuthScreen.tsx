import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Lock, Mail, UserPlus, LogIn } from "lucide-react";
import type { UserAccount } from "./types";
import { findUserByEmail, normalizeEmail, verifyPassword } from "../services/authService";

type Props = {
  users: UserAccount[];
  onLogin: (userId: string) => void;
  onRegister: (user: Omit<UserAccount, "id" | "createdAt" | "updatedAt">) => boolean;
};

const brandLogo = "/kryostock-icon.png";

export function AuthScreen({ users, onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (event?: React.FormEvent) => {
    event?.preventDefault();
    const user = findUserByEmail(users, email);

    if (!user || !verifyPassword(user, password)) {
      toast.error("E-mail ou senha inválidos.");
      return;
    }

    onLogin(user.id);
    toast.success(`Bem-vindo ao KryoStock, ${user.name}!`);
  };

  const handleRegister = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha nome, e-mail e senha para criar a conta.");
      return;
    }
    if (password.length < 4) {
      toast.error("A senha precisa ter pelo menos 4 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }
    if (users.some((u) => normalizeEmail(u.email) === normalizeEmail(email))) {
      toast.error("Já existe uma conta cadastrada com este e-mail.");
      return;
    }

    setIsSubmitting(true);
    try {
      const registered = onRegister({
        name: name.trim(),
        email: normalizeEmail(email),
        password,
        avatarUrl: "",
      });

      if (registered) {
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Erro ao criar cadastro no KryoStock:", error);
      toast.error("Não foi possível criar o cadastro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061a35] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
        <div className="text-white space-y-7">
          <div className="flex items-center gap-4">
            <img src={brandLogo} alt="Logo KryoStock" className="w-16 h-16 rounded-2xl object-contain" />
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">KryoStock</h1>
              <p className="text-blue-100 mt-1">Controle de estoque portátil e funcional</p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <h2 className="text-3xl font-semibold leading-tight">Organize produtos, entradas, saídas e relatórios em um único sistema.</h2>
            <p className="text-blue-100/85 text-lg leading-relaxed">
              Acesse sua conta para manter suas configurações, avatar e nome de usuário salvos junto aos dados do aplicativo.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
            {[
              "Dashboard operacional",
              "Persistência local",
              "Aplicativo Windows",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-50">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-2xl border-white/10">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3 mb-2">
              <img src={brandLogo} alt="KryoStock" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <CardTitle>{mode === "login" ? "Entrar no KryoStock" : "Criar conta"}</CardTitle>
                <p className="text-sm text-muted-foreground">{mode === "login" ? "Acesse sua área de trabalho" : "Cadastre seu usuário local"}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" name="email" type="email" autoComplete="email" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@empresa.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" />
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita sua senha" />
                </div>
              )}

              <Button type="button" className="w-full" disabled={isSubmitting} onClick={() => (mode === "login" ? handleLogin() : handleRegister())}>
                {mode === "login" ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                {isSubmitting ? "Processando..." : mode === "login" ? "Entrar" : "Cadastrar"}
              </Button>
            </div>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Ainda não tem conta?" : "Já tem uma conta?"}{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                {mode === "login" ? "Criar cadastro" : "Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
