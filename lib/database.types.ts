export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          quantity: number
          student_limit: number
          limit_duration: number
          limit_duration_minutes: number
          unit: string | null
          is_weighed: boolean
          has_limit: boolean
          cost: number | null
          supplier: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          category: string
          quantity: number
          student_limit: number
          limit_duration: number
          limit_duration_minutes: number
          unit?: string | null
          is_weighed: boolean
          has_limit: boolean
          cost?: number | null
          supplier?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          quantity?: number
          student_limit?: number
          limit_duration?: number
          limit_duration_minutes?: number
          unit?: string | null
          is_weighed?: boolean
          has_limit?: boolean
          cost?: number | null
          supplier?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          type: string
          item_id: string
          item_name: string
          quantity: number
          user_id: string
          timestamp: string
          unit: string | null
          cost: number | null
          total_cost: number | null
        }
        Insert: {
          id: string
          type: string
          item_id: string
          item_name: string
          quantity: number
          user_id: string
          timestamp: string
          unit?: string | null
          cost?: number | null
          total_cost?: number | null
        }
        Update: {
          id?: string
          type?: string
          item_id?: string
          item_name?: string
          quantity?: number
          user_id?: string
          timestamp?: string
          unit?: string | null
          cost?: number | null
          total_cost?: number | null
        }
      }
      student_checkouts: {
        Row: {
          id: string
          student_id: string
          item_id: string
          quantity: number
          timestamp: string
          unit: string | null
        }
        Insert: {
          id?: string
          student_id: string
          item_id: string
          quantity: number
          timestamp: string
          unit?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          item_id?: string
          quantity?: number
          timestamp?: string
          unit?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          student_id: string
          status: string
          created_at: string
          fulfilled_at: string | null
          notified: boolean
          error: string | null
        }
        Insert: {
          id: string
          student_id: string
          status: string
          created_at: string
          fulfilled_at?: string | null
          notified: boolean
          error?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          status?: string
          created_at?: string
          fulfilled_at?: string | null
          notified?: boolean
          error?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string
          item_name: string
          quantity: number
          category: string
          unit: string | null
        }
        Insert: {
          id?: string
          order_id: string
          item_id: string
          item_name: string
          quantity: number
          category: string
          unit?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string
          item_name?: string
          quantity?: number
          category?: string
          unit?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
