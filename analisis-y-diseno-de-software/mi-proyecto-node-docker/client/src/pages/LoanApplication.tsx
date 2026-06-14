import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Header } from "@/components/Header";
import {
  FileText,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const USER_KEY = "app:user";

type LoanData = {
  monto?: number;
  tasaInteres?: number;
  cuotas?: number;
  fechaPrimerPago?: string;
  pagoPorCuota?: number;
  montoTotal?: number;
};

const getRutFromLocalStorage = (): string | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    return (
      parsed?.rut ||
      parsed?.rut_cliente ||
      parsed?.user?.rut ||
      parsed?.user?.rut_cliente ||
      null
    );
  } catch {
    return null;
  }
};

const LoanApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Datos del préstamo simulado, vienen desde LoanResults.tsx
  const loanData = (location.state || {}) as LoanData;

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    ingresos: "",
  });

  const [loadingUser, setLoadingUser] = useState(true);
  const [datosUsuarioCargados, setDatosUsuarioCargados] = useState(false);

  // Estado del modal de autenticación
  const [authOpen, setAuthOpen] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const crearSesionSolicitud = async () => {
      const rut = getRutFromLocalStorage();

      if (!rut) {
        throw new Error("No se encontró el RUT del usuario guardado en el navegador.");
      }

      const res = await fetch("/api/session/loan-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ rut }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          json?.message || "No se pudo crear la sesión de solicitud."
        );
      }
    };

    const cargarDatosUsuario = async () => {
      try {
        // Primero crea la sesión Express especial para este flujo
        await crearSesionSolicitud();

        // Después pide los datos usando esa sesión
        const res = await fetch("/api/users/datos-solicitud", {
          method: "GET",
          credentials: "include",
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          if (!cancelled) {
            toast({
              title: "No se pudieron cargar tus datos",
              description:
                json?.message ||
                "La página se abrió igual, pero tendrás que completar los datos manualmente.",
              variant: "destructive",
            });

            setDatosUsuarioCargados(false);
          }

          return;
        }

        const user = json?.user || {};

        if (!cancelled) {
          setFormData((prev) => ({
            ...prev,
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            rut: user.rut || "",
            email: user.email || "",
          }));

          setDatosUsuarioCargados(true);
        }
      } catch (error) {
        if (!cancelled) {
          toast({
            title: "No se pudieron cargar tus datos",
            description:
              error instanceof Error
                ? error.message
                : "La página se abrió igual, pero tendrás que completar los datos manualmente.",
            variant: "destructive",
          });

          setDatosUsuarioCargados(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    cargarDatosUsuario();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const camposBloqueados = ["nombre", "apellido", "rut", "email"];

    // Si el backend logró cargar los datos, estos campos quedan bloqueados.
    // Si no logró cargarlos, se pueden escribir manualmente.
    if (datosUsuarioCargados && camposBloqueados.includes(name)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setAuthError(null);
    setAuthCode("");
    setAuthOpen(true);
  };

 const verifyAuthCode = async (code: string): Promise<boolean> => {
  const rut = formData.rut || getRutFromLocalStorage();

  console.log("Verificando autenticador con:", {
    rut,
    code,
  });

  if (!rut) {
    throw new Error("No se encontró el RUT del usuario para verificar el código.");
  }

  const res = await fetch("/api/auth-code/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      rut,
      code,
      autenticador: code,
    }),
  });

  const json = await res.json().catch(() => null);

  console.log("Respuesta verify:", json);

  if (!res.ok) {
    throw new Error(
      json?.message || json?.error || "Error al verificar el código"
    );
  }

  return json?.valid === true || json?.ok === true;
};

  const sendApplication = async () => {
    const monto = Number(loanData.monto);
    const cantCuotas = Number(loanData.cuotas);
    const sueldo = Number(formData.ingresos);

    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error("No se encontró un monto válido para la solicitud.");
    }

    if (!Number.isFinite(cantCuotas) || cantCuotas <= 0) {
      throw new Error("No se encontró una cantidad de cuotas válida.");
    }

    if (!Number.isFinite(sueldo) || sueldo <= 0) {
      throw new Error("Ingresa un sueldo mensual válido.");
    }

    const res = await fetch("/api/solicitudes-prestamo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        rut: formData.rut || getRutFromLocalStorage(),
        monto,
        sueldo,
        cantCuotas,
        telefono: formData.telefono,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
      }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || json?.ok === false) {
      throw new Error(
        json?.message ||
          json?.error ||
          "No se pudo guardar la solicitud de préstamo."
      );
    }

    return json;
  };

  const handleConfirmCode = async () => {
    if (authCode.length < 6) {
      setAuthError("Ingresa los 6 dígitos.");
      return;
    }

    setVerifying(true);
    setAuthError(null);

    try {
      const ok = await verifyAuthCode(authCode);

      if (!ok) {
        setAuthError("Código incorrecto. Ingrésalo nuevamente.");
        setAuthCode("");
        setVerifying(false);
        return;
      }

      const solicitudCreada = await sendApplication();

      toast({
        title: "¡Solicitud enviada!",
        description:
          solicitudCreada?.estado === "aceptada"
            ? "Tu solicitud fue aceptada automáticamente."
            : solicitudCreada?.estado === "rechazada"
              ? "Tu solicitud fue rechazada según la evaluación de riesgo."
              : "Tu solicitud fue registrada correctamente.",
      });

      setAuthOpen(false);
      setVerifying(false);

      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setVerifying(false);
      setAuthError(
        err instanceof Error
          ? err.message
          : "Hubo un problema al verificar. Intenta nuevamente."
      );
    }
  };

  const camposPersonalesBloqueados = datosUsuarioCargados;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <Card className="shadow-card-lg relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-accent" />
              Solicitud de Préstamo
            </CardTitle>

            <CardDescription>
              Completa tus datos para procesar tu solicitud
            </CardDescription>

            {loadingUser && (
              <p className="text-sm text-muted-foreground mt-2">
                Intentando cargar tus datos personales...
              </p>
            )}

            {!loadingUser && datosUsuarioCargados && (
              <p className="text-sm text-muted-foreground mt-2">
                Tus datos personales fueron cargados automáticamente.
              </p>
            )}

            {!loadingUser && !datosUsuarioCargados && (
              <p className="text-sm text-muted-foreground mt-2">
                No se pudieron cargar tus datos automáticamente. Puedes
                completarlos manualmente por ahora.
              </p>
            )}

            {loanData.monto && (
              <div className="mt-4 p-4 bg-accent/10 rounded-lg">
                <p className="text-sm font-semibold mb-2">
                  Resumen de tu préstamo:
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Monto:</span>
                  <span className="font-medium">
                    ${loanData.monto?.toLocaleString("es-CL")}
                  </span>

                  <span className="text-muted-foreground">Cuotas:</span>
                  <span className="font-medium">{loanData.cuotas}</span>

                  <span className="text-muted-foreground">Pago mensual:</span>
                  <span className="font-medium">
                    ${loanData.pagoPorCuota?.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Juan"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    readOnly={camposPersonalesBloqueados}
                    className={
                      camposPersonalesBloqueados
                        ? "bg-muted cursor-not-allowed"
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    name="apellido"
                    type="text"
                    placeholder="Pérez"
                    value={formData.apellido}
                    onChange={handleChange}
                    required
                    readOnly={camposPersonalesBloqueados}
                    className={
                      camposPersonalesBloqueados
                        ? "bg-muted cursor-not-allowed"
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  name="rut"
                  type="text"
                  placeholder="12.345.678-9"
                  value={formData.rut}
                  onChange={handleChange}
                  required
                  readOnly={camposPersonalesBloqueados}
                  className={
                    camposPersonalesBloqueados
                      ? "bg-muted cursor-not-allowed"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  readOnly={camposPersonalesBloqueados}
                  className={
                    camposPersonalesBloqueados
                      ? "bg-muted cursor-not-allowed"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  type="text"
                  placeholder="Av. Principal 123"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  name="ciudad"
                  type="text"
                  placeholder="Santiago"
                  value={formData.ciudad}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ingresos">Ingresos mensuales *</Label>
                <Input
                  id="ingresos"
                  name="ingresos"
                  type="number"
                  placeholder="500000"
                  value={formData.ingresos}
                  onChange={handleChange}
                  required
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Indica tus ingresos mensuales aproximados
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancelar
                </Button>

                <Button type="submit" variant="accent" className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </Button>
              </div>
            </form>
          </CardContent>

          {authOpen && (
            <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/85 backdrop-blur-sm p-6 overflow-auto animate-in fade-in-0">
              <div className="w-full max-w-md mt-8 rounded-xl border bg-card text-card-foreground shadow-lg p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-accent" />
                    <h2 className="text-lg font-semibold leading-none tracking-tight">
                      Verificación de identidad
                    </h2>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Ingresa tu código de autenticación de 6 dígitos para
                    confirmar el envío.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Código</Label>

                    <button
                      type="button"
                      onClick={() => setShowCode((s) => !s)}
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      {showCode ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {showCode ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={authCode}
                      onChange={(v) => {
                        setAuthError(null);
                        setAuthCode(v.replace(/\D/g, ""));
                      }}
                      disabled={verifying}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className={
                              !showCode && authCode[i]
                                ? "relative text-transparent after:content-['•'] after:absolute after:inset-0 after:flex after:items-center after:justify-center after:text-foreground"
                                : ""
                            }
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {authError && (
                    <p className="text-xs text-destructive text-center">
                      {authError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAuthOpen(false)}
                    disabled={verifying}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    variant="accent"
                    className="flex-1"
                    onClick={handleConfirmCode}
                    disabled={verifying || authCode.length < 6}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verificando…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default LoanApplication;