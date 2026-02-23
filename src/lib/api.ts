const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (USE_MOCK) {
    return mockResponse<T>(path, body);
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function mockResponse<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path === "/login") {
        const isAdmin = body.user_id === "admin@amfa.com";
        resolve({
          user_id: body.user_id as string,
          business_id: "b8f2e1a0-1234-5678-9abc-def012345678",
          telegram_bot_token: isAdmin ? null : "mock_token",
        } as unknown as T);
      } else if (path === "/ingest") {
        resolve({
          upload_batch_id: "ub-" + crypto.randomUUID().slice(0, 8),
          products: 44,
          status: "ready",
        } as unknown as T);
      } else if (path === "/query") {
        resolve({
          response:
            "Based on your catalog, I'd recommend the Face Cleansing Foam — it's one of your best sellers at 15 USDC. Would you like me to suggest complementary products?",
        } as unknown as T);
      } else if (path === "/orders") {
        resolve({
          business_id: body.business_id,
          count: 2,
          orders: [
            {
              business_id: body.business_id,
              thread_id: "785862166",
              payment_id: "699bfed713ce3dd51f2fc2ad",
              cart_snapshot: {
                thread_id: "785862166",
                business_id: body.business_id,
                items: [
                  { name: "Face Cleansing Foam (with Brush)", unit_price_amount: 15.0, unit_price_currency: "USDC", qty: 1, line_total_amount: 15.0 },
                ],
                summary: { item_count: 1, subtotal_amount: 15.0, currency: "USDC" },
              },
              email: "customer@email.com",
              address: "Hollystown, Dublin",
              country: "Ireland",
              amount: "15.0",
              status: "pending",
              created_at: "2026-02-23T07:17:22",
              updated_at: "2026-02-23T07:17:22",
            },
            {
              business_id: body.business_id,
              thread_id: "912374581",
              payment_id: "a12cef9871bcd44e8823ff01",
              cart_snapshot: {
                thread_id: "912374581",
                business_id: body.business_id,
                items: [
                  { name: "Hydrating Serum", unit_price_amount: 22.0, unit_price_currency: "USDC", qty: 2, line_total_amount: 44.0 },
                ],
                summary: { item_count: 2, subtotal_amount: 44.0, currency: "USDC" },
              },
              email: "jane@shop.io",
              address: "Kreuzberg, Berlin",
              country: "Germany",
              amount: "44.0",
              status: "success",
              created_at: "2026-02-22T14:03:11",
              updated_at: "2026-02-22T15:10:05",
            },
          ],
        } as unknown as T);
      } else if (path === "/orders/status") {
        resolve({
          message: "Order status updated to success",
          order_id: body.order_id as string,
        } as unknown as T);
      } else {
        resolve({} as T);
      }
    }, 600);
  });
}

export interface LoginResponse {
  user_id: string;
  business_id: string;
  telegram_bot_token: string | null;
}

export function login(user_id: string, password: string) {
  return request<LoginResponse>("/login", { user_id, password });
}

export interface IngestResponse {
  upload_batch_id: string;
  products: number;
  status: string;
}

export function ingest(url: string, business_id: string) {
  return request<IngestResponse>("/ingest", { url, business_id });
}

export interface QueryResponse {
  response: string;
}

export function queryAssistant(business_id: string, query: string) {
  return request<QueryResponse>("/query", { business_id, query });
}

export interface OrderItem {
  name: string;
  unit_price_amount: number;
  unit_price_currency: string;
  qty: number;
  line_total_amount: number;
}

export interface Order {
  business_id: string;
  thread_id: string;
  payment_id: string;
  cart_snapshot: {
    thread_id: string;
    business_id: string;
    items: OrderItem[];
    summary: {
      item_count: number;
      subtotal_amount: number;
      currency: string;
    };
  };
  email: string;
  address: string;
  country: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrdersResponse {
  business_id: string;
  count: number;
  orders: Order[];
}

export function fetchOrders(business_id: string) {
  return request<OrdersResponse>("/orders", { business_id });
}

export interface OrderStatusResponse {
  message: string;
  order_id: string;
}

export function updateOrderStatus(business_id: string, order_id: string) {
  return request<OrderStatusResponse>("/orders/status", { business_id, order_id });
}
