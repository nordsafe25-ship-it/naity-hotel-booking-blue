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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const { check_in, deposit_amount } = await req.json();
  const peak = isPeakSeason(check_in);
  const deposit = Number(deposit_amount ?? 0);
  const hoursUntil = (new Date(check_in).getTime() - Date.now()) / 3600000;

  let refundAmount = 0, refundPercent = 0, policyAr = "", policyEn = "";

  if (peak) {
    policyAr = "⚠️ موسم الذروة (15 يونيو – 15 سبتمبر): لا يوجد استرداد للعربون بغض النظر عن وقت الإلغاء.";
    policyEn = "⚠️ Peak season (Jun 15 – Sep 15): No refund on deposit regardless of cancellation time.";
  } else if (hoursUntil >= 48) {
    refundAmount = deposit; refundPercent = 100;
    policyAr = "✅ إلغاء قبل 48 ساعة أو أكثر: استرداد كامل $" + deposit;
    policyEn = "✅ Cancelled 48+ hours before check-in: Full refund of $" + deposit;
  } else if (hoursUntil >= 24) {
    refundAmount = Math.round(deposit * 0.5); refundPercent = 50;
    policyAr = "⚠️ إلغاء بين 24-48 ساعة: استرداد 50% ($" + refundAmount + ")";
    policyEn = "⚠️ Cancelled 24-48 hours before check-in: 50% refund ($" + refundAmount + ")";
  } else {
    policyAr = "❌ إلغاء أقل من 24 ساعة: لا يوجد استرداد.";
    policyEn = "❌ Less than 24 hours before check-in: No refund.";
  }

  return new Response(JSON.stringify({
    peak_season: peak, refund_amount: refundAmount, refund_percent: refundPercent,
    policy_ar: policyAr, policy_en: policyEn, hours_until_checkin: Math.round(hoursUntil),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
