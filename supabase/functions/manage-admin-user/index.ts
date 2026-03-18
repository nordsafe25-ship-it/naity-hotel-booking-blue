import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer "))
      return json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user)
      return json({ error: "Unauthorized" }, 401);

    const callerId = userData.user.id;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .maybeSingle();

    if (roleRow?.role !== "admin")
      return json({ error: "Admin access required" }, 403);

    const body = await req.json();
    const { action, email, password, role, user_id, full_name } = body;

    if (action === "create") {
      if (!email || !password || !role)
        return json({ error: "email, password and role are required" }, 400);

      const { data: authData, error: authErr } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || "" },
        });

      if (authErr) {
        const status = authErr.message.toLowerCase().includes("already") ? 409 : 400;
        return json({ error: authErr.message }, status);
      }

      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: authData.user.id, role });

      if (roleErr) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return json({ error: roleErr.message }, 500);
      }

      return json({ success: true, user_id: authData.user.id, email });
    }

    if (action === "update_role") {
      if (!user_id || !role)
        return json({ error: "user_id and role are required" }, 400);
      const { error } = await supabase.from("user_roles").upsert({ user_id, role });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (action === "delete") {
      if (!user_id) return json({ error: "user_id is required" }, 400);
      if (user_id === callerId)
        return json({ error: "Cannot delete your own account" }, 400);

      await supabase.from("user_roles").delete().eq("user_id", user_id);
      const { error: delErr } = await supabase.auth.admin.deleteUser(user_id);
      if (delErr) return json({ error: delErr.message }, 500);
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
        role: roles?.find((r: any) => r.user_id === u.id)?.role ?? null,
      }));

      return json({ users });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: unknown) {
    return json({ error: (err as Error).message }, 500);
  }
});
