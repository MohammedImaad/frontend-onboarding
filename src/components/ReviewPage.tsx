import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Package, Brain, Send } from "lucide-react";
import { fetchPreview, completeIngestion, sendManual, type PreviewResponse } from "@/lib/api";
import { getSession, updateSession } from "@/lib/session";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ReviewPageProps {
  onComplete: () => void;
}

export default function ReviewPage({ onComplete }: ReviewPageProps) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [manualText, setManualText] = useState("");
  const [sendingManual, setSendingManual] = useState(false);

  const loadPreview = useCallback(async () => {
    try {
      const session = getSession();
      if (!session?.upload_batch_id) return;
      const data = await fetchPreview(session.business_id, session.upload_batch_id);
      setPreview(data);
    } catch {
      setError("Failed to load preview data.");
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const session = getSession();
      if (!session?.upload_batch_id) return;
      await completeIngestion(session.business_id, session.upload_batch_id);
      updateSession({ ingestion_status: "ready" });
      onComplete();
    } catch {
      setError("Failed to complete setup. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const handleSendManual = async () => {
    if (!manualText.trim()) return;
    setSendingManual(true);
    try {
      const session = getSession();
      if (!session?.upload_batch_id) return;
      await sendManual(session.business_id, session.upload_batch_id, manualText.trim());
      setManualText("");
      setLoadingPreview(true);
      await loadPreview();
    } catch {
      setError("Failed to add knowledge.");
    } finally {
      setSendingManual(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col"
      >
        <div className="mb-4 pt-8">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-border">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Review your <span className="text-gradient">imported data</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check products &amp; knowledge, then complete setup
          </p>
        </div>

        <Tabs defaultValue="products" className="flex flex-1 flex-col">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="products" className="flex-1 gap-1.5">
              <Package className="h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex-1 gap-1.5">
              <Brain className="h-4 w-4" /> Knowledge
            </TabsTrigger>
          </TabsList>

          {/* ---- Products Tab (unchanged) ---- */}
          <TabsContent value="products" className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
            {loadingPreview ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error && !preview ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : preview?.products?.length ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {preview.products.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card overflow-hidden rounded-xl"
                  >
                    {p.images?.[0] && (
                      <div className="aspect-square w-full overflow-hidden bg-muted/30">
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-foreground line-clamp-2">{p.name}</h3>
                      <p className="mt-1 text-xs font-semibold text-primary">₹{p.price}</p>
                      {p.available !== undefined && (
                        <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${p.available ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                          {p.available ? "In Stock" : "Out of Stock"}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No products found.</p>
            )}
          </TabsContent>

          {/* ---- Knowledge Tab ---- */}
          <TabsContent value="knowledge" className="flex flex-1 flex-col gap-4" style={{ maxHeight: "calc(100vh - 320px)" }}>
            {/* Manual input */}
            <div className="glass-card rounded-xl p-4">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Add anything your AI should know (shipping, policies, etc.)
              </label>
              <Textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="e.g. We offer free shipping on orders above ₹999..."
                className="mb-3 min-h-[80px] resize-none bg-background/50"
              />
              <button
                onClick={handleSendManual}
                disabled={sendingManual || !manualText.trim()}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
              >
                {sendingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Add
              </button>
            </div>

            {/* Chunks list */}
            <div className="flex-1 overflow-y-auto">
              {loadingPreview ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : preview?.chunks?.length ? (
                <div className="space-y-2">
                  {preview.chunks.map((c, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass-card rounded-lg p-3"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {c.source_type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{c.text}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">No knowledge chunks yet.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {error && preview && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-sm text-destructive">
            {error}
          </motion.p>
        )}

        <button
          onClick={handleComplete}
          disabled={completing}
          className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 animate-pulse-glow"
        >
          {completing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Complete Setup
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
