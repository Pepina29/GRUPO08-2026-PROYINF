import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoanApplication from "./pages/LoanApplication";
import Information from "./pages/Information";
import EvalRiesgo from "./pages/EvalRiesgo";
import EvalRiesgoInt from "./pages/EvalRiesgoInt";
import Perfil from "@/pages/Perfil";
import DatosPersonales from "@/pages/DatosPersonales";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/solicitar-prestamo" element={<LoanApplication />} />
          <Route path="/informacion" element={<Information />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/datos-personales" element={<DatosPersonales />} />
          <Route path="/eval-riesgo" element={<EvalRiesgo />} />
          <Route path="/eval-riesgo-int" element={<EvalRiesgoInt />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;