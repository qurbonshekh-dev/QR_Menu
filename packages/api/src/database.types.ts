// Скопировано из вывода Supabase `generate_typescript_types` для проекта Food.
// Руками не править: меняется схема миграцией — файл перегенерируется.
// Вспомогательные дженерики (Tables<>, TablesInsert<>, Enums<>) из вывода
// опущены — мы ими не пользуемся, ходим через репозитории этого пакета.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: { id: string; name: string; zone_label: string; currency: string; created_at: string };
        Insert: { id?: string; name: string; zone_label?: string; currency?: string; created_at?: string };
        Update: { id?: string; name?: string; zone_label?: string; currency?: string; created_at?: string };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          role: string;
          created_at: string;
          /** Связь с пользователем Supabase Auth: вход сотрудника (миграция staff_auth_link). */
          auth_user_id: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name: string;
          role: string;
          created_at?: string;
          auth_user_id?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name?: string;
          role?: string;
          created_at?: string;
          auth_user_id?: string | null;
        };
        Relationships: [];
      };
      dining_tables: {
        Row: {
          id: string;
          restaurant_id: string;
          number: string;
          seats: number;
          status: string;
          waiter_id: string | null;
          reserved_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          number: string;
          seats?: number;
          status?: string;
          waiter_id?: string | null;
          reserved_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          number?: string;
          seats?: number;
          status?: string;
          waiter_id?: string | null;
          reserved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'dining_tables_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dining_tables_waiter_id_fkey';
            columns: ['waiter_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_categories: {
        Row: { id: string; restaurant_id: string; slug: string; name: string; sort_order: number };
        Insert: { id?: string; restaurant_id: string; slug: string; name: string; sort_order?: number };
        Update: { id?: string; restaurant_id?: string; slug?: string; name?: string; sort_order?: number };
        Relationships: [];
      };
      dishes: {
        Row: {
          id: string;
          restaurant_id: string;
          category_id: string;
          slug: string;
          name: string;
          description: string;
          price: number;
          image_key: string | null;
          calories: number | null;
          weight: number | null;
          rating: number | null;
          ingredients: string[];
          available: boolean;
          station: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          category_id: string;
          slug: string;
          name: string;
          description?: string;
          price: number;
          image_key?: string | null;
          calories?: number | null;
          weight?: number | null;
          rating?: number | null;
          ingredients?: string[];
          available?: boolean;
          station?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['dishes']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'dishes_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'menu_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'dishes_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
        ];
      };
      dish_option_groups: {
        Row: { id: string; dish_id: string; slug: string; title: string; layout: string; sort_order: number };
        Insert: { id?: string; dish_id: string; slug: string; title: string; layout: string; sort_order?: number };
        Update: Partial<Database['public']['Tables']['dish_option_groups']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'dish_option_groups_dish_id_fkey';
            columns: ['dish_id'];
            isOneToOne: false;
            referencedRelation: 'dishes';
            referencedColumns: ['id'];
          },
        ];
      };
      dish_extras: {
        Row: { id: string; dish_id: string; name: string; price: number; sort_order: number };
        Insert: { id?: string; dish_id: string; name: string; price?: number; sort_order?: number };
        Update: Partial<Database['public']['Tables']['dish_extras']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'dish_extras_dish_id_fkey';
            columns: ['dish_id'];
            isOneToOne: false;
            referencedRelation: 'dishes';
            referencedColumns: ['id'];
          },
        ];
      };
      dish_options: {
        Row: {
          id: string;
          group_id: string;
          slug: string;
          caption: string | null;
          label: string | null;
          price: number | null;
          is_default: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          group_id: string;
          slug: string;
          caption?: string | null;
          label?: string | null;
          price?: number | null;
          is_default?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['dish_options']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'dish_options_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'dish_option_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_id: string;
          number: number;
          status: string;
          serving_mode: string;
          comment: string | null;
          total: number;
          tip: number;
          split: Json | null;
          placed_at: string;
          ready_at: string | null;
          served_at: string | null;
          /** Кто принял заказ. У гостевого заказа официанта нет — null. */
          waiter_id: string | null;
          /** Сколько гостей за столом — официант вводит это первым шагом. */
          guests: number | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_id: string;
          number?: number;
          status?: string;
          serving_mode?: string;
          comment?: string | null;
          total?: number;
          tip?: number;
          split?: Json | null;
          placed_at?: string;
          ready_at?: string | null;
          served_at?: string | null;
          waiter_id?: string | null;
          guests?: number | null;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'orders_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'dining_tables';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          dish_id: string | null;
          title: string;
          options: string | null;
          comment: string | null;
          quantity: number;
          unit_price: number;
          /** Кому нести тарелку: индекс гостя (0-based), null — общее блюдо. */
          guest_index: number | null;
          /** Курс подачи в минутах от оформления; null — по готовности. */
          serve_after_minutes: number | null;
          /** Снимок модификаторов: «без лука · + сыр чеддер». */
          modifiers: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          dish_id?: string | null;
          title: string;
          options?: string | null;
          comment?: string | null;
          quantity: number;
          unit_price: number;
          guest_index?: number | null;
          serve_after_minutes?: number | null;
          modifiers?: string | null;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_dish_id_fkey';
            columns: ['dish_id'];
            isOneToOne: false;
            referencedRelation: 'dishes';
            referencedColumns: ['id'];
          },
        ];
      };
      waiter_calls: {
        Row: { id: string; table_id: string; reasons: string[]; created_at: string; resolved_at: string | null };
        Insert: { id?: string; table_id: string; reasons?: string[]; created_at?: string; resolved_at?: string | null };
        Update: Partial<Database['public']['Tables']['waiter_calls']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'waiter_calls_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'dining_tables';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
