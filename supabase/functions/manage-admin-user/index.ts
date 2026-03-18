import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer "))
      return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsErr } =
      await anonClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims)
      return json({ error: "Unauthorized" }, 401);

    const callerId = claimsData.claims.sub as string;

    // Check admin role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .maybeSingle();
    if (roleRow?.role !== "admin")
      return json({ error: "Admin access required" }, 403);

    const { action, email, password, role, user_id, full_name } =
      await req.json();

    // CREATE
    if (action === "create") {
      if (!email || !password || !role)
        return json({ error: "email, password and role required" }, 400);

      const { data: authData, error: authErr } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name || "" },
        });
      if (authErr) throw authErr;

      await supabase
        .from("user_roles")
        .upsert({ user_id: authData.user.id, role });

      return json({ success: true, user_id: authData.user.id });
    }

    // UPDATE ROLE
    if (action === "update_role") {
      if (!user_id || !role)
        return json({ error: "user_id and role required" }, 400);
      await supabase.from("user_roles").upsert({ user_id, role });
      return json({ success: true });
    }

    // DELETE
    if (action === "delete") {
      if (!user_id) return json({ error: "user_id required" }, 400);
      if (user_id === callerId)
        return json({ error: "Cannot delete your own account" }, 400);
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      const { error: delErr } = await supabase.auth.admin.deleteUser(user_id);
      if (delErr) throw delErr;
      return json({ success: true });
    }

    // LIST
    if (action === "list") {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const { data: roles } = await supabase.from("user_roles").select("*");
      const result = (usersData?.users ?? []).map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        role: roles?.find((r: any) => r.user_id === u.id)?.role ?? null,
      }));
      return json({ users: result });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
});
