// i18n module - direct hotel API connection
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

type Lang = "ar" | "en";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const translations: Record<string, Record<Lang, string>> = {
  // ── Navbar ──────────────────────────────────────────
  "nav.home":       { ar: "الرئيسية",   en: "Home" },
  "nav.hotels":     { ar: "الفنادق",    en: "Hotels" },
  "nav.howItWorks": { ar: "كيف يعمل",  en: "How It Works" },
  "nav.about":      { ar: "عن Naity",   en: "About Naity" },
  "nav.contact":    { ar: "تواصل معنا", en: "Contact Us" },
  "nav.myBookings": { ar: "حجوزاتي",   en: "My Bookings" },

  // ── Hero ────────────────────────────────────────────
  "hero.slogan":   { ar: "نيتي — نحن نجهّز إقامتك",                          en: "Naity — We Prepare Your Stay" },
  "hero.title":    { ar: "اعثر على إقامتك المثالية مع",                       en: "Find your perfect stay with" },
  "hero.subtitle": { ar: "حجز مباشر من الفنادق. ادفع 10% الآن والباقي عند وصولك.", en: "Book direct from hotels. Pay 10% now, rest on arrival." },
  "hero.anyCity":  { ar: "أي مدينة",                                           en: "Any City" },
  "hero.search":   { ar: "ابحث عن فندق",                                      en: "Search Hotels" },
  "hero.badge1":   { ar: "ادفع 10% فقط — الباقي عند الوصول",                  en: "Pay Only 10% — Rest on Arrival" },
  "hero.badge2":   { ar: "تأكيد فوري مباشر من الفندق",                        en: "Instant Direct Hotel Confirmation" },
  "hero.badge3":   { ar: "احجز بدون حساب — فقط بريدك الإلكتروني",             en: "Book Without Account — Just Your Email" },

  // ── Direct connection ───────────────────────────────
  "direct.badge": { ar: "ربط مباشر بأنظمة الفنادق",     en: "Direct Hotel System Connection" },
  "direct.title": { ar: "مرتبطون مباشرة بالفنادق",       en: "Directly Connected to Hotels" },
  "direct.desc":  { ar: "كل فندق على Naity مرتبط بنظامه الداخلي عبر API.\nتوفر الغرف يُحدَّث كل 10 دقائق — ما تراه حقيقي وليس تقديراً.", en: "Every hotel on Naity connects to its internal system via API.\nRoom availability updates every 10 minutes — what you see is real, not estimated." },

  // ── Why Book ────────────────────────────────────────
  "benefits.title":          { ar: "لماذا تحجز مع Naity؟",       en: "Why Book with Naity?" },
  "benefits.deposit.title":  { ar: "ادفع 10% فقط الآن",           en: "Pay Only 10% Now" },
  "benefits.deposit.desc":   { ar: "أكّد حجزك بعربون 10% فقط عبر البطاقة. الباقي 90% تدفعه نقداً عند وصولك للفندق.", en: "Confirm your booking with a 10% deposit by card. Pay 90% cash on arrival." },
  "benefits.instant.title":  { ar: "تأكيد فوري للفندق",            en: "Instant Hotel Confirmation" },
  "benefits.instant.desc":   { ar: "حجزك يُرسل مباشرة لنظام الفندق فور الدفع. لا انتظار، لا اتصالات.", en: "Your booking reaches the hotel system instantly upon payment. No waiting." },
  "benefits.realtime.title": { ar: "توفر حقيقي ومحدَّث",           en: "Real & Updated Availability" },
  "benefits.realtime.desc":  { ar: "بيانات الغرف تُسحب من نظام الفندق كل 10 دقائق. لا غرف وهمية.", en: "Room data pulled every 10 minutes from hotel system. No ghost rooms." },
  "benefits.support.title":  { ar: "احجز بدون حساب",               en: "Book Without Account" },
  "benefits.support.desc":   { ar: "احجز بدون تسجيل. تتبع جميع حجوزاتك في أي وقت بإدخال بريدك فقط.", en: "Book without registration. Track all bookings anytime with just your email." },

  // ── How It Works ────────────────────────────────────
  "how.title":       { ar: "كيف تعمل Naity",                                             en: "How Naity Works" },
  "how.subtitle":    { ar: "ثلاث خطوات بسيطة تفصلك عن إقامتك المثالية.",                 en: "Three simple steps to your perfect stay." },
  "how.step":        { ar: "الخطوة",                                                      en: "Step" },
  "how.step1.title": { ar: "ابحث واختر فندقك",                                           en: "Search & Choose" },
  "how.step1.desc":  { ar: "تصفح الفنادق المتاحة وفلتر حسب المدينة، السعر، والنجوم.",     en: "Browse available hotels and filter by city, price, and stars." },
  "how.step2.title": { ar: "ادفع 10% عبر البطاقة",                                       en: "Pay 10% by Card" },
  "how.step2.desc":  { ar: "أكّد حجزك بدفع 10% فقط. آمن ومشفر. حجزك يصل للفندق فوراً.", en: "Confirm with just 10% deposit. Secure & encrypted. Sent to hotel instantly." },
  "how.step3.title": { ar: "استمتع بإقامتك",                                             en: "Enjoy Your Stay" },
  "how.step3.desc":  { ar: "احضر بقسيمة حجزك الرقمية وادفع 90% نقداً عند الوصول.",       en: "Arrive with digital voucher and pay 90% cash on arrival." },
  "how.result":      { ar: "ما يميز Naity",                                              en: "What Makes Naity Different" },
  "how.result1":     { ar: "بيانات مباشرة من الفنادق — لا قوائم قديمة",                  en: "Data direct from hotels — no stale listings" },
  "how.result2":     { ar: "لا حجوزات مزدوجة — التوفر يتحدث كل 10 دقائق",               en: "No double bookings — availability updates every 10 min" },
  "how.result3":     { ar: "لا رسوم مخفية — الأسعار يحددها الفندق مباشرة",              en: "No hidden fees — prices set directly by the hotel" },
  "how.result4":     { ar: "ادفع 10% الآن، 90% نقداً عند الوصول",                       en: "Pay 10% now, 90% cash on arrival" },

  // ── About ───────────────────────────────────────────
  "about.title":            { ar: "عن Naity",                          en: "About Naity" },
  "about.subtitle":         { ar: "نعيد تعريف تجربة حجز الفنادق بالاتصال المباشر.", en: "Redefining hotel booking through direct connection." },
  "about.mission":          { ar: "مهمتنا",                            en: "Our Mission" },
  "about.missionDesc":      { ar: "Naity وُلدت لتكون الجسر الموثوق بين الفنادق والمسافرين. مهمتنا توفير تجربة حجز بسيطة وشفافة وفورية — بدون وسطاء أو مفاجآت.", en: "Naity was born to be the trusted bridge between hotels and travelers. Simple, transparent, instant booking — no middlemen, no surprises." },
  "about.vision":           { ar: "رؤيتنا",                            en: "Our Vision" },
  "about.visionDesc":       { ar: "أن تكون Naity المرجع الأول لحجز الفنادق — منصة يثق بها كل مسافر وكل فندق.", en: "For Naity to be the go-to hotel booking platform — trusted by every traveler and every hotel." },
  "about.values":           { ar: "قيمنا",                             en: "Our Values" },
  "about.transparency":     { ar: "الشفافية",                          en: "Transparency" },
  "about.transparencyDesc": { ar: "ما تراه هو ما تحصل عليه. أسعار حقيقية، توفر حقيقي.", en: "What you see is what you get. Real prices, real availability." },
  "about.reliability":      { ar: "الموثوقية",                         en: "Reliability" },
  "about.reliabilityDesc":  { ar: "كل حجز يُرسل مباشرة للفندق للتأكيد الفوري.", en: "Every booking goes directly to the hotel for instant confirmation." },
  "about.innovation":       { ar: "الابتكار",                          en: "Innovation" },
  "about.innovationDesc":   { ar: "نستخدم التكنولوجيا لنجعل تجربة الحجز بمستوى عالمي.", en: "We use technology to bring hotel booking to world-class standards." },

  // ── Contact ─────────────────────────────────────────
  "contact.title":        { ar: "تواصل معنا",                                                      en: "Contact Us" },
  "contact.subtitle":     { ar: "لديك سؤال؟ تريد ربط فندقك؟ نحن هنا للمساعدة.",                   en: "Have a question? Want to connect your hotel? We're here." },
  "contact.name":         { ar: "الاسم",              en: "Name" },
  "contact.namePlaceholder": { ar: "اسمك",            en: "Your name" },
  "contact.email":        { ar: "البريد الإلكتروني",  en: "Email" },
  "contact.subject":      { ar: "الموضوع",            en: "Subject" },
  "contact.subjectPlaceholder": { ar: "كيف يمكننا مساعدتك؟", en: "How can we help?" },
  "contact.message":      { ar: "الرسالة",            en: "Message" },
  "contact.messagePlaceholder": { ar: "أخبرنا المزيد...", en: "Tell us more..." },
  "contact.send":         { ar: "إرسال الرسالة",      en: "Send Message" },
  "contact.emailLabel":   { ar: "البريد الإلكتروني",  en: "Email" },
  "contact.phoneLabel":   { ar: "الهاتف",             en: "Phone" },
  "contact.officeLabel":  { ar: "المكتب",             en: "Office" },
  "contact.office":       { ar: "سوريا — دمشق",       en: "Syria — Damascus" },
  "contact.hotelCta":     { ar: "هل تمتلك فندقاً؟",  en: "Do you own a hotel?" },
  "contact.hotelCtaDesc": { ar: "اربط نظام فندقك بـ Naity واستقطب ضيوفاً من حول العالم. التكامل سريع ومجاني.", en: "Connect your hotel system to Naity and attract guests worldwide. Fast and free." },
  "contact.learnMore":    { ar: "اعرف أكثر",          en: "Learn More" },
  "contact.successToast": { ar: "تم إرسال الرسالة! سنرد عليك قريباً.", en: "Message sent! We'll get back to you soon." },

  // ── Footer ──────────────────────────────────────────
  "footer.slogan":        { ar: "نحن نجهّز إقامتك",                                          en: "We Prepare Your Stay" },
  "footer.desc":          { ar: "منصة حجز الفنادق المباشرة. بدون وسيط، بدون رسوم مخفية.",    en: "The direct hotel booking platform. No middlemen, no hidden fees." },
  "footer.explore":       { ar: "استكشف",             en: "Explore" },
  "footer.support":       { ar: "الدعم",              en: "Support" },
  "footer.forHotels":     { ar: "للفنادق",            en: "For Hotels" },
  "footer.forHotelsDesc": { ar: "اربط فندقك بـ Naity مجاناً لاستقبال حجوزات مباشرة.",       en: "Connect your hotel to Naity for free to receive direct bookings." },
  "footer.joinNaity":     { ar: "انضم إلى Naity",     en: "Join Naity" },
  "footer.copyright":     { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },
  "footer.terms":         { ar: "الشروط والأحكام",    en: "Terms & Conditions" },
  "footer.privacy":       { ar: "سياسة الخصوصية",    en: "Privacy Policy" },
  "footer.cookies":       { ar: "سياسة الكوكيز",      en: "Cookie Policy" },

  // ── My Bookings ─────────────────────────────────────
  "myBookings.title":          { ar: "تتبع حجزك",                                                                                      en: "Track Your Booking" },
  "myBookings.subtitle":       { ar: "أدخل البريد الإلكتروني الذي استخدمته عند الحجز لعرض جميع حجوزاتك وتفاصيلها الكاملة",             en: "Enter the email used when booking to view all your reservations and full details" },
  "myBookings.emailLabel":     { ar: "البريد الإلكتروني المستخدم في الحجز",                                                             en: "Email Used During Booking" },
  "myBookings.search":         { ar: "عرض حجوزاتي",          en: "View My Bookings" },
  "myBookings.noBookings":     { ar: "لا توجد حجوزات بهذا البريد",                                                                     en: "No bookings found for this email" },
  "myBookings.noBookingsDesc": { ar: "تأكد من إدخال نفس البريد المستخدم عند الحجز",                                                   en: "Make sure you enter the same email used when booking" },
  "myBookings.nights":         { ar: "ليالي",              en: "nights" },
  "myBookings.details":        { ar: "عرض التفاصيل والقسيمة", en: "Show Details & Voucher" },
  "myBookings.hideDetails":    { ar: "إخفاء التفاصيل",     en: "Hide Details" },
  "myBookings.showOnArrival":  { ar: "أظهر هذه القسيمة عند تسجيل الوصول", en: "Show this voucher at check-in" },

  // ── Booking ─────────────────────────────────────────
  "booking.title":         { ar: "أكمل حجزك",           en: "Complete Your Booking" },
  "booking.guestInfo":     { ar: "معلومات الضيف",        en: "Guest Information" },
  "booking.firstName":     { ar: "الاسم الأول",          en: "First Name" },
  "booking.lastName":      { ar: "اسم العائلة",          en: "Last Name" },
  "booking.email":         { ar: "البريد الإلكتروني",    en: "Email" },
  "booking.phone":         { ar: "رقم الهاتف",           en: "Phone Number" },
  "booking.checkIn":       { ar: "تاريخ الوصول",         en: "Check-in Date" },
  "booking.checkOut":      { ar: "تاريخ المغادرة",       en: "Check-out Date" },
  "booking.specialRequests": { ar: "طلبات خاصة",        en: "Special Requests" },
  "booking.specialPlaceholder": { ar: "أي طلبات خاصة...", en: "Any special requests..." },
  "booking.confirm":       { ar: "تأكيد الحجز",          en: "Confirm Booking" },
  "booking.summary":       { ar: "ملخص الحجز",           en: "Booking Summary" },
  "booking.roomType":      { ar: "نوع الغرفة",           en: "Room Type" },
  "booking.pricePerNight": { ar: "السعر/الليلة",         en: "Price/Night" },
  "booking.guestsLabel":   { ar: "الضيوف",               en: "Guests" },
  "booking.upTo":          { ar: "حتى",                  en: "Up to" },
  "booking.noRoom":        { ar: "لم يتم اختيار غرفة. يرجى العودة واختيار غرفة.", en: "No room selected. Please go back and select a room." },
  "booking.confirmed":     { ar: "تم تأكيد الحجز!",      en: "Booking Confirmed!" },
  "booking.confirmedDesc": { ar: "تم إرسال حجزك للفندق مباشرة. ستتلقى تأكيداً على بريدك قريباً.", en: "Your booking was sent to the hotel. Confirmation email coming soon." },
  "booking.successToast":  { ar: "تم إرسال الحجز بنجاح!", en: "Booking submitted successfully!" },

  // ── Status ──────────────────────────────────────────
  "status.confirmed": { ar: "مؤكد ✓",       en: "Confirmed ✓" },
  "status.pending":   { ar: "قيد المراجعة", en: "Pending Review" },
  "status.cancelled": { ar: "ملغي",         en: "Cancelled" },
  "status.completed": { ar: "مكتمل",        en: "Completed" },

  // ── Hotel detail ────────────────────────────────────
  "hotel.notFound":  { ar: "الفندق غير موجود",   en: "Hotel not found" },
  "hotel.reviews":   { ar: "تقييم",              en: "reviews" },
  "hotel.perNight":  { ar: "/ليلة",              en: "/night" },
  "hotel.about":     { ar: "عن هذا الفندق",      en: "About this hotel" },
  "hotel.amenities": { ar: "المرافق",            en: "Amenities" },
  "hotel.rooms":     { ar: "الغرف المتاحة",      en: "Available Rooms" },
  "hotel.available": { ar: "متاح",              en: "Available" },
  "hotel.soldOut":   { ar: "نفذ",               en: "Sold Out" },
  "hotel.upTo":      { ar: "حتى",               en: "Up to" },
  "hotel.guests":    { ar: "ضيوف",              en: "guests" },
  "hotel.bookNow":   { ar: "احجز الآن",         en: "Book Now" },

  // ── Hotels listing ──────────────────────────────────
  "hotels.title":     { ar: "تصفح الفنادق",      en: "Browse Hotels" },
  "hotels.filter":    { ar: "التصفية",           en: "Filter" },
  "hotels.city":      { ar: "المدينة",           en: "City" },
  "hotels.allCities": { ar: "جميع المدن",        en: "All Cities" },
  "hotels.minStars":  { ar: "الحد الأدنى للنجوم", en: "Minimum Stars" },
  "hotels.all":       { ar: "الكل",             en: "All" },
  "hotels.stars":     { ar: "نجوم",             en: "stars" },
  "hotels.maxPrice":  { ar: "الحد الأقصى للسعر", en: "Max Price" },
  "hotels.noResults": { ar: "لا توجد فنادق تطابق معايير البحث.", en: "No hotels match your search criteria." },

  // ── Featured ──────────────────────────────────────
  "featured.title":   { ar: "فنادق مميزة", en: "Featured Hotels" },
  "featured.viewAll": { ar: "عرض الكل",   en: "View All" },

  // ── App download ────────────────────────────────────
  "app.download":   { ar: "حمّل التطبيق", en: "Download the App" },
  "app.appStore":   { ar: "App Store",    en: "App Store" },
  "app.googlePlay": { ar: "Google Play",  en: "Google Play" },

  // ── 404 ─────────────────────────────────────────────
  "notFound.title": { ar: "الصفحة غير موجودة", en: "Page Not Found" },
  "notFound.desc":  { ar: "عذراً! الصفحة غير موجودة", en: "Sorry! Page doesn't exist." },
  "notFound.back":  { ar: "العودة للرئيسية",    en: "Back to Home" },

  // ── HotelCard ─────────────────────────────────────
  "card.review": { ar: "تقييم", en: "reviews" },

  // ── API Companies ─────────────────────────────────
  "api.companies":    { ar: "شركات API",              en: "API Companies" },
  "api.addCompany":   { ar: "إضافة شركة",              en: "Add Company" },
  "api.apiKey":       { ar: "مفتاح API",               en: "API Key" },
  "api.regenerate":   { ar: "إعادة توليد",             en: "Regenerate" },
  "api.copyKey":      { ar: "نسخ المفتاح",             en: "Copy Key" },
  "api.lastSync":     { ar: "آخر مزامنة",              en: "Last Sync" },
  "api.linkHotel":    { ar: "ربط فندق",                en: "Link Hotel" },
  "api.externalId":   { ar: "الرقم الخارجي للفندق",    en: "External Hotel ID" },
  "api.linkedHotels": { ar: "فنادق مرتبطة",            en: "Linked Hotels" },
  "api.endpoint":     { ar: "رابط الاتصال",            en: "API Endpoint" },
  "api.howToConnect": { ar: "كيف تتصل الشركات؟",       en: "How to connect?" },
  "api.addedToast":   { ar: "تم إضافة الشركة بنجاح",   en: "Company added!" },
  "api.copiedToast":  { ar: "تم النسخ!",               en: "Copied!" },
  "api.unlinkHotel":  { ar: "إلغاء الربط",             en: "Unlink" },
};

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("naity-lang");
    return (saved === "en" || saved === "ar") ? saved : "ar";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("naity-lang", l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useCallback((key: string) => {
    return translations[key]?.[lang] || key;
  }, [lang]);

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

// Helper to get localized hotel data
export const useLocalizedHotelData = () => {
  const { lang } = useI18n();
  
  const hotelNames: Record<number, Record<Lang, string>> = {
    1: { ar: "منتجع أزور مارينا", en: "Azure Marina Resort" },
    2: { ar: "فندق القصر الكبير", en: "Grand Palace Hotel" },
    3: { ar: "فندق سكاي لاين للأعمال", en: "Skyline Business Hotel" },
    4: { ar: "فندق واحة الحديقة", en: "Garden Oasis Hotel" },
    5: { ar: "نزل نسيم الساحل", en: "Coastal Breeze Inn" },
    6: { ar: "فندق قمة المرتفعات", en: "Summit Heights Hotel" },
  };

  const hotelDescriptions: Record<number, Record<Lang, string>> = {
    1: { ar: "منتجع فاخر على الشاطئ مع إطلالات خلابة.", en: "Luxury beachfront resort with stunning views." },
    2: { ar: "أناقة تاريخية تلتقي بالفخامة العصرية.", en: "Historic elegance meets modern luxury." },
    3: { ar: "فندق أعمال عصري.", en: "Modern business hotel." },
    4: { ar: "ملاذ هادئ محاط بحدائق غنّاء.", en: "A serene retreat surrounded by lush gardens." },
    5: { ar: "فندق ساحلي ساحر.", en: "Charming coastal hotel." },
    6: { ar: "فخامة راقية مع إطلالات بانورامية.", en: "Refined luxury with panoramic views." },
  };

  const amenitiesMap: Record<string, string> = lang === "en" ? {
    "مسبح": "Pool", "سبا": "Spa", "شاطئ خاص": "Private Beach", "مطعم": "Restaurant",
    "صالة رياضية": "Gym", "واي فاي": "WiFi", "خدمة الغرف": "Room Service",
    "موقف سيارات": "Parking", "بار": "Bar", "كونسيرج": "Concierge",
    "خدمة صف السيارات": "Valet Parking", "مركز أعمال": "Business Center",
    "قاعات اجتماعات": "Meeting Rooms", "حديقة": "Garden", "نقل من المطار": "Airport Transfer",
    "تراس": "Terrace", "غسيل": "Laundry",
  } : {};

  const localizeAmenity = (amenity: string) => amenitiesMap[amenity] || amenity;

  const cityMap: Record<string, string> = lang === "en" ? {} : {
    "Dubai": "دبي", "Istanbul": "إسطنبول", "Riyadh": "الرياض",
    "Marrakech": "مراكش", "Casablanca": "الدار البيضاء", "Amman": "عمّان",
    "Damascus": "دمشق", "Aleppo": "حلب", "Lattakia": "اللاذقية",
    "Homs": "حمص", "Tartus": "طرطوس",
  };

  const localizeHotelName = (id: number, fallback: string) => {
    return hotelNames[id]?.[lang] || fallback;
  };

  const localizeCity = (city: string) => {
    if (lang === "ar") return cityMap[city] || city;
    return city;
  };

  return { lang, hotelNames, hotelDescriptions, localizeAmenity, localizeHotelName, localizeCity };
};
