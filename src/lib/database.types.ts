// Hand-written stub types matching database/schema.sql.
// Regenerate via `npx supabase gen types typescript --project-id <id>`
// once a Supabase project exists, and replace this file.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "invited"
  | "registered";
export type InviteCodeStatus = "active" | "used" | "expired" | "cancelled";
export type WorkspaceStatus = "active" | "suspended" | "archived";
export type WorkspaceRole =
  | "owner"
  | "manager"
  | "cashier"
  | "stock_staff"
  | "viewer";
export type EventStatus = "planned" | "running" | "closed" | "archived";
export type OrderType = "take_now" | "send_later" | "mixed" | "sample";
export type PaymentMethod =
  | "cash"
  | "promptpay"
  | "transfer"
  | "card"
  | "other"
  | "sample"
  | "mixed";
export type PaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "voided";
export type OrderStatus = "completed" | "voided" | "corrected";
export type FulfillmentType = "take_now" | "send_later";
export type SendLaterStatus =
  | "pending"
  | "packed"
  | "shipped"
  | "completed"
  | "cancelled";
export type PreferredContactMethod = "phone" | "email" | "line";
export type ContactChannel = "phone" | "email" | "line" | "other";
export type CustomerRegisteredVia = "portal" | "cashier" | "admin" | "import";
export type PetSpecies = "cat" | "dog" | "rabbit" | "bird" | "other";
export type CustomerOrderLinkSource = "portal" | "cashier" | "admin";

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string;
          owner_name: string;
          phone: string;
          email: string;
          brand_name: string;
          product_category: string;
          social_link: string | null;
          num_skus: number | null;
          events_per_year: number | null;
          message: string | null;
          status: ApplicationStatus;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          owner_name: string;
          phone: string;
          email: string;
          brand_name: string;
          product_category: string;
          social_link?: string | null;
          num_skus?: number | null;
          events_per_year?: number | null;
          message?: string | null;
          status?: ApplicationStatus;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          user_id: string;
          granted_at?: string;
          granted_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Insert"]>;
        Relationships: [];
      };
      invite_codes: {
        Row: {
          id: string;
          application_id: string;
          code: string;
          email: string;
          brand_name: string;
          status: InviteCodeStatus;
          expires_at: string;
          used_at: string | null;
          used_by_user_id: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          code: string;
          email: string;
          brand_name: string;
          status?: InviteCodeStatus;
          expires_at?: string;
          used_at?: string | null;
          used_by_user_id?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invite_codes"]["Insert"]>;
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          brand_name: string;
          slug: string;
          owner_user_id: string;
          industry: string;
          status: WorkspaceStatus;
          setup_complete: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_name: string;
          slug: string;
          owner_user_id: string;
          industry?: string;
          status?: WorkspaceStatus;
          setup_complete?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_members"]["Insert"]
        >;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          workspace_id: string;
          sku: string;
          name: string;
          category: string;
          price_satang: number;
          shipping_fee_satang: number;
          default_starting_qty: number;
          send_later_enabled: boolean;
          is_active: boolean;
          image_path: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          sku: string;
          name: string;
          category?: string;
          price_satang: number;
          shipping_fee_satang?: number;
          default_starting_qty?: number;
          send_later_enabled?: boolean;
          is_active?: boolean;
          image_path?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          venue: string | null;
          start_date: string;
          end_date: string;
          status: EventStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          venue?: string | null;
          start_date: string;
          end_date: string;
          status?: EventStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      event_inventory: {
        Row: {
          id: string;
          workspace_id: string;
          event_id: string;
          product_id: string;
          starting_qty: number;
          current_qty: number;
          reserved_qty: number;
          sold_qty: number;
          sample_qty: number;
          adjusted_qty: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          event_id: string;
          product_id: string;
          starting_qty?: number;
          current_qty?: number;
          reserved_qty?: number;
          sold_qty?: number;
          sample_qty?: number;
          adjusted_qty?: number;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["event_inventory"]["Insert"]
        >;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          workspace_id: string;
          event_id: string;
          order_number: string;
          cashier_user_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_email: string | null;
          order_type: OrderType;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          subtotal_satang: number;
          discount_satang: number;
          shipping_fee_satang: number;
          total_satang: number;
          status: OrderStatus;
          note: string | null;
          created_at: string;
          voided_at: string | null;
          voided_by_user_id: string | null;
          void_reason: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          event_id: string;
          order_number: string;
          cashier_user_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_email?: string | null;
          order_type?: OrderType;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          subtotal_satang?: number;
          discount_satang?: number;
          shipping_fee_satang?: number;
          total_satang?: number;
          status?: OrderStatus;
          note?: string | null;
          created_at?: string;
          voided_at?: string | null;
          voided_by_user_id?: string | null;
          void_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          workspace_id: string;
          order_id: string;
          product_id: string;
          sku: string;
          product_name: string;
          qty: number;
          unit_price_satang: number;
          line_total_satang: number;
          fulfillment_type: FulfillmentType;
          is_sample: boolean;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          order_id: string;
          product_id: string;
          sku: string;
          product_name: string;
          qty: number;
          unit_price_satang: number;
          line_total_satang: number;
          fulfillment_type?: FulfillmentType;
          is_sample?: boolean;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      payment_records: {
        Row: {
          id: string;
          workspace_id: string;
          order_id: string;
          payment_method: Exclude<PaymentMethod, "sample" | "mixed">;
          amount_satang: number;
          slip_path: string | null;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          order_id: string;
          payment_method: Exclude<PaymentMethod, "sample" | "mixed">;
          amount_satang: number;
          slip_path?: string | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["payment_records"]["Insert"]
        >;
        Relationships: [];
      };
      send_later_orders: {
        Row: {
          id: string;
          workspace_id: string;
          order_id: string;
          customer_name: string;
          customer_phone: string;
          shipping_address: string;
          shipping_method: string | null;
          shipping_fee_satang: number;
          fulfillment_status: SendLaterStatus;
          tracking_number: string | null;
          note: string | null;
          created_at: string;
          packed_at: string | null;
          shipped_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          order_id: string;
          customer_name: string;
          customer_phone: string;
          shipping_address: string;
          shipping_method?: string | null;
          shipping_fee_satang?: number;
          fulfillment_status?: SendLaterStatus;
          tracking_number?: string | null;
          note?: string | null;
          created_at?: string;
          packed_at?: string | null;
          shipped_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["send_later_orders"]["Insert"]
        >;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string | null;
          user_id: string | null;
          action: string;
          target_table: string;
          target_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          user_id?: string | null;
          action: string;
          target_table: string;
          target_id?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          workspace_id: string;
          display_name: string | null;
          preferred_contact_method: PreferredContactMethod | null;
          consent_marketing: boolean;
          consent_marketing_at: string | null;
          registered_via: CustomerRegisteredVia;
          first_seen_at: string;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          display_name?: string | null;
          preferred_contact_method?: PreferredContactMethod | null;
          consent_marketing?: boolean;
          consent_marketing_at?: string | null;
          registered_via?: CustomerRegisteredVia;
          first_seen_at?: string;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      customer_contacts: {
        Row: {
          id: string;
          workspace_id: string;
          customer_id: string;
          channel: ContactChannel;
          value: string;
          is_primary: boolean;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          customer_id: string;
          channel: ContactChannel;
          value: string;
          is_primary?: boolean;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_contacts"]["Insert"]
        >;
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          workspace_id: string;
          customer_id: string;
          name: string;
          species: PetSpecies;
          breed: string | null;
          weight_kg: number | null;
          birthday: string | null;
          adoption_day: string | null;
          allergies: string | null;
          preferences: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          customer_id: string;
          name: string;
          species?: PetSpecies;
          breed?: string | null;
          weight_kg?: number | null;
          birthday?: string | null;
          adoption_day?: string | null;
          allergies?: string | null;
          preferences?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pets"]["Insert"]>;
        Relationships: [];
      };
      customer_order_links: {
        Row: {
          id: string;
          workspace_id: string;
          customer_id: string;
          order_id: string;
          linked_via: CustomerOrderLinkSource;
          linked_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          customer_id: string;
          order_id: string;
          linked_via?: CustomerOrderLinkSource;
          linked_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_order_links"]["Insert"]
        >;
        Relationships: [];
      };
      customer_registration_tokens: {
        Row: {
          id: string;
          workspace_id: string;
          order_id: string;
          token: string;
          expires_at: string;
          claimed_at: string | null;
          claimed_customer_id: string | null;
          created_at: string;
          created_by_user_id: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          order_id: string;
          token: string;
          expires_at?: string;
          claimed_at?: string | null;
          claimed_customer_id?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_registration_tokens"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_workspace_member: {
        Args: { ws: string; roles?: string[] };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      adjust_event_stock: {
        Args: {
          p_event_id: string;
          p_product_id: string;
          p_delta: number;
          p_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["event_inventory"]["Row"];
      };
      convert_event_to_sample: {
        Args: {
          p_event_id: string;
          p_product_id: string;
          p_qty: number;
          p_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["event_inventory"]["Row"];
      };
      convert_sample_to_event: {
        Args: {
          p_event_id: string;
          p_product_id: string;
          p_qty: number;
          p_reason?: string | null;
        };
        Returns: Database["public"]["Tables"]["event_inventory"]["Row"];
      };
      create_registration_token: {
        Args: { p_order_id: string };
        Returns: string;
      };
      claim_registration_token: {
        Args: { p_token: string; p_payload: Json };
        Returns: string;
      };
      redeem_invite_code: {
        Args: { p_code: string; p_brand_name: string; p_slug: string };
        Returns: string;
      };
      approve_application: {
        Args: { p_application_id: string; p_code: string };
        Returns: Database["public"]["Tables"]["invite_codes"]["Row"];
      };
      reject_application: {
        Args: { p_application_id: string };
        Returns: undefined;
      };
      create_order: {
        Args: { payload: Json };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
