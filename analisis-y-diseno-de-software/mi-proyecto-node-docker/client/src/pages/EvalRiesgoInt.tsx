import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Hash,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";

const USER_KEY = "app:user";

type SolicitudEvaluacion = {
  idSolicitud?: number;
  id_solicitud?: number;
  rut?: string;
  rut_cliente?: string;
  monto?: number | string;
  monto_cliente?: number | string;
  sueldo?: number | string;
  sueldo_cliente?: number | string;
  estado?: string;
  cantCuotas?: number;
  cant_cuotas?: number;
  fechaSolicitud?: string;
  fecha_solicitud?: string;
  idEvaluacion?: number;
  id_evaluacion?: number;
  riesgo?: number | string | null;
  prestamo?: unknown;
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

const normalizarEstado = (estado?: string) =>
  String(estado || "pendiente").toLowerCase().trim();

const estadosAceptados = ["aceptada", "aprobada", "aprobado", "aceptado"];
const estadosRechazados = ["rechazada", "rechazado", "denegada", "denegado"];
const estadosPedido = [
  "pedido",
  "pedida",
  "prestamo pedido",
  "préstamo pedido",
  "solicitado",
  "solicitada",
];

const esAceptada = (estado?: string) =>
  estadosAceptados.includes(normalizarEstado(estado));

const esRechazada = (estado?: string) =>
  estadosRechazados.includes(normalizarEstado(estado));

const esPedido = (estado?: string) =>
  estadosPedido.includes(normalizarEstado(estado));

const obtenerId = (solicitud: SolicitudEvaluacion) =>
  solicitud.idSolicitud ?? solicitud.id_solicitud;

const obtenerMonto = (solicitud: SolicitudEvaluacion) =>
  Number(solicitud.monto ?? solicitud.monto_cliente ?? 0);

const obtenerSueldo = (solicitud: SolicitudEvaluacion) =>
  Number(solicitud.sueldo ?? solicitud.sueldo_cliente ?? 0);

const obtenerCuotas = (solicitud: SolicitudEvaluacion) =>
  Number(solicitud.cantCuotas ?? solicitud.cant_cuotas ?? 0);

const obtenerFecha = (solicitud: SolicitudEvaluacion) =>
  solicitud.fechaSolicitud ?? solicitud.fecha_solicitud;

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "No disponible";
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const estadoConfig = (estado?: string) => {
  const normalized = normalizarEstado(estado);

  if (estadosPedido.includes(normalized)) {
    return {
      label: "Pedido",
      icon: ShieldCheck,
      badgeClass:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
      cardClass: "border-blue-200/80 dark:border-blue-900/60",
      message: "Esta solicitud ya fue firmada y el préstamo fue pedido.",
    };
  }

  if (estadosAceptados.includes(normalized)) {
    return {
      label: "Aceptada",
      icon: CheckCircle2,
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
      cardClass: "border-emerald-200/80 dark:border-emerald-900/60",
      message: "Tu evaluación fue aprobada automáticamente.",
    };
  }

  if (estadosRechazados.includes(normalized)) {
    return {
      label: "Rechazada",
      icon: XCircle,
      badgeClass:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
      cardClass: "border-red-200/80 dark:border-red-900/60",
      message:
        "La solicitud no cumple con los criterios automáticos de riesgo.",
    };
  }

  return {
    label: "Pendiente",
    icon: Clock,
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    cardClass: "border-amber-200/80 dark:border-amber-900/60",
    message: "La solicitud todavía está pendiente de evaluación.",
  };
};

const riesgoConfig = (riesgo: SolicitudEvaluacion["riesgo"]) => {
  const value = Number(riesgo);

  if (!Number.isFinite(value)) {
    return {
      label: "Sin evaluación",
      className: "text-muted-foreground",
      helper: "Aún no existe un riesgo calculado para esta solicitud.",
    };
  }

  if (value <= 4) {
    return {
      label: `Riesgo bajo (${value}/10)`,
      className: "text-emerald-700 dark:text-emerald-300",
      helper: "Buena relación entre monto, cuotas e ingresos.",
    };
  }

  if (value <= 6) {
    return {
      label: `Riesgo medio (${value}/10)`,
      className: "text-amber-700 dark:text-amber-300",
      helper: "La carga mensual es moderada.",
    };
  }

  return {
    label: `Riesgo alto (${value}/10)`,
    className: "text-red-700 dark:text-red-300",
    helper: "La carga mensual estimada es alta para los ingresos ingresados.",
  };
};

const EvalRiesgoInt = () => {
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState<SolicitudEvaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudEvaluacion | null>(null);
  const [codigoFirma, setCodigoFirma] = useState("");
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [errorFirma, setErrorFirma] = useState<string | null>(null);
  const [firmando, setFirmando] = useState(false);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);

      const rut = getRutFromLocalStorage();

      const url = rut
        ? `/api/evaluaciones/historial?rut=${encodeURIComponent(rut)}`
        : "/api/evaluaciones/historial";

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.ok === false) {
        const mensaje = json?.message || json?.error || "";

        if (
          res.status === 401 ||
          mensaje.toLowerCase().includes("no hay usuario autenticado") ||
          mensaje.toLowerCase().includes("no se encontró sesión")
        ) {
          setSolicitudes([]);
          setError(null);
          return;
        }

        throw new Error(
          mensaje || "No se pudo cargar el historial de evaluaciones."
        );
      }

      setSolicitudes(Array.isArray(json?.solicitudes) ? json.solicitudes : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error cargando el historial."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const resumen = useMemo(() => {
    const aceptadas = solicitudes.filter(
      (s) => esAceptada(s.estado) || esPedido(s.estado)
    ).length;

    const rechazadas = solicitudes.filter((s) => esRechazada(s.estado)).length;

    const pendientes = solicitudes.length - aceptadas - rechazadas;

    return {
      total: solicitudes.length,
      aceptadas,
      rechazadas,
      pendientes,
    };
  }, [solicitudes]);

  const abrirModalFirma = (solicitud: SolicitudEvaluacion) => {
    setSolicitudSeleccionada(solicitud);
    setCodigoFirma("");
    setMostrarCodigo(false);
    setErrorFirma(null);
    setShowFirmaModal(true);
  };

  const cerrarModalFirma = () => {
    if (firmando) {
      return;
    }

    setShowFirmaModal(false);
    setSolicitudSeleccionada(null);
    setCodigoFirma("");
    setMostrarCodigo(false);
    setErrorFirma(null);
  };

  const confirmarFirma = async () => {
    try {
      setErrorFirma(null);

      if (!solicitudSeleccionada) {
        setErrorFirma("No hay una solicitud seleccionada.");
        return;
      }

      const idSolicitud = obtenerId(solicitudSeleccionada);

      if (!idSolicitud) {
        setErrorFirma("No se encontró el id de la solicitud.");
        return;
      }

      if (!/^\d{6}$/.test(codigoFirma)) {
        setErrorFirma("El código debe tener exactamente 6 dígitos.");
        return;
      }

      setFirmando(true);

      const rut = getRutFromLocalStorage();

      const res = await fetch("/api/prestamos/confirmar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id_solicitud: idSolicitud,
          codigo: codigoFirma,
          rut,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || data?.ok === false) {
        setErrorFirma(
          data?.message || "No se pudo firmar la solicitud. Intenta nuevamente."
        );
        return;
      }

      setSolicitudes((prev) =>
        prev.map((solicitud) => {
          const idActual = obtenerId(solicitud);

          if (idActual !== idSolicitud) {
            return solicitud;
          }

          return {
            ...solicitud,
            ...(data?.solicitud || {}),
            estado: data?.solicitud?.estado || "pedido",
            prestamo: data?.prestamo,
          };
        })
      );

      setShowFirmaModal(false);
      setSolicitudSeleccionada(null);
      setCodigoFirma("");
      setMostrarCodigo(false);
      setErrorFirma(null);
    } catch (err) {
      console.error("Error al firmar solicitud:", err);
      setErrorFirma("Error de conexión con el servidor.");
    } finally {
      setFirmando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <section className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-12 w-12 text-accent" />
            <h1 className="text-4xl font-bold text-foreground">
              Historial de Evaluaciones
            </h1>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Revisa el estado de tus solicitudes de préstamo y el resultado de la
            evaluación de riesgo asociada.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="shadow-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent/10 p-2">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{resumen.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-50 p-2 dark:bg-emerald-950/40">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aceptadas</p>
                  <p className="text-2xl font-bold">{resumen.aceptadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-50 p-2 dark:bg-red-950/40">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rechazadas</p>
                  <p className="text-2xl font-bold">{resumen.rechazadas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/70">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-50 p-2 dark:bg-amber-950/40">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <p className="text-2xl font-bold">{resumen.pendientes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="shadow-card-lg">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <ShieldCheck className="h-6 w-6 text-accent" />
                Solicitudes registradas
              </CardTitle>
              <CardDescription>
                Cada solicitud muestra su estado final y el nivel de riesgo
                calculado automáticamente por el backend.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={cargarSolicitudes}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </CardHeader>

          <CardContent>
            {loading && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-accent mb-3" />
                <p className="font-medium">Cargando historial...</p>
                <p className="text-sm text-muted-foreground">
                  Estamos buscando tus solicitudes registradas.
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      No se pudo cargar el historial
                    </p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && solicitudes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-semibold">
                  Todavía no tienes solicitudes
                </h3>

                <p className="text-sm text-muted-foreground max-w-md mt-1 mb-5">
                  Cuando envíes una solicitud de préstamo, aparecerá aquí junto
                  con su evaluación de riesgo.
                </p>

                <Button type="button" onClick={() => navigate("/")}>
                  Crear solicitud
                </Button>
              </div>
            )}

            {!loading && !error && solicitudes.length > 0 && (
              <div className="space-y-4">
                {solicitudes.map((solicitud) => {
                  const estado = estadoConfig(solicitud.estado);
                  const riesgo = riesgoConfig(solicitud.riesgo);
                  const EstadoIcon = estado.icon;
                  const idSolicitud = obtenerId(solicitud);
                  const monto = obtenerMonto(solicitud);
                  const sueldo = obtenerSueldo(solicitud);
                  const cuotas = obtenerCuotas(solicitud);
                  const puedeFirmar = esAceptada(solicitud.estado);
                  const yaPedido = esPedido(solicitud.estado);

                  return (
                    <div
                      key={idSolicitud ?? `${monto}-${obtenerFecha(solicitud)}`}
                      className={`rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md ${estado.cardClass}`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              Solicitud #{idSolicitud ?? "-"}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${estado.badgeClass}`}
                            >
                              <EstadoIcon className="h-3.5 w-3.5" />
                              {estado.label}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {estado.message}
                          </p>
                        </div>

                        <div className="rounded-lg bg-muted/50 px-4 py-3 md:text-right">
                          <p className="text-xs text-muted-foreground">
                            Evaluación de riesgo
                          </p>

                          <p className={`font-bold ${riesgo.className}`}>
                            {riesgo.label}
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            {riesgo.helper}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-5">
                        <div className="rounded-lg border bg-background/60 p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Wallet className="h-3.5 w-3.5" />
                            Monto solicitado
                          </div>

                          <p className="font-semibold">
                            {formatCurrency(monto)}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-background/60 p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Sueldo informado
                          </div>

                          <p className="font-semibold">
                            {formatCurrency(sueldo)}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-background/60 p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Hash className="h-3.5 w-3.5" />
                            Cantidad de cuotas
                          </div>

                          <p className="font-semibold">
                            {cuotas > 0 ? `${cuotas} cuotas` : "No disponible"}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-background/60 p-3">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Fecha de solicitud
                          </div>

                          <p className="font-semibold">
                            {formatDate(obtenerFecha(solicitud))}
                          </p>
                        </div>
                      </div>

                      {puedeFirmar && (
                        <div className="flex justify-end mt-5">
                          <Button
                            type="button"
                            variant="accent"
                            onClick={() => abrirModalFirma(solicitud)}
                          >
                            Firmar solicitud
                          </Button>
                        </div>
                      )}

                      {yaPedido && (
                        <div className="flex justify-end mt-5">
                          <Button type="button" variant="outline" disabled>
                            Préstamo pedido
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="bg-primary text-primary-foreground py-8 mt-16">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Sistema de Préstamos. Todos los derechos reservados.</p>
        </div>
      </footer>

      {showFirmaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-accent/10 p-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">
                  Verificación de identidad
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Ingresa tu código de autenticación de 6 dígitos para firmar la
                  solicitud y pedir el préstamo.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  Código
                </label>

                <button
                  type="button"
                  onClick={() => setMostrarCodigo((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {mostrarCodigo ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {mostrarCodigo ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              <input
                type={mostrarCodigo ? "text" : "password"}
                inputMode="numeric"
                maxLength={6}
                value={codigoFirma}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCodigoFirma(value.slice(0, 6));
                  setErrorFirma(null);
                }}
                className="w-full rounded-lg border bg-background px-4 py-3 text-center text-lg font-semibold tracking-[0.6em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="------"
                disabled={firmando}
              />

              {errorFirma && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <p>{errorFirma}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={cerrarModalFirma}
                disabled={firmando}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="accent"
                onClick={confirmarFirma}
                disabled={firmando || codigoFirma.length !== 6}
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {firmando ? "Firmando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvalRiesgoInt;