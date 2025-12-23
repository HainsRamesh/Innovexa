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
      bookmarks: {
        Row: {
          created_at: string
          id: string
          problem_id: string | null
          solution_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id?: string | null
          solution_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string | null
          solution_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarks_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          comments: string | null
          conditions: string | null
          created_at: string
          expected_roi: number | null
          funding_amount: number
          id: string
          investor_id: string
          problem_id: string
          solution_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          conditions?: string | null
          created_at?: string
          expected_roi?: number | null
          funding_amount: number
          id?: string
          investor_id: string
          problem_id: string
          solution_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          conditions?: string | null
          created_at?: string
          expected_roi?: number | null
          funding_amount?: number
          id?: string
          investor_id?: string
          problem_id?: string
          solution_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          ai_complexity_score: number | null
          ai_summary: string | null
          budget_max: number | null
          budget_min: number | null
          category: Database["public"]["Enums"]["problem_category"]
          created_at: string
          deadline: string | null
          description: string
          id: string
          industry: string | null
          owner_id: string
          requirements: string[] | null
          status: Database["public"]["Enums"]["problem_status"]
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          ai_complexity_score?: number | null
          ai_summary?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: Database["public"]["Enums"]["problem_category"]
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          industry?: string | null
          owner_id: string
          requirements?: string[] | null
          status?: Database["public"]["Enums"]["problem_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          ai_complexity_score?: number | null
          ai_summary?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category?: Database["public"]["Enums"]["problem_category"]
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          industry?: string | null
          owner_id?: string
          requirements?: string[] | null
          status?: Database["public"]["Enums"]["problem_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_name: string | null
          organization_type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_name?: string | null
          organization_type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_name?: string | null
          organization_type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      solution_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          solution_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          solution_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          solution_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solution_replies_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      solutions: {
        Row: {
          ai_evaluation: string | null
          ai_match_score: number | null
          approach: string | null
          attachments: string[] | null
          created_at: string
          description: string
          estimated_cost: number | null
          id: string
          innovator_id: string
          problem_id: string
          status: Database["public"]["Enums"]["solution_status"]
          technology_stack: string[] | null
          timeline_weeks: number | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_evaluation?: string | null
          ai_match_score?: number | null
          approach?: string | null
          attachments?: string[] | null
          created_at?: string
          description: string
          estimated_cost?: number | null
          id?: string
          innovator_id: string
          problem_id: string
          status?: Database["public"]["Enums"]["solution_status"]
          technology_stack?: string[] | null
          timeline_weeks?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_evaluation?: string | null
          ai_match_score?: number | null
          approach?: string | null
          attachments?: string[] | null
          created_at?: string
          description?: string
          estimated_cost?: number | null
          id?: string
          innovator_id?: string
          problem_id?: string
          status?: Database["public"]["Enums"]["solution_status"]
          technology_stack?: string[] | null
          timeline_weeks?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "solutions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          organization_name: string | null
          organization_type: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          organization_name?: string | null
          organization_type?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          organization_name?: string | null
          organization_type?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "innovator" | "enterprise" | "investor"
      problem_category:
        | "technology"
        | "healthcare"
        | "sustainability"
        | "finance"
        | "education"
        | "infrastructure"
        | "manufacturing"
        | "agriculture"
        | "other"
      problem_status: "draft" | "open" | "in_review" | "matched" | "closed"
      solution_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "shortlisted"
        | "accepted"
        | "rejected"
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
      app_role: ["admin", "innovator", "enterprise", "investor"],
      problem_category: [
        "technology",
        "healthcare",
        "sustainability",
        "finance",
        "education",
        "infrastructure",
        "manufacturing",
        "agriculture",
        "other",
      ],
      problem_status: ["draft", "open", "in_review", "matched", "closed"],
      solution_status: [
        "draft",
        "submitted",
        "under_review",
        "shortlisted",
        "accepted",
        "rejected",
      ],
    },
  },
} as const
