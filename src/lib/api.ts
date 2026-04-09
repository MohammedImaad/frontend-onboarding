const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";


async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  
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



export interface LoginResponse {
  user_id: string;
  business_id: string;
  telegram_bot_token: string | null;
  upload_batch_id?: string;
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
  answer: string;
}

export interface PreviewResponse {
  products: Array<{ name: string; price: string; description?: string; image_url?: string }>;
  texts: string[];
}

export function fetchPreview(business_id: string, upload_batch_id: string) {
  return fetch(`${BASE_URL}/preview?business_id=${encodeURIComponent(business_id)}&upload_batch_id=${encodeURIComponent(upload_batch_id)}`)
    .then((res) => {
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json() as Promise<PreviewResponse>;
    });
}

export interface ManualResponse {
  status: string;
}

export function sendManual(business_id: string, upload_batch_id: string, text: string) {
  return request<ManualResponse>("/manual", { business_id, upload_batch_id, text });
}

export interface CompleteIngestionResponse {
  status: string;
}

export function completeIngestion(business_id: string, upload_batch_id: string) {
  return request<CompleteIngestionResponse>("/complete-ingestion", { business_id, upload_batch_id });
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
