import { getAdminToken } from "./adminAuth";
import { getAuthToken } from "./storage";

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

export type CommunityStandard = {
  title: string;
  summary: string;
  short_rule: string;
  prohibited: string[];
  agent_redirect: string;
  serious_redirect: string;
};

export type AuthLinkResponse = {
  status: string;
  detail: string;
  magic_link?: string | null;
};

export type AuthSession = {
  token: string;
  expires_at: string;
  user: User;
};

export type UserRef = {
  id: number;
  name: string;
  neighborhood: string;
};

export type BudRelationship = {
  id: number;
  other_user: UserRef;
  relationship_state: string;
  confirmation_status: string;
  saved_by_me: boolean;
  saved_by_them_visible: boolean;
  mutual_bud_count: number;
  request_expires_at?: string | null;
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
  location_url?: string | null;
  cost: string;
  kid_friendly: boolean;
  capacity?: number | null;
  status: string;
  visibility: string;
  tags: string[];
  related_interests: string[];
  rsvp_count: number;
  viewer_status?: string | null;
  thread_available: boolean;
  created_at: string;
};

export type LocalEvent = {
  source_key: string;
  title: string;
  description: string;
  category: string;
  date?: string | null;
  start_time: string;
  end_time: string;
  location: string;
  location_url?: string | null;
  source_url: string;
  cost: string;
  kid_friendly: boolean;
  capacity?: number | null;
  tags: string[];
  related_interests: string[];
  status: "ready" | "needs_ingestion";
};

export type EventSource = {
  key: string;
  type: string;
  name: string;
  category: string;
  default_venue: string;
  source_url: string;
  owner: string;
  cadence: string;
};

export type LocalEventsPayload = {
  events: LocalEvent[];
  sources: EventSource[];
};

export type Rsvp = {
  id: number;
  plan_id: number;
  plan_title: string;
  plan_date: string;
  plan_start_time: string;
  plan_end_time: string;
  plan_location: string;
  plan_location_url?: string | null;
  plan_cost: string;
  plan_kid_friendly: boolean;
  user_id: number;
  status: string;
  created_at: string;
};

export type ConversationMember = {
  id: number;
  user: UserRef;
  membership_status: string;
  notification_preference: string;
  persistence_choice: string;
  joined_at: string;
  muted_at?: string | null;
  left_at?: string | null;
};

export type ConversationMessage = {
  id: number;
  conversation_id: number;
  sender_type: string;
  sender_user?: UserRef | null;
  body: string;
  message_type: string;
  created_at: string;
  deleted_at?: string | null;
};

export type Conversation = {
  id: number;
  conversation_type: string;
  related_plan_id?: number | null;
  related_crew_id?: number | null;
  lifecycle_status: string;
  expires_at?: string | null;
  graduated_at?: string | null;
  plan_title?: string | null;
  crew_name?: string | null;
  current_member?: ConversationMember | null;
  members: ConversationMember[];
  messages: ConversationMessage[];
  can_post: boolean;
};

export type Crew = {
  id: number;
  name: string;
  status: string;
  origin_conversation_id?: number | null;
  created_at: string;
  members: ConversationMember[];
};

export type SafetyReport = {
  id: number;
  reporter_user_id: number;
  reported_user_id?: number | null;
  conversation_id?: number | null;
  message_id?: number | null;
  report_type: string;
  reason: string;
  status: string;
  created_at: string;
};

export type SocialSimulationEvent = {
  id: number;
  sim_date: string;
  day_index: number;
  event_type: string;
  title: string;
  body: string;
  impact_score: number;
  created_at: string;
};

export type SocialSimulationAgentSummary = {
  id: number;
  display_name: string;
  archetype: string;
  neighborhood: string;
  plans_created: number;
  rsvps_sent: number;
  messages_sent: number;
  trust_score: number;
};

export type SocialSimulation = {
  id: number;
  name: string;
  status: string;
  human_user_id?: number | null;
  current_date: string;
  day_index: number;
  agent_count: number;
  archetypes: Record<string, number>;
  metrics: Record<string, number>;
  top_coordinators: SocialSimulationAgentSummary[];
  events: SocialSimulationEvent[];
};

