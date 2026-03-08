import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Participants from "./pages/Participants";
import EmailAutomation from "./pages/EmailAutomation";
import SocialMedia from "./pages/SocialMedia";
import Scheduler from "./pages/Scheduler";
import SwarmControl from "./pages/SwarmControl";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/participants" element={<Participants />} />
            <Route path="/email-automation" element={<EmailAutomation />} />
            <Route path="/social-media" element={<SocialMedia />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/swarm-control" element={<SwarmControl />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
