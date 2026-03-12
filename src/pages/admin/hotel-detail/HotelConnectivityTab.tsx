import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Copy, RefreshCw, Wifi, WifiOff, Clock, ArrowDownUp, Check, X } from "lucide-react";

const HotelConnectivityTab = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const tx = (ar: string, en: string) => lang === "ar" ? ar : en;

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const apiBaseUrl = `${SUPABASE_URL}/functions/v1`;

  const { data: syncSettings, isLoading } = useQuery({
    queryKey: ["hotel-sync-settings", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("local_sync_settings")
        .select("*")
        .eq("hotel_id", hotelId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: syncHistory } = useQuery({
    queryKey: ["hotel-sync-history", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_history")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const createSettingsMutation = useMutation({
    mutationFn: async () => {
      const key = crypto.randomUUID();
      const { error } = await supabase.from("local_sync_settings").insert({
        hotel_id: hotelId,
        secret_key: key,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-sync-settings", hotelId] });
      toast.success(tx("تم إنشاء مفتاح API", "API key created"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (active: boolean) => {
      const { error } = await supabase
        .from("local_sync_settings")
        .update({ is_active: active })
        .eq("hotel_id", hotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-sync-settings", hotelId] });
      toast.success(tx("تم التحديث", "Updated"));
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: async () => {
      const key = crypto.randomUUID();
      const { error } = await supabase
        .from("local_sync_settings")
        .update({ secret_key: key })
        .eq("hotel_id", hotelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-sync-settings", hotelId] });
      toast.success(tx("تم تجديد المفتاح", "API key regenerated"));
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${tx("تم النسخ", "copied")}`);
  };

  // Live status calculation
  const isLive = syncSettings?.last_sync_at
    ? (Date.now() - new Date(syncSettings.last_sync_at).getTime()) < 10 * 60 * 1000
    : false;

  const lastSyncFormatted = syncSettings?.last_sync_at
    ? new Date(syncSettings.last_sync_at).toLocaleString(lang === "ar" ? "ar-SY" : "en-GB")
    : tx("لم تتم المزامنة بعد", "Never synced");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!syncSettings) {
    return (
      <div className="bg-card rounded-xl p-8 border border-border/50 shadow-card text-center space-y-4">
        <WifiOff className="w-12 h-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-semibold text-foreground">
          {tx("لم يتم إعداد الاتصال", "Connectivity Not Configured")}
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {tx(
            "قم بتفعيل اتصال API للسماح لنظام شام سوفت بمزامنة البيانات تلقائياً.",
            "Enable API connectivity to allow Sham Soft to sync data automatically."
          )}
        </p>
        <Button onClick={() => createSettingsMutation.mutate()} className="gradient-cta">
          {tx("تفعيل اتصال API", "Enable API Connectivity")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Live Status */}
      <div className={`rounded-xl p-5 border shadow-card flex items-center gap-4 ${isLive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-destructive/5 border-destructive/20"}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isLive ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
          {isLive ? <Wifi className="w-6 h-6 text-emerald-500" /> : <WifiOff className="w-6 h-6 text-destructive" />}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            {isLive ? tx("متصل — يعمل", "Connected — Online") : tx("غير متصل", "Disconnected — Offline")}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {tx("آخر مزامنة:", "Last sync:")} {lastSyncFormatted}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{tx("مفعّل", "Active")}</Label>
          <Switch
            checked={syncSettings.is_active ?? false}
            onCheckedChange={(v) => toggleActiveMutation.mutate(v)}
          />
        </div>
      </div>

      {/* API Credentials */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-5">
        <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
          <ArrowDownUp className="w-5 h-5 text-primary" />
          {tx("بيانات اتصال API — شام سوفت", "API Credentials — Sham Soft")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tx(
            "انسخ هذه البيانات والصقها في إعدادات برنامج شام سوفت على سطح المكتب.",
            "Copy these credentials and paste them into the Sham Soft desktop settings."
          )}
        </p>

        {/* Inventory Sync URL */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{tx("رابط مزامنة المخزون", "Inventory Sync URL")}</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={`${apiBaseUrl}/hotel-sync`} className="font-mono text-xs bg-muted" />
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(`${apiBaseUrl}/hotel-sync`, "URL")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Reservations URL */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{tx("رابط جلب الحجوزات", "Fetch Reservations URL")}</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={`${apiBaseUrl}/hotel-reservations`} className="font-mono text-xs bg-muted" />
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(`${apiBaseUrl}/hotel-reservations`, "URL")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sync Confirm URL */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{tx("رابط تأكيد المزامنة", "Sync Confirmation URL")}</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={`${apiBaseUrl}/hotel-sync-confirm`} className="font-mono text-xs bg-muted" />
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(`${apiBaseUrl}/hotel-sync-confirm`, "URL")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{tx("مفتاح API السري", "Secret API Key")}</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={syncSettings.secret_key ?? ""} className="font-mono text-xs bg-muted" type="password" />
            <Button size="icon" variant="outline" onClick={() => copyToClipboard(syncSettings.secret_key ?? "", "API Key")}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => regenerateKeyMutation.mutate()} title={tx("إعادة توليد", "Regenerate")}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {tx(
              "أرسل هذا المفتاح في الهيدر: X-Hotel-API-Key أو Authorization: Bearer ...",
              "Send this key in header: X-Hotel-API-Key or Authorization: Bearer ..."
            )}
          </p>
        </div>
      </div>

      {/* Sync History */}
      <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
        <h2 className="font-semibold text-foreground text-lg">
          {tx("سجل المزامنة الأخير", "Recent Sync History")}
        </h2>
        {(!syncHistory || syncHistory.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {tx("لا يوجد سجل مزامنة بعد", "No sync history yet")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 text-start font-medium">{tx("الحدث", "Event")}</th>
                  <th className="py-2 text-start font-medium">{tx("الاتجاه", "Direction")}</th>
                  <th className="py-2 text-start font-medium">{tx("السجلات", "Records")}</th>
                  <th className="py-2 text-start font-medium">{tx("الحالة", "Status")}</th>
                  <th className="py-2 text-start font-medium">{tx("الوقت", "Time")}</th>
                </tr>
              </thead>
              <tbody>
                {syncHistory.map((entry: any) => (
                  <tr key={entry.id} className="border-b border-border/30">
                    <td className="py-2 font-mono text-xs">{entry.event_type}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${entry.direction === "inbound" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600"}`}>
                        {entry.direction === "inbound" ? tx("وارد", "IN") : tx("صادر", "OUT")}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{entry.records_count}</td>
                    <td className="py-2">
                      {entry.status === "success" ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 text-destructive" />
                      )}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString(lang === "ar" ? "ar-SY" : "en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelConnectivityTab;
