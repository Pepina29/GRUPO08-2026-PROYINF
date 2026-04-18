import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Shield, FileCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import MiniToast from "@/components/MiniToast";

const EvalRiesgo = () => {
  const navigate = useNavigate();
  const [consentimiento, setConsentimiento] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  // Toast para advertencia
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState({ title: "", description: "" });

  const handleContinue = () => {
    if (!consentimiento) {
      // Mostrar toast de advertencia
      setToastMsg({
        title: "Debes aceptar el consentimiento",
        description: "Por favor, marca la casilla para continuar con la evaluación."
      });
      setToastOpen(true);
      return;
    }

    // Si acepta, continuar con la evaluación
    navigate("/eval-riesgo-int");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-accent" />
            <h1 className="text-4xl font-bold text-foreground">Evaluación de Riesgo</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Evaluamos tu perfil para ofrecerte las mejores condiciones de préstamo
          </p>
        </section>

        {/* Explicación del proceso */}
        <section className="mb-12">
          <Card className="shadow-card-lg border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-6 w-6 text-accent" />
                ¿Qué es la evaluación de riesgo?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                La evaluación de riesgo es un análisis que realizamos para determinar tu capacidad de pago 
                y ofrecerte condiciones de préstamo personalizadas según tu perfil financiero.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-success/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Proceso rápido</p>
                    <p className="text-sm text-muted-foreground">Solo toma unos minutos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-success/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Información segura</p>
                    <p className="text-sm text-muted-foreground">Tus datos están protegidos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-success/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Mejores tasas</p>
                    <p className="text-sm text-muted-foreground">Condiciones personalizadas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-success/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sin compromiso</p>
                    <p className="text-sm text-muted-foreground">No afecta tu historial</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Formulario de consentimiento */}
        <section>
          <Card className="shadow-card-lg">
            <CardHeader>
              <CardTitle>Autorización para evaluación</CardTitle>
              <CardDescription>
                Para realizar la evaluación de riesgo, necesitamos tu autorización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información sobre el uso del RUT */}
              <div className="rounded-lg bg-accent/5 border border-accent/20 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      Uso de información personal
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Utilizaremos tu RUT para consultar tu historial crediticio en instituciones 
                      financieras autorizadas. Esta información nos permite evaluar tu capacidad de 
                      pago y ofrecerte las mejores condiciones.
                    </p>
                  </div>
                </div>
              </div>

              {/* Checkbox de consentimiento */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/5 transition-colors">
                <Checkbox
                  id="consentimiento"
                  checked={consentimiento}
                  onCheckedChange={(checked) => setConsentimiento(checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="consentimiento"
                    className="text-base font-medium leading-none cursor-pointer"
                  >
                    Autorizo el uso de mi RUT para la evaluación de riesgo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Al marcar esta casilla, autorizas a Sistema de Préstamos a consultar tu 
                    información crediticia para fines de evaluación.
                  </p>
                </div>
              </div>

              {/* Botón de continuar */}
              <div className="flex flex-col gap-4 pt-4">
                <Button
                  onClick={handleContinue}
                  variant="accent"
                  size="lg"
                  className="w-full"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Continuar con la evaluación
                </Button>
                <Button
                  onClick={() => navigate("/eval-riesgo-int")}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  No autorizo el consentimiento
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Debes aceptar el consentimiento para continuar con la evaluación autorizada
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Información adicional */}
        <section className="mt-8">
          <Card className="shadow-card bg-gradient-hero text-white">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Tu privacidad es importante</h3>
                  <p className="text-white/90 text-sm">
                    Toda tu información está protegida con los más altos estándares de seguridad. 
                    Nunca compartiremos tus datos con terceros sin tu autorización expresa. 
                    Cumplimos con todas las normativas de protección de datos vigentes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 mt-16">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Sistema de Préstamos. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Mini Toast */}
      <MiniToast
        open={toastOpen}
        title={toastMsg.title}
        description={toastMsg.description}
        variant="error"
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
};

export default EvalRiesgo;