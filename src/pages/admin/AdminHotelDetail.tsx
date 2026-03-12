import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import AdminLayout from "./AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import HotelGeneralTab from "./hotel-detail/HotelGeneralTab";
import HotelGalleryTab from "./hotel-detail/HotelGalleryTab";
import HotelRoomsTab from "./hotel-detail/HotelRoomsTab";
import HotelConnectivityTab from "./hotel-detail/HotelConnectivityTab";

const AdminHotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();

  const { data: hotel, isLoading } = useQuery({
    queryKey: ["admin-hotel-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!hotel) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-muted-foreground">
          {lang === "ar" ? "الفندق غير موجود" : "Hotel not found"}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/hotels")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === "ar" ? hotel.name_ar : hotel.name_en}
            </h1>
            <p className="text-sm text-muted-foreground">{hotel.city}</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="w-full justify-start bg-muted rounded-xl p-1">
            <TabsTrigger value="general" className="rounded-lg">
              {lang === "ar" ? "عام" : "General"}
            </TabsTrigger>
            <TabsTrigger value="gallery" className="rounded-lg">
              {lang === "ar" ? "معرض الصور" : "Gallery"}
            </TabsTrigger>
            <TabsTrigger value="rooms" className="rounded-lg">
              {lang === "ar" ? "الغرف" : "Rooms"}
            </TabsTrigger>
            <TabsTrigger value="connectivity" className="rounded-lg">
              {lang === "ar" ? "الاتصال" : "Connectivity"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <HotelGeneralTab hotel={hotel} />
          </TabsContent>

          <TabsContent value="gallery" className="mt-6">
            <HotelGalleryTab hotelId={hotel.id} />
          </TabsContent>

          <TabsContent value="rooms" className="mt-6">
            <HotelRoomsTab hotelId={hotel.id} />
          </TabsContent>

          <TabsContent value="connectivity" className="mt-6">
            <HotelConnectivityTab hotelId={hotel.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminHotelDetail;
