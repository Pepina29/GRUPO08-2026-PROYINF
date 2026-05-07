import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ShieldCheck, ArrowLeft, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import MiniToast from "@/components/MiniToast";

/**
 * Página: Crear código de autenticación
 * El usuario elige un código de 6 dígitos y lo confirma.
 * El guardado real (POST al backend) se hace en `saveAuthCode` — reemplazá
 * el cuerpo por tu llamada real (fetch/axios/supabase). Igualmente, para
 * recuperarlo más tarde usá `fetchAuthCode` desde donde lo necesites.
 */

const USER_KEY = "app:user";

const getLoggedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

async function saveAuthCode(code: string): Promise<void> {
  const user = getLoggedUser();
  const rut = user?.rut || user?.rut_cliente;

  if (!rut) {
    throw new Error("No se encontró el RUT del usuario logueado");
  }

  const res = await fetch("/api/auth-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, rut }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.ok) {
    throw new Error(data?.message || "No se pudo guardar el código");
  }
}

// 🔌 BACKEND — para usar desde otras pantallas cuando necesites recuperarlo
// export async function fetchAuthCode(): Promise<string | null> {
//   const res = await fetch("/api/auth-code");
//   if (!res.ok) return null;
//   const { code } = await res.json();
//   return code ?? null;
// }

const CodigoAuth = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "success" | "error";
  }>({ title: "" });
  const showToast = (
    title: string,
    description?: string,
    variant: "default" | "success" | "error" = "default",
  ) => {
    setToastMsg({ title, description, variant });
    setToastOpen(true);
  };

  const codeReady = code.length === 6;
  const matches = useMemo(() => confirm.length === 6 && confirm === code, [code, confirm]);

  const goConfirm = () => {
    if (!codeReady) {
      showToast("Código incompleto", "Ingresa los 6 dígitos.", "error");
      return;
    }
    setStep("confirm");
  };

  const handleSave = async () => {
  const finalCode = code.trim();

  if (finalCode.length !== 6 || confirm !== finalCode) {
    showToast("Los códigos no coinciden", "Revisa e intenta nuevamente.", "error");
    return;
  }

  try {
    setSaving(true);
    await saveAuthCode(finalCode);
    window.dispatchEvent(new CustomEvent("auth-code:changed"));
    showToast("Código guardado", "Guardado y listo para usar.", "success");
    setTimeout(() => navigate(-1), 800);
  } catch (e: any) {
    console.error("[CodigoAuth] Error guardando:", e);
    showToast("Error al guardar", e?.message || "Intenta nuevamente en unos segundos.", "error");
  } finally {
    setSaving(false);
  }
};

  const renderDots = (value: string) =>
    show ? value : value.replace(/./g, "•").padEnd(0, "");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Badge variant="secondary" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> 2FA
          </Badge>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-accent" />
              {step === "create" ? "Crea tu código de autenticación" : "Confirma tu código"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {step === "create"
                ? "Elege un código de 6 dígitos. Lo vas a usar para autenticarte más adelante, esta será tu firma digital."
                : "Vuleve a ingresar el mismo código para confirmarlo."}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-0">
            <div className="rounded-xl border bg-muted/30 p-6">
              <div className="flex justify-center">
                {step === "create" ? (
                  <InputOTP
                    maxLength={6}
                    value={show ? code : code}
                    onChange={(v) => setCode(v.replace(/\D/g, ""))}
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-14 w-10 sm:h-16 sm:w-12 text-2xl sm:text-3xl font-bold"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                ) : (
                  <InputOTP
                    maxLength={6}
                    value={confirm}
                    onChange={(v) => setConfirm(v.replace(/\D/g, ""))}
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-14 w-10 sm:h-16 sm:w-12 text-2xl sm:text-3xl font-bold"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShow((s) => !s)}
                  className="text-xs text-muted-foreground"
                >
                  {show ? (
                    <>
                      <EyeOff className="mr-1 h-3.5 w-3.5" /> Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1 h-3.5 w-3.5" /> Mostrar
                    </>
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground space-y-1">
              <p>• Elege un código que recuerdes pero que no sea fácil de adivinar.</p>
              <p>• Evita secuencias obvias como 123456 o fechas conocidas.</p>
              <p>• No compartas este código con nadie, esta es tu firma digital y autentifica que la persona eres TÚ.</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-end gap-2">
            {step === "create" ? (
              <Button onClick={goConfirm} disabled={!codeReady}>
                Continuar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirm("");
                    setStep("create");
                  }}
                  disabled={saving}
                >
                  Editar código
                </Button>
                <Button onClick={handleSave} disabled={!matches || saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar código"
                  )}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </main>

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

export default CodigoAuth;
