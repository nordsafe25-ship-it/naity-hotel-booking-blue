import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Star, ImagePlus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const HotelGalleryTab = ({ hotelId }: { hotelId: string }) => {
  const { lang } = useI18n();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: photos } = useQuery({
    queryKey: ["hotel-photos", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("hotel_photos").select("*").eq("hotel_id", hotelId).order("sort_order");
      return data ?? [];
    },
  });

  const { data: hotel } = useQuery({
    queryKey: ["hotel-cover", hotelId],
    queryFn: async () => {
      const { data } = await supabase.from("hotels").select("cover_image").eq("id", hotelId).single();
      return data;
    },
  });

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const fileArr = Array.from(files);

    for (const file of fileArr) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop();
      const path = `${hotelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("hotel-photos").upload(path, file);
      if (uploadError) { toast.error(uploadError.message); continue; }

      const { data: { publicUrl } } = supabase.storage.from("hotel-photos").getPublicUrl(path);
      await supabase.from("hotel_photos").insert({ hotel_id: hotelId, url: publicUrl, sort_order: (photos?.length ?? 0) });
    }

    queryClient.invalidateQueries({ queryKey: ["hotel-photos", hotelId] });
    setUploading(false);
    toast.success(lang === "ar" ? "تم رفع الصور بنجاح" : "Photos uploaded successfully");
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  }, [photos]);

  const deletePhoto = async (photo: Tables<"hotel_photos">) => {
    const urlParts = photo.url.split("/hotel-photos/");
    if (urlParts[1]) await supabase.storage.from("hotel-photos").remove([urlParts[1]]);
    await supabase.from("hotel_photos").delete().eq("id", photo.id);
    queryClient.invalidateQueries({ queryKey: ["hotel-photos", hotelId] });
    toast.success(lang === "ar" ? "تم حذف الصورة" : "Photo deleted");
  };

  const setAsMain = async (url: string) => {
    await supabase.from("hotels").update({ cover_image: url }).eq("id", hotelId);
    queryClient.invalidateQueries({ queryKey: ["hotel-cover", hotelId] });
    queryClient.invalidateQueries({ queryKey: ["admin-hotel-detail", hotelId] });
    toast.success(lang === "ar" ? "تم تعيين صورة الغلاف" : "Main image set");
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ImagePlus className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {uploading
                ? (lang === "ar" ? "جارٍ الرفع..." : "Uploading...")
                : (lang === "ar" ? "اسحب الصور هنا أو انقر للرفع" : "Drag & drop photos here, or click to upload")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "ar" ? "PNG, JPG, WEBP — حتى 10 صور" : "PNG, JPG, WEBP — up to 10 photos"}
            </p>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos?.map((photo) => {
          const isMain = hotel?.cover_image === photo.url;
          return (
            <div
              key={photo.id}
              className={`relative group rounded-xl overflow-hidden border-2 transition-colors ${
                isMain ? "border-primary" : "border-border/50 hover:border-border"
              }`}
            >
              <img src={photo.url} alt="" className="w-full h-40 object-cover" />
              {isMain && (
                <div className="absolute top-2 start-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  {lang === "ar" ? "رئيسية" : "Main"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!isMain && (
                  <Button size="sm" variant="secondary" onClick={() => setAsMain(photo.url)} className="text-xs">
                    <Star className="w-3 h-3 me-1" />
                    {lang === "ar" ? "تعيين كرئيسية" : "Set as Main"}
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => deletePhoto(photo)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {photos?.length === 0 && (
        <p className="text-center text-muted-foreground py-10 text-sm">
          {lang === "ar" ? "لا توجد صور بعد. قم بسحب صور هنا لبدء المعرض." : "No photos yet. Drag images above to start building your gallery."}
        </p>
      )}
    </div>
  );
};

export default HotelGalleryTab;
