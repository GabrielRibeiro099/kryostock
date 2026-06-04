import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { Products } from "./components/Products";
import { Movements } from "./components/Movements";
import { Categories } from "./components/Categories";
import { Reports } from "./components/Reports";
import { AuthScreen } from "./components/AuthScreen";
import { Settings } from "./components/Settings";
import type { Product, Category, Movement, AppView, MovementType, UserAccount } from "./components/types";
import { createProduct, deleteOrDeactivateProduct, reactivateProduct, updateProduct } from "./services/inventoryService";
import { createCategory, updateCategory, canDeleteCategory } from "./services/categoryService";
import { applyMovement, deleteMovement } from "./services/movementService";
import { buildAppData, downloadBackup, loadLocalFallback, loadPersistentData as loadPortableData, readBackupFile, saveLocalFallback, savePersistentData as savePortableData } from "./services/storageService";
import { createPasswordSalt, hashPassword, normalizeEmail } from "./services/authService";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Tag,
  BarChart3,
  Menu,
  X,
  Sun,
  Moon,
  Settings as SettingsIcon,
  Loader2,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";

const BRAND_NAME = "KryoStock";
const BRAND_SUBTITLE = "Controle de Estoque";
const BRAND_LOGO = "/kryostock-icon.png";

const NAV_ITEMS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: "products", label: "Produtos", icon: <Package className="w-5 h-5" /> },
  { id: "movements", label: "Movimentações", icon: <ArrowLeftRight className="w-5 h-5" /> },
  { id: "categories", label: "Categorias", icon: <Tag className="w-5 h-5" /> },
  { id: "reports", label: "Relatórios", icon: <BarChart3 className="w-5 h-5" /> },
  { id: "settings", label: "Configurações", icon: <SettingsIcon className="w-5 h-5" /> },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "KS";
}

