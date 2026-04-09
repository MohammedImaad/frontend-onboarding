import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginPage from "@/components/LoginPage";
import ShopifyIngestionPage from "@/components/ShopifyIngestionPage";
import SalesAssistantPage from "@/components/SalesAssistantPage";
import OrdersManagementPage from "@/components/OrdersManagementPage";
import { getSession, isLoggedIn, isAdmin, hasUploadBatch, clearSession } from "@/lib/session";
import { LogOut } from "lucide-react";

type AppStep = "login" | "ingestion" | "review" | "testing" | "orders";

function resolveStep(): AppStep {
  if (!isLoggedIn()) return "login";
  const session = getSession();
  if (!session) return "login";

  // Non-admin → orders
  if (session.telegram_bot_token !== null) return "orders";

  // Admin flow
  if (!hasUploadBatch()) return "ingestion";
  if (session.ingestion_status === "pending_review") return "review";
  return "testing";
}

const Index = () => {
  const [step, setStep] = useState<AppStep>(resolveStep);

  const refresh = useCallback(() => setStep(resolveStep()), []);

  useEffect(() => {
    // Re-check on storage changes (other tabs)
    const handler = () => refresh();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refresh]);

  const handleLogout = () => {
    clearSession();
    refresh();
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Top bar when logged in */}
      {step !== "login" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed right-4 top-4 z-50"
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-border bg-card/80 backdrop-blur-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === "login" && <LoginPage onLogin={refresh} />}
          {step === "ingestion" && <ShopifyIngestionPage onComplete={refresh} />}
          {step === "testing" && <SalesAssistantPage />}
          {step === "orders" && <OrdersManagementPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
