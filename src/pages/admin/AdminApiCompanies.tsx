import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Plus, Copy, Eye, EyeOff, RefreshCw, Trash2, Edit, Plug, Loader2,
  Hotel, Link2, Unlink, PackageOpen, FileText
} from "lucide-react";

interface ApiCompany {
  id: string;
  name: string;
  api_key: string;
  status: string;
  contact_email: string | null;
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
  payload: Record<string, unknown> | null;
  status: string;
  created_at: string;
  api_companies: { name: string } | null;
}

function generateApiKey(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "company";
  const hex = Math.random().toString(16).slice(2, 8);
  return `sk_${slug}_${hex}`;
}

function maskKey(key: string) {
  if (key.length < 10) return "sk_****_****";
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
  const [form, setForm] = useState({ name: "", contact_email: "", notes: "", api_key: "" });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ApiCompany | null>(null);

  // Hotels dialog
  const [hotelsDialogOpen, setHotelsDialogOpen] = useState(false);
  const [hotelsCompany, setHotelsCompany] = useState<ApiCompany | null>(null);
  const [linkedHotels, setLinkedHotels] = useState<LinkedHotel[]>([]);
  const [unlinkedHotels, setUnlinkedHotels] = useState<LinkedHotel[]>([]);
  const [linkHotelId, setLinkHotelId] = useState("");
  const [linkExternalId, setLinkExternalId] = useState("");
  const [hotelsLoading, setHotelsLoading] = useState(false);

  // Sync logs
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncLogsLoading, setSyncLogsLoading] = useState(true);
  const [payloadDialogLog, setPayloadDialogLog] = useState<SyncLog | null>(null);

  // Docs key selector
  const [docsCompanyId, setDocsCompanyId] = useState<string>("");

  const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hotel-company-api`;

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

    const enriched = comps.map((c) => ({
      ...c,
      hotels_count: (hotels || []).filter((h) => h.company_id === c.id).length,
    }));

    setCompanies(enriched);
    setLoading(false);
  };

  const fetchSyncLogs = useCallback(async () => {
    setSyncLogsLoading(true);
    const { data } = await supabase
      .from("api_sync_logs")
      .select("*, api_companies(name)")
      .order("created_at", { ascending: false })
      .limit(20);
    setSyncLogs((data as unknown as SyncLog[]) || []);
    setSyncLogsLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchSyncLogs();
  }, [fetchSyncLogs]);

  // Auto-refresh sync logs every 30s
  useEffect(() => {
    const interval = setInterval(fetchSyncLogs, 30000);
    return () => clearInterval(interval);
  }, [fetchSyncLogs]);

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

  const openCreateDialog = () => {
    setEditingCompany(null);
    const key = generateApiKey("new");
    setForm({ name: "", contact_email: "", notes: "", api_key: key });
    setDialogOpen(true);
  };

  const openEditDialog = (c: ApiCompany) => {
    setEditingCompany(c);
    setForm({ name: c.name, contact_email: c.contact_email || "", notes: c.notes || "", api_key: c.api_key });
    setDialogOpen(true);
  };

  const openHotelsDialog = (c: ApiCompany) => {
    setHotelsCompany(c);
    setHotelsDialogOpen(true);
    setLinkHotelId("");
    setLinkExternalId("");
    fetchHotelsForCompany(c.id);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    const apiKey = form.api_key || generateApiKey(form.name);

    if (editingCompany) {
      await supabase
        .from("api_companies")
        .update({ name: form.name, contact_email: form.contact_email || null, notes: form.notes || null, api_key: apiKey })
        .eq("id", editingCompany.id);
      toast({ title: isAr ? "تم تحديث الشركة" : "Company updated" });
    } else {
      await supabase
        .from("api_companies")
        .insert({ name: form.name, contact_email: form.contact_email || null, notes: form.notes || null, api_key: apiKey });
      toast({ title: t("api.addedToast") });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchCompanies();
  };

  const toggleStatus = async (c: ApiCompany) => {
    const newStatus = c.status === "active" ? "inactive" : "active";
    await supabase.from("api_companies").update({ status: newStatus }).eq("id", c.id);
    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    fetchCompanies();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("api_companies").delete().eq("id", deleteTarget.id);
    toast({ title: isAr ? "تم حذف الشركة" : "Company deleted" });
    setDeleteTarget(null);
    fetchCompanies();
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("api.copiedToast") });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const regenerateKey = () => {
    setForm(f => ({ ...f, api_key: generateApiKey(f.name || "new") }));
    toast({ title: t("api.regenerate") + " ✓" });
  };

  const linkHotel = async () => {
    if (!linkHotelId || !linkExternalId || !hotelsCompany) return;
    await supabase
      .from("hotels")
      .update({ company_id: hotelsCompany.id, external_hotel_id: parseInt(linkExternalId) })
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
      .update({ company_id: null, external_hotel_id: null })
      .eq("id", hotelId);
    toast({ title: t("api.unlinkHotel") + " ✓" });
    fetchHotelsForCompany(hotelsCompany.id);
    fetchCompanies();
  };

  const handleNameChange = (name: string) => {
    setForm(f => {
      const newForm = { ...f, name };
      if (!editingCompany) {
        newForm.api_key = generateApiKey(name);
      }
      return newForm;
    });
  };

  const selectedDocsKey = companies.find(c => c.id === docsCompanyId)?.api_key || "sk_yourcompany_xxxxxx";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Plug className="w-6 h-6 text-primary" />
              {t("api.companies")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "إدارة شركات الفنادق المتصلة عبر API" : "Manage hotel companies connected via API"}
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 me-2" />
            {t("api.addCompany")}
          </Button>
        </div>

        {/* API Endpoint Card */}
        <div className="bg-muted rounded-lg p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">{t("api.endpoint")}</p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-background px-3 py-1.5 rounded border border-border flex-1 overflow-x-auto" dir="ltr">
              {apiEndpoint}
            </code>
            <Button variant="outline" size="sm" onClick={() => copyText(apiEndpoint)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
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
              {t("api.addCompany")}
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "اسم الشركة" : "Company"}</TableHead>
                  <TableHead>{t("api.apiKey")}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "الفنادق" : "Hotels"}</TableHead>
                  <TableHead>{t("api.lastSync")}</TableHead>
                  <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.name}
                      {c.contact_email && <span className="block text-xs text-muted-foreground">{c.contact_email}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs" dir="ltr">
                          {visibleKeys.has(c.id) ? c.api_key : maskKey(c.api_key)}
                        </code>
                        <button onClick={() => toggleKeyVisibility(c.id)} className="p-1 rounded hover:bg-muted">
                          {visibleKeys.has(c.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyText(c.api_key)} className="p-1 rounded hover:bg-muted">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "destructive"}>
                        {c.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "معطل" : "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.hotels_count ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.last_sync_at ? timeAgo(c.last_sync_at, isAr) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} title={isAr ? "تعديل" : "Edit"}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openHotelsDialog(c)} title={t("api.linkedHotels")}>
                          <Hotel className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(c)}>
                          {c.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

        {/* Sync Logs Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {isAr ? "سجلات المزامنة الأخيرة" : "Recent Sync Logs"}
            </h3>
            <Button variant="outline" size="sm" onClick={fetchSyncLogs}>
              <RefreshCw className="w-3.5 h-3.5 me-1" />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
          </div>

          {syncLogsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : syncLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              {isAr ? "لا توجد سجلات بعد" : "No sync logs yet"}
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isAr ? "الوقت" : "Time"}</TableHead>
                    <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                    <TableHead>{isAr ? "النوع" : "Event"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "البيانات" : "Payload"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(log.created_at, isAr)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.api_companies?.name || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{log.event_type}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "success" ? "default" : "destructive"}>
                          {log.status === "success" ? (isAr ? "نجاح" : "Success") : (isAr ? "فشل" : "Failed")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setPayloadDialogLog(log)}>
                          <Eye className="w-3.5 h-3.5 me-1" />
                          {isAr ? "عرض" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* API Documentation Card */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Plug className="w-4 h-4 text-primary" />
            {t("api.howToConnect")}
          </h3>
          {companies.length > 0 && (
            <div className="max-w-xs">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {isAr ? "اختر شركة لعرض مفتاحها" : "Select company to show key"}
              </label>
              <Select value={docsCompanyId} onValueChange={setDocsCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر شركة..." : "Select company..."} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto border border-border" dir="ltr">
{`ENDPOINT:
POST ${apiEndpoint}

