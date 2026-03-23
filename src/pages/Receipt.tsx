import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type LangMode = "ar" | "en" | "both";

const Receipt = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("id");
  const [langMode, setLangMode] = useState<LangMode>("both");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["receipt-booking", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, hotels(name_ar, name_en, city, address, contact_phone, check_in_time, check_out_time), room_categories(name_ar, name_en)")
        .eq("id", bookingId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const tx = (ar: string, en: string) => {
    if (langMode === "ar") return ar;
    if (langMode === "en") return en;
    return `${ar} | ${en}`;
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">الحجز غير موجود | Booking not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-foreground">404</p>
          <p className="text-muted-foreground">الحجز غير موجود | Booking not found</p>
        </div>
      </div>
    );
  }

  const hotel = booking.hotels as any;
  const room = booking.room_categories as any;
  const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
  const remaining = Number(booking.total_price) - Number(booking.deposit_amount || 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      <div className="max-w-2xl mx-auto px-4">
        {/* Language toggle + Print - hidden on print */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div className="flex gap-2">
            {(["ar", "en", "both"] as LangMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setLangMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${langMode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {m === "ar" ? "عربي" : m === "en" ? "English" : "كلاهما"}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" />
            {tx("طباعة", "Print")}
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 text-center">
            <h1 className="text-2xl font-bold mb-1">Naity</h1>
            <p className="text-blue-100 text-sm">{tx("تأكيد الحجز ✓", "Booking Confirmation ✓")}</p>
          </div>

          {/* Green confirmation */}
          <div className="bg-green-50 border-b border-green-200 p-4 text-center">
            <p className="text-green-700 font-semibold text-sm">
              ✅ {tx("تم تأكيد حجزك بنجاح", "Your booking is confirmed")}
            </p>
          </div>

          {/* Booking ID + Ref */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border-b border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">{tx("رقم الحجز", "Booking ID")}</p>
              <p className="font-bold text-lg font-mono">{booking.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">{tx("رمز التحقق", "Ref Code")}</p>
              <p className="font-bold text-lg font-mono">{booking.transaction_hash || "—"}</p>
            </div>
          </div>

          {/* Details table */}
          <div className="p-4 space-y-3">
            {[
              { label: tx("الضيف", "Guest"), value: `${booking.guest_first_name} ${booking.guest_last_name}` },
              { label: tx("الفندق", "Hotel"), value: `${hotel?.name_ar || ""} | ${hotel?.name_en || ""}` },
              { label: tx("المدينة", "City"), value: hotel?.city },
              { label: tx("العنوان", "Address"), value: hotel?.address },
              { label: tx("هاتف الفندق", "Hotel Phone"), value: hotel?.contact_phone },
              { label: tx("نوع الغرفة", "Room"), value: `${room?.name_ar || ""} | ${room?.name_en || ""}` },
              { label: tx("تاريخ الوصول", "Check-in"), value: `${booking.check_in}${hotel?.check_in_time ? ` (${tx("من", "from")} ${hotel.check_in_time})` : ""}` },
              { label: tx("تاريخ المغادرة", "Check-out"), value: `${booking.check_out}${hotel?.check_out_time ? ` (${tx("قبل", "before")} ${hotel.check_out_time})` : ""}` },
              { label: tx("عدد الليالي", "Nights"), value: nights },
              { label: tx("عدد الضيوف", "Guests"), value: booking.guests_count },
              { label: tx("الإفطار", "Breakfast"), value: booking.breakfast_included ? tx("مشمول", "Included") : tx("غير مشمول", "Not included") },
              ...(booking.special_requests ? [{ label: tx("طلبات خاصة", "Special Requests"), value: booking.special_requests }] : []),
            ].map((row, i) => (
              row.value ? (
                <div key={i} className="flex justify-between items-start gap-4 py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500 shrink-0">{row.label}</span>
                  <span className="text-sm font-medium text-gray-900 text-end">{row.value}</span>
                </div>
              ) : null
            ))}
          </div>

          {/* Payment summary */}
          <div className="bg-gray-50 p-4 space-y-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{tx("المجموع الكلي", "Total Amount")}</span>
              <span className="font-semibold">${booking.total_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{tx("العربون المدفوع (10%)", "Deposit Paid (10%)")}</span>
              <span className="font-semibold text-green-600">${booking.deposit_amount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{tx("المتبقي عند الوصول", "Remaining at Hotel")}</span>
              <span className="font-semibold text-amber-600">${remaining.toFixed(2)}</span>
            </div>
          </div>

          {/* Total paid bar */}
          <div className="bg-blue-700 text-white p-4 flex items-center justify-between">
            <span className="text-sm">{tx("العربون المدفوع الآن", "Amount Paid Now")}</span>
            <span className="text-2xl font-bold">${booking.deposit_amount || 0}</span>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 m-4 p-4 rounded-xl">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ {tx(
                `يرجى دفع المبلغ المتبقي $${remaining.toFixed(2)} نقداً عند الوصول للفندق`,
                `Please pay the remaining $${remaining.toFixed(2)} in cash upon arrival at the hotel.`
              )}
            </p>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-4 text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">www.naity.net</p>
            <p className="text-xs text-gray-500">support@naity.net</p>
            <p className="text-xs text-gray-500">WhatsApp: +963 981 941 098</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
