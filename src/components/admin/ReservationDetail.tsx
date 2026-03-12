import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Hash, LogIn } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ReservationDetailProps {
  booking: any;
  open: boolean;
  onClose: () => void;
}

const ReservationDetail = ({ booking, open, onClose }: ReservationDetailProps) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", booking.id);
      if (error) throw error;

      // If cancelling, notify the hotel system
      if (status === "cancelled") {
        try {
          await supabase.functions.invoke("send-cancellation-to-hotel", {
            body: { booking_id: booking.id },
          });
        } catch (e) {
          console.error("Hotel cancellation notification failed:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success(lang === "ar" ? "تم تحديث الحالة" : "Status updated");
      onClose();
    },
  });

  const confirmCheckin = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bookings").update({
        status: "checked_in",
        sync_status: "pending",
      }).eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success(lang === "ar" ? "تم تأكيد تسجيل الوصول — سيتم إرسال إشارة للنظام المحلي" : "Check-in confirmed — signal sent to local system");
      onClose();
    },
  });

  if (!booking) return null;

  const t = (ar: string, en: string) => lang === "ar" ? ar : en;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("تفاصيل الحجز", "Reservation Details")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Guest Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoCell label={t("الاسم الأول", "First Name")} value={booking.guest_first_name} />
            <InfoCell label={t("اسم العائلة", "Last Name")} value={booking.guest_last_name} />
            <InfoCell label={t("البريد الإلكتروني", "Email")} value={booking.guest_email} />
            <InfoCell label={t("الهاتف", "Phone")} value={booking.guest_phone || "—"} />
            <InfoCell label={t("الجنسية", "Nationality")} value={booking.nationality || "—"} />
            <InfoCell label={t("عدد الأشخاص", "Guests")} value={String(booking.guests_count ?? 1)} />
            <InfoCell label={t("الحالة", "Status")} value={booking.status} badge />
          </div>

          {/* Booking Details */}
          <div className="bg-muted rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoCell label={t("الفندق", "Hotel")} value={lang === "ar" ? booking.hotels?.name_ar : booking.hotels?.name_en} />
            <InfoCell label={t("الغرفة", "Room")} value={lang === "ar" ? booking.room_categories?.name_ar : booking.room_categories?.name_en} />
            {booking.room_number && (
              <InfoCell label={t("رقم الغرفة", "Room No.")} value={`#${booking.room_number}`} />
            )}
            <InfoCell label={t("تسجيل الوصول", "Check-in")} value={booking.check_in} />
            <InfoCell label={t("تسجيل المغادرة", "Check-out")} value={booking.check_out} />
            <InfoCell label={t("المبلغ الكلي", "Total")} value={`$${booking.total_price}`} bold />
            <InfoCell label={t("العربون", "Deposit")} value={`$${booking.deposit_amount || 0}`} />
          </div>

          {booking.transaction_hash && (
            <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("رمز المعاملة", "Transaction Hash")}</p>
                <p className="font-mono text-xs text-foreground break-all">{booking.transaction_hash}</p>
              </div>
            </div>
          )}

          {booking.special_requests && (
            <div className="bg-muted rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{t("طلبات خاصة", "Special Requests")}</p>
              <p className="text-sm text-foreground">{booking.special_requests}</p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 py-4 bg-card rounded-xl border border-border/50">
            <p className="text-sm font-medium text-muted-foreground">{t("رمز QR للحجز", "Booking QR Code")}</p>
            <QRCodeSVG
              value={booking.id}
              size={160}
              level="H"
              includeMargin
              className="rounded-lg"
            />
            <p className="text-xs text-muted-foreground font-mono">{booking.id.slice(0, 8)}...</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {booking.status === "confirmed" && (
              <Button
                className="gradient-cta flex-1 gap-2"
                onClick={() => confirmCheckin.mutate()}
                disabled={confirmCheckin.isPending}
              >
                <LogIn className="w-4 h-4" />
                {confirmCheckin.isPending ? "..." : t("تأكيد تسجيل الوصول", "Confirm Check-in")}
              </Button>
            )}
            {booking.status === "pending" && (
              <Button
                className="gradient-cta flex-1 gap-2"
                onClick={() => updateStatus.mutate("confirmed")}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="w-4 h-4" />
                {t("تأكيد الحجز", "Confirm Booking")}
              </Button>
            )}
            {!["cancelled", "completed", "checked_in"].includes(booking.status) && (
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                onClick={() => updateStatus.mutate("cancelled")}
                disabled={updateStatus.isPending}
              >
                <XCircle className="w-4 h-4" />
                {t("إلغاء", "Cancel")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoCell = ({ label, value, bold, badge }: { label: string; value: string; bold?: boolean; badge?: boolean }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    {badge ? (
      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">{value}</span>
    ) : (
      <p className={`text-sm text-foreground ${bold ? "font-bold text-lg" : "font-medium"}`}>{value}</p>
    )}
  </div>
);

export default ReservationDetail;
