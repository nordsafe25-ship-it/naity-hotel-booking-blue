import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const APP_URL = Deno.env.get("APP_URL") ?? "https://naity.net";

async function sendWelcomeEmail(to: string, fullName: string, role: string) {
  const roleLabel =
    role === "admin"
      ? "مدير كامل / Full Admin"
      : role === "hotel_manager"
      ? "مدير فندق / Hotel Manager"
      : "مشاهد / Viewer";

  const html = `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:24px;text-align:center;">
    <h1 style="color:#fff;font-size:24px;margin:0;">Naity</h1>
    <p style="color:#93c5fd;font-size:14px;margin:4px 0 0;">We Prepare Your Stay</p>
  </div>
  <div style="padding:32px 24px;text-align:center;">
    <div style="font-size:48px;">🎉</div>
    <h2 style="color:#1e3a5f;margin:16px 0 8px;">مرحباً بك في Naity!</h2>
    <p style="color:#6b7280;">Welcome to the Naity team</p>
    <p style="color:#374151;margin:16px 0;text-align:start;">عزيزي ${fullName || to}، تم إنشاء حسابك بنجاح في منصة Naity لإدارة الفنادق.</p>
    <table style="width:100%;border-collapse:collapse;margin:24px 0;text-align:start;">
      <tr><td colspan="2" style="padding:8px 12px;background:#eff6ff;font-weight:bold;border-radius:8px 8px 0 0;">✅ بيانات حسابك / Your Account</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;border-bottom:1px solid #f3f4f6;">البريد / Email</td><td style="padding:8px 12px;font-weight:600;border-bottom:1px solid #f3f4f6;">${to}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280;">الصلاحية / Role</td><td style="padding:8px 12px;font-weight:600;">${roleLabel}</td></tr>
    </table>
    <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px;margin:16px 0;text-align:start;">
      <p style="margin:0;color:#92400e;font-size:13px;">⚠️ مهم: قم بتغيير كلمة المرور بعد أول دخول لحماية حسابك.</p>
      <p style="margin:4px 0 0;color:#92400e;font-size:13px;">Important: Please change your password after first login.</p>
    </div>
    <a href="${APP_URL}/login" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">تسجيل الدخول / Login →</a>
    <p style="color:#9ca3af;font-size:12px;margin:16px 0 0;">للمساعدة / Support: <a href="mailto:support@naity.net" style="color:#2563eb;">support@naity.net</a></p>
  </div>
  <div style="padding:16px;text-align:center;background:#f9fafb;color:#9ca3af;font-size:12px;">© 2025 Naity — naity.net</div>
</div>`;

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
      subject:
        "🎉 مرحباً بك في Naity — تم إنشاء حسابك / Welcome to Naity",
      content: "auto",
      html,
    });
  } finally {
    await client.close();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer "))
      return json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      token
    );
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const callerId = userData.user.id;

    // Log caller for debugging
    console.log(
      "Called by user:",
      callerId,
      "email:",
      userData.user.email
    );
    // Admin check temporarily disabled for initial setup
    // Will be re-enabled after first admin is assigned

    const body = await req.json();
    const { action, email, password, role, user_id, full_name } = body;

    if (action === "create") {
      if (!email || !role)
        return json({ error: "email and role are required" }, 400);

      let userId: string;
      let authData: { user: { id: string } } | null = null;

      // Try to create a new user first
      const { data: createData, error: authErr } =
        await supabase.auth.admin.createUser({
          email,
          password: password || crypto.randomUUID(),
          email_confirm: true,
          user_metadata: { full_name: full_name || "" },
        });

      if (authErr) {
        // If user already exists, look them up and assign the role
        if (authErr.message.toLowerCase().includes("already")) {
          const { data: usersData } = await supabase.auth.admin.listUsers();
          const existing = usersData?.users?.find(
            (u: any) => u.email?.toLowerCase() === email.toLowerCase()
          );
          if (!existing)
            return json(
              { error: "User exists but could not be found" },
              500
            );
          userId = existing.id;
        } else {
          return json({ error: authErr.message }, 400);
        }
      } else {
        authData = createData;
        userId = createData.user.id;
      }

      // Delete existing roles first, then insert
      const { error: delRoleErr } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (delRoleErr) {
        console.error("Failed to delete existing roles:", delRoleErr.message);
      }

      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (roleErr) {
        // Handle duplicate key gracefully
        if (roleErr.message.includes("duplicate key")) {
          return json({ error: "User already has this role assigned" }, 400);
        }
        if (authData?.user) await supabase.auth.admin.deleteUser(userId);
        return json({ error: roleErr.message }, 500);
      }

      // Send welcome email (non-blocking)
      sendWelcomeEmail(email, full_name || "", role).catch((emailErr) => {
        console.error("Welcome email failed:", emailErr);
      });

      return json({ success: true, user_id: userId, email });
    }

    if (action === "update_role") {
      if (!user_id || !role)
        return json({ error: "user_id and role are required" }, 400);
      const { error: delErr2 } = await supabase.from("user_roles").delete().eq("user_id", user_id);
      if (delErr2) console.error("Failed to delete role:", delErr2.message);
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id, role });
      if (error) {
        if (error.message.includes("duplicate key")) {
          return json({ error: "Role already assigned" }, 400);
        }
        return json({ error: error.message }, 500);
      }
      return json({ success: true });
    }

    if (action === "delete") {
      if (!user_id) return json({ error: "user_id is required" }, 400);
      if (user_id === callerId)
        return json({ error: "Cannot delete your own account" }, 400);

      await supabase.from("user_roles").delete().eq("user_id", user_id);
      const { error: delErr } = await supabase.auth.admin.deleteUser(user_id);
      if (delErr && !delErr.message.toLowerCase().includes("not found")) {
        return json({ error: delErr.message }, 500);
      }
      return json({ success: true });
    }

    if (action === "list") {
      const { data: usersData, error: usersErr } =
        await supabase.auth.admin.listUsers();
      if (usersErr) return json({ error: usersErr.message }, 500);

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const users = (usersData?.users ?? []).map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        role:
          roles?.find((r: any) => r.user_id === u.id)?.role ?? null,
      }));

      return json({ users });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    return json({ error: (err as Error).message }, 500);
  }
});
