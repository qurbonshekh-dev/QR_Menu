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
          /** Стол объединён с другим: счёт и заказы живут на главном столе. */
          merged_into: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          number: string;
          seats?: number;
          status?: string;
          waiter_id?: string | null;
          reserved_at?: string | null;
          merged_into?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          number?: string;
          seats?: number;
          status?: string;
          waiter_id?: string | null;
          reserved_at?: string | null;
          merged_into?: string | null;
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
          protein: number | null;
          fat: number | null;
          carbs: number | null;
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
          protein?: number | null;
          fat?: number | null;
          carbs?: number | null;
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
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          kind: string;
          status: string;
          customer_name: string | null;
          customer_phone: string;
          street: string | null;
          house: string | null;
          entrance: string | null;
          floor: string | null;
          flat: string | null;
          courier_comment: string | null;
          leave_at_door: boolean;
          call_on_arrival: boolean;
          payment: string;
          change_from: number | null;
          delivery_fee: number;
          service_fee: number;
          discount: number;
          promo_code: string | null;
          created_at: string;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          kind: string;
          status?: string;
          customer_name?: string | null;
          customer_phone: string;
          street?: string | null;
          house?: string | null;
          entrance?: string | null;
          floor?: string | null;
          flat?: string | null;
          courier_comment?: string | null;
          leave_at_door?: boolean;
          call_on_arrival?: boolean;
          payment?: string;
          change_from?: number | null;
          delivery_fee?: number;
          service_fee?: number;
          discount?: number;
          promo_code?: string | null;
          created_at?: string;
          delivered_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['deliveries']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'deliveries_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: true;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          /** У доставки стола нет. */
          table_id: string | null;
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
          /** Откуда заказ: зал, доставка, самовывоз, стойка кассы. */
          channel: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_id?: string | null;
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
          channel?: string;
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
          /** Состояние тарелки: queued / cooking / ready / served. */
          status: string;
          ready_at: string | null;
          served_at: string | null;
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
          status?: string;
          ready_at?: string | null;
          served_at?: string | null;
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
      reservations: {
        Row: {
          id: string;
          table_id: string;
          guest_name: string | null;
          guest_phone: string | null;
          guests: number | null;
          starts_at: string;
          created_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          table_id: string;
          guest_name?: string | null;
          guest_phone?: string | null;
          guests?: number | null;
          starts_at: string;
          created_at?: string;
          cancelled_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['reservations']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'reservations_table_id_fkey';
            columns: ['table_id'];
            isOneToOne: false;
            referencedRelation: 'dining_tables';
            referencedColumns: ['id'];
          },
        ];
      };
      shifts: {
        Row: {
          id: string;
          staff_id: string;
          starts_at: string;
          ends_at: string;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          starts_at: string;
          ends_at: string;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shifts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'shifts_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
        ];
      };
      staff_goals: {
        Row: {
          id: string;
          staff_id: string;
          title: string;
          target: number;
          created_at: string;
          achieved_at: string | null;
        };
        Insert: {
          id?: string;
          staff_id: string;
          title: string;
          target: number;
          created_at?: string;
          achieved_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['staff_goals']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'staff_goals_staff_id_fkey';
            columns: ['staff_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
        ];
      };
      waiter_calls: {
        Row: {
          id: string;
          table_id: string;
          reasons: string[];
          /** Сообщение гостя своими словами — в отличие от reasons, это не выбор из списка. */
          message: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          table_id: string;
          reasons?: string[];
          message?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
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
      cash_shifts: {
        Row: {
          id: string;
          restaurant_id: string;
          cashier_id: string;
          opened_at: string;
          closed_at: string | null;
          /** Наличные в ящике на начало смены. */
          cash_start: number;
          /** Сколько насчитали при инкассации — расхождение вычислить нельзя. */
          cash_counted: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          cashier_id: string;
          opened_at?: string;
          closed_at?: string | null;
          cash_start?: number;
          cash_counted?: number | null;
          note?: string | null;
        };
        Update: Partial<Database['public']['Tables']['cash_shifts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'cash_shifts_cashier_id_fkey';
            columns: ['cashier_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
        ];
      };
      receipts: {
        Row: {
          id: string;
          restaurant_id: string;
          number: number;
          cash_shift_id: string | null;
          cashier_id: string | null;
          /** Снимок: чек не следует за пересадкой стола. */
          table_number: string | null;
          channel: string;
          subtotal: number;
          discount: number;
          discount_reason: string | null;
          tip: number;
          total: number;
          status: string;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          number?: number;
          cash_shift_id?: string | null;
          cashier_id?: string | null;
          table_number?: string | null;
          channel?: string;
          subtotal?: number;
          discount?: number;
          discount_reason?: string | null;
          tip?: number;
          total?: number;
          status?: string;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['receipts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'receipts_cash_shift_id_fkey';
            columns: ['cash_shift_id'];
            isOneToOne: false;
            referencedRelation: 'cash_shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receipts_cashier_id_fkey';
            columns: ['cashier_id'];
            isOneToOne: false;
            referencedRelation: 'staff';
            referencedColumns: ['id'];
          },
        ];
      };
      receipt_orders: {
        Row: { receipt_id: string; order_id: string };
        Insert: { receipt_id: string; order_id: string };
        Update: Partial<Database['public']['Tables']['receipt_orders']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'receipt_orders_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'receipt_orders_receipt_id_fkey';
            columns: ['receipt_id'];
            isOneToOne: false;
            referencedRelation: 'receipts';
            referencedColumns: ['id'];
          },
        ];
      };
      receipt_items: {
        Row: {
          id: string;
          receipt_id: string;
          title: string;
          options: string | null;
          modifiers: string | null;
          quantity: number;
          unit_price: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          title: string;
          options?: string | null;
          modifiers?: string | null;
          quantity: number;
          unit_price: number;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['receipt_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'receipt_items_receipt_id_fkey';
            columns: ['receipt_id'];
            isOneToOne: false;
            referencedRelation: 'receipts';
            referencedColumns: ['id'];
          },
        ];
      };
      receipt_payments: {
        Row: {
          id: string;
          receipt_id: string;
          method: string;
          /** Отрицательная сумма — возврат. */
          amount: number;
          change_given: number;
          provider_ref: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          method: string;
          amount: number;
          change_given?: number;
          provider_ref?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['receipt_payments']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'receipt_payments_receipt_id_fkey';
            columns: ['receipt_id'];
            isOneToOne: false;
            referencedRelation: 'receipts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      move_table_orders: { Args: { from_table: string; to_table: string }; Returns: undefined };
      merge_tables: { Args: { primary_table: string; secondary_table: string }; Returns: undefined };
      unmerge_table: { Args: { secondary_table: string }; Returns: undefined };
      refresh_table_status: { Args: { target: string }; Returns: undefined };
      close_bill: {
        Args: {
          p_order_ids: string[];
          p_payments?: Json;
          p_cashier_id?: string;
          p_cash_shift_id?: string;
          p_discount?: number;
          p_discount_reason?: string;
          p_tip?: number;
        };
        /** id выписанного чека. */
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
