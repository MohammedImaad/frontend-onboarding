import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, CheckCircle2, Package, FileText, Bot, User } from "lucide-react";
import { fetchPreview, sendManual, completeIngestion, type PreviewResponse } from "@/lib/api";
import { getSession, updateSession } from "@/lib/session";

interface ReviewPageProps {
  onComplete: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ReviewPage({ onComplete }: ReviewPageProps) {
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPreview();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadPreview = async () => {
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
  };

  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const userMsg = text.trim();
    setText("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setSending(true);

    try {
      const session = getSession();
      if (!session?.upload_batch_id) return;
      await sendManual(session.business_id, session.upload_batch_id, userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: "Knowledge added successfully." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to add. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

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

  return (
    <div className="flex min-h-screen flex-col p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col"
      >
        <div className="mb-6 pt-8">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-border">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Review your <span className="text-gradient">imported data</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your products, add extra knowledge, then complete setup
          </p>
        </div>

        {/* Preview Data */}
        <div className="glass-card mb-4 max-h-[300px] overflow-y-auto p-4">
          {loadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error && !preview ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : preview ? (
            <div className="space-y-4">
              {preview.products.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Package className="h-3.5 w-3.5" /> Products ({preview.products.length})
                  </h3>
                  <div className="space-y-2">
                    {preview.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <span className="text-sm text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {preview.texts.length > 0 && (
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> Content
                  </h3>
                  <div className="space-y-1">
                    {preview.texts.map((t, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{t}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Manual knowledge chat */}
        <div
          ref={scrollRef}
          className="glass-card mb-4 flex-1 space-y-4 overflow-y-auto p-4"
          style={{ maxHeight: "200px", minHeight: "100px" }}
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground/50">
                Add extra knowledge about your business...
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.role === "user" ? "bg-primary/10" : "bg-secondary"}`}>
                {msg.role === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="rounded-xl bg-secondary px-4 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendManual} className="mb-4 flex gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add extra knowledge about your business..."
            className="flex-1 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="flex items-center justify-center rounded-lg bg-primary px-4 text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 text-sm text-destructive">
            {error}
          </motion.p>
        )}

        <button
          onClick={handleComplete}
          disabled={completing}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50 animate-pulse-glow"
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