HEADERS:
Content-Type: application/json
X-API-KEY: ${selectedDocsKey}

BODY:
{
  "HotelId": 1,
  "RoomId": 101,
  "Price": 120,
  "Bed": 2,
  "Status": "Available",
  "YesToDate": "2026-04-01"
}

RESPONSE:
{ "status": "success", "message": "Room synced" }`}
          </pre>
          <Button variant="outline" size="sm" onClick={() => copyText(
`POST ${apiEndpoint}
Headers: Content-Type: application/json, X-API-KEY: ${selectedDocsKey}
Body: { "HotelId": 1, "RoomId": 101, "Price": 120, "Bed": 2, "Status": "Available", "YesToDate": "2026-04-01" }`
          )}>
            <Copy className="w-3.5 h-3.5 me-2" />
            {t("api.copyKey")}
          </Button>
        </div>
      </div>

      {/* Add/Edit Company Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? (isAr ? "تعديل الشركة" : "Edit Company") : t("api.addCompany")}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "أدخل بيانات الشركة" : "Enter company details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{isAr ? "اسم الشركة" : "Company Name"} *</label>
              <Input value={form.name} onChange={e => handleNameChange(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "البريد الإلكتروني" : "Contact Email"}</label>
              <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "ملاحظات" : "Notes"}</label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">{t("api.apiKey")}</label>
              <div className="flex gap-2">
                <Input value={form.api_key} readOnly dir="ltr" className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={regenerateKey} title={t("api.regenerate")}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyText(form.api_key)} title={t("api.copyKey")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {editingCompany ? (isAr ? "حفظ" : "Save") : (isAr ? "إنشاء" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hotels Dialog */}
      <Dialog open={hotelsDialogOpen} onOpenChange={setHotelsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {hotelsCompany?.name} — {t("api.linkedHotels")}
            </DialogTitle>
            <DialogDescription>
              {isAr ? "إدارة الفنادق المرتبطة بهذه الشركة" : "Manage hotels linked to this company"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="linked" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="linked" className="flex-1">{t("api.linkedHotels")}</TabsTrigger>
              <TabsTrigger value="link" className="flex-1">{t("api.linkHotel")}</TabsTrigger>
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
                      <p className="text-xs text-muted-foreground">{h.city} • {t("api.externalId")}: {h.external_hotel_id ?? "—"}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => unlinkHotel(h.id)} className="text-destructive hover:text-destructive">
                      <Unlink className="w-3.5 h-3.5 me-1" />
                      {t("api.unlinkHotel")}
                    </Button>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">{isAr ? "اختر فندقاً" : "Select Hotel"}</label>
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
                <label className="text-sm font-medium">{t("api.externalId")}</label>
                <Input
                  type="number"
                  value={linkExternalId}
                  onChange={e => setLinkExternalId(e.target.value)}
                  placeholder={isAr ? "مثال: 1" : "e.g. 1"}
                  dir="ltr"
                />
              </div>
              <Button onClick={linkHotel} disabled={!linkHotelId || !linkExternalId} className="w-full">
                <Link2 className="w-4 h-4 me-2" />
                {t("api.linkHotel")}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف الشركة" : "Delete Company"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من حذف "${deleteTarget?.name}"؟ سيتم حذف جميع سجلات المزامنة المرتبطة.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? All related sync logs will be deleted.`}
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

      {/* Payload Viewer Dialog */}
      <AlertDialog open={!!payloadDialogLog} onOpenChange={open => !open && setPayloadDialogLog(null)}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "بيانات المزامنة" : "Sync Payload"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto border border-border mt-2 whitespace-pre-wrap" dir="ltr">
                {payloadDialogLog ? JSON.stringify(payloadDialogLog.payload, null, 2) : ""}
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
