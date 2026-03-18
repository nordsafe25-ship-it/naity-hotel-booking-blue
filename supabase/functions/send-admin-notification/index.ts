import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmail(to: string, subject: string, html: string) {
  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get("SMTP_HOST") ?? "naity.net",
      port: Number(Deno.env.get("SMTP_PORT") ?? "465"),
      tls: true,
      auth: {
        username: Deno.env.get("SMTP_USER") ?? "no-replay@naity.net",
        password: Deno.env.get("SMTP_PASS") ?? "",
      },
    },
  });
  try {
    await client.send({
      from: "Naity System <no-replay@naity.net>",
      to,
      subject,
      content: "auto",
      html,
    });
  } finally {
    await client.close();
  }
}

const ADMIN_EMAIL = "admin@naity.net";
const APP_URL = Deno.env.get("APP_URL") ?? "https://naity.net";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { type, data } = await req.json();

    // ── NEW HOTEL ─────────────────────────────────────────────
    if (type === "new_hotel") {
      const icon =
        data.property_type === "apartment" ? "🏠" : "🏨";
      const typeLabel =
        data.property_type === "apartment"
          ? "🏠 شقة سياحية"
          : "🏨 فندق";
      const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:24px;text-align:center;">
    <h1 style="color:#fff;font-size:24px;margin:0;">Naity</h1>
    <p style="color:#93c5fd;font-size:14px;margin:4px 0 0;">System Notification</p>
  </div>
  <div style="padding:32px 24px;text-align:center;">
    <div style="font-size:48px;">${icon}</div>
    <h2 style="color:#1e3a5f;margin:16px 0 8px;">عقار جديد أُضيف إلى Naity</h2>
    <p style="color:#6b7280;">A new property has been added to the platform</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;text-align:start;">
      <tr><td colspan="2" style="padding:8px 12px;background:#eff6ff;font-weight:bold;border-radius:8px 8px 0 0;">✅ تفاصيل العقار / Property Details</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">الاسم / Name</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.name_ar || data.name_en}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">المدينة / City</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.city}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;">النوع / Type</td><td style="padding:8px 12px;font-weight:600;">${typeLabel}</td></tr>
    </table>
    <a href="${APP_URL}/admin/hotels" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">إدارة الفنادق →</a>
  </div>
  <div style="padding:16px;text-align:center;background:#f9fafb;color:#9ca3af;font-size:12px;">© 2025 Naity — naity.net</div>
</div>`;
      await sendEmail(
        ADMIN_EMAIL,
        `${icon} عقار جديد أُضيف — ${data.name_ar || data.name_en}`,
        html
      );
      return json({ success: true });
    }

    // ── NEW API COMPANY ───────────────────────────────────────
    if (type === "new_company") {
      const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:24px;text-align:center;">
    <h1 style="color:#fff;font-size:24px;margin:0;">Naity</h1>
    <p style="color:#93c5fd;font-size:14px;margin:4px 0 0;">System Notification</p>
  </div>
  <div style="padding:32px 24px;text-align:center;">
    <div style="font-size:48px;">🔌</div>
    <h2 style="color:#1e3a5f;margin:16px 0 8px;">شركة API جديدة أُضيفت</h2>
    <p style="color:#6b7280;">A new API company has been added</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;text-align:start;">
      <tr><td colspan="2" style="padding:8px 12px;background:#eff6ff;font-weight:bold;border-radius:8px 8px 0 0;">✅ تفاصيل الشركة / Company Details</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">الاسم / Name</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.name}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">Base URL</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #f3f4f6;">${data.base_url}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;">Auth Type</td><td style="padding:8px 12px;font-weight:600;">${data.auth_type}</td></tr>
    </table>
    <a href="${APP_URL}/admin/api-companies" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">إدارة شركات API →</a>
  </div>
  <div style="padding:16px;text-align:center;background:#f9fafb;color:#9ca3af;font-size:12px;">© 2025 Naity — naity.net</div>
</div>`;
      await sendEmail(
        ADMIN_EMAIL,
        `🔌 شركة API جديدة — ${data.name}`,
        html
      );
      return json({ success: true });
    }

    return json({ error: "Unknown notification type" }, 400);
  } catch (err: unknown) {
    console.error("Notification error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
