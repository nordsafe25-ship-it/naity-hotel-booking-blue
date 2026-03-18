import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Plus, Copy, Eye, EyeOff, RefreshCw, Trash2, Edit, Plug, Loader2,
  Hotel, Link2, Unlink, PackageOpen, FileText, Wifi, WifiOff, Zap
} from "lucide-react";

interface ApiCompany {
  id: string;
  name: string;
  name_ar: string | null;
  base_url: string;
  api_key: string;
  api_token: string | null;
  auth_type: string;
  username: string | null;
  password: string | null;
  get_rooms_path: string | null;
  post_booking_path: string | null;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  last_sync_at: string | null;
  created_at: string;
  hotels_count?: number;
}

interface LinkedHotel {
  id: string;
  name_en: string;
  name_ar: string;
  city: string;
  external_hotel_id: number | null;
}

interface SyncLog {
  id: string;
  company_id: string;
  hotel_id: string | null;
  event_type: string;
  direction: string | null;
  status: string;
  request_url: string | null;
  response: Record<string, unknown> | null;
  error_msg: string | null;
  created_at: string;
  api_companies: { name: string } | null;
}

function generateApiKey(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "company";
  const hex = Math.random().toString(16).slice(2, 8);
  return `sk_${slug}_${hex}`;
}

function maskKey(key: string) {
  if (!key || key.length < 10) return "sk_****_****";
  return key.slice(0, 3) + "_****_" + key.slice(-4);
}

function timeAgo(dateStr: string, isAr: boolean) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isAr ? "الآن" : "Just now";
  if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return isAr ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return isAr ? `منذ ${days} يوم` : `${days}d ago`;
}

const AUTH_TYPES = [
  { value: "none", label_en: "None", label_ar: "بدون" },
  { value: "api_key", label_en: "API Key", label_ar: "مفتاح API" },
  { value: "token", label_en: "Bearer Token", label_ar: "Bearer Token" },
  { value: "basic", label_en: "Basic Auth", label_ar: "Basic Auth" },
];

const defaultForm = {
  name: "", name_ar: "", base_url: "", api_key: "",
  api_token: "", auth_type: "none", username: "", password: "",
  get_rooms_path: "", post_booking_path: "",
  contact_email: "", contact_phone: "", notes: "", status: "active",
};

