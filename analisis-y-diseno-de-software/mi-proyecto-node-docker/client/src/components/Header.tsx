// src/components/Header.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, UserPlus, LogOut, Info, Home, FileText } from "lucide-react";
import RutInput from "@/components/RutInput";


interface User {
  rut: string;
  nombre: string;
  apellido: string;
  email: string;
}

// donde persistimos el usuario logeado
const USER_KEY = "app:user";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rutLogin, setRutLogin] = useState("");
  const [rutRegister, setRutRegister] = useState("");


  // --- badge simulaciones guardadas ---
  const [savedCount, setSavedCount] = useState(0);

  const getLoggedUser = (): User | null => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  };

  const fetchSavedCount = async () => {
    const u = getLoggedUser();
    if (!u?.rut) {
      setSavedCount(0);
      return;
    }
    try {
      const r = await fetch(`/api/simulations/count?rut=${u.rut}`);
      const j = await r.json();
      setSavedCount(j?.count ?? 0);
    } catch {
      setSavedCount(0);
    }
  };
  // ------------------------------------

  // cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const u = getLoggedUser();
    if (u) setUser(u);
  }, []);

  // contador de simulaciones: carga inicial + escucha eventos
  useEffect(() => {
    // carga inicial
    fetchSavedCount();

    // cuando se guarden/eliminen simulaciones
    const onSimsChanged = () => fetchSavedCount();
    window.addEventListener("simulations:changed", onSimsChanged as EventListener);

    // cuando cambie el usuario (login/logout en otra pestaña)
    const onStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY) fetchSavedCount();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("simulations:changed", onSimsChanged as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  // ------------------------------------

  // helper de fetch
  const apiFetch = async (path: string, body: any) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || "Error de servidor");
    }
    return data;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const rut = rutLogin;
      const password = String(formData.get("password") || "");

      const data = await apiFetch("/api/login", { rut, password });

      const u: User = {
        rut: data.user.rut,
        nombre: data.user.nombre_cliente,
        apellido: data.user.apellido_cliente,
        email: data.user.email,
      };

      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setLoginOpen(false);
      setRutLogin(""); // limpiar RUT
      e.currentTarget?.reset(); // safe reset

      // refrescar contador al iniciar sesión
      fetchSavedCount();
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const rut = rutRegister;
      const nombre = String(formData.get("nombre") || "");
      const apellido = String(formData.get("apellido") || "");
      const email = String(formData.get("email") || "");
      const password = String(formData.get("password") || "");

      const data = await apiFetch("/api/register", {
        rut,
        nombre,
        apellido,
        email,
        password,
      });

      const u: User = {
        rut: data.user.rut, // ya viene bien formateado desde backend
        nombre: data.user.nombre_cliente,
        apellido: data.user.apellido_cliente,
        email: data.user.email,
      };

      setUser(u);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
      setRegisterOpen(false);
      setRutRegister(""); // limpiar RUT
      e.currentTarget?.reset(); // safe reset

      // refrescar contador tras registro
      fetchSavedCount();
    } catch (err: any) {
      setErrorMsg(err.message || "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    setSavedCount(0); // limpiar badge
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">💰</span>
              <h1 className="text-xl font-bold text-foreground">Sistema de Préstamos</h1>
            </button>

            {/* Navegación */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
              <Button
                variant={location.pathname === "/informacion" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/informacion")}
              >
                <Info className="h-4 w-4 mr-2" />
                Información
              </Button>
              <Button
                variant={location.pathname === "/eval-riesgo" ? "default" : "ghost"}
                size="sm"
                onClick={() => navigate("/eval-riesgo")}
              >
                <Info className="h-4 w-4 mr-2" />
                Evaluación
              </Button>

              {/* BOTÓN NUEVO: Aparece si el usuario está logueado */}
              {user && (
                <Button
                  variant={location.pathname === "/datos-personales" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/datos-personales")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Datos Personales
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm font-medium text-foreground hidden sm:inline">
                  {user.nombre} {user.apellido}
                </span>

                {/* PERFIL con badge de simulaciones */}
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/perfil" className="relative">
                    Perfil
                    {savedCount > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs h-5 min-w-5 px-1">
                        {savedCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Cerrar Sesión</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setLoginOpen(true)}>
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Iniciar Sesión</span>
                </Button>
                <Button variant="default" size="sm" onClick={() => setRegisterOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Registrarse</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar Sesión</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-rut">RUT</Label>
              <RutInput 
                value={rutLogin}
                onChange={setRutLogin}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input id="login-password" name="password" type="password" required />
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setLoginOpen(false);
                  setRegisterOpen(true);
                }}
              >
                Regístrate acá
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrarse</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-rut">RUT</Label>
              <RutInput
                value={rutRegister}
                onChange={setRutRegister}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-nombre">Nombre</Label>
              <Input id="reg-nombre" name="nombre" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-apellido">Apellido</Label>
              <Input id="reg-apellido" name="apellido" type="text" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Contraseña</Label>
              <Input id="reg-password" name="password" type="password" minLength={6} required />
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrarse"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setRegisterOpen(false);
                  setLoginOpen(true);
                }}
              >
                Inicia sesión acá
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};