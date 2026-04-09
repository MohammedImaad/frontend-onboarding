import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ShoppingBag, ArrowRight } from "lucide-react";
import { ingest } from "@/lib/api";
import { getSession, updateSession } from "@/lib/session";

interface ShopifyIngestionPageProps {
  onComplete: () => void;
}

export default function ShopifyIngestionPage({ onComplete }: ShopifyIngestionPageProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = getSession();
      if (!session) return;
      const data = await ingest(url, session.business_id);
      updateSession({ upload_batch_id: data.upload_batch_id, ingestion_status: data.status });
      onComplete();
    } catch {
      setError("Failed to ingest products. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg"
      >
        <div className="glass-card p-8">
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 glow-border"
            >
              <ShoppingBag className="h-6 w-6 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Now get ready to sell through{" "}
              <span className="text-gradient">Telegram</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Enter your Shopify store URL to import your products
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Shopify Store URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://your-store.myshopify.com"
                className="w-full rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 animate-pulse-glow"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Import Products
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
