import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const isPeakSeason = (dateStr: string): boolean => {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 6 && day >= 15) return true;
  if (m === 7 || m === 8) return true;
  if (m === 9 && day <= 15) return true;
  return false;
};

function getRefundInfo(deposit: number, checkIn: string, isApartment: boolean) {
  const peak = isPeakSeason(checkIn);
  const hoursUntil = (new Date(checkIn).getTime() - Date.now()) / 3600000;

  let refundPercent = 0, policyAr = "", policyEn = "";

  if (peak) {
    policyAr = "لا يوجد استرداد خلال موسم الصيف (15 يونيو - 15 سبتمبر)";
    policyEn = "No refund during summer season (June 15 - September 15)";
  } else if (isApartment) {
    if (hoursUntil >= 72) {
      refundPercent = 100;
      policyAr = "استرداد كامل — الإلغاء قبل 72 ساعة من الوصول";
      policyEn = "Full refund — cancelled 72+ hours before check-in";
    } else if (hoursUntil >= 48) {
      refundPercent = 50;
      policyAr = "استرداد 50% — الإلغاء بين 48-72 ساعة قبل الوصول";
      policyEn = "50% refund — cancelled 48-72 hours before check-in";
    } else {
      policyAr = "لا استرداد — الإلغاء أقل من 48 ساعة قبل الوصول";
      policyEn = "No refund — cancelled less than 48 hours before check-in";
    }
  } else {
    if (hoursUntil >= 48) {
      refundPercent = 100;
      policyAr = "استرداد كامل — الإلغاء قبل 48 ساعة من الوصول";
      policyEn = "Full refund — cancelled 48+ hours before check-in";
    } else if (hoursUntil >= 24) {
      refundPercent = 50;
      policyAr = "استرداد 50% — الإلغاء بين 24-48 ساعة قبل الوصول";
      policyEn = "50% refund — cancelled 24-48 hours before check-in";
    } else {
      policyAr = "لا استرداد — الإلغاء أقل من 24 ساعة قبل الوصول";
      policyEn = "No refund — cancelled less than 24 hours before check-in";
    }
  }

  const refundAmount = Math.round(deposit * refundPercent / 100);
  return { peak_season: peak, refund_amount: refundAmount, refund_percent: refundPercent, policy_ar: policyAr, policy_en: policyEn, is_apartment: isApartment, hours_until_checkin: Math.round(hoursUntil) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { check_in, deposit_amount, hotel_id } = await req.json();
  const deposit = Number(deposit_amount ?? 0);

  let isApartment = false;
  if (hotel_id) {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { data } = await supabase.from("hotels").select("property_type").eq("id", hotel_id).single();
    isApartment = data?.property_type === "apartment";
  }

  const result = getRefundInfo(deposit, check_in, isApartment);
  return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
