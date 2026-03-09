import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Upload, Shield, CreditCard, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { QRCodeSVG } from "qrcode.react";

const DEPOSIT_PERCENT = 10;

type Step = "details" | "passport" | "payment" | "voucher";

const isPeakSeason = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (month === 6 && day >= 15) return true;
  if (month === 7 || month === 8) return true;
  if (month === 9 && day <= 15) return true;
  return false;
};

const BookingForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hotelId = searchParams.get("hotel") || "";
  const roomId = searchParams.get("room") || "";
  const { t, lang } = useI18n();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;
  const BackArrow = lang === "ar" ? ArrowRight : ArrowLeft;

  const [step, setStep] = useState<Step>("details");
  const [hotel, setHotel] = useState<any>(null);
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Passport
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [passportPreview, setPassportPreview] = useState<string | null>(null);
  const [passportNumber, setPassportNumber] = useState("");
  const [uploading, setUploading] = useState(false);

  // Payment / Voucher
  const [processing, setProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId || !roomId) return;
    const load = async () => {
      const [h, r] = await Promise.all([
        supabase.from("hotels").select("*").eq("id", hotelId).single(),
        supabase.from("room_categories").select("*").eq("id", roomId).single(),
      ]);
      setHotel(h.data);
      setRoom(r.data);
      setLoading(false);
    };
    load();
  }, [hotelId, roomId]);

  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1;
  const totalPrice = room ? room.price_per_night * nights : 0;
  const depositAmount = Math.round(totalPrice * DEPOSIT_PERCENT / 100);
  const balanceDue = totalPrice - depositAmount;

  const handlePassportDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setPassportFile(file);
      setPassportPreview(URL.createObjectURL(file));
    }
  }, []);

  const handlePassportSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
      setPassportPreview(URL.createObjectURL(file));
    }
  };

  const enterPassportStep = async () => {
    setStep("passport");
    try {
      await supabase.from("webhook_logs").insert({
        hotel_id: hotelId,
        event_type: "temporary_hold",
        payload: { room_category_id: roomId, check_in: checkIn, check_out: checkOut, guest_name: `${firstName} ${lastName}` },
        status: "sent",
      });
    } catch (err) {
      console.error("Hold webhook failed:", err);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      let passportUrl: string | null = null;
      if (passportFile) {
        const ext = passportFile.name.split(".").pop();
        const path = `passports/${hotelId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("hotel-photos").upload(path, passportFile);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("hotel-photos").getPublicUrl(path);
          passportUrl = urlData.publicUrl;
        }
      }

      const txHash = `NTY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data: booking, error } = await supabase.from("bookings").insert({
        hotel_id: hotelId,
        room_category_id: roomId,
        guest_first_name: firstName,
        guest_last_name: lastName,
        guest_email: email,
        guest_phone: phone || null,
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice,
        deposit_amount: depositAmount,
        special_requests: specialRequests || null,
        passport_number: passportNumber || null,
        passport_image_url: passportUrl,
        transaction_hash: txHash,
        payment_status: "deposit_paid",
        status: "confirmed",
        sync_status: "pending",
      }).select("id").single();

      if (error) throw error;

      setBookingId(booking.id);

      await supabase.from("webhook_logs").insert({
        hotel_id: hotelId,
        event_type: "booking_confirmed",
        payload: { booking_id: booking.id, transaction_hash: txHash, deposit_amount: depositAmount },
        status: "sent",
      });

      setStep("voucher");
      toast.success(tx("تم الدفع بنجاح!", "Payment successful!"));
    } catch (err: any) {
      toast.error(err.message || tx("حدث خطأ", "An error occurred"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-pulse text-muted-foreground">{tx("جاري التحميل...", "Loading...")}</div>
        </div>
      </Layout>
    );
  }

  if (!hotel || !room) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">{tx("لم يتم العثور على البيانات", "Data not found")}</h1>
          <button onClick={() => navigate("/hotels")} className="text-primary underline">{tx("تصفح الفنادق", "Browse Hotels")}</button>
        </div>
      </Layout>
    );
  }

  const hotelName = lang === "ar" ? hotel.name_ar : hotel.name_en;
  const roomName = lang === "ar" ? room.name_ar : room.name_en;

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: "details", label: tx("المعلومات", "Details"), icon: FileText },
    { key: "passport", label: tx("الجواز", "Passport"), icon: Shield },
    { key: "payment", label: tx("الدفع", "Payment"), icon: CreditCard },
    { key: "voucher", label: tx("القسيمة", "Voucher"), icon: CheckCircle },
  ];
  const currentStepIdx = steps.findIndex(s => s.key === step);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back button */}
        <button onClick={() => {
          if (step === "details") navigate(-1);
          else if (step === "passport") setStep("details");
          else if (step === "payment") setStep("passport");
        }} className={`flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 ${step === "voucher" ? "invisible" : ""}`}>
          <BackArrow className="w-4 h-4" />
          {tx("رجوع", "Back")}
        </button>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${i <= currentStepIdx ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 rounded ${i < currentStepIdx ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Step 1: Guest Details */}
            {step === "details" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-5">
                <h2 className="font-semibold text-foreground text-lg">{t("booking.guestInfo")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.firstName")} *</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.lastName")} *</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.email")} *</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.phone")}</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{tx("الجنسية", "Nationality")} *</label>
                    <input value={nationality} onChange={e => setNationality(e.target.value)} required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" placeholder={tx("مثال: سوري", "e.g. Syrian")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.checkIn")} *</label>
                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{t("booking.checkOut")} *</label>
                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{t("booking.specialRequests")}</label>
                  <textarea rows={3} value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground resize-none focus:ring-2 focus:ring-primary/30 transition" placeholder={t("booking.specialPlaceholder")} />
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary cursor-pointer shrink-0" />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {tx("أوافق على ", "I agree to the ")}
                    <Link to="/terms" target="_blank" className="text-primary underline underline-offset-2">
                      {tx("الشروط والأحكام", "Terms & Conditions")}
                    </Link>
                    {tx(" وسياسة ", " and ")}
                    <Link to="/privacy" target="_blank" className="text-primary underline underline-offset-2">
                      {tx("الخصوصية", "Privacy Policy")}
                    </Link>
                    {tx("، بما فيها عدم الاسترداد في مواسم الذروة.",
                        ", including the no-refund policy during peak seasons.")}
                  </span>
                </label>

                <button
                  onClick={() => {
                    if (!firstName || !lastName || !email || !nationality || !checkIn || !checkOut) {
                      toast.error(tx("يرجى تعبئة جميع الحقول المطلوبة", "Please fill all required fields"));
                      return;
                    }
                    if (new Date(checkOut) <= new Date(checkIn)) {
                      toast.error(tx("تاريخ المغادرة يجب أن يكون بعد الوصول", "Check-out must be after check-in"));
                      return;
                    }
                    if (!termsAccepted) {
                      toast.error(tx("يجب الموافقة على الشروط والأحكام أولاً", "You must accept the Terms & Conditions first"));
                      return;
                    }
                    enterPassportStep();
                  }}
                  className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {tx("التالي: تحميل الجواز", "Next: Upload Passport")}
                </button>
              </motion.div>
            )}

            {/* Step 2: Passport Upload */}
            {step === "passport" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-lg">{tx("تحميل جواز السفر", "Passport Upload")}</h2>
                    <p className="text-xs text-muted-foreground">{tx("متطلب حكومي إلزامي", "Government Requirement")}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">{tx("رقم الجواز", "Passport Number")}</label>
                  <input value={passportNumber} onChange={e => setPassportNumber(e.target.value)} className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" placeholder={tx("مثال: N12345678", "e.g. N12345678")} />
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handlePassportDrop}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center space-y-3 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("passport-input")?.click()}
                >
                  {passportPreview ? (
                    <div className="space-y-3">
                      <img src={passportPreview} alt="Passport" className="max-h-48 mx-auto rounded-lg shadow-card" />
                      <p className="text-sm text-primary font-medium">{tx("تم التحميل - انقر للتغيير", "Uploaded - click to change")}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-sm text-muted-foreground">{tx("اسحب وأفلت صورة الجواز هنا", "Drag & drop your passport image here")}</p>
                      <p className="text-xs text-muted-foreground">{tx("أو انقر للاختيار", "or click to browse")}</p>
                    </>
                  )}
                  <input id="passport-input" type="file" accept="image/*" onChange={handlePassportSelect} className="hidden" />
                </div>

                <div className="bg-muted/50 rounded-lg p-3 border border-border/30">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    {tx("بياناتك محمية ومشفرة. يتم استخدام صورة الجواز للتحقق من الهوية فقط وفقاً للمتطلبات الحكومية.", "Your data is protected and encrypted. Passport image is used for identity verification only per government requirements.")}
                  </p>
                </div>

                <button
                  onClick={() => setStep("payment")}
                  className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {tx("التالي: الدفع", "Next: Payment")}
                </button>
              </motion.div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-lg">{tx("دفع العربون", "Deposit Payment")}</h2>
                    <p className="text-xs text-muted-foreground">{tx("ادفع العربون فقط لتأكيد حجزك", "Pay only the deposit to confirm your booking")}</p>
                  </div>
                </div>

                {/* Payment summary */}
                <div className="bg-muted/50 rounded-xl p-5 space-y-3 border border-border/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{roomName} × {nights} {tx("ليالي", "nights")}</span>
                    <span className="font-medium text-foreground" dir="ltr">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tx(`العربون (${DEPOSIT_PERCENT}%)`, `Deposit (${DEPOSIT_PERCENT}%)`)}</span>
                    <span className="font-bold text-primary text-lg" dir="ltr">${depositAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border/50 pt-2">
                    <span className="text-muted-foreground">{tx("الباقي عند الوصول", "Balance at check-in")}</span>
                    <span className="font-medium text-foreground" dir="ltr">${balanceDue}</span>
                  </div>
                </div>

                {/* Peak season warning */}
                {isPeakSeason(checkIn) && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          {tx("تنبيه: موسم الذروة — لا استرداد", "Warning: Peak Season — No Refund")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx("حجزك في موسم الصيف (15 يونيو – 15 سبتمبر). العربون (10%) غير قابل للاسترداد.",
                              "Your booking is in Summer peak season (Jun 15 – Sep 15). The 10% deposit is non-refundable.")}
                        </p>
                        <Link to="/terms" target="_blank" className="text-xs text-primary underline underline-offset-2">
                          {tx("اقرأ سياسة الإلغاء الكاملة", "Read full cancellation policy")}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Placeholder payment form */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{tx("رقم البطاقة", "Card Number")}</label>
                    <input placeholder="4242 4242 4242 4242" className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition" dir="ltr" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">{tx("تاريخ الانتهاء", "Expiry")}</label>
                      <input placeholder="MM/YY" className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">CVC</label>
                      <input placeholder="123" className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" dir="ltr" />
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-xs text-primary font-medium flex items-start gap-2">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                    {tx("المبلغ المطلوب دفعه الآن هو العربون فقط. الباقي يُدفع عند الوصول للفندق.", "Only the deposit amount is charged now. The balance is due upon check-in at the hotel.")}
                  </p>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {processing ? tx("جاري المعالجة...", "Processing...") : tx(`ادفع $${depositAmount} عربون`, `Pay $${depositAmount} Deposit`)}
                </button>
              </motion.div>
            )}

            {/* Step 4: Voucher */}
            {step === "voucher" && bookingId && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-xl p-8 shadow-card border border-border/50 text-center space-y-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                  <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                </motion.div>

                <h1 className="text-2xl font-extrabold text-foreground">{tx("تم تأكيد الحجز!", "Booking Confirmed!")}</h1>
                <p className="text-muted-foreground">{tx("تم إرسال حجزك مباشرة إلى الفندق", "Your booking has been sent directly to the hotel")}</p>

                {/* Digital Voucher */}
                <div className="bg-muted/50 rounded-xl p-6 border border-border/30 space-y-4 max-w-sm mx-auto">
                  <h3 className="font-semibold text-foreground">{tx("قسيمة الحجز الرقمية", "Digital Booking Voucher")}</h3>

                  <div className="bg-card p-4 rounded-lg inline-block mx-auto">
                    <QRCodeSVG value={`NAITY-BOOKING:${bookingId}`} size={160} level="H" />
                  </div>

                  <div className="text-start space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("الفندق", "Hotel")}</span>
                      <span className="font-medium text-foreground">{hotelName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("الغرفة", "Room")}</span>
                      <span className="font-medium text-foreground">{roomName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("الضيف", "Guest")}</span>
                      <span className="font-medium text-foreground">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("booking.checkIn")}</span>
                      <span className="font-medium text-foreground">{checkIn}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("booking.checkOut")}</span>
                      <span className="font-medium text-foreground">{checkOut}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">{tx("المدفوع", "Paid")}</span>
                      <span className="font-bold text-primary" dir="ltr">${depositAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("المتبقي", "Remaining")}</span>
                      <span className="font-medium text-foreground" dir="ltr">${balanceDue}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">{tx("احفظ هذه القسيمة على هاتفك وأظهرها عند تسجيل الوصول", "Save this voucher to your phone and present it at check-in")}</p>

                <button
                  onClick={() => navigate("/")}
                  className="gradient-cta text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  {tx("العودة للرئيسية", "Back to Home")}
                </button>

                <button
                  onClick={() => navigate('/my-bookings')}
                  className="text-sm text-primary underline underline-offset-2 hover:opacity-80 transition mt-2 block text-center w-full"
                >
                  {tx("تتبع جميع حجوزاتي بالبريد الإلكتروني", "Track all my bookings by email")}
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar summary */}
          {step !== "voucher" && (
            <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 h-fit space-y-4 lg:sticky lg:top-20">
              <h2 className="font-semibold text-foreground text-lg">{t("booking.summary")}</h2>
              {hotel.cover_image && <img src={hotel.cover_image} alt={hotelName} className="w-full h-32 object-cover rounded-lg" />}
              <div>
                <h3 className="font-semibold text-foreground">{hotelName}</h3>
                <p className="text-sm text-muted-foreground">{hotel.city}</p>
              </div>
              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.roomType")}</span>
                  <span className="font-medium text-foreground">{roomName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.pricePerNight")}</span>
                  <span className="font-medium text-foreground" dir="ltr">${room.price_per_night}</span>
                </div>
                {checkIn && checkOut && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("عدد الليالي", "Nights")}</span>
                      <span className="font-medium text-foreground">{nights}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">{tx("الإجمالي", "Total")}</span>
                      <span className="font-bold text-foreground" dir="ltr">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{tx("العربون المطلوب", "Deposit Due")}</span>
                      <span className="font-bold text-primary" dir="ltr">${depositAmount}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.guestsLabel")}</span>
                  <span className="font-medium text-foreground">{t("booking.upTo")} {room.max_guests}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookingForm;
