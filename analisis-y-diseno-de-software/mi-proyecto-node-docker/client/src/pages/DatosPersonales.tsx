import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, 
  Upload, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  X,
  CreditCard
} from "lucide-react";
import MiniToast from "@/components/MiniToast";

type UploadedDoc = {
  file: File;
  url: string;
  name: string;
} | null;

const DatosPersonales = () => {
  // Estados para los documentos
  const [docFront, setDocFront] = useState<UploadedDoc>(null);
  const [docBack, setDocBack] = useState<UploadedDoc>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estado para el Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<{title: string; description?: string; variant?: "default"|"success"|"error"}>({ title: "" });

  const showToast = (title: string, description?: string, variant: "default"|"success"|"error" = "default") => {
    setToastMsg({ title, description, variant });
    setToastOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación básica de tipo
    if (!file.type.startsWith('image/')) {
      showToast("Error de archivo", "Por favor selecciona una imagen válida.", "error");
      return;
    }

    const url = URL.createObjectURL(file);
    const docData = { file, url, name: file.name };

    if (side === 'front') setDocFront(docData);
    else setDocBack(docData);
    
    showToast("Documento cargado", `El lado ${side === 'front' ? 'frontal' : 'trasero'} se añadió correctamente.`, "success");
    e.target.value = ''; // Limpiar input
  };

  const removeDoc = (side: 'front' | 'back') => {
    if (side === 'front') setDocFront(null);
    else setDocBack(null);
  };

  // --- NUEVA FUNCIÓN QUE MANDA LOS DATOS AL BACKEND ---
  const handleGuardarCambios = async () => {
    if (!docFront || !docBack) return;

    const formData = new FormData();
    formData.append("frontal", docFront.file);
    formData.append("trasera", docBack.file);

    // Obtener el usuario actual para mandarle el RUT al backend
    const userString = localStorage.getItem("app:user");
    if (userString) {
      const user = JSON.parse(userString);
      formData.append("rut", user.rut);
    } else {
      showToast("Error", "No se encontró la sesión del usuario", "error");
      return;
    }

    try {
      showToast("Subiendo...", "Estamos guardando tus documentos", "default");
      
      const res = await fetch("/api/upload-docs", {
        method: "POST",
        body: formData, // Envia el FormData (no necesita headers de JSON)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir documentos");
      }

      showToast("¡Listo!", "Tus documentos han sido guardados", "success");
      
      // Opcional: Limpiar las fotos de la pantalla si quieres que se blanquee
      // setDocFront(null);
      // setDocBack(null);

    } catch (error: any) {
      showToast("Error", error.message, "error");
    }
  };
  // ----------------------------------------------------

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <User className="h-8 w-8 text-accent" />
            </div>
            <h1 className="text-3xl font-bold">Datos Personales</h1>
          </div>
          <p className="text-muted-foreground">
            Completa tu perfil subiendo tus documentos de identidad para validar tu cuenta.
          </p>
        </header>

        <section className="space-y-8">
          <Card className="shadow-card border-none bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-accent" />
                <CardTitle>Cédula de Identidad</CardTitle>
              </div>
              <CardDescription>
                Sube fotos claras donde se lean todos tus datos. Formatos permitidos: JPG, PNG.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              
              {/* Espacio para Cara Frontal */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  Cara Frontal <Badge variant="outline" className="font-normal">Requerido</Badge>
                </label>
                
                {!docFront ? (
                  <label className="group relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer bg-accent/5 border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-accent/60 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium">Subir frontal</p>
                      <p className="text-xs text-muted-foreground mt-1">Arrastra o haz clic</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'front')} 
                    />
                  </label>
                ) : (
                  <div className="relative group overflow-hidden rounded-xl border bg-success/5 border-success/20 p-4 h-44 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/20 rounded-full">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-semibold truncate">{docFront.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lado Frontal</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => setPreviewUrl(docFront.url)}
                      >
                        <Eye className="w-4 h-4" /> Revisar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => removeDoc('front')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Espacio para Cara Trasera */}
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  Cara Trasera <Badge variant="outline" className="font-normal">Requerido</Badge>
                </label>
                
                {!docBack ? (
                  <label className="group relative flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer bg-accent/5 border-accent/20 hover:bg-accent/10 hover:border-accent/40 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-accent/60 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium">Subir reverso</p>
                      <p className="text-xs text-muted-foreground mt-1">Arrastra o haz clic</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'back')} 
                    />
                  </label>
                ) : (
                  <div className="relative group overflow-hidden rounded-xl border bg-success/5 border-success/20 p-4 h-44 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-success/20 rounded-full">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-semibold truncate">{docBack.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Lado Trasero</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => setPreviewUrl(docBack.url)}
                      >
                        <Eye className="w-4 h-4" /> Revisar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => removeDoc('back')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
            <CardFooter className="bg-accent/5 border-t py-4 flex justify-between items-center">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <FileText className="w-3 h-3" /> Tus datos se procesan de forma segura
              </p>
              {/* --- AQUÍ CONECTAMOS EL EVENTO ONCLICK --- */}
              <Button disabled={!docFront || !docBack} variant="accent" onClick={handleGuardarCambios}>
                Guardar cambios
              </Button>
            </CardFooter>
          </Card>
        </section>
      </main>

      {/* Modal para Revisar Imagen */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
          <DialogHeader className="p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/60 to-transparent">
            <DialogTitle className="text-white flex items-center gap-2">
              Vista previa del documento
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px] p-4">
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Vista previa" 
                className="max-w-full max-h-[70vh] rounded shadow-2xl object-contain"
              />
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="w-6 h-6" />
          </Button>
        </DialogContent>
      </Dialog>

      {/* Footer consistente con el proyecto */}
      <footer className="bg-primary text-primary-foreground py-8 mt-16">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 Sistema de Préstamos. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Notificaciones */}
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

export default DatosPersonales;