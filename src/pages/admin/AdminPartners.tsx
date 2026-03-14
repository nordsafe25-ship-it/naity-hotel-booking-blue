import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Handshake, Plus, Trash2, Pencil, Building2, UserPlus } from "lucide-react";

const AdminPartners = () => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", name_ar: "", contact_email: "", contact_phone: "",
    commission_rate: 0, notes: "", is_active: true,
  });

  // Login creation state
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginPartnerId, setLoginPartnerId] = useState<string | null>(null);
  const [loginPartnerName, setLoginPartnerName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [creatingLogin, setCreatingLogin] = useState(false);

  const resetForm = () => {
    setForm({ name: "", name_ar: "", contact_email: "", contact_phone: "", commission_rate: 0, notes: "", is_active: true });
    setEditId(null);
  };

  const { data: partners, isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tech_partners")
        .select("*, hotels(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: any) => ({
        ...p,
        hotels_count: Array.isArray(p.hotels) ? p.hotels.length : 0,
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        commission_rate: form.commission_rate,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      };
      if (!payload.name) throw new Error(lang === "ar" ? "الاسم مطلوب" : "Name is required");

      if (editId) {
        const { error } = await supabase.from("tech_partners").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tech_partners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success(editId
        ? (lang === "ar" ? "تم تحديث الشريك" : "Partner updated")
        : (lang === "ar" ? "تم إضافة الشريك" : "Partner added"));
      setOpen(false);
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, hotelsCount }: { id: string; hotelsCount: number }) => {
      if (hotelsCount > 0) {
        throw new Error(lang === "ar"
          ? "لا يمكن حذف شريك مرتبط بعقارات. قم بفك الارتباط أولاً."
          : "Cannot delete a partner linked to properties. Unlink them first.");
      }
      const { error } = await supabase.from("tech_partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast.success(lang === "ar" ? "تم حذف الشريك" : "Partner deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name ?? "",
      name_ar: p.name_ar ?? "",
      contact_email: p.contact_email ?? "",
      contact_phone: p.contact_phone ?? "",
      commission_rate: p.commission_rate ?? 0,
      notes: p.notes ?? "",
      is_active: p.is_active ?? true,
    });
    setOpen(true);
  };

  const openLoginDialog = (p: any) => {
    setLoginPartnerId(p.id);
    setLoginPartnerName(lang === "ar" && p.name_ar ? p.name_ar : p.name);
    setLoginEmail(p.contact_email ?? "");
    setLoginPassword("");
    setLoginOpen(true);
  };

  const handleCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPartnerId) return;
    if (loginPassword.length < 6) {
      toast.error(lang === "ar" ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }
    setCreatingLogin(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-partner", {
        body: { email: loginEmail.trim(), password: loginPassword, partner_id: loginPartnerId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(
        lang === "ar"
          ? `تم إنشاء الحساب بنجاح لـ ${data.email}`
          : `Account created successfully for ${data.email}`
      );
      setLoginOpen(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (err: any) {
      toast.error(err.message || (lang === "ar" ? "حدث خطأ أثناء إنشاء الحساب" : "Error creating account"));
    } finally {
      setCreatingLogin(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">
            {lang === "ar" ? "الشركاء التقنيين" : "Tech Partners"}
          </h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-cta gap-2">
                <Plus className="w-4 h-4" />
                {lang === "ar" ? "إضافة شريك" : "Add Partner"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? (lang === "ar" ? "تعديل الشريك" : "Edit Partner")
                    : (lang === "ar" ? "إضافة شريك جديد" : "Add New Partner")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div>
                  <Label>{lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <Label>{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <Input value={form.name_ar} onChange={(e) => setForm(f => ({ ...f, name_ar: e.target.value }))} />
                </div>
                <div>
                  <Label>{lang === "ar" ? "البريد الإلكتروني" : "Contact Email"}</Label>
                  <Input type="email" value={form.contact_email} onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div>
                  <Label>{lang === "ar" ? "رقم الهاتف" : "Contact Phone"}</Label>
                  <Input value={form.contact_phone} onChange={(e) => setForm(f => ({ ...f, contact_phone: e.target.value }))} />
                </div>
                <div>
                  <Label>{lang === "ar" ? "نسبة العمولة من العربون %" : "Commission % of Deposit"}</Label>
                  <Input
                    type="number" min={0} max={100} step={0.01}
                    value={form.commission_rate}
                    onChange={(e) => setForm(f => ({ ...f, commission_rate: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === "ar"
                      ? "مثال: 20 يعني أن الشريك يستحق 20% من كل عربون"
                      : "e.g. 20 means partner earns 20% of each deposit"}
                  </p>
                </div>
                <div>
                  <Label>{lang === "ar" ? "ملاحظات" : "Notes"}</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
                </div>
                {editId && (
                  <div className="flex items-center justify-between">
                    <Label>{lang === "ar" ? "نشط" : "Active"}</Label>
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                  </div>
                )}
                <Button type="submit" className="w-full gradient-cta" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "..." : editId
                    ? (lang === "ar" ? "حفظ التعديلات" : "Save Changes")
                    : (lang === "ar" ? "إضافة الشريك" : "Add Partner")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Create Login Dialog */}
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {lang === "ar" ? `إنشاء حساب لـ ${loginPartnerName}` : `Create login for ${loginPartnerName}`}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLogin} className="space-y-4">
              <div>
                <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label>{lang === "ar" ? "كلمة المرور" : "Password"}</Label>
                <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required minLength={8} className="mt-1" />
              </div>
              <Button type="submit" className="w-full gradient-cta" disabled={creatingLogin}>
                {creatingLogin ? "..." : (lang === "ar" ? "إنشاء الحساب" : "Create Account")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !partners?.length ? (
          <div className="bg-card rounded-2xl border border-border/50 shadow-card flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Handshake className="w-12 h-12 opacity-30 mb-3" />
            <p className="text-lg font-medium">{lang === "ar" ? "لا يوجد شركاء بعد" : "No partners yet"}</p>
            <p className="text-sm mt-1">{lang === "ar" ? "أضف أول شريك تقني" : "Add your first tech partner"}</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/40">
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "الاسم" : "Name"}</th>
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "العمولة" : "Commission"}</th>
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "البريد" : "Email"}</th>
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "الهاتف" : "Phone"}</th>
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "عدد الفنادق/الشقق" : "Properties"}</th>
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="text-start px-5 py-3.5 font-semibold text-muted-foreground">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {partners.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                            {p.name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <span className="font-semibold text-foreground">{lang === "ar" && p.name_ar ? p.name_ar : p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-foreground">{p.commission_rate}%</td>
                      <td className="px-5 py-4 text-muted-foreground" dir="ltr">{p.contact_email ?? "—"}</td>
                      <td className="px-5 py-4 text-muted-foreground" dir="ltr">{p.contact_phone ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {p.hotels_count}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {lang === "ar" ? "نشط" : "Active"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {lang === "ar" ? "غير نشط" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-primary" title={lang === "ar" ? "تعديل" : "Edit"}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (p.hotels_count > 0) {
                                toast.error(lang === "ar"
                                  ? "لا يمكن حذف شريك مرتبط بعقارات"
                                  : "Cannot delete partner linked to properties");
                                return;
                              }
                              if (confirm(lang === "ar" ? "حذف هذا الشريك؟" : "Delete this partner?"))
                                deleteMutation.mutate({ id: p.id, hotelsCount: p.hotels_count });
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"
                            title={lang === "ar" ? "حذف" : "Delete"}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openLoginDialog(p)}
                            className="p-2 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-primary"
                            title={lang === "ar" ? "إنشاء حساب" : "Create Login"}>
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPartners;
