import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing environment variables", {
        hasSupabaseUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceRoleKey,
        hasAnonKey: !!anonKey,
      });
      return jsonResponse(500, { error: "Server configuration error" });
    }

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header", { hasAuthHeader: !!authHeader });
      return jsonResponse(401, { error: "Unauthorized: Missing Bearer token" });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error("Authorization header had empty token");
      return jsonResponse(401, { error: "Unauthorized: Invalid Bearer token" });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("JWT validation failed", { message: claimsError?.message });
      return jsonResponse(401, { error: "Unauthorized: Invalid or expired token" });
    }

    const callerId = claimsData.claims.sub;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: roleCheck, error: roleCheckError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleCheckError) {
      console.error("Role check failed", { message: roleCheckError.message, callerId });
      return jsonResponse(500, { error: "Failed to verify admin permissions" });
    }

    if (!roleCheck) {
      return jsonResponse(403, { error: "Admin access required" });
    }

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON payload", parseError);
      return jsonResponse(400, { error: "Invalid JSON payload" });
    }

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
    const hotelId = typeof payload.hotel_id === "string" ? payload.hotel_id : null;

    console.log("create-manager payload", {
      email,
      fullName,
      hotelId,
      hasPassword: Boolean(password),
      callerId,
    });

    if (!email || !password || !fullName) {
      console.error("Validation error: missing fields", {
        hasEmail: !!email,
        hasPassword: !!password,
        hasFullName: !!fullName,
      });
      return jsonResponse(400, { error: "email, password, and full_name are required" });
    }

    if (!email.includes("@")) {
      return jsonResponse(400, { error: "Invalid email format" });
    }

    if (password.length < 6) {
      return jsonResponse(400, { error: "Password must be at least 6 characters" });
    }

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !userData.user?.id) {
      console.error("Failed to create manager user", { message: createError?.message, email });
      return jsonResponse(400, { error: createError?.message ?? "Failed to create manager user" });
    }

    const managerUserId = userData.user.id;

    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: managerUserId,
      role: "hotel_manager",
    });

    if (roleError) {
      console.error("Failed to assign hotel_manager role", { message: roleError.message, managerUserId });
      await supabaseAdmin.auth.admin.deleteUser(managerUserId);
      return jsonResponse(500, { error: "Failed to assign manager role" });
    }

    const warnings: string[] = [];

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: managerUserId,
          full_name: fullName,
          email,
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      console.error("Profile upsert failed", { message: profileError.message, managerUserId });
      warnings.push("Profile was not synced automatically");
    }

    if (hotelId) {
      const { error: hotelError } = await supabaseAdmin
        .from("hotels")
        .update({ manager_id: managerUserId })
        .eq("id", hotelId);

      if (hotelError) {
        console.error("Failed to assign manager to hotel", {
          message: hotelError.message,
          managerUserId,
          hotelId,
        });
        warnings.push("Manager created but hotel assignment failed");
      }
    }

    return jsonResponse(200, {
      success: true,
      user_id: managerUserId,
      warnings,
    });
  } catch (err) {
    console.error("create-manager unexpected error", err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : "Unexpected server error",
    });
  }
});
