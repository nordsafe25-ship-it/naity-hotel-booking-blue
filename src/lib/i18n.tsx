import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

type Lang = "ar" | "en";

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const translations: Record<string, Record<Lang, string>> = {
  // Navbar
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.hotels": { ar: "الفنادق", en: "Hotels" },
  "nav.howItWorks": { ar: "كيف يعمل", en: "How It Works" },
  "nav.about": { ar: "عن Naity", en: "About Naity" },
  "nav.contact": { ar: "تواصل معنا", en: "Contact Us" },

  // Hero
  "hero.title": { ar: "اعثر على إقامتك المثالية مع", en: "Find your perfect stay with" },
  "hero.subtitle": { ar: "احجز فنادق متصلة مباشرة بنظام حاجز لإدارة الفنادق.\nتوفر فوري. تأكيد لحظي.", en: "Book hotels connected directly to the Hajiz hotel management system.\nInstant availability. Instant confirmation." },
  "hero.anyCity": { ar: "أي مدينة", en: "Any City" },
  "hero.guest1": { ar: "1 ضيف", en: "1 Guest" },
  "hero.guest2": { ar: "2 ضيوف", en: "2 Guests" },
  "hero.guest3": { ar: "3 ضيوف", en: "3 Guests" },
  "hero.guest4": { ar: "+4 ضيوف", en: "4+ Guests" },
  "hero.search": { ar: "بحث", en: "Search" },

  // Hajiz section
  "hajiz.badge": { ar: "مدعوم بنظام حاجز", en: "Powered by Hajiz" },
  "hajiz.title": { ar: "متصل مباشرة بالفنادق", en: "Connected directly to hotels" },
  "hajiz.desc": { ar: "كل فندق على Naity يستخدم نظام حاجز داخلياً.\nهذا يعني أنك تحصل على توفر الغرف لحظياً، أسعار مباشرة، وتأكيد حجز فوري — بدون وسطاء.", en: "Every hotel on Naity uses the Hajiz system internally.\nThis means you get real-time room availability, direct prices, and instant booking confirmation — no middlemen." },

  // Featured
  "featured.title": { ar: "فنادق مميزة", en: "Featured Hotels" },
  "featured.viewAll": { ar: "عرض الكل", en: "View All" },

  // Benefits
  "benefits.title": { ar: "لماذا تحجز مع Naity؟", en: "Why book with Naity?" },
  "benefits.realtime.title": { ar: "توفر لحظي", en: "Real-time Availability" },
  "benefits.realtime.desc": { ar: "بيانات الغرف تُجلب مباشرة من نظام حاجز الخاص بالفندق. ما تراه هو ما تحصل عليه.", en: "Room data is fetched directly from the hotel's Hajiz system. What you see is what you get." },
  "benefits.instant.title": { ar: "تأكيد فوري", en: "Instant Confirmation" },
  "benefits.instant.desc": { ar: "حجزك يُؤكد فوراً عبر واجهة حاجز البرمجية. لا انتظار، لا شك.", en: "Your booking is confirmed instantly through the Hajiz API. No waiting, no doubt." },
  "benefits.secure.title": { ar: "آمن وموثوق", en: "Secure & Trusted" },
  "benefits.secure.desc": { ar: "حجوزات مشفرة من البداية للنهاية مع نظام موثوق تستخدمه فنادق حول العالم.", en: "End-to-end encrypted bookings with a trusted system used by hotels worldwide." },

  // Hotels listing
  "hotels.title": { ar: "تصفح الفنادق", en: "Browse Hotels" },
  "hotels.filter": { ar: "التصفية", en: "Filter" },
  "hotels.city": { ar: "المدينة", en: "City" },
  "hotels.allCities": { ar: "جميع المدن", en: "All Cities" },
  "hotels.minStars": { ar: "الحد الأدنى للنجوم", en: "Minimum Stars" },
  "hotels.all": { ar: "الكل", en: "All" },
  "hotels.stars": { ar: "نجوم", en: "stars" },
  "hotels.maxPrice": { ar: "الحد الأقصى للسعر", en: "Max Price" },
  "hotels.noResults": { ar: "لا توجد فنادق تطابق معايير البحث. حاول تعديل الفلاتر.", en: "No hotels match your search criteria. Try adjusting the filters." },

  // Hotel details
  "hotel.notFound": { ar: "الفندق غير موجود", en: "Hotel not found" },
  "hotel.reviews": { ar: "تقييم", en: "reviews" },
  "hotel.perNight": { ar: "/ليلة", en: "/night" },
  "hotel.about": { ar: "عن هذا الفندق", en: "About this hotel" },
  "hotel.amenities": { ar: "المرافق", en: "Amenities" },
  "hotel.rooms": { ar: "الغرف المتاحة", en: "Available Rooms" },
  "hotel.available": { ar: "متاح", en: "Available" },
  "hotel.soldOut": { ar: "نفذ", en: "Sold Out" },
  "hotel.upTo": { ar: "حتى", en: "Up to" },
  "hotel.guests": { ar: "ضيوف", en: "guests" },
  "hotel.bookNow": { ar: "احجز الآن", en: "Book Now" },

  // Booking
  "booking.title": { ar: "أكمل حجزك", en: "Complete Your Booking" },
  "booking.guestInfo": { ar: "معلومات الضيف", en: "Guest Information" },
  "booking.firstName": { ar: "الاسم الأول", en: "First Name" },
  "booking.lastName": { ar: "اسم العائلة", en: "Last Name" },
  "booking.email": { ar: "البريد الإلكتروني", en: "Email" },
  "booking.phone": { ar: "رقم الهاتف", en: "Phone Number" },
  "booking.checkIn": { ar: "تاريخ الوصول", en: "Check-in Date" },
  "booking.checkOut": { ar: "تاريخ المغادرة", en: "Check-out Date" },
  "booking.specialRequests": { ar: "طلبات خاصة", en: "Special Requests" },
  "booking.specialPlaceholder": { ar: "أي طلبات خاصة...", en: "Any special requests..." },
  "booking.confirm": { ar: "تأكيد الحجز", en: "Confirm Booking" },
  "booking.summary": { ar: "ملخص الحجز", en: "Booking Summary" },
  "booking.roomType": { ar: "نوع الغرفة", en: "Room Type" },
  "booking.pricePerNight": { ar: "السعر/الليلة", en: "Price/Night" },
  "booking.guestsLabel": { ar: "الضيوف", en: "Guests" },
  "booking.upTo": { ar: "حتى", en: "Up to" },
  "booking.noRoom": { ar: "لم يتم اختيار غرفة. يرجى العودة واختيار غرفة.", en: "No room selected. Please go back and select a room." },
  "booking.confirmed": { ar: "تم تأكيد الحجز!", en: "Booking Confirmed!" },
  "booking.confirmedDesc": { ar: "تم إرسال حجزك إلى الفندق عبر نظام حاجز. ستتلقى بريداً إلكترونياً للتأكيد قريباً.", en: "Your booking has been sent to the hotel via the Hajiz system. You will receive a confirmation email shortly." },
  "booking.successToast": { ar: "تم إرسال الحجز بنجاح!", en: "Booking submitted successfully!" },

  // How it works
  "how.title": { ar: "كيف تعمل Naity", en: "How Naity Works" },
  "how.subtitle": { ar: "اتصال سلس بين الفنادق والمسافرين، مدعوم بنظام حاجز لإدارة الفنادق.", en: "Seamless connection between hotels and travelers, powered by the Hajiz hotel management system." },
  "how.step": { ar: "الخطوة", en: "Step" },
  "how.step1.title": { ar: "الفنادق تستخدم حاجز", en: "Hotels use Hajiz" },
  "how.step1.desc": { ar: "تقوم الفنادق بتثبيت نظام حاجز لإدارة الغرف والتوفر والتسعير والعمليات داخلياً.", en: "Hotels install the Hajiz system to manage rooms, availability, pricing, and operations internally." },
  "how.step2.title": { ar: "Naity تتصل عبر API", en: "Naity connects via API" },
  "how.step2.desc": { ar: "تتصل Naity بنظام حاجز لكل فندق من خلال واجهة برمجية آمنة، وتسحب البيانات الحية لحظياً.", en: "Naity connects to each hotel's Hajiz system through a secure API, pulling live data in real-time." },
  "how.step3.title": { ar: "أنت تتصفح وتحجز", en: "You browse & book" },
  "how.step3.desc": { ar: "فقط الفنادق التي تعمل بنظام حاجز تظهر على Naity. تحصل على توفر حقيقي، أسعار حقيقية، وتأكيد فوري.", en: "Only hotels running Hajiz appear on Naity. You get real availability, real prices, and instant confirmation." },
  "how.result": { ar: "النتيجة", en: "The Result" },
  "how.result1": { ar: "لا قوائم قديمة — البيانات تأتي مباشرة من الفنادق", en: "No stale listings — data comes directly from hotels" },
  "how.result2": { ar: "لا حجوزات مزدوجة — التوفر متزامن لحظياً", en: "No double bookings — availability syncs in real-time" },
  "how.result3": { ar: "لا رسوم مخفية — الأسعار يحددها الفندق مباشرة", en: "No hidden fees — prices are set directly by the hotel" },
  "how.result4": { ar: "تأكيد فوري — الحجوزات تذهب مباشرة إلى حاجز", en: "Instant confirmation — bookings go directly to Hajiz" },

  // About
  "about.title": { ar: "عن Naity", en: "About Naity" },
  "about.subtitle": { ar: "تحديث حجز الفنادق من خلال الاتصال المباشر بنظام حاجز لإدارة الفنادق.", en: "Modernizing hotel booking through direct connection to the Hajiz hotel management system." },
  "about.mission": { ar: "مهمتنا", en: "Our Mission" },
  "about.missionDesc": { ar: "سد الفجوة بين الفنادق والمسافرين من خلال توفير تجربة حجز سلسة. عبر منظومة حاجز + Naity، نضمن أن كل حجز دقيق وفوري وموثوق.", en: "Bridging the gap between hotels and travelers through a seamless booking experience. Through the Hajiz + Naity ecosystem, we ensure every booking is accurate, instant, and reliable." },
  "about.vision": { ar: "رؤيتنا", en: "Our Vision" },
  "about.visionDesc": { ar: "عالم يستخدم فيه كل فندق، من البوتيك إلى السلسلة الفاخرة، نظام حاجز للعمليات وNaity للتوزيع — لخلق سوق حجز موثوق وشفاف.", en: "A world where every hotel, from boutique to luxury chain, uses Hajiz for operations and Naity for distribution — creating a reliable and transparent booking marketplace." },
  "about.values": { ar: "قيمنا", en: "Our Values" },
  "about.transparency": { ar: "الشفافية", en: "Transparency" },
  "about.transparencyDesc": { ar: "ما تراه هو ما تحصل عليه. أسعار حقيقية، توفر حقيقي.", en: "What you see is what you get. Real prices, real availability." },
  "about.reliability": { ar: "الموثوقية", en: "Reliability" },
  "about.reliabilityDesc": { ar: "كل حجز يمر عبر حاجز لتأكيد فوري ومضمون.", en: "Every booking goes through Hajiz for instant, guaranteed confirmation." },
  "about.innovation": { ar: "الابتكار", en: "Innovation" },
  "about.innovationDesc": { ar: "تحسين مستمر لتجربة الفندق والضيف من خلال التكنولوجيا.", en: "Continuously improving the hotel and guest experience through technology." },

  // Contact
  "contact.title": { ar: "تواصل معنا", en: "Contact Us" },
  "contact.subtitle": { ar: "لديك أسئلة؟ نحن هنا للمساعدة. تواصل معنا في أي وقت.", en: "Have questions? We're here to help. Reach out anytime." },
  "contact.name": { ar: "الاسم", en: "Name" },
  "contact.namePlaceholder": { ar: "اسمك", en: "Your name" },
  "contact.email": { ar: "البريد الإلكتروني", en: "Email" },
  "contact.subject": { ar: "الموضوع", en: "Subject" },
  "contact.subjectPlaceholder": { ar: "كيف يمكننا مساعدتك؟", en: "How can we help?" },
  "contact.message": { ar: "الرسالة", en: "Message" },
  "contact.messagePlaceholder": { ar: "أخبرنا المزيد...", en: "Tell us more..." },
  "contact.send": { ar: "إرسال الرسالة", en: "Send Message" },
  "contact.emailLabel": { ar: "البريد الإلكتروني", en: "Email" },
  "contact.phoneLabel": { ar: "الهاتف", en: "Phone" },
  "contact.officeLabel": { ar: "المكتب", en: "Office" },
  "contact.office": { ar: "دبي، الإمارات", en: "Dubai, UAE" },
  "contact.hotelCta": { ar: "هل أنت فندق؟", en: "Are you a hotel?" },
  "contact.hotelCtaDesc": { ar: "انضم إلى منظومة حاجز واحصل على إدراج فندقك في Naity. أدر عملياتك واستقطب المزيد من الضيوف.", en: "Join the Hajiz ecosystem and get your hotel listed on Naity. Manage your operations and attract more guests." },
  "contact.learnHajiz": { ar: "تعرّف على حاجز", en: "Learn about Hajiz" },
  "contact.successToast": { ar: "تم إرسال الرسالة! سنرد عليك قريباً.", en: "Message sent! We'll get back to you soon." },

  // Footer
  "footer.desc": { ar: "منصتك الموثوقة لحجز الفنادق. متصلة مباشرة بالفنادق التي تعمل بنظام حاجز.", en: "Your trusted hotel booking platform. Connected directly to hotels powered by Hajiz." },
  "footer.explore": { ar: "استكشف", en: "Explore" },
  "footer.support": { ar: "الدعم", en: "Support" },
  "footer.forHotels": { ar: "للفنادق", en: "For Hotels" },
  "footer.forHotelsDesc": { ar: "استخدم نظام حاجز لإدارة فندقك والظهور على Naity.", en: "Use the Hajiz system to manage your hotel and appear on Naity." },
  "footer.joinHajiz": { ar: "انضم إلى حاجز", en: "Join Hajiz" },
  "footer.copyright": { ar: "جميع الحقوق محفوظة. مدعوم بنظام حاجز.", en: "All rights reserved. Powered by Hajiz." },

  // 404
  "notFound.title": { ar: "الصفحة غير موجودة", en: "Page Not Found" },
  "notFound.desc": { ar: "عذراً! الصفحة غير موجودة", en: "Sorry! The page you're looking for doesn't exist." },
  "notFound.back": { ar: "العودة للرئيسية", en: "Back to Home" },

  // HotelCard
  "card.review": { ar: "تقييم", en: "reviews" },

  // Cities (for display)
  "city.dubai": { ar: "دبي", en: "Dubai" },
  "city.istanbul": { ar: "إسطنبول", en: "Istanbul" },
  "city.riyadh": { ar: "الرياض", en: "Riyadh" },
  "city.marrakech": { ar: "مراكش", en: "Marrakech" },
  "city.casablanca": { ar: "الدار البيضاء", en: "Casablanca" },
  "city.amman": { ar: "عمّان", en: "Amman" },
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
    1: { ar: "منتجع فاخر على الشاطئ مع إطلالات خلابة على الخليج العربي. استمتع بتجربة طعام عالمية وعلاجات سبا وشاطئ خاص.", en: "Luxury beachfront resort with stunning views of the Arabian Gulf. Enjoy world-class dining, spa treatments, and a private beach." },
    2: { ar: "أناقة تاريخية تلتقي بالفخامة العصرية في قلب إسطنبول. يطل على البوسفور مع ضيافة تركية استثنائية.", en: "Historic elegance meets modern luxury in the heart of Istanbul. Overlooking the Bosphorus with exceptional Turkish hospitality." },
    3: { ar: "فندق أعمال عصري في الحي المالي بالرياض. مثالي لرجال الأعمال الباحثين عن الراحة والملاءمة.", en: "Modern business hotel in Riyadh's financial district. Perfect for business travelers seeking comfort and convenience." },
    4: { ar: "ملاذ هادئ محاط بحدائق غنّاء في قلب مراكش. عمارة رياض تقليدية مع وسائل راحة عصرية.", en: "A serene retreat surrounded by lush gardens in the heart of Marrakech. Traditional riad architecture with modern amenities." },
    5: { ar: "فندق ساحلي ساحر مع إطلالات على المحيط وضيافة مغربية دافئة. مثالي للمسافرين بميزانية محدودة.", en: "Charming coastal hotel with ocean views and warm Moroccan hospitality. Perfect for budget-conscious travelers." },
    6: { ar: "فخامة راقية في عمّان مع إطلالات بانورامية على المدينة. مزيج من السحر الأردني والتصميم المعاصر.", en: "Refined luxury in Amman with panoramic city views. A blend of Jordanian charm and contemporary design." },
  };

  const amenitiesMap: Record<string, string> = lang === "en" ? {
    "مسبح": "Pool", "سبا": "Spa", "شاطئ خاص": "Private Beach", "مطعم": "Restaurant",
    "صالة رياضية": "Gym", "واي فاي": "WiFi", "خدمة الغرف": "Room Service",
    "موقف سيارات": "Parking", "بار": "Bar", "كونسيرج": "Concierge",
    "خدمة صف السيارات": "Valet Parking", "مركز أعمال": "Business Center",
    "قاعات اجتماعات": "Meeting Rooms", "حديقة": "Garden", "نقل من المطار": "Airport Transfer",
    "تراس": "Terrace", "غسيل": "Laundry",
  } : {};

  const roomTypes: Record<string, string> = lang === "en" ? {
    "غرفة قياسية": "Standard Room", "جناح ديلوكس": "Deluxe Suite",
    "غرفة عائلية": "Family Room", "الجناح الرئاسي": "Presidential Suite",
  } : {};

  const roomAmenities: Record<string, string> = lang === "en" ? {
    "سرير كينغ": "King Bed", "واي فاي": "WiFi", "تلفزيون": "TV", "ميني بار": "Mini Bar",
    "صالة جلوس": "Living Area", "شرفة": "Balcony", "سريرين كوين": "Two Queen Beds",
    "مساحة إضافية": "Extra Space", "غرفة معيشة": "Living Room", "غرفة طعام": "Dining Room",
    "خدمة كبير الخدم": "Butler Service", "جاكوزي": "Jacuzzi", "إطلالة بانورامية": "Panoramic View",
  } : {};

  const cityMap: Record<string, string> = {
    "دبي": "Dubai", "إسطنبول": "Istanbul", "الرياض": "Riyadh",
    "مراكش": "Marrakech", "الدار البيضاء": "Casablanca", "عمّان": "Amman",
  };

  const localizeHotelName = (id: number, fallback: string) => hotelNames[id]?.[lang] || fallback;
  const localizeHotelDesc = (id: number, fallback: string) => hotelDescriptions[id]?.[lang] || fallback;
  const localizeAmenity = (a: string) => amenitiesMap[a] || a;
  const localizeCity = (c: string) => lang === "en" ? (cityMap[c] || c) : c;
  const localizeRoomType = (r: string) => roomTypes[r] || r;
  const localizeRoomAmenity = (a: string) => roomAmenities[a] || a;

  return { localizeHotelName, localizeHotelDesc, localizeAmenity, localizeCity, localizeRoomType, localizeRoomAmenity };
};
