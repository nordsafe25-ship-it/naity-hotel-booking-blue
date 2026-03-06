import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Activity, Save, Wifi, WifiOff } from "lucide-react";
import { format } from "date-fns";

const AdminSync = () => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();

  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels-sync"],
    queryFn: async () => {
      const { data } = await supabase.from("hotels").select("id, name_ar, name_en");
      return data ?? [];
    },
  });

  const { data: syncSettings } = useQuery({
    queryKey: ["admin-sync-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("local_sync_settings").select("*");
      return data ?? [];
    },
  });

  const { data: webhookLogs } = useQuery({
    queryKey: ["admin-webhook-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("webhook_logs")
        .select("*, hotels(name_ar, name_en)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {lang === "ar" ? "إعدادات المزامنة المحلية" : "Local Sync Settings"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {lang === "ar" 
            ? "قم بتكوين اتصال API بين Naity وتطبيق سطح المكتب المحلي في كل فندق."
            : "Configure the API connection between Naity and the local desktop application at each hotel."}
        </p>

        {/* Sync Settings per Hotel */}
        <div className="grid gap-4">
          {hotels?.map((hotel) => {
            const settings = syncSettings?.find((s) => s.hotel_id === hotel.id);
            return (
              <SyncCard
                key={hotel.id}
                hotel={hotel}
                settings={settings}
                lang={lang}
                onSaved={() => queryClient.invalidateQueries({ queryKey: ["admin-sync-settings"] })}
              />
            );
          })}
          {hotels?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {lang === "ar" ? "لا توجد فنادق لتكوينها" : "No hotels to configure"}
            </p>
          )}
        </div>

        {/* Webhook Logs */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            {lang === "ar" ? "سجل Webhooks" : "Webhook Log"}
          </h2>
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الوقت" : "Time"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الفندق" : "Hotel"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الحدث" : "Event"}</th>
                    <th className="text-start p-3 font-medium text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {webhookLogs?.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="p-3 text-foreground text-xs font-mono">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}</td>
                      <td className="p-3 text-foreground">{lang === "ar" ? (log.hotels as any)?.name_ar : (log.hotels as any)?.name_en}</td>
                      <td className="p-3 text-foreground">{log.event_type}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === "received" ? "bg-green-100 text-green-800" :
                          log.status === "failed" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                        }`}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {webhookLogs?.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {lang === "ar" ? "لا توجد سجلات بعد" : "No webhook logs yet"}
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const SyncCard = ({ hotel, settings, lang, onSaved }: {
  hotel: { id: string; name_ar: string; name_en: string };
  settings: any;
  lang: string;
  onSaved: () => void;
}) => {
  const [endpoint, setEndpoint] = useState(settings?.api_endpoint ?? "");
  const [secretKey, setSecretKey] = useState(settings?.secret_key ?? "");
  const [isActive, setIsActive] = useState(settings?.is_active ?? false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        hotel_id: hotel.id,
        api_endpoint: endpoint,
        secret_key: secretKey,
        is_active: isActive,
      };
      if (settings) {
        const { error } = await supabase.from("local_sync_settings").update(payload).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("local_sync_settings").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      onSaved();
      toast.success(lang === "ar" ? "تم حفظ الإعدادات" : "Settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="bg-card rounded-xl p-5 border border-border/50 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isActive ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <h3 className="font-semibold text-foreground">{lang === "ar" ? hotel.name_ar : hotel.name_en}</h3>
            {settings?.last_sync_at && (
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "آخر مزامنة: " : "Last sync: "}
                {format(new Date(settings.last_sync_at), "yyyy-MM-dd HH:mm")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{lang === "ar" ? "نشط" : "Active"}</span>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">{lang === "ar" ? "نقطة نهاية API" : "API Endpoint"}</Label>
          <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://hotel-system.local/api" className="text-sm" />
        </div>
        <div>
          <Label className="text-xs">{lang === "ar" ? "المفتاح السري" : "Secret Key"}</Label>
          <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="sk_..." className="text-sm" />
        </div>
      </div>
      <Button size="sm" className="gradient-cta gap-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        <Save className="w-4 h-4" /> {saveMutation.isPending ? "..." : (lang === "ar" ? "حفظ" : "Save")}
      </Button>
    </div>
  );
};

export default AdminSync;
