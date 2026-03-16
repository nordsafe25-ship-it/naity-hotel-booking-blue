import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Eye, EyeOff, RefreshCw, Trash2, Edit, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ApiCompany {
  id: string;
  name: string;
  api_key: string;
  status: string;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  hotels_count?: number;
  last_sync?: string | null;
}

function generateApiKey(name: string) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "company";
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(3)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sk_${slug}_${hex}`;
}

function maskKey(key: string) {
  if (key.length < 10) return "sk_****_****";
  return key.slice(0, 3) + "_****_" + key.slice(-4);
}

export default function AdminApiCompanies() {
  const { lang } = useI18n();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ApiCompany | null>(null);
  const [form, setForm] = useState({ name: "", contact_email: "", notes: "", api_key: "" });
  const [saving, setSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-hotel-api`;

  const fetchCompanies = async () => {
    setLoading(true);
    const { data: comps } = await supabase
      .from("api_companies" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!comps) { setLoading(false); return; }

    // Get hotels count per company
    const { data: hotels } = await supabase
      .from("hotels")
      .select("id, company_id");

    // Get last sync per company
    const { data: logs } = await supabase
      .from("api_sync_logs" as any)
      .select("company_id, created_at")
      .order("created_at", { ascending: false });

    const enriched = (comps as any[]).map((c: any) => {
      const hotelsCount = (hotels || []).filter((h: any) => h.company_id === c.id).length;
      const lastLog = (logs as any[] || []).find((l: any) => l.company_id === c.id);
      return { ...c, hotels_count: hotelsCount, last_sync: lastLog?.created_at || null };
    });

    setCompanies(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

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

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);

    if (editingCompany) {
      await supabase
        .from("api_companies" as any)
        .update({ name: form.name, contact_email: form.contact_email || null, notes: form.notes || null, api_key: form.api_key } as any)
        .eq("id", editingCompany.id);
      toast({ title: isAr ? "تم تحديث الشركة" : "Company updated" });
    } else {
      const key = form.api_key || generateApiKey(form.name);
      await supabase
        .from("api_companies" as any)
        .insert({ name: form.name, contact_email: form.contact_email || null, notes: form.notes || null, api_key: key } as any);
      toast({ title: isAr ? "تم إنشاء الشركة" : "Company created" });
    }

    setSaving(false);
    setDialogOpen(false);
    fetchCompanies();
  };

  const toggleStatus = async (c: ApiCompany) => {
    const newStatus = c.status === "active" ? "inactive" : "active";
    await supabase.from("api_companies" as any).update({ status: newStatus } as any).eq("id", c.id);
    toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    fetchCompanies();
  };

  const deleteCompany = async (c: ApiCompany) => {
    if (!confirm(isAr ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete this company?")) return;
    await supabase.from("api_companies" as any).delete().eq("id", c.id);
    toast({ title: isAr ? "تم حذف الشركة" : "Company deleted" });
    fetchCompanies();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: isAr ? "تم نسخ المفتاح" : "API key copied" });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const regenerateKey = () => {
    setForm((f) => ({ ...f, api_key: generateApiKey(f.name || "new") }));
    toast({ title: isAr ? "تم إعادة توليد المفتاح" : "API key regenerated" });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isAr ? "تكاملات API" : "API Integrations"}</h1>
            <p className="text-sm text-muted-foreground mt-1">{isAr ? "إدارة شركات الفنادق المتصلة عبر API" : "Manage hotel companies connected via API"}</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 me-2" />
            {isAr ? "إضافة شركة" : "Add Company"}
          </Button>
        </div>

        {/* API Endpoint banner */}
        <div className="bg-muted rounded-lg p-4 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "رابط API للمشاركة مع الفنادق:" : "API Endpoint to share with hotels:"}</p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-background px-3 py-1.5 rounded border border-border flex-1 overflow-x-auto" dir="ltr">{apiEndpoint}</code>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(apiEndpoint); toast({ title: isAr ? "تم نسخ الرابط" : "URL copied" }); }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد شركات بعد" : "No companies yet"}</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "اسم الشركة" : "Company"}</TableHead>
                  <TableHead>{isAr ? "مفتاح API" : "API Key"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{isAr ? "الفنادق" : "Hotels"}</TableHead>
                  <TableHead>{isAr ? "آخر مزامنة" : "Last Sync"}</TableHead>
                  <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs" dir="ltr">{visibleKeys.has(c.id) ? c.api_key : maskKey(c.api_key)}</code>
                        <button onClick={() => toggleKeyVisibility(c.id)} className="p-1 rounded hover:bg-muted">
                          {visibleKeys.has(c.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => copyKey(c.api_key)} className="p-1 rounded hover:bg-muted">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "destructive"}>
                        {c.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.hotels_count ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.last_sync ? new Date(c.last_sync).toLocaleString(isAr ? "ar" : "en") : (isAr ? "لا يوجد" : "None")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)} title={isAr ? "تعديل" : "Edit"}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(c)} title={c.status === "active" ? (isAr ? "تعطيل" : "Deactivate") : (isAr ? "تفعيل" : "Activate")}>
                          {c.status === "active" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/api-companies/${c.id}/logs`} title={isAr ? "سجلات المزامنة" : "Sync Logs"}>
                            <FileText className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCompany(c)} title={isAr ? "حذف" : "Delete"}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? (isAr ? "تعديل الشركة" : "Edit Company") : (isAr ? "إضافة شركة" : "Add Company")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{isAr ? "اسم الشركة" : "Company Name"} *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "البريد الإلكتروني" : "Contact Email"}</label>
              <Input value={form.contact_email} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "ملاحظات" : "Notes"}</label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "مفتاح API" : "API Key"}</label>
              <div className="flex gap-2">
                <Input value={form.api_key} readOnly dir="ltr" className="font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={regenerateKey} title={isAr ? "إعادة توليد المفتاح" : "Regenerate Key"}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyKey(form.api_key)} title={isAr ? "نسخ المفتاح" : "Copy Key"}>
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
    </AdminLayout>
  );
}
