import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UserPlus, Trash2, Pencil, Loader2 } from "lucide-react";

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "hotel_manager" | "viewer" | null;
}

const ROLE_OPTIONS = [
  { value: "admin", ar: "مدير كامل", en: "Full Admin" },
  { value: "hotel_manager", ar: "مدير فندق", en: "Hotel Manager" },
  { value: "viewer", ar: "مشاهد فقط", en: "View Only" },
] as const;

const callManageUser = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("manage-admin-user", {
    body,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
};

const AdminUsers = () => {
  const { lang } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tx = (ar: string, en: string) => (lang === "ar" ? ar : en);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("viewer");

  // Inline role editing
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>("");

  const { data: users = [], isLoading } = useQuery<ManagedUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await callManageUser({ action: "list" });
      return res.users ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      callManageUser({
        action: "create",
        email,
        password,
        role,
        full_name: fullName,
      }),
    onSuccess: () => {
      toast.success(tx(`تم إنشاء حساب ${email}`, `Account ${email} created`));
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("viewer");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ user_id, role }: { user_id: string; role: string }) =>
      callManageUser({ action: "update_role", user_id, role }),
    onSuccess: () => {
      toast.success(tx("تم تحديث الصلاحية", "Role updated"));
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (user_id: string) =>
      callManageUser({ action: "delete", user_id }),
    onSuccess: () => {
      toast.success(tx("تم حذف المستخدم", "User deleted"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const roleBadge = (r: string | null) => {
    switch (r) {
      case "admin":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{tx("مدير كامل", "Admin")}</Badge>;
      case "hotel_manager":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{tx("مدير فندق", "Manager")}</Badge>;
      case "viewer":
        return <Badge variant="secondary">{tx("مشاهد", "Viewer")}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{tx("بدون صلاحية", "No Role")}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          {tx("إدارة المستخدمين", "User Management")}
        </h1>

        {/* Create User Form */}
        <div className="bg-card rounded-xl p-6 border border-border/50 shadow-card space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {tx("إضافة مستخدم جديد", "Add New User")}
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <Label>{tx("الاسم الكامل", "Full Name")}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={tx("اختياري", "Optional")} />
            </div>
            <div>
              <Label>{tx("البريد الإلكتروني", "Email")} *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>{tx("كلمة المرور", "Password")} *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label>{tx("الصلاحية", "Role")} *</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {tx(r.ar, r.en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="gradient-cta gap-2" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {tx("إنشاء الحساب", "Create Account")}
              </Button>
            </div>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-start px-4 py-3 font-medium text-muted-foreground">{tx("الاسم", "Name")}</th>
                    <th className="text-start px-4 py-3 font-medium text-muted-foreground">{tx("البريد", "Email")}</th>
                    <th className="text-start px-4 py-3 font-medium text-muted-foreground">{tx("الصلاحية", "Role")}</th>
                    <th className="text-start px-4 py-3 font-medium text-muted-foreground">{tx("آخر دخول", "Last Sign In")}</th>
                    <th className="text-start px-4 py-3 font-medium text-muted-foreground">{tx("تاريخ الإنشاء", "Created")}</th>
                    <th className="text-start px-4 py-3 font-medium text-muted-foreground">{tx("إجراءات", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition">
                      <td className="px-4 py-3 text-foreground">{u.full_name || "—"}</td>
                      <td className="px-4 py-3 text-foreground font-mono text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <Select value={editingRole} onValueChange={setEditingRole}>
                              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>{tx(r.ar, r.en)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 text-xs"
                              disabled={updateRoleMutation.isPending}
                              onClick={() => updateRoleMutation.mutate({ user_id: u.id, role: editingRole })}
                            >
                              {tx("حفظ", "Save")}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingUserId(null)}>
                              {tx("إلغاء", "Cancel")}
                            </Button>
                          </div>
                        ) : (
                          roleBadge(u.role)
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString(lang === "ar" ? "ar-SY" : "en-US") : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString(lang === "ar" ? "ar-SY" : "en-US")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditingRole(u.role ?? "viewer");
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                disabled={u.id === user?.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{tx("حذف المستخدم", "Delete User")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {tx(
                                    `هل أنت متأكد من حذف ${u.email}؟ لا يمكن التراجع.`,
                                    `Are you sure you want to delete ${u.email}? This cannot be undone.`
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{tx("إلغاء", "Cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteMutation.mutate(u.id)}
                                >
                                  {tx("حذف", "Delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        {tx("لا يوجد مستخدمين", "No users found")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
