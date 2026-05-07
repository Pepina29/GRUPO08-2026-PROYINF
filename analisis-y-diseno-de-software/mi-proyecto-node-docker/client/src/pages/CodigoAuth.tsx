import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, RefreshCcw, Copy, ArrowLeft, Timer } from "lucide-react";
import MiniToast from "@/components/MiniToast";

const CODE_TTL = 60; // segundos

const generateCode = () => {
  // 6 dígitos criptográficamente seguros
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1_000_000).padStart(6, "0");
};

const CodigoAuth = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<number>(Date.now());
  const [remaining, setRemaining] = useState<number>(CODE_TTL);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; description?: string; variant?: "default" | "success" | "error" }>({ title: "" });
  const showToast = (title: string, description?: string, variant: "default" | "success" | "error" = "default") => {
    setToastMsg({ title, description, variant });
    setToastOpen(true);
  };

  const regenerate = () => {
    setCode(generateCode());
    setCreatedAt(Date.now());
    setRemaining(CODE_TTL);
  };

  useEffect(() => {
    regenerate();
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = Math.floor((Date.now() - createdAt) / 1000);
      const left = Math.max(0, CODE_TTL - elapsed);
      setRemaining(left);
      if (left === 0) {
        regenerate();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [createdAt]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast("Código copiado", "Pégalo donde lo necesites.", "success");
    } catch {
      showToast("No se pudo copiar", "Inténtalo nuevamente.", "error");
    }
  };

  const pct = Math.round((remaining / CODE_TTL) * 100);

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
              <ShieldCheck className="h-5 w-5 text-accent" />
              Código de autenticación
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Tu código de 6 dígitos. Se renueva automáticamente cada {CODE_TTL} segundos.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-0">
            <div className="rounded-xl border bg-muted/30 p-6">
              <div className="flex justify-center gap-2 sm:gap-3">
                {code.split("").map((d, i) => (
                  <div
                    key={i}
                    className="flex h-14 w-10 sm:h-16 sm:w-12 items-center justify-center rounded-lg border bg-background text-2xl sm:text-3xl font-bold tabular-nums shadow-sm"
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Expira en
                </span>
                <span className="font-medium text-foreground tabular-nums">
                  {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                  {String(remaining % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            <Separator />

            <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
              No compartas este código con nadie. Solo es válido durante el tiempo restante mostrado.
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={onCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button onClick={regenerate}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Generar nuevo
            </Button>
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
