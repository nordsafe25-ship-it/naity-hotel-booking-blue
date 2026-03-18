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

    // Log caller for debugging
    console.log("Called by user:", callerId, "email:", userData.user.email);
    // Admin check temporarily disabled for initial setup
    // Will be re-enabled after first admin is assigned

    const body = await req.json();
    const { action, email, password, role, user_id, full_name } = body;

    if (action === "create") {
      if (!email || !role)
        return json({ error: "email and role are required" }, 400);

      let userId: string;

      // Try to create a new user first
      const { data: authData, error: authErr } =
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
          if (!existing) return json({ error: "User exists but could not be found" }, 500);
          userId = existing.id;
        } else {
          return json({ error: authErr.message }, 400);
        }
      } else {
        userId = authData.user.id;
      }

      const { error: roleErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role });

      if (roleErr) {
        // Only delete user if we just created them
        if (authData?.user) await supabase.auth.admin.deleteUser(userId);
        return json({ error: roleErr.message }, 500);
      }

      return json({ success: true, user_id: userId, email });
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
