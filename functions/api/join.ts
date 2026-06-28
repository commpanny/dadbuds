type KVNamespace = {
  put(
    key: string,
    value: string,
    options?: { metadata?: Record<string, string> },
  ): Promise<void>;
};

type PagesFunction<Env> = (context: {
  request: Request;
  env: Env;
}) => Response | Promise<Response>;

type Env = {
  DADBUDS_LEADS?: KVNamespace;
};

type Lead = {
  email: string;
  zip: string;
  referral_code: string;
  spokane_beta: boolean;
  zip_code_interest: boolean;
  marketing_consent: boolean;
  source_url: string;
  utm: Record<string, string>;
  created_at: string;
  ip_country: string;
  user_agent: string;
};

const trackedFields = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
];

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function checked(form: FormData, key: string) {
  return form.get(key) === "yes";
}

function redirect(request: Request, path: string) {
  return Response.redirect(new URL(path, request.url), 303);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const form = await request.formData();

  if (text(form, "bot-field")) {
    return redirect(request, "/join/thanks");
  }

  const email = text(form, "email").toLowerCase();
  const zip = text(form, "zip");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response("Email is required.", { status: 400 });
  }

  if (!/^\d{5}$/.test(zip)) {
    return new Response("ZIP code is required.", { status: 400 });
  }

  if (!env.DADBUDS_LEADS) {
    return new Response("DadBuds intake storage is not configured.", {
      status: 500,
    });
  }

  const lead: Lead = {
    email,
    zip,
    referral_code: text(form, "referral_code") || "BOYSOFSUMMER",
    spokane_beta: checked(form, "spokane_beta"),
    zip_code_interest: checked(form, "zip_code_interest"),
    marketing_consent: checked(form, "marketing_consent"),
    source_url: text(form, "source_url"),
    utm: Object.fromEntries(
      trackedFields.map((field) => [field, text(form, field)]),
    ),
    created_at: new Date().toISOString(),
    ip_country: request.headers.get("cf-ipcountry") ?? "",
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? "",
  };

  const key = `lead:${lead.created_at}:${crypto.randomUUID()}`;
  await env.DADBUDS_LEADS.put(key, JSON.stringify(lead), {
    metadata: {
      email,
      zip,
      referral_code: lead.referral_code,
      created_at: lead.created_at,
    },
  });

  return redirect(request, "/join/thanks");
};

export const onRequestGet: PagesFunction<Env> = async ({ request }) => {
  return redirect(request, "/join/signup");
};
