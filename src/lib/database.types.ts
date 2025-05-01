export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string | null
          slug: string
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description?: string | null
          slug: string
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string | null
          slug?: string
        }
      }
      items: {
        Row: {
          id: number
          created_at: string
          name: string
          price: number
          description: string | null
          duration_months: number | null
          category_id: number
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          price: number
          description?: string | null
          duration_months?: number | null
          category_id: number
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          price?: number
          description?: string | null
          duration_months?: number | null
          category_id?: number
        }
      }
      comments: {
        Row: {
          id: number
          created_at: string
          content: string
          user_id: string
          category_id: number | null
          item_id: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          content: string
          user_id: string
          category_id?: number | null
          item_id?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          content?: string
          user_id?: string
          category_id?: number | null
          item_id?: number | null
        }
      }
      images: {
        Row: {
          id: number
          created_at: string
          url: string
          item_id: number | null
          category_id: number | null
          type: string
        }
        Insert: {
          id?: number
          created_at?: string
          url: string
          item_id?: number | null
          category_id?: number | null
          type: string
        }
        Update: {
          id?: number
          created_at?: string
          url?: string
          item_id?: number | null
          category_id?: number | null
          type?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string | null
          avatar_url: string | null
          role: string
        }
        Insert: {
          id: string
          created_at?: string
          username?: string | null
          avatar_url?: string | null
          role?: string
        }
        Update: {
          id?: string
          created_at?: string
          username?: string | null
          avatar_url?: string | null
          role?: string
        }
      }
      services: {
        Row: {
          id: number
          created_at: string
          name: string
          description: string
          category_id: number
          category: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          description: string
          category_id: number
          category?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          description?: string
          category_id?: number
          category?: string | null
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