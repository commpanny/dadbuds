export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  neighborhood: string;
  age_range: string;
  kids_age_range: string;
  discord_username?: string | null;
  sms_opt_in: boolean;
  comfort_level: string;
  interests: string[];
  typical_availability: string[];
  created_at: string;
};

export type AvailabilityWindow = {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  user_email?: string | null;
  date: string;
  start_time: string;
  end_time: string;
  kid_status: string;
  preferred_vibe: string;
  notes?: string | null;
  status: string;
  created_at: string;
};

export type Plan = {
  id: number;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  cost: string;
  kid_friendly: boolean;
  capacity?: number | null;
  status: string;
  visibility: string;
  tags: string[];
  related_interests: string[];
  rsvp_count: number;
  created_at: string;
};

export type Rsvp = {
  id: number;
  plan_id: number;
  plan_title: string;
  user_id: number;
  status: string;
  created_at: string;
};

export type Message = {
  id: number;
  channel: string;
  recipient_type: string;
  recipient_id?: number | null;
  body: string;
  status: string;
  related_plan_id?: number | null;
  created_at: string;
  sent_at?: string | null;
};

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: BodyInit | Record<string, unknown> | null;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  let body = options.body;

  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    let message = "DadBuds API request failed.";
    try {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } catch {
      message = `${message} (${response.status})`;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const api = {
  createUser: (payload: Record<string, unknown>) =>
    request<User>("/users", { method: "POST", body: payload }),
  listUsers: () => request<User[]>("/users"),
  getUser: (id: number) => request<User>(`/users/${id}`),
  findUserByEmail: (email: string) =>
    request<User>(`/users/by-email/${encodeURIComponent(email)}`),
  createAvailability: (payload: Record<string, unknown>) =>
    request<AvailabilityWindow>("/availability", {
      method: "POST",
      body: payload,
    }),
  listAvailability: (userId?: number | null) => {
    const suffix = userId ? `?user_id=${userId}` : "";
    return request<AvailabilityWindow[]>(`/availability${suffix}`);
  },
  updateAvailabilityStatus: (id: number, status: string) =>
    request<AvailabilityWindow>(`/availability/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  listPlans: (includeDrafts = false) =>
    request<Plan[]>(`/plans${includeDrafts ? "?include_drafts=true" : ""}`),
  createPlan: (payload: Record<string, unknown>) =>
    request<Plan>("/plans", { method: "POST", body: payload }),
  createRsvp: (planId: number, payload: Record<string, unknown>) =>
    request<Rsvp>(`/plans/${planId}/rsvps`, {
      method: "POST",
      body: payload,
    }),
  listRsvps: (userId?: number | null) => {
    const suffix = userId ? `?user_id=${userId}` : "";
    return request<Rsvp[]>(`/rsvps${suffix}`);
  },
  generateMessage: (planId: number) =>
    request<Message>(`/plans/${planId}/generate-message`, {
      method: "POST",
    }),
  listMessages: () => request<Message[]>("/messages"),
  createMessage: (payload: Record<string, unknown>) =>
    request<Message>("/messages", { method: "POST", body: payload }),
  fakeSendMessage: (messageId: number) =>
    request<Message>(`/messages/${messageId}/fake-send`, {
      method: "PATCH",
    }),
};
