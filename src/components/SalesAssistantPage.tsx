import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Bot, User } from "lucide-react";
import { queryAssistant } from "@/lib/api";
import { getSession } from "@/lib/session";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SalesAssistantPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg = query.trim();
    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const session = getSession();
      if (!session) return;
      const data = await queryAssistant(session.business_id, userMsg);
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
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
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Test your sales assistant
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            While we create your Telegram bot, try asking about your products
          </p>
        </div>

        <div
          ref={scrollRef}
          className="glass-card mb-4 flex-1 space-y-4 overflow-y-auto p-4"
          style={{ maxHeight: "calc(100vh - 280px)" }}
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground/50">
                Ask something about your products...
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
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.role === "user" ? "bg-primary/10" : "bg-secondary"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
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

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about your products..."
            className="flex-1 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center justify-center rounded-lg bg-primary px-4 text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
