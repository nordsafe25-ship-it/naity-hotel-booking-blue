import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff } from "lucide-react";

interface HeartbeatIndicatorProps {
  hotelId: string;
}

const HeartbeatIndicator = ({ hotelId }: HeartbeatIndicatorProps) => {
  const { lang } = useI18n();

  const { data: syncSettings } = useQuery({
    queryKey: ["heartbeat", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("local_sync_settings").select("is_active, last_heartbeat_at").eq("hotel_id", hotelId).maybeSingle();
      return data;
    },
    refetchInterval: 30_000, // Poll every 30s
  });

  const isOnline = syncSettings?.is_active &&
    syncSettings?.last_heartbeat_at &&
    (Date.now() - new Date(syncSettings.last_heartbeat_at).getTime()) < 5 * 60 * 1000;

  const label = isOnline
    ? (lang === "ar" ? "متصل" : "Online")
    : (lang === "ar" ? "غير متصل" : "Offline");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center">
          {isOnline ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>
          ) : (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground/30" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default HeartbeatIndicator;
