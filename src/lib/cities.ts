/**
 * Main Syrian cities supported on the Naity platform.
 * To add more cities, simply append to this array — all search,
 * admin forms, and validation will automatically pick them up.
 */
export const SYRIAN_MAIN_CITIES = [
  { en: "Damascus",  ar: "دمشق" },
  { en: "Aleppo",    ar: "حلب" },
  { en: "Homs",      ar: "حمص" },
  { en: "Hama",      ar: "حماة" },
  { en: "Latakia",   ar: "اللاذقية" },
  { en: "Tartus",    ar: "طرطوس" },
] as const;

export const ALLOWED_CITY_NAMES = SYRIAN_MAIN_CITIES.map(c => c.en);