export type UxFeedback = {
  id: number;
  source_type: string;
  page: string;
  severity: string;
  body: string;
  status: string;
  simulation_id?: number | null;
  agent_id?: number | null;
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
  admin?: boolean;
  body?: BodyInit | Record<string, unknown> | null;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const { admin, body: requestBody, ...requestOptions } = options;
  let body = requestBody;

  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  if (admin) {
    const token = getAdminToken();
    if (token) headers.set("X-Admin-Token", token);
  }
  const authToken = getAuthToken();
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const response = await fetch(`${apiBase}${path}`, {
    ...requestOptions,
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
  getCommunityStandard: () =>
    request<CommunityStandard>("/community-standard"),
  requestAuthLink: (email: string) =>
    request<AuthLinkResponse>("/auth/request-link", {
      method: "POST",
      body: { email },
    }),
  verifyAuthLink: (token: string) =>
    request<AuthSession>("/auth/verify", {
      method: "POST",
      body: { token },
    }),
  getCurrentUser: () => request<User>("/auth/me"),
  logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),
  createUser: (payload: Record<string, unknown>) =>
    request<User>("/users", { method: "POST", body: payload }),
  listUsers: () => request<User[]>("/users", { admin: true }),
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
    return request<AvailabilityWindow[]>(`/availability${suffix}`, {
      admin: !userId,
    });
  },
  updateAvailabilityStatus: (id: number, status: string) =>
    request<AvailabilityWindow>(`/availability/${id}/status`, {
      method: "PATCH",
      admin: true,
      body: { status },
    }),
  listPlans: (includeDrafts = false, userId?: number | null) => {
    const params = new URLSearchParams();
    if (includeDrafts) params.set("include_drafts", "true");
    if (userId) params.set("user_id", String(userId));
    const query = params.toString();
    return request<Plan[]>(`/plans${query ? `?${query}` : ""}`, {
      admin: includeDrafts,
    });
  },
  listLocalEvents: () => request<LocalEventsPayload>("/local-events"),
  createPlan: (payload: Record<string, unknown>) =>
    request<Plan>("/plans", { method: "POST", admin: true, body: payload }),
  createRsvp: (planId: number, payload: Record<string, unknown>) =>
    request<Rsvp>(`/plans/${planId}/rsvps`, {
      method: "POST",
      body: payload,
    }),
  deleteRsvp: (planId: number, payload: { user_id?: number | null; email?: string }) => {
    const params = new URLSearchParams();
    if (payload.user_id) params.set("user_id", String(payload.user_id));
    if (payload.email) params.set("email", payload.email);
    return request<{ status: string }>(
      `/plans/${planId}/rsvps?${params.toString()}`,
      { method: "DELETE" },
    );
  },
  listRsvps: (userId?: number | null) => {
    const suffix = userId ? `?user_id=${userId}` : "";
    return request<Rsvp[]>(`/rsvps${suffix}`, { admin: !userId });
  },
  generateMessage: (planId: number) =>
    request<Message>(`/plans/${planId}/generate-message`, {
      method: "POST",
      admin: true,
    }),
  listMessages: () => request<Message[]>("/messages", { admin: true }),
  createMessage: (payload: Record<string, unknown>) =>
    request<Message>("/messages", {
      method: "POST",
      admin: true,
      body: payload,
    }),
  fakeSendMessage: (messageId: number) =>
    request<Message>(`/messages/${messageId}/fake-send`, {
      method: "PATCH",
      admin: true,
    }),
  listBuds: (userId: number) =>
    request<BudRelationship[]>(`/me/buds?user_id=${userId}`),
  saveBud: (targetUserId: number, actorUserId: number) =>
    request<BudRelationship>(`/users/${targetUserId}/save-bud`, {
      method: "POST",
      body: { actor_user_id: actorUserId },
    }),
  requestBud: (targetUserId: number, actorUserId: number) =>
    request<BudRelationship>(`/users/${targetUserId}/request-bud`, {
      method: "POST",
      body: { actor_user_id: actorUserId },
    }),
  blockUser: (targetUserId: number, actorUserId: number) =>
    request<BudRelationship>(`/users/${targetUserId}/block`, {
      method: "POST",
      body: { actor_user_id: actorUserId },
    }),
  getPlanConversation: (planId: number, userId: number) =>
    request<Conversation>(`/plans/${planId}/conversation?user_id=${userId}`),
  getConversation: (conversationId: number, userId: number) =>
    request<Conversation>(`/conversations/${conversationId}?user_id=${userId}`),
  createConversationMessage: (
    conversationId: number,
    payload: Record<string, unknown>,
  ) =>
    request<ConversationMessage>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: payload,
    }),
  muteConversation: (conversationId: number, userId: number) =>
    request<Conversation>(`/conversations/${conversationId}/mute`, {
      method: "POST",
      body: { user_id: userId },
    }),
  leaveConversation: (conversationId: number, userId: number) =>
    request<Conversation>(`/conversations/${conversationId}/leave`, {
      method: "POST",
      body: { user_id: userId },
    }),
  setPersistenceChoice: (
    conversationId: number,
    userId: number,
    choice: string,
  ) =>
    request<Conversation>(
      `/conversations/${conversationId}/persistence-choice`,
      {
        method: "POST",
        body: { user_id: userId, choice },
      },
    ),
  createSafetyReport: (payload: Record<string, unknown>) =>
    request<SafetyReport>("/safety-reports", {
      method: "POST",
      body: payload,
    }),
  turnMessageIntoPlan: (
    messageId: number,
    payload: Record<string, unknown>,
  ) =>
    request<Plan>(`/messages/${messageId}/turn-into-plan`, {
      method: "POST",
      body: payload,
    }),
  listCrews: (userId: number) => request<Crew[]>(`/me/crews?user_id=${userId}`),
  getCrew: (crewId: number, userId: number) =>
    request<Crew>(`/crews/${crewId}?user_id=${userId}`),
  createSocialSimulation: (payload: Record<string, unknown>) =>
    request<SocialSimulation>("/simulations/social", {
      method: "POST",
      body: payload,
    }),
  getLatestSocialSimulation: (userId?: number | null) =>
    request<SocialSimulation>(
      `/simulations/social/latest${userId ? `?user_id=${userId}` : ""}`,
    ),
  getSocialSimulation: (simulationId: number) =>
    request<SocialSimulation>(`/simulations/social/${simulationId}`),
  advanceSocialSimulation: (
    simulationId: number,
    payload: Record<string, unknown>,
  ) =>
    request<SocialSimulation>(`/simulations/social/${simulationId}/advance`, {
      method: "POST",
      body: payload,
    }),
  listUxFeedback: (simulationId?: number | null) => {
    const suffix = simulationId ? `?simulation_id=${simulationId}` : "";
    return request<UxFeedback[]>(`/ux-feedback${suffix}`);
  },
  createUxFeedback: (payload: Record<string, unknown>) =>
    request<UxFeedback>("/ux-feedback", {
      method: "POST",
      body: payload,
    }),
};
