import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Try to detect country from various headers
    const cfCountry = req.headers.get("cf-ipcountry"); // Cloudflare
    const xCountry = req.headers.get("x-country-code");
    const xForwardedFor = req.headers.get("x-forwarded-for");

    let country = cfCountry || xCountry || "";

    // If no country header, try IP geolocation
    if (!country && xForwardedFor) {
      const ip = xForwardedFor.split(",")[0].trim();
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
        const geoData = await geoRes.json();
        country = geoData.countryCode || "";
      } catch {
        // fallback - can't detect
      }
    }

    const isSyria = country.toUpperCase() === "SY";

    return new Response(
      JSON.stringify({ is_syria: isSyria, country: country.toUpperCase() || "UNKNOWN" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ is_syria: false, country: "UNKNOWN" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