export default function App() {
  const initialDataRef = useRef(loadLocalFallback());
  const [view, setView] = useState<AppView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const dataLoadedRef = useRef(false);
  const ignorePortableHydrationRef = useRef(false);
  const [darkMode, setDarkMode] = useState<boolean>(initialDataRef.current.settings.darkMode);
  const [products, setProducts] = useState<Product[]>(initialDataRef.current.inventory.products);
  const [categories, setCategories] = useState<Category[]>(initialDataRef.current.inventory.categories);
  const [movements, setMovements] = useState<Movement[]>(initialDataRef.current.inventory.movements);
  const [users, setUsers] = useState<UserAccount[]>(initialDataRef.current.users);
  const [currentUserId, setCurrentUserId] = useState<string | null>(initialDataRef.current.currentSession?.userId ?? null);


  // Carrega os dados do arquivo portátil antes de liberar login/cadastro.
  // Isso evita que a leitura atrasada do JSON sobrescreva um cadastro recém-criado.
  useEffect(() => {
    let cancelled = false;

    async function hydrateData() {
      const data = await loadPortableData();
      if (cancelled) return;

      if (data && !ignorePortableHydrationRef.current) {
        setProducts(data.inventory.products);
        setCategories(data.inventory.categories);
        setMovements(data.inventory.movements);
        setUsers(data.users);
        setCurrentUserId(data.currentSession?.userId ?? null);
        setDarkMode(data.settings.darkMode);
        try {
          saveLocalFallback(data);
        } catch {
          toast.error("Não foi possível sincronizar os dados locais do KryoStock.");
        }
      }

      dataLoadedRef.current = true;
      setIsHydrating(false);
    }

    void hydrateData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change: browser fallback + portable folder JSON file.
  useEffect(() => {
    const appData = buildAppData({ products, categories, movements, darkMode, users, currentUserId });
    try {
      saveLocalFallback(appData);
    } catch {
      toast.error("Não foi possível salvar os dados localmente.");
    }
    if (dataLoadedRef.current && !isHydrating) {
      savePortableData(appData).then((ok) => {
        if (!ok) {
          // localStorage fica como fallback quando a API do executável não está disponível.
        }
      });
    }
  }, [products, categories, movements, darkMode, users, currentUserId, isHydrating]);

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  const lowStockCount = products.filter((p) => p.isActive !== false && p.quantity <= p.minStock).length;

  const registerUser = useCallback((data: Omit<UserAccount, "id" | "createdAt" | "updatedAt">): boolean => {
    const duplicated = users.some((user) => normalizeEmail(user.email) === normalizeEmail(data.email));
    if (duplicated) {
      toast.error("Já existe uma conta cadastrada com este e-mail.");
      return false;
    }

    const password = data.password?.trim() ?? "";
    if (!password) {
      toast.error("Informe uma senha válida para criar o cadastro.");
      return false;
    }

    const now = new Date().toISOString();
    const passwordSalt = createPasswordSalt();
    const newUser: UserAccount = {
      id: `u${Date.now()}`,
      name: data.name.trim(),
      email: normalizeEmail(data.email),
      passwordSalt,
      passwordHash: hashPassword(password, passwordSalt),
      avatarUrl: data.avatarUrl || "",
      createdAt: now,
      updatedAt: now,
    };

    const nextUsers = [...users, newUser];
    const nextAppData = buildAppData({
      products,
      categories,
      movements,
      users: nextUsers,
      currentUserId: newUser.id,
      darkMode,
    });

    // Evita que qualquer sincronização atrasada apague o cadastro recém-criado.
    ignorePortableHydrationRef.current = true;
    dataLoadedRef.current = true;
    setIsHydrating(false);

    setUsers(nextUsers);
    setCurrentUserId(newUser.id);
    try {
      saveLocalFallback(nextAppData);
    } catch {
      toast.error("Cadastro criado, mas não foi possível salvar no armazenamento local.");
    }
    void savePortableData(nextAppData);
    toast.success("Cadastro criado com sucesso no KryoStock!");
    return true;
  }, [users, products, categories, movements, darkMode]);

  const updateUser = useCallback((id: string, data: Partial<Pick<UserAccount, "name" | "avatarUrl" | "password">>) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== id) return user;
        const { password, ...profileData } = data;
        return {
          ...user,
          ...profileData,
          ...(password ? (() => { const passwordSalt = createPasswordSalt(); return { passwordSalt, passwordHash: hashPassword(password, passwordSalt), password: undefined }; })() : {}),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setView("dashboard");
    toast.success("Você saiu da conta.");
  }, []);

  // Product CRUD
  const addProduct = useCallback((data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const { result, product } = createProduct(data, products, categories);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    if (result.warning) toast.warning(result.warning);
    setProducts((prev) => [...prev, product!]);
    toast.success("Produto criado com sucesso!");
    return true;
  }, [products, categories]);

  const editProduct = useCallback((id: string, data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const { result, products: nextProducts } = updateProduct(id, data, products, categories);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    if (result.warning) toast.warning(result.warning);
    setProducts(nextProducts!);
    toast.success("Produto atualizado!");
    return true;
  }, [products, categories]);

  const deleteProduct = useCallback((id: string) => {
    const result = deleteOrDeactivateProduct(id, products, movements);
    setProducts(result.products);
    if (result.action === "not_found") toast.error(result.message);
    else if (result.action === "deactivated") toast.warning(result.message);
    else toast.success(result.message);
  }, [products, movements]);

  const reactivateProductHandler = useCallback((id: string) => {
    setProducts((prev) => reactivateProduct(id, prev));
    toast.success("Produto reativado.");
  }, []);

  // Category CRUD
  const addCategory = useCallback((data: Omit<Category, "id">) => {
    const { result, category } = createCategory(data, categories);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    setCategories((prev) => [...prev, category!]);
    toast.success("Categoria criada!");
    return true;
  }, [categories]);

  const editCategory = useCallback((id: string, data: Omit<Category, "id">) => {
    const { result, categories: nextCategories } = updateCategory(id, data, categories);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    setCategories(nextCategories!);
    toast.success("Categoria atualizada!");
    return true;
  }, [categories]);

  const deleteCategory = useCallback((id: string) => {
    const result = canDeleteCategory(id, products);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Categoria excluída.");
  }, [products]);

  // Movement add
  const addMovement = useCallback(
    (data: { productId: string; type: MovementType; quantity: number; reason: string; date: string }) => {
      const result = applyMovement(data, products, currentUser?.name || "Usuário KryoStock");
      if (!result.ok) {
        toast.error(result.message);
        return false;
      }
      const product = products.find((p) => p.id === data.productId);
      setMovements((prev) => [...prev, result.movement]);
      setProducts(result.products);
      toast.success(`${result.label} registrada no KryoStock: ${data.quantity} ${product?.unit ?? "un"}`);
      return true;
    },
    [products, currentUser]
  );


  const deleteMovementHandler = useCallback((id: string) => {
    const result = deleteMovement(id, products, movements);
    if (!result.ok) {
      toast.error(result.message);
      return false;
    }
    setProducts(result.products);
    setMovements(result.movements);
    toast.success("Movimentação excluída e estoque recalculado com sucesso.");
    return true;
  }, [products, movements]);


  const exportBackup = useCallback(() => {
    const appData = buildAppData({ products, categories, movements, users, currentUserId, darkMode });
    downloadBackup(appData);
    toast.success("Backup exportado com sucesso.");
  }, [products, categories, movements, users, currentUserId, darkMode]);

  const importBackup = useCallback(async (file: File) => {
    try {
      const appData = await readBackupFile(file);
      setProducts(appData.inventory.products);
      setCategories(appData.inventory.categories);
      setMovements(appData.inventory.movements);
      setUsers(appData.users);
      setCurrentUserId(appData.currentSession?.userId ?? null);
      setDarkMode(appData.settings.darkMode);
      try {
        saveLocalFallback(appData);
      } catch {
        toast.error("Backup carregado, mas não foi possível salvar no navegador.");
      }
      await savePortableData(appData);
      toast.success("Backup importado com sucesso.");
    } catch {
      toast.error("Não foi possível importar o backup. Verifique se o arquivo JSON é válido.");
    }
  }, []);

  const navigate = (v: string) => {
    setView(v as AppView);
    setSidebarOpen(false);
  };

  if (isHydrating) {
    return (
      <div className={`${darkMode ? "dark" : ""} notranslate`} style={{ colorScheme: darkMode ? "dark" : "light" }}>
        <Toaster position="top-right" richColors />
        <div className="min-h-screen bg-[#061a35] flex items-center justify-center p-6 text-white">
          <div className="flex flex-col items-center gap-4 text-center">
            <img src={BRAND_LOGO} alt="Logo KryoStock" className="w-16 h-16 rounded-2xl object-contain" />
            <Loader2 className="w-7 h-7 animate-spin text-blue-100" />
            <div>
              <p className="font-semibold">Carregando KryoStock</p>
              <p className="text-sm text-blue-100/80">Sincronizando dados locais...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`${darkMode ? "dark" : ""} notranslate`} style={{ colorScheme: darkMode ? "dark" : "light" }}>
        <Toaster position="top-right" richColors />
        <AuthScreen
          users={users}
          onLogin={(userId) => {
            ignorePortableHydrationRef.current = true;
            setCurrentUserId(userId);
            const nextAppData = buildAppData({ products, categories, movements, users, currentUserId: userId, darkMode });
            saveLocalFallback(nextAppData);
            void savePortableData(nextAppData);
          }}
          onRegister={registerUser}
        />
      </div>
    );
  }

  return (
    <div className={`${darkMode ? "dark" : ""} notranslate`} style={{ colorScheme: darkMode ? "dark" : "light" }}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Toaster position="top-right" richColors />

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col
            bg-sidebar border-r border-sidebar-border text-sidebar-foreground
            transform transition-transform duration-200
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border">
            <img src={BRAND_LOGO} alt="Logo KryoStock" className="w-9 h-9 rounded-xl object-contain" />
            <div>
              <p className="font-semibold text-sm leading-tight text-sidebar-foreground">{BRAND_NAME}</p>
              <p className="text-xs text-muted-foreground leading-tight">{BRAND_SUBTITLE}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto w-7 h-7 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                    ${isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.id === "products" && lowStockCount > 0 && (
                    <Badge className="ml-auto text-xs h-5 px-1.5 bg-orange-500 text-white border-0">
                      {lowStockCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-sidebar-border space-y-3">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span>{darkMode ? "Modo Claro" : "Modo Escuro"}</span>
            </button>

            <button onClick={() => navigate("settings")} className="w-full flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-sidebar-foreground">{initials(currentUser.name)}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight truncate text-sidebar-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground leading-tight truncate">{currentUser.email}</p>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Bar (mobile only) */}
          <header className="flex items-center gap-4 px-6 py-3 border-b bg-background lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img src={BRAND_LOGO} alt="KryoStock" className="w-7 h-7 rounded-lg object-contain" />
              <span className="font-semibold text-sm">{BRAND_NAME}</span>
            </div>
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="ml-auto p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-6">
              {view === "dashboard" && (
                <Dashboard
                  products={products}
                  categories={categories}
                  movements={movements}
                  onNavigate={navigate}
                />
              )}
              {view === "products" && (
                <Products
                  products={products}
                  categories={categories}
                  onAdd={addProduct}
                  onEdit={editProduct}
                  onDelete={deleteProduct}
                  onReactivate={reactivateProductHandler}
                />
              )}
              {view === "movements" && (
                <Movements
                  movements={movements}
                  products={products}
                  categories={categories}
                  onAdd={addMovement}
                  onDelete={deleteMovementHandler}
                />
              )}
              {view === "categories" && (
                <Categories
                  categories={categories}
                  products={products}
                  onAdd={addCategory}
                  onEdit={editCategory}
                  onDelete={deleteCategory}
                />
              )}
              {view === "reports" && (
                <Reports
                  products={products}
                  categories={categories}
                  movements={movements}
                />
              )}
              {view === "settings" && (
                <Settings user={currentUser} onUpdateUser={updateUser} onLogout={logout} onExportBackup={exportBackup} onImportBackup={importBackup} darkMode={darkMode} onToggleDarkMode={() => setDarkMode((d) => !d)} />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
