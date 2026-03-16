import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface SyncLog {
  id: string;
  company_id: string;
  hotel_id: string | null;
  event_type: string;
  payload: any;
  status: string;
  created_at: string;
  hotel_name?: string;
}

export default function AdminApiLogs() {
  const { id: companyId } = useParams<{ id: string }>();
  const { lang } = useI18n();
  const isAr = lang === "ar";

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async () => {
    setLoading(true);

    // Get company name
    const { data: comp } = await supabase
      .from("api_companies" as any)
      .select("name")
      .eq("id", companyId)
      .maybeSingle();
    if (comp) setCompanyName((comp as any).name);

    let query = supabase
      .from("api_sync_logs" as any)
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (eventFilter !== "all") query = query.eq("event_type", eventFilter);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data } = await query;

    // Get hotel names
    const hotelIds = [...new Set((data as any[] || []).filter((l: any) => l.hotel_id).map((l: any) => l.hotel_id))];
    let hotelMap: Record<string, string> = {};
    if (hotelIds.length > 0) {
      const { data: hotels } = await supabase.from("hotels").select("id, name_en, name_ar").in("id", hotelIds);
      (hotels || []).forEach((h: any) => { hotelMap[h.id] = isAr ? h.name_ar : h.name_en; });
    }

    const enriched = (data as any[] || []).map((l: any) => ({
      ...l,
      hotel_name: l.hotel_id ? hotelMap[l.hotel_id] || l.hotel_id : null,
    }));

    setLogs(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [companyId, statusFilter, eventFilter, dateFrom, dateTo]);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/api-companies"><ChevronLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAr ? "سجلات المزامنة" : "Sync Logs"} — {companyName}
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{isAr ? "الحالة" : "Status"}</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="success">{isAr ? "ناجح" : "Success"}</SelectItem>
                <SelectItem value="failed">{isAr ? "فشل" : "Failed"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{isAr ? "نوع الحدث" : "Event Type"}</label>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                <SelectItem value="room_sync">room_sync</SelectItem>
                <SelectItem value="booking_sync">booking_sync</SelectItem>
                <SelectItem value="error">error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{isAr ? "من تاريخ" : "From"}</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{isAr ? "إلى تاريخ" : "To"}</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{isAr ? "لا توجد سجلات" : "No logs found"}</div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>{isAr ? "التاريخ/الوقت" : "Date/Time"}</TableHead>
                  <TableHead>{isAr ? "نوع الحدث" : "Event Type"}</TableHead>
                  <TableHead>{isAr ? "الفندق" : "Hotel"}</TableHead>
                  <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <>
                    <TableRow key={log.id} className="cursor-pointer" onClick={() => toggleExpand(log.id)}>
                      <TableCell>
                        {expandedRows.has(log.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(log.created_at).toLocaleString(isAr ? "ar" : "en")}</TableCell>
                      <TableCell><Badge variant="outline">{log.event_type}</Badge></TableCell>
                      <TableCell className="text-sm">{log.hotel_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "success" ? "default" : "destructive"}>
                          {log.status === "success" ? (isAr ? "ناجح" : "Success") : (isAr ? "فشل" : "Failed")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(log.id) && (
                      <TableRow key={`${log.id}-payload`}>
                        <TableCell colSpan={5} className="bg-muted/50">
                          <pre className="text-xs overflow-x-auto p-2 rounded bg-background border" dir="ltr">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
