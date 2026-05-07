import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const SIM_LIMIT = 5;

type StoredSimulation = {
  id: string;
  data: any;
  createdAt?: string;
};

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, DollarSign, TrendingUp, Percent, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import MiniToast from "@/components/MiniToast";

type Sim = {
  monto?: number;
  tasa?: number;
  cuotas?: number;
  fechaPrimerPago?: string;
  pagoPorCuota?: number;
  montoTotal?: number;
  [k: string]: unknown;
};

const USER_KEY = "app:user";
const getLoggedUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};

type DbSimulation = {
  id: string;
  rut: number;
  data: any;
  created_at: string;
};

const Perfil = () => {
  const [list, setList] = useState<DbSimulation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const navigate = useNavigate();

  // ---- MiniToast state ----
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string; description?: string; variant?: "default"|"success"|"error"}>({ title: "" });
  const showToast = (title: string, description?: string, variant: "default"|"success"|"error" = "default") => {
    setToastMsg({ title, description, variant });
    setToastOpen(true);
  };
  // -------------------------

  const load = async () => {
    const u = getLoggedUser();
    if (!u?.rut) { setList([]); return; }

    try {
      const r = await fetch(`/api/simulations?rut=${u.rut}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      const j = await r.json();
      const sims = (j?.simulations ?? j?.rows ?? j) as any[];
      setList(Array.isArray(sims) ? sims : []);
    } catch (e) {
      console.error("[Perfil] load() fallo:", e);
      setList([]);
      showToast("No se pudo cargar", "Inténtalo nuevamente.", "error");
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onChanged = () => load();
    window.addEventListener("simulations:changed", onChanged as EventListener);
    return () => window.removeEventListener("simulations:changed", onChanged as EventListener);
  }, []);

  const onDelete = async (id: string) => {
    const u = getLoggedUser();
    if (!u?.rut) return;
    const r = await fetch(`/api/simulations/${id}?rut=${u.rut}`, { method: "DELETE" });
    if (r.ok) {
      setList((prev) => prev.filter((x) => x.id !== id));
      setSelectedIds((s) => s.filter((x) => x !== id));
      window.dispatchEvent(new CustomEvent("simulations:changed"));
      showToast("Simulación eliminada", undefined, "success");
    } else {
      showToast("No se pudo eliminar", "Inténtalo nuevamente.", "error");
    }
  };

  const onClear = async () => {
    if (!confirm("¿Eliminar TODAS las simulaciones guardadas?")) return;
    const u = getLoggedUser();
    if (!u?.rut) return;
    const r = await fetch(`/api/simulations?rut=${u.rut}`, { method: "DELETE" });
    if (r.ok) {
      setList([]);
      setSelectedIds([]);
      window.dispatchEvent(new CustomEvent("simulations:changed"));
      showToast("Perfil vaciado", undefined, "success");
    } else {
      showToast("No se pudo vaciar", "Inténtalo nuevamente.", "error");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        showToast("Solo puedes comparar 2 simulaciones", "Quita una selección para elegir otra.", "error");
        return prev;
      }
      return [...prev, id];
    });
  };

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(value ?? 0);

  const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-CL") : "-");

  const goSolicitar = (item: StoredSimulation) => {
    const d = item.data as Sim;
    navigate("/solicitar-prestamo", {
      state: {
        monto: d.monto ?? 0,
        tasaInteres: d.tasa ?? 0,
        cuotas: d.cuotas ?? 0,
        fechaPrimerPago: d.fechaPrimerPago ?? "",
        pagoPorCuota: d.pagoPorCuota ?? 0,
        montoTotal: d.montoTotal ?? 0,
      },
    });
  };

  const sel = useMemo(
    () =>
      selectedIds
        .map((id) => {
          const x = list.find((s) => s.id === id);
          if (!x) return null;
          return { id: x.id, data: x.data, createdAt: x.created_at } as StoredSimulation;
        })
        .filter(Boolean) as StoredSimulation[],
    [selectedIds, list]
  );

  const handleCompare = () => {
    if (sel.length < 2) {
      showToast("Selecciona 2 simulaciones", "Elige exactamente dos para comparar.", "error");
      return;
    }
    setCompareOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Perfil</h1>
            <p className="text-sm text-muted-foreground">
              Simulaciones guardadas (máx. {SIM_LIMIT}). Capacidad restante: {Math.max(0, SIM_LIMIT - list.length)}.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" onClick={() => setSelectedIds([])} disabled={!selectedIds.length}>
              Limpiar selección
            </Button>
            <Button onClick={handleCompare} disabled={selectedIds.length !== 2}>
              Comparar simulaciones
            </Button>
            <Button variant="outline" onClick={onClear} disabled={list.length === 0}>
              Vaciar todo
            </Button>
            <Button variant="default" onClick={() => navigate("/codigo-auth")}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Generar código de autenticación
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No tienes simulaciones guardadas. Ve al simulador y usa “Guardar en Perfil”.
          </div>
        ) : (
          <div className="grid gap-4">
            {list.map((item, idx) => {
              const d = item.data as Sim;
              const checked = selectedIds.includes(item.id);

              const asStored: StoredSimulation = {
                // @ts-expect-error adaptado mínimamente
                id: item.id,
                data: item.data,
                // @ts-ignore
                createdAt: item.created_at,
              } as unknown as StoredSimulation;

              return (
                <Card key={item.id} className={`overflow-hidden ${checked ? "ring-2 ring-primary" : ""}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="secondary">#{list.length - idx}</Badge>
                      Simulación
                    </CardTitle>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(item.id)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span>Seleccionar</span>
                      </label>

                      <span className="text-xs text-muted-foreground">Guardada: {formatDate(item.created_at)}</span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => onDelete(item.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-lg border p-3">
                        <div className="mb-1 text-xs text-muted-foreground">Monto</div>
                        <div className="flex items-center gap-2 text-lg font-bold">
                          <DollarSign className="h-4 w-4 text-accent" />
                          {formatCurrency(d.monto)}
                        </div>
                      </div>

                      <div className="rounded-lg border p-3">
                        <div className="mb-1 text-xs text-muted-foreground">Pago por cuota</div>
                        <div className="flex items-center gap-2 text-lg font-semibold text-accent">
                          <TrendingUp className="h-4 w-4" />
                          {formatCurrency(d.pagoPorCuota)}
                        </div>
                      </div>

                      <div className="rounded-lg border p-3">
                        <div className="mb-1 text-xs text-muted-foreground">Monto total</div>
                        <div className="text-lg font-semibold">{formatCurrency(d.montoTotal)}</div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Percent className="h-3 w-3" /> <span>Tasa anual</span>
                        <span className="ml-1 text-foreground font-medium">{d.tasa ?? "-"}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" /> <span>Primer pago</span>
                        <span className="ml-1 text-foreground font-medium">{d.fechaPrimerPago ?? "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <HashIcon /> <span>Cuotas</span>
                        <span className="ml-1 text-foreground font-medium">{d.cuotas ?? "-"}</span>
                      </div>
                    </div>

                    <Separator />
                  </CardContent>

                  <CardFooter className="flex items-center justify-end">
                    <Button onClick={() => goSolicitar(asStored)}>
                      Solicitar préstamo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog de comparación */}
        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogContent className="w-[min(92vw,780px)] sm:max-w-[780px]">
            <DialogHeader>
              <DialogTitle>Comparación de simulaciones</DialogTitle>
            </DialogHeader>
            {sel.length >= 2 ? (
              <Comparison a={sel[0]} b={sel[1]} />
            ) : (
              <p className="text-sm text-muted-foreground">Selecciona 2 simulaciones para comparar.</p>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Mini toast */}
      <MiniToast
        open={toastOpen}
        title={toastMsg.title}
        description={toastMsg.description}
        variant={toastMsg.variant}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default Perfil;

/* ---------- Subcomponentes ---------- */

function Comparison({ a, b }: { a: StoredSimulation; b: StoredSimulation }) {
  const A = (a.data as Sim) || {};
  const B = (b.data as Sim) || {};

  const num = (x: any) => (typeof x === "number" ? x : Number(x ?? 0));
  const montoA = num(A.monto), montoB = num(B.monto);
  const tasaA = num(A.tasa), tasaB = num(B.tasa);
  const cuotasA = num(A.cuotas), cuotasB = num(B.cuotas);
  const cuotaA = num(A.pagoPorCuota), cuotaB = num(B.pagoPorCuota);
  const totalA = num(A.montoTotal), totalB = num(B.montoTotal);
  const interesesA = totalA - montoA;
  const interesesB = totalB - montoB;

  const fmt = (v: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(v);
  const diff = (x: number) => (x === 0 ? "—" : x > 0 ? `+${fmt(x)}` : `-${fmt(Math.abs(x))}`);

  const Pill = ({ who }: { who: "A" | "B" }) => (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        who === "A" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
      }`}
    >
      {who}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div />
        <div className="font-semibold text-center">Simulación <Pill who="A" /></div>
        <div className="font-semibold text-center">Simulación <Pill who="B" /></div>

        <Row label="Monto" a={fmt(montoA)} b={fmt(montoB)} />
        <Row label="Tasa anual" a={`${tasaA}%`} b={`${tasaB}%`} />
        <Row label="Cuotas" a={cuotasA} b={cuotasB} />
        <Row label="Pago por cuota" a={fmt(cuotaA)} b={fmt(cuotaB)} diff={diff(cuotaB - cuotaA)} />
        <Row label="Monto total" a={fmt(totalA)} b={fmt(totalB)} diff={diff(totalB - totalA)} />
        <Row label="Intereses totales" a={fmt(interesesA)} b={fmt(interesesB)} diff={diff(interesesB - interesesA)} />
      </div>
    </div>
  );
}

function Row({ label, a, b, diff }: { label: string; a: any; b: any; diff?: string }) {
  return (
    <>
      <div className="py-2 pr-2 text-muted-foreground">{label}</div>
      <div className="py-2 text-center font-medium">{a}</div>
      <div className="py-2 text-center font-medium">{b}</div>
      {diff !== undefined && (
        <>
          <div></div>
          <div className="pb-2 text-center text-xs text-muted-foreground">—</div>
          <div className="pb-2 text-center text-xs text-muted-foreground">{diff}</div>
        </>
      )}
    </>
  );
}

function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 text-current" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M10 3L8 21M16 3l-2 18M4 8h16M3 16h16" />
    </svg>
  );
}

// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";

// const SIM_LIMIT = 5;

// type StoredSimulation = {
//   id: string;
//   data: any;
//   createdAt?: string;
// };

// import { Header } from "@/components/Header";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Calendar, DollarSign, TrendingUp, Percent, Trash2, ArrowRight } from "lucide-react";
// import MiniToast from "@/components/MiniToast";

// type Sim = {
//   monto?: number;
//   tasa?: number;
//   cuotas?: number;
//   fechaPrimerPago?: string;
//   pagoPorCuota?: number;
//   montoTotal?: number;
//   [k: string]: unknown;
// };

// const USER_KEY = "app:user";
// const getLoggedUser = () => {
//   try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
// };

// type DbSimulation = {
//   id: string;
//   rut: number;
//   data: any;
//   created_at: string;
// };

// const Perfil = () => {
//   const [list, setList] = useState<DbSimulation[]>([]);
//   const [selectedIds, setSelectedIds] = useState<string[]>([]);
//   const [compareOpen, setCompareOpen] = useState(false);
//   const navigate = useNavigate();

//   // ---- MiniToast state ----
//   const [toastOpen, setToastOpen] = useState(false);
//   const [toastMsg, setToastMsg] = useState<{title: string; description?: string; variant?: "default"|"success"|"error"}>({ title: "" });
//   const showToast = (title: string, description?: string, variant: "default"|"success"|"error" = "default") => {
//     setToastMsg({ title, description, variant });
//     setToastOpen(true);
//   };
//   // -------------------------

//   const load = async () => {
//     const u = getLoggedUser();
//     if (!u?.rut) { setList([]); return; }

//     try {
//       const r = await fetch(`/api/simulations?rut=${u.rut}`);
//       if (!r.ok) throw new Error(`HTTP ${r.status}`);

//       const j = await r.json();
//       const sims = (j?.simulations ?? j?.rows ?? j) as any[];
//       setList(Array.isArray(sims) ? sims : []);
//     } catch (e) {
//       console.error("[Perfil] load() fallo:", e);
//       setList([]);
//       showToast("No se pudo cargar", "Inténtalo nuevamente.", "error");
//     }
//   };
//   useEffect(() => { load(); }, []);

//   useEffect(() => {
//     const onChanged = () => load();
//     window.addEventListener("simulations:changed", onChanged as EventListener);
//     return () => window.removeEventListener("simulations:changed", onChanged as EventListener);
//   }, []);

//   const onDelete = async (id: string) => {
//     const u = getLoggedUser();
//     if (!u?.rut) return;
//     const r = await fetch(`/api/simulations/${id}?rut=${u.rut}`, { method: "DELETE" });
//     if (r.ok) {
//       setList((prev) => prev.filter((x) => x.id !== id));
//       setSelectedIds((s) => s.filter((x) => x !== id));
//       window.dispatchEvent(new CustomEvent("simulations:changed"));
//       showToast("Simulación eliminada", undefined, "success");
//     } else {
//       showToast("No se pudo eliminar", "Inténtalo nuevamente.", "error");
//     }
//   };

//   const onClear = async () => {
//     if (!confirm("¿Eliminar TODAS las simulaciones guardadas?")) return;
//     const u = getLoggedUser();
//     if (!u?.rut) return;
//     const r = await fetch(`/api/simulations?rut=${u.rut}`, { method: "DELETE" });
//     if (r.ok) {
//       setList([]);
//       setSelectedIds([]);
//       window.dispatchEvent(new CustomEvent("simulations:changed"));
//       showToast("Perfil vaciado", undefined, "success");
//     } else {
//       showToast("No se pudo vaciar", "Inténtalo nuevamente.", "error");
//     }
//   };

//   const toggleSelect = (id: string) => {
//     setSelectedIds((prev) => {
//       if (prev.includes(id)) return prev.filter((x) => x !== id);
//       if (prev.length >= 2) {
//         showToast("Solo puedes comparar 2 simulaciones", "Quita una selección para elegir otra.", "error");
//         return prev;
//       }
//       return [...prev, id];
//     });
//   };

//   const formatCurrency = (value?: number) =>
//     new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(value ?? 0);

//   const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("es-CL") : "-");

//   const goSolicitar = (item: StoredSimulation) => {
//     const d = item.data as Sim;
//     navigate("/solicitar-prestamo", {
//       state: {
//         monto: d.monto ?? 0,
//         tasaInteres: d.tasa ?? 0,
//         cuotas: d.cuotas ?? 0,
//         fechaPrimerPago: d.fechaPrimerPago ?? "",
//         pagoPorCuota: d.pagoPorCuota ?? 0,
//         montoTotal: d.montoTotal ?? 0,
//       },
//     });
//   };

//   const sel = useMemo(
//     () =>
//       selectedIds
//         .map((id) => {
//           const x = list.find((s) => s.id === id);
//           if (!x) return null;
//           return { id: x.id, data: x.data, createdAt: x.created_at } as StoredSimulation;
//         })
//         .filter(Boolean) as StoredSimulation[],
//     [selectedIds, list]
//   );

//   const handleCompare = () => {
//     if (sel.length < 2) {
//       showToast("Selecciona 2 simulaciones", "Elige exactamente dos para comparar.", "error");
//       return;
//     }
//     setCompareOpen(true);
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Header />

//       <main className="container mx-auto px-4 py-12 max-w-5xl">
//         <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
//           <div>
//             <h1 className="text-2xl font-bold">Perfil</h1>
//             <p className="text-sm text-muted-foreground">
//               Simulaciones guardadas (máx. {SIM_LIMIT}). Capacidad restante: {Math.max(0, SIM_LIMIT - list.length)}.
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <Button variant="secondary" onClick={() => setSelectedIds([])} disabled={!selectedIds.length}>
//               Limpiar selección
//             </Button>
//             <Button onClick={handleCompare} disabled={selectedIds.length !== 2}>
//               Comparar simulaciones
//             </Button>
//             <Button variant="outline" onClick={onClear} disabled={list.length === 0}>
//               Vaciar todo
//             </Button>
//           </div>
//         </div>

//         {list.length === 0 ? (
//           <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
//             No tienes simulaciones guardadas. Ve al simulador y usa “Guardar en Perfil”.
//           </div>
//         ) : (
//           <div className="grid gap-4">
//             {list.map((item, idx) => {
//               const d = item.data as Sim;
//               const checked = selectedIds.includes(item.id);

//               const asStored: StoredSimulation = {
//                 // @ts-expect-error adaptado mínimamente
//                 id: item.id,
//                 data: item.data,
//                 // @ts-ignore
//                 createdAt: item.created_at,
//               } as unknown as StoredSimulation;

//               return (
//                 <Card key={item.id} className={`overflow-hidden ${checked ? "ring-2 ring-primary" : ""}`}>
//                   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
//                     <CardTitle className="text-base flex items-center gap-2">
//                       <Badge variant="secondary">#{list.length - idx}</Badge>
//                       Simulación
//                     </CardTitle>

//                     <div className="flex items-center gap-3">
//                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
//                         <input
//                           type="checkbox"
//                           checked={checked}
//                           onChange={() => toggleSelect(item.id)}
//                           className="h-4 w-4 accent-primary"
//                         />
//                         <span>Seleccionar</span>
//                       </label>

//                       <span className="text-xs text-muted-foreground">Guardada: {formatDate(item.created_at)}</span>

//                       <Button
//                         variant="ghost"
//                         size="icon"
//                         className="text-red-500 hover:text-red-600"
//                         onClick={() => onDelete(item.id)}
//                         title="Eliminar"
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </CardHeader>

//                   <CardContent className="space-y-4 pt-0">
//                     <div className="grid gap-4 md:grid-cols-3">
//                       <div className="rounded-lg border p-3">
//                         <div className="mb-1 text-xs text-muted-foreground">Monto</div>
//                         <div className="flex items-center gap-2 text-lg font-bold">
//                           <DollarSign className="h-4 w-4 text-accent" />
//                           {formatCurrency(d.monto)}
//                         </div>
//                       </div>

//                       <div className="rounded-lg border p-3">
//                         <div className="mb-1 text-xs text-muted-foreground">Pago por cuota</div>
//                         <div className="flex items-center gap-2 text-lg font-semibold text-accent">
//                           <TrendingUp className="h-4 w-4" />
//                           {formatCurrency(d.pagoPorCuota)}
//                         </div>
//                       </div>

//                       <div className="rounded-lg border p-3">
//                         <div className="mb-1 text-xs text-muted-foreground">Monto total</div>
//                         <div className="text-lg font-semibold">{formatCurrency(d.montoTotal)}</div>
//                       </div>
//                     </div>

//                     <div className="grid gap-3 md:grid-cols-3 text-sm">
//                       <div className="flex items-center gap-2 text-muted-foreground">
//                         <Percent className="h-3 w-3" /> <span>Tasa anual</span>
//                         <span className="ml-1 text-foreground font-medium">{d.tasa ?? "-"}%</span>
//                       </div>
//                       <div className="flex items-center gap-2 text-muted-foreground">
//                         <Calendar className="h-3 w-3" /> <span>Primer pago</span>
//                         <span className="ml-1 text-foreground font-medium">{d.fechaPrimerPago ?? "-"}</span>
//                       </div>
//                       <div className="flex items-center gap-2 text-muted-foreground">
//                         <HashIcon /> <span>Cuotas</span>
//                         <span className="ml-1 text-foreground font-medium">{d.cuotas ?? "-"}</span>
//                       </div>
//                     </div>

//                     <Separator />
//                   </CardContent>

//                   <CardFooter className="flex items-center justify-end">
//                     <Button onClick={() => goSolicitar(asStored)}>
//                       Solicitar préstamo <ArrowRight className="ml-2 h-4 w-4" />
//                     </Button>
//                   </CardFooter>
//                 </Card>
//               );
//             })}
//           </div>
//         )}

//         {/* Dialog de comparación */}
//         <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
//           <DialogContent className="w-[min(92vw,780px)] sm:max-w-[780px]">
//             <DialogHeader>
//               <DialogTitle>Comparación de simulaciones</DialogTitle>
//             </DialogHeader>
//             {sel.length >= 2 ? (
//               <Comparison a={sel[0]} b={sel[1]} />
//             ) : (
//               <p className="text-sm text-muted-foreground">Selecciona 2 simulaciones para comparar.</p>
//             )}
//           </DialogContent>
//         </Dialog>
//       </main>

//       {/* Mini toast */}
//       <MiniToast
//         open={toastOpen}
//         title={toastMsg.title}
//         description={toastMsg.description}
//         variant={toastMsg.variant}
//         onClose={() => setToastOpen(false)}
//       />
//     </div>
//   );
// };

// export default Perfil;

// /* ---------- Subcomponentes ---------- */

// function Comparison({ a, b }: { a: StoredSimulation; b: StoredSimulation }) {
//   const A = (a.data as Sim) || {};
//   const B = (b.data as Sim) || {};

//   const num = (x: any) => (typeof x === "number" ? x : Number(x ?? 0));
//   const montoA = num(A.monto), montoB = num(B.monto);
//   const tasaA = num(A.tasa), tasaB = num(B.tasa);
//   const cuotasA = num(A.cuotas), cuotasB = num(B.cuotas);
//   const cuotaA = num(A.pagoPorCuota), cuotaB = num(B.pagoPorCuota);
//   const totalA = num(A.montoTotal), totalB = num(B.montoTotal);
//   const interesesA = totalA - montoA;
//   const interesesB = totalB - montoB;

//   const fmt = (v: number) =>
//     new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(v);
//   const diff = (x: number) => (x === 0 ? "—" : x > 0 ? `+${fmt(x)}` : `-${fmt(Math.abs(x))}`);

//   const Pill = ({ who }: { who: "A" | "B" }) => (
//     <span
//       className={`rounded-full px-2 py-0.5 text-xs ${
//         who === "A" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
//       }`}
//     >
//       {who}
//     </span>
//   );

//   return (
//     <div className="space-y-4">
//       <div className="grid grid-cols-3 gap-2 text-sm">
//         <div />
//         <div className="font-semibold text-center">Simulación <Pill who="A" /></div>
//         <div className="font-semibold text-center">Simulación <Pill who="B" /></div>

//         <Row label="Monto" a={fmt(montoA)} b={fmt(montoB)} />
//         <Row label="Tasa anual" a={`${tasaA}%`} b={`${tasaB}%`} />
//         <Row label="Cuotas" a={cuotasA} b={cuotasB} />
//         <Row label="Pago por cuota" a={fmt(cuotaA)} b={fmt(cuotaB)} diff={diff(cuotaB - cuotaA)} />
//         <Row label="Monto total" a={fmt(totalA)} b={fmt(totalB)} diff={diff(totalB - totalA)} />
//         <Row label="Intereses totales" a={fmt(interesesA)} b={fmt(interesesB)} diff={diff(interesesB - interesesA)} />
//       </div>
//     </div>
//   );
// }

// function Row({ label, a, b, diff }: { label: string; a: any; b: any; diff?: string }) {
//   return (
//     <>
//       <div className="py-2 pr-2 text-muted-foreground">{label}</div>
//       <div className="py-2 text-center font-medium">{a}</div>
//       <div className="py-2 text-center font-medium">{b}</div>
//       {diff !== undefined && (
//         <>
//           <div></div>
//           <div className="pb-2 text-center text-xs text-muted-foreground">—</div>
//           <div className="pb-2 text-center text-xs text-muted-foreground">{diff}</div>
//         </>
//       )}
//     </>
//   );
// }

// function HashIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="h-3 w-3 text-current" fill="none" stroke="currentColor">
//       <path strokeWidth="2" d="M10 3L8 21M16 3l-2 18M4 8h16M3 16h16" />
//     </svg>
//   );
// }