export default function AdminApiCompanies() {
  const { lang, t } = useI18n();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Add/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ApiCompany | null>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<ApiCompany | null>(null);

  // Hotels dialog
  const [hotelsDialogOpen, setHotelsDialogOpen] = useState(false);
  const [hotelsCompany, setHotelsCompany] = useState<ApiCompany | null>(null);
  const [linkedHotels, setLinkedHotels] = useState<LinkedHotel[]>([]);
  const [unlinkedHotels, setUnlinkedHotels] = useState<LinkedHotel[]>([]);
  const [linkHotelId, setLinkHotelId] = useState("");
  const [linkExternalId, setLinkExternalId] = useState("");
  const [hotelsLoading, setHotelsLoading] = useState(false);

  // Logs drawer
  const [logsDrawerOpen, setLogsDrawerOpen] = useState(false);
  const [logsCompany, setLogsCompany] = useState<ApiCompany | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(false);
  const [payloadDialogLog, setPayloadDialogLog] = useState<SyncLog | null>(null);

  // Testing/syncing states
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data: comps } = await supabase
      .from("api_companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (!comps) { setLoading(false); return; }

    const { data: hotels } = await supabase
      .from("hotels")
      .select("id, company_id");

    const enriched = comps.map((c: any) => ({
      ...c,
      hotels_count: (hotels || []).filter((h: any) => h.company_id === c.id).length,
    }));

    setCompanies(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const fetchLogsForCompany = async (companyId: string) => {
    setSyncLogsLoading(true);
    const { data } = await supabase
      .from("api_sync_logs")
      .select("*, api_companies(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(50);
    setSyncLogs((data as unknown as SyncLog[]) || []);
    setSyncLogsLoading(false);
  };

  const fetchHotelsForCompany = async (companyId: string) => {
    setHotelsLoading(true);
    const [linkedRes, unlinkedRes] = await Promise.all([
      supabase.from("hotels").select("id, name_en, name_ar, city, external_hotel_id").eq("company_id", companyId),
      supabase.from("hotels").select("id, name_en, name_ar, city, external_hotel_id").is("company_id", null),
    ]);
    setLinkedHotels((linkedRes.data || []) as LinkedHotel[]);
    setUnlinkedHotels((unlinkedRes.data || []) as LinkedHotel[]);
    setHotelsLoading(false);
  };

  // ── Dialog helpers ──────────────────────────────
  const openCreateDialog = () => {
    setEditingCompany(null);
    setForm({ ...defaultForm, api_key: generateApiKey("new") });
    setDialogOpen(true);
  };

  const openEditDialog = (c: ApiCompany) => {
    setEditingCompany(c);
    setForm({
      name: c.name, name_ar: c.name_ar ?? "", base_url: c.base_url ?? "",
      api_key: c.api_key ?? "", api_token: c.api_token ?? "",
      auth_type: c.auth_type ?? "none", username: c.username ?? "",
      password: c.password ?? "", get_rooms_path: c.get_rooms_path ?? "",
      post_booking_path: c.post_booking_path ?? "",
      contact_email: c.contact_email ?? "", contact_phone: c.contact_phone ?? "",
      notes: c.notes ?? "", status: c.status ?? "active",
    });
    setDialogOpen(true);
  };

  const openHotelsDialog = (c: ApiCompany) => {
    setHotelsCompany(c);
    setHotelsDialogOpen(true);
    setLinkHotelId("");
    setLinkExternalId("");
    fetchHotelsForCompany(c.id);
  };

  const openLogsDrawer = (c: ApiCompany) => {
    setLogsCompany(c);
    setLogsDrawerOpen(true);
    fetchLogsForCompany(c.id);
  };

  // ── CRUD ──────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.base_url.trim()) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      name: form.name, name_ar: form.name_ar || null,
      base_url: form.base_url, api_key: form.api_key || generateApiKey(form.name),
      api_token: form.api_token || null, auth_type: form.auth_type,
      username: form.username || null, password: form.password || null,
      get_rooms_path: form.get_rooms_path || "", post_booking_path: form.post_booking_path || "",
      contact_email: form.contact_email || null, contact_phone: form.contact_phone || null,
      notes: form.notes || null, status: form.status,
    };

    if (editingCompany) {
      await supabase.from("api_companies").update(payload as any).eq("id", editingCompany.id);
      toast({ title: isAr ? "تم تحديث الشركة" : "Company updated" });
    } else {
      await supabase.from("api_companies").insert(payload as any);
      toast({ title: isAr ? "تم إضافة الشركة" : "Company added" });
      supabase.functions.invoke("send-admin-notification", {
        body: {
          type: "new_company",
          data: {
            name: form.name,
            base_url: form.base_url,
            auth_type: form.auth_type,
          },
        },
      }).catch((e) => console.error("Company notification failed:", e));
    }

    setSaving(false);
    setDialogOpen(false);
    fetchCompanies();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("api_companies").delete().eq("id", deleteTarget.id);
    toast({ title: isAr ? "تم حذف الشركة" : "Company deleted" });
    setDeleteTarget(null);
    fetchCompanies();
  };

  // ── Actions ──────────────────────────────
  const testConnection = async (c: ApiCompany) => {
    setTestingId(c.id);
    try {
      const { data, error } = await supabase.functions.invoke("api-company-sync", {
        body: { action: "test_connection", company_id: c.id },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: isAr ? "✅ الاتصال ناجح" : "✅ Connection successful" });
      } else {
        toast({ title: isAr ? "❌ فشل الاتصال" : "❌ Connection failed", description: data?.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: isAr ? "❌ خطأ" : "❌ Error", description: e.message, variant: "destructive" });
    }
    setTestingId(null);
  };

  const syncAllHotels = async (c: ApiCompany) => {
    setSyncingId(c.id);
    try {
      const { data: hotels } = await supabase
        .from("hotels")
        .select("id")
        .eq("company_id", c.id);

      if (!hotels?.length) {
        toast({ title: isAr ? "لا توجد فنادق مرتبطة" : "No linked hotels", variant: "destructive" });
        setSyncingId(null);
        return;
      }

      let success = 0;
      for (const hotel of hotels) {
        const { data } = await supabase.functions.invoke("api-company-sync", {
          body: { action: "sync_rooms", company_id: c.id, hotel_id: hotel.id },
        });
        if (data?.success) success++;
      }

      toast({
        title: isAr
          ? `✅ تمت مزامنة ${success}/${hotels.length} فندق`
          : `✅ Synced ${success}/${hotels.length} hotels`,
      });
      fetchCompanies();
    } catch (e: any) {
      toast({ title: isAr ? "❌ خطأ" : "❌ Error", description: e.message, variant: "destructive" });
    }
    setSyncingId(null);
  };

  const linkHotel = async () => {
    if (!linkHotelId || !linkExternalId || !hotelsCompany) return;
    await supabase
      .from("hotels")
      .update({ company_id: hotelsCompany.id, external_hotel_id: parseInt(linkExternalId) } as any)
      .eq("id", linkHotelId);
    toast({ title: isAr ? "تم ربط الفندق" : "Hotel linked" });
    setLinkHotelId("");
    setLinkExternalId("");
    fetchHotelsForCompany(hotelsCompany.id);
    fetchCompanies();
  };

  const unlinkHotel = async (hotelId: string) => {
    if (!hotelsCompany) return;
    await supabase
      .from("hotels")
      .update({ company_id: null, external_hotel_id: null } as any)
      .eq("id", hotelId);
    toast({ title: isAr ? "تم إلغاء الربط" : "Hotel unlinked" });
    fetchHotelsForCompany(hotelsCompany.id);
    fetchCompanies();
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: isAr ? "تم النسخ" : "Copied!" });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Plug className="w-6 h-6 text-primary" />
              {isAr ? "شركات الـ API" : "API Companies"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "إدارة شركات الفنادق المتصلة عبر API" : "Manage hotel software companies connected via API"}
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 me-2" />
            {isAr ? "إضافة شركة" : "Add Company"}
          </Button>
        </div>

        {/* Companies Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <PackageOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">{isAr ? "لا توجد شركات بعد" : "No companies yet"}</p>
            <Button onClick={openCreateDialog} variant="outline">
              <Plus className="w-4 h-4 me-2" />
              {isAr ? "إضافة شركة" : "Add Company"}
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الاسم" : "Company"}</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead>{isAr ? "آخر مزامنة" : "Last Sync"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      {c.name_ar && <span className="text-xs text-muted-foreground">{c.name_ar}</span>}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {c.hotels_count ?? 0} {isAr ? "فندق" : "hotels"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs break-all" dir="ltr">{c.base_url?.slice(0, 40)}{(c.base_url?.length ?? 0) > 40 ? "..." : ""}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {AUTH_TYPES.find(a => a.value === c.auth_type)?.[isAr ? "label_ar" : "label_en"] ?? c.auth_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.last_sync_at ? timeAgo(c.last_sync_at, isAr) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "destructive"}>
                        {c.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} title={isAr ? "تعديل" : "Edit"}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => testConnection(c)}
                          disabled={testingId === c.id}
                          title={isAr ? "اختبار الاتصال" : "Test Connection"}
                        >
                          {testingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => syncAllHotels(c)}
                          disabled={syncingId === c.id}
                          title={isAr ? "مزامنة الكل" : "Sync All Hotels"}
                        >
                          {syncingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openHotelsDialog(c)} title={isAr ? "الفنادق" : "Hotels"}>
                          <Hotel className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openLogsDrawer(c)} title={isAr ? "السجلات" : "Logs"}>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ── Add/Edit Dialog ──────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? (isAr ? "تعديل الشركة" : "Edit Company") : (isAr ? "إضافة شركة" : "Add Company")}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "أدخل بيانات شركة البرمجيات الفندقية" : "Enter hotel software company details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name (English) *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Base URL *</Label>
              <Input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} dir="ltr" placeholder="https://example.com/api" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>GET Rooms Path</Label>
                <Input value={form.get_rooms_path} onChange={e => setForm(f => ({ ...f, get_rooms_path: e.target.value }))} dir="ltr" placeholder="/rooms" />
              </div>
              <div>
                <Label>POST Booking Path</Label>
                <Input value={form.post_booking_path} onChange={e => setForm(f => ({ ...f, post_booking_path: e.target.value }))} dir="ltr" placeholder="/booking" />
              </div>
            </div>

            {/* Auth Type */}
            <div>
              <Label>{isAr ? "نوع المصادقة" : "Auth Type"}</Label>
              <div className="flex items-center gap-3 mt-1">
                {AUTH_TYPES.map(at => (
                  <label key={at.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio" name="auth_type"
                      checked={form.auth_type === at.value}
                      onChange={() => setForm(f => ({ ...f, auth_type: at.value }))}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-sm">{isAr ? at.label_ar : at.label_en}</span>
                  </label>
                ))}
              </div>
            </div>

            {form.auth_type === "api_key" && (
              <div>
                <Label>API Key</Label>
                <Input value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} dir="ltr" />
              </div>
            )}
            {form.auth_type === "token" && (
              <div>
                <Label>Bearer Token</Label>
                <Input value={form.api_token} onChange={e => setForm(f => ({ ...f, api_token: e.target.value }))} dir="ltr" />
              </div>
            )}
            {form.auth_type === "basic" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Username</Label>
                  <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} dir="ltr" />
                </div>
              </div>
            )}

            {/* Always show internal API key for hotel-company-api endpoint */}
            {form.auth_type === "none" && (
              <div>
                <Label>{isAr ? "مفتاح API الداخلي" : "Internal API Key"}</Label>
                <div className="flex gap-2">
                  <Input value={form.api_key} readOnly dir="ltr" className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => setForm(f => ({ ...f, api_key: generateApiKey(f.name || "new") }))}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyText(form.api_key)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isAr ? "يُستخدم من قبل الشركة للإرسال إلى Naity" : "Used by the company to push data to Naity"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isAr ? "بريد التواصل" : "Contact Email"}</Label>
                <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "هاتف التواصل" : "Contact Phone"}</Label>
                <Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>

            <div className="flex items-center gap-3">
              <Label>{isAr ? "الحالة" : "Status"}</Label>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={v => setForm(f => ({ ...f, status: v ? "active" : "inactive" }))}
              />
              <span className="text-sm text-muted-foreground">
                {form.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.base_url.trim()}>
              {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {editingCompany ? (isAr ? "حفظ" : "Save") : (isAr ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Logs Drawer ──────────────────────────── */}
      <Sheet open={logsDrawerOpen} onOpenChange={setLogsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {logsCompany?.name} — {isAr ? "السجلات" : "Logs"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Button variant="outline" size="sm" onClick={() => logsCompany && fetchLogsForCompany(logsCompany.id)}>
              <RefreshCw className="w-3.5 h-3.5 me-1" />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
            {syncLogsLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : syncLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">{isAr ? "لا توجد سجلات" : "No logs yet"}</p>
            ) : (
              <div className="space-y-2">
                {syncLogs.map(log => (
                  <div key={log.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={log.status === "success" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {log.status === "success" ? "✅" : "❌"} {log.event_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{timeAgo(log.created_at, isAr)}</span>
                    </div>
                    {log.request_url && (
                      <code className="text-[10px] text-muted-foreground break-all block" dir="ltr">{log.request_url}</code>
                    )}
                    {log.error_msg && (
                      <p className="text-xs text-destructive">{log.error_msg}</p>
                    )}
                    {log.response && (
                      <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setPayloadDialogLog(log)}>
                        <Eye className="w-3 h-3 me-1" /> {isAr ? "عرض الرد" : "View Response"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Hotels Dialog ──────────────────────────── */}
      <Dialog open={hotelsDialogOpen} onOpenChange={setHotelsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {hotelsCompany?.name} — {isAr ? "الفنادق المرتبطة" : "Linked Hotels"}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "إدارة الفنادق المرتبطة بهذه الشركة" : "Manage hotels linked to this company"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="linked" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="linked" className="flex-1">{isAr ? "المرتبطة" : "Linked"}</TabsTrigger>
              <TabsTrigger value="link" className="flex-1">{isAr ? "ربط فندق" : "Link Hotel"}</TabsTrigger>
            </TabsList>

            <TabsContent value="linked" className="space-y-2 mt-4">
              {hotelsLoading ? (
                <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : linkedHotels.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">{isAr ? "لا توجد فنادق مرتبطة" : "No linked hotels"}</p>
              ) : (
                linkedHotels.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{isAr ? h.name_ar : h.name_en}</p>
                      <p className="text-xs text-muted-foreground">{h.city} • ID: {h.external_hotel_id ?? "—"}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => unlinkHotel(h.id)} className="text-destructive hover:text-destructive">
                      <Unlink className="w-3.5 h-3.5 me-1" />
                      {isAr ? "إلغاء" : "Unlink"}
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-4">
              <div>
                <Label>{isAr ? "اختر فندقاً" : "Select Hotel"}</Label>
                <Select value={linkHotelId} onValueChange={setLinkHotelId}>
                  <SelectTrigger><SelectValue placeholder={isAr ? "اختر..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    {unlinkedHotels.map(h => (
                      <SelectItem key={h.id} value={h.id}>
                        {isAr ? h.name_ar : h.name_en} — {h.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isAr ? "رقم الفندق في نظام الشركة" : "External Hotel ID"}</Label>
                <Input
                  type="number" value={linkExternalId}
                  onChange={e => setLinkExternalId(e.target.value)}
                  placeholder={isAr ? "مثال: 1" : "e.g. 1"} dir="ltr"
                />
              </div>
              <Button onClick={linkHotel} disabled={!linkHotelId || !linkExternalId} className="w-full">
                <Link2 className="w-4 h-4 me-2" />
                {isAr ? "ربط الفندق" : "Link Hotel"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف الشركة" : "Delete Company"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${deleteTarget?.name}"؟`
                : `Are you sure you want to delete "${deleteTarget?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Payload Viewer ──────────────────────────── */}
      <AlertDialog open={!!payloadDialogLog} onOpenChange={open => !open && setPayloadDialogLog(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "بيانات الرد" : "Response Data"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto border border-border mt-2 whitespace-pre-wrap" dir="ltr">
                {payloadDialogLog ? JSON.stringify(payloadDialogLog.response, null, 2) : ""}
              </pre>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إغلاق" : "Close"}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
