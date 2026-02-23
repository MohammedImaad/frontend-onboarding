import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Package,
  ChevronDown,
  MapPin,
  Mail,
  Hash,
  ShoppingCart,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { fetchOrders, updateOrderStatus, type Order } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const session = getSession();
      if (!session) return;
      const data = await fetchOrders(session.business_id);
      setOrders(data.orders);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (paymentId: string) => {
    setUpdatingId(paymentId);
    // menu removed, no-op
    try {
      const session = getSession();
      if (!session) return;
      await updateOrderStatus(session.business_id, paymentId);
      setOrders((prev) =>
        prev.map((o) => (o.payment_id === paymentId ? { ...o, status: "success" } : o))
      );
    } catch {
      console.error("Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/4 right-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-4xl"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 glow-border">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Orders</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <motion.div
                key={order.payment_id}
                layout
                className="glass-card overflow-hidden"
              >
                {/* Row header */}
                <div
                  className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/30"
                  onClick={() =>
                    setExpandedId(expandedId === order.payment_id ? null : order.payment_id)
                  }
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      expandedId === order.payment_id ? "rotate-180" : ""
                    }`}
                  />

                  <div className="min-w-0 flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 items-center">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {order.payment_id.slice(0, 12)}…
                    </span>
                    <span className="truncate text-sm text-foreground">{order.email}</span>
                    <span className="text-sm font-medium text-foreground">
                      {order.amount} {order.cart_snapshot.summary.currency}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        order.status === "success"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {order.status === "success" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {order.status}
                    </span>
                    <span className="hidden text-xs text-muted-foreground md:block">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedId === order.payment_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border bg-muted/20 p-4 md:p-6">
                        <div className="grid gap-6 md:grid-cols-2">
                          {/* Customer info */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Customer Details
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground">{order.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground">
                                  {order.address}, {order.country}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="font-mono text-xs text-muted-foreground">
                                  Thread: {order.thread_id}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Cart */}
                          <div className="space-y-3">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              <ShoppingCart className="mr-1 inline h-3.5 w-3.5" />
                              Cart Items
                            </h3>
                            <div className="space-y-2">
                              {order.cart_snapshot.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {item.qty} × {item.unit_price_amount}{" "}
                                      {item.unit_price_currency}
                                    </p>
                                  </div>
                                  <span className="text-sm font-medium text-foreground">
                                    {item.line_total_amount} {item.unit_price_currency}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between border-t border-border pt-2">
                              <span className="text-xs text-muted-foreground">
                                {order.cart_snapshot.summary.item_count} item(s)
                              </span>
                              <span className="text-sm font-semibold text-foreground">
                                Total: {order.cart_snapshot.summary.subtotal_amount}{" "}
                                {order.cart_snapshot.summary.currency}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Timestamps & Action */}
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                          <div className="flex gap-4">
                            <span className="text-xs text-muted-foreground">
                              Created: {formatDate(order.created_at)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Updated: {formatDate(order.updated_at)}
                            </span>
                          </div>
                          {order.status !== "success" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkCompleted(order.payment_id);
                              }}
                              disabled={updatingId === order.payment_id}
                              className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:opacity-50"
                            >
                              {updatingId === order.payment_id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Mark as Completed
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
