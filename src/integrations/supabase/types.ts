export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string
          hotel_id: string
          id: string
          note: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string
          hotel_id: string
          id?: string
          note?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string
          hotel_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in: string
          check_out: string
          check_out_processed: boolean | null
          created_at: string
          deposit_amount: number | null
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone: string | null
          guest_user_id: string | null
          guests_count: number
          hotel_booking_id: string | null
          hotel_id: string
          hotel_notification_status: string | null
          hotel_notified_at: string | null
          id: string
          nationality: string | null
          payment_status: string
          phone_country_code: string | null
          room_category_id: string
          room_number: string | null
          special_requests: string | null
          status: string
          stripe_payment_id: string | null
          sync_status: string | null
          total_price: number
          transaction_hash: string | null
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          check_out_processed?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone?: string | null
          guest_user_id?: string | null
          guests_count?: number
          hotel_booking_id?: string | null
          hotel_id: string
          hotel_notification_status?: string | null
          hotel_notified_at?: string | null
          id?: string
          nationality?: string | null
          payment_status?: string
          phone_country_code?: string | null
          room_category_id: string
          room_number?: string | null
          special_requests?: string | null
          status?: string
          stripe_payment_id?: string | null
          sync_status?: string | null
          total_price: number
          transaction_hash?: string | null
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          check_out_processed?: boolean | null
          created_at?: string
          deposit_amount?: number | null
          guest_email?: string
          guest_first_name?: string
          guest_last_name?: string
          guest_phone?: string | null
          guest_user_id?: string | null
          guests_count?: number
          hotel_booking_id?: string | null
          hotel_id?: string
          hotel_notification_status?: string | null
          hotel_notified_at?: string | null
          id?: string
          nationality?: string | null
          payment_status?: string
          phone_country_code?: string | null
          room_category_id?: string
          room_number?: string | null
          special_requests?: string | null
          status?: string
          stripe_payment_id?: string | null
          sync_status?: string | null
          total_price?: number
          transaction_hash?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_category_id_fkey"
            columns: ["room_category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          country: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_read: boolean
          is_starred: boolean
          message: string
          phone: string
          replied_at: string | null
          subject: string
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_read?: boolean
          is_starred?: boolean
          message: string
          phone: string
          replied_at?: string | null
          subject: string
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_read?: boolean
          is_starred?: boolean
          message?: string
          phone?: string
          replied_at?: string | null
          subject?: string
        }
        Relationships: []
      }
      hotel_photos: {
        Row: {
          caption: string | null
          created_at: string
          hotel_id: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_photos_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string | null
          amenities: string[] | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          contact_email: string | null
          contact_phone: string | null
          cover_image: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          floor: number | null
          house_rules_ar: string | null
          house_rules_en: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          latitude: number | null
          longitude: number | null
          manager_id: string | null
          manual_mode: boolean | null
          name_ar: string
          name_en: string
          neighborhood: string | null
          property_type: string
          slug: string | null
          stars: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          floor?: number | null
          house_rules_ar?: string | null
          house_rules_en?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          manual_mode?: boolean | null
          name_ar: string
          name_en: string
          neighborhood?: string | null
          property_type?: string
          slug?: string | null
          stars?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_image?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          floor?: number | null
          house_rules_ar?: string | null
          house_rules_en?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          manual_mode?: boolean | null
          name_ar?: string
          name_en?: string
          neighborhood?: string | null
          property_type?: string
          slug?: string | null
          stars?: number
          updated_at?: string
        }
        Relationships: []
      }
      local_sync_settings: {
        Row: {
          api_endpoint: string | null
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean | null
          last_heartbeat_at: string | null
          last_sync_at: string | null
          secret_key: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean | null
          last_heartbeat_at?: string | null
          last_sync_at?: string | null
          secret_key?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean | null
          last_heartbeat_at?: string | null
          last_sync_at?: string | null
          secret_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_sync_settings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: true
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_availability: {
        Row: {
          category_name: string | null
          created_at: string
          hotel_id: string
          id: string
          last_updated_by_hotel: string | null
          occupied_check_in: string | null
          occupied_check_out: string | null
          price_per_night: number | null
          room_category_id: string | null
          room_kind: string | null
          room_number: string
          sham_soft_room_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          last_updated_by_hotel?: string | null
          occupied_check_in?: string | null
          occupied_check_out?: string | null
          price_per_night?: number | null
          room_category_id?: string | null
          room_kind?: string | null
          room_number: string
          sham_soft_room_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category_name?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          last_updated_by_hotel?: string | null
          occupied_check_in?: string | null
          occupied_check_out?: string | null
          price_per_night?: number | null
          room_category_id?: string | null
          room_kind?: string | null
          room_number?: string
          sham_soft_room_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_availability_room_category_id_fkey"
            columns: ["room_category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      room_categories: {
        Row: {
          amenities: string[] | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          hotel_id: string
          id: string
          is_active: boolean
          max_guests: number
          name_ar: string
          name_en: string
          price_per_night: number
          total_rooms: number
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          max_guests?: number
          name_ar: string
          name_en: string
          price_per_night: number
          total_rooms?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          max_guests?: number
          name_ar?: string
          name_en?: string
          price_per_night?: number
          total_rooms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_categories_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_history: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          event_type: string
          hotel_id: string
          id: string
          metadata: Json | null
          records_count: number | null
          status: string
        }
        Insert: {
          created_at?: string
          direction?: string
          error_message?: string | null
          event_type?: string
          hotel_id: string
          id?: string
          metadata?: Json | null
          records_count?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          event_type?: string
          hotel_id?: string
          id?: string
          metadata?: Json | null
          records_count?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_history_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          event_type: string
          hotel_id: string
          id: string
          payload: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          hotel_id: string
          id?: string
          payload?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          hotel_id?: string
          id?: string
          payload?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expire_completed_bookings: { Args: never; Returns: undefined }
      get_manager_hotel_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      unlist_stale_rooms: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "hotel_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "hotel_manager"],
    },
  },
} as const
