import { STRUCTURED_AMENITIES } from "@/lib/amenities";
import { useI18n } from "@/lib/i18n";
import { Check } from "lucide-react";

interface AmenityBadgesProps {
  hotel: Record<string, any>;
  compact?: boolean;
}

const AmenityBadges = ({ hotel, compact = false }: AmenityBadgesProps) => {
  const { lang } = useI18n();
  const active = STRUCTURED_AMENITIES.filter(a => hotel[a.key]);

  if (active.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {active.map(a => (
          <span
            key={a.key}
            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
            title={lang === "ar" ? a.label_ar : a.label_en}
          >
            <a.icon className="w-3 h-3" />
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {STRUCTURED_AMENITIES.map(a => {
        const available = !!hotel[a.key];
        return (
          <div
            key={a.key}
            className={`flex items-center gap-2.5 p-3 rounded-xl border transition ${
              available
                ? "bg-primary/5 border-primary/20 text-foreground"
                : "bg-muted/50 border-border/30 text-muted-foreground/50"
            }`}
          >
            <a.icon className={`w-5 h-5 shrink-0 ${available ? "text-primary" : "text-muted-foreground/30"}`} />
            <span className="text-sm font-medium">{lang === "ar" ? a.label_ar : a.label_en}</span>
            {available && <Check className="w-3.5 h-3.5 text-primary ms-auto" />}
          </div>
        );
      })}
    </div>
  );
};

export default AmenityBadges;
