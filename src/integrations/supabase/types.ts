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
          innovation_id: string | null
          problem_id: string | null
          solution_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          innovation_id?: string | null
          problem_id?: string | null
          solution_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          innovation_id?: string | null
          problem_id?: string | null
          solution_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_innovation_id_fkey"
            columns: ["innovation_id"]
            isOneToOne: false
            referencedRelation: "innovations"
            referencedColumns: ["id"]
          },
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
      connections: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          participant_one: string
          participant_two: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_one: string
          participant_two: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_one?: string
          participant_two?: string
          updated_at?: string
        }
        Relationships: []
      }
      enterprise_innovation_views: {
        Row: {
          created_at: string
          enterprise_user_id: string
          id: string
          innovation_id: string
          view_date: string
        }
        Insert: {
          created_at?: string
          enterprise_user_id: string
          id?: string
          innovation_id: string
          view_date?: string
        }
        Update: {
          created_at?: string
          enterprise_user_id?: string
          id?: string
          innovation_id?: string
          view_date?: string
        }
        Relationships: []
      }
      innovation_likes: {
        Row: {
          created_at: string
          id: string
          innovation_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          innovation_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          innovation_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "innovation_likes_innovation_id_fkey"
            columns: ["innovation_id"]
            isOneToOne: false
            referencedRelation: "innovations"
            referencedColumns: ["id"]
          },
        ]
      }
      innovations: {
        Row: {
          category: Database["public"]["Enums"]["innovation_category"]
          cover_image_url: string
          created_at: string
          custom_category: string | null
          description: string
          gallery_urls: string[] | null
          id: string
          innovator_id: string
          like_count: number | null
          pdf_urls: string[] | null
          status: Database["public"]["Enums"]["innovation_status"]
          tagline: string
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
          with_product: string
          without_product: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["innovation_category"]
          cover_image_url: string
          created_at?: string
          custom_category?: string | null
          description: string
          gallery_urls?: string[] | null
          id?: string
          innovator_id: string
          like_count?: number | null
          pdf_urls?: string[] | null
          status?: Database["public"]["Enums"]["innovation_status"]
          tagline: string
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
          with_product: string
          without_product: string
        }
        Update: {
          category?: Database["public"]["Enums"]["innovation_category"]
          cover_image_url?: string
          created_at?: string
          custom_category?: string | null
          description?: string
          gallery_urls?: string[] | null
          id?: string
          innovator_id?: string
          like_count?: number | null
          pdf_urls?: string[] | null
          status?: Database["public"]["Enums"]["innovation_status"]
          tagline?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
          with_product?: string
          without_product?: string
        }
        Relationships: []
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
      investor_interests: {
        Row: {
          created_at: string
          id: string
          innovation_id: string | null
          interest_type: string
          investment_range: string | null
          investor_id: string
          investor_name: string
          message: string | null
          problem_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          innovation_id?: string | null
          interest_type: string
          investment_range?: string | null
          investor_id: string
          investor_name: string
          message?: string | null
          problem_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          innovation_id?: string | null
          interest_type?: string
          investment_range?: string | null
          investor_id?: string
          investor_name?: string
          message?: string | null
          problem_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_interests_innovation_id_fkey"
            columns: ["innovation_id"]
            isOneToOne: false
            referencedRelation: "innovations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_interests_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          text: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          text: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_avatar_url: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          data: Json | null
          group_key: string | null
          id: string
          is_read: boolean
          message: string
          priority: number
          read_at: string | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          data?: Json | null
          group_key?: string | null
          id?: string
          is_read?: boolean
          message: string
          priority?: number
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_avatar_url?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          data?: Json | null
          group_key?: string | null
          id?: string
          is_read?: boolean
          message?: string
          priority?: number
          read_at?: string | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      problem_likes: {
        Row: {
          created_at: string
          id: string
          problem_id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          problem_id: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          problem_id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "problem_likes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
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
          like_count: number | null
          owner_id: string
          requirements: string[] | null
          solutions_count: number | null
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
          like_count?: number | null
          owner_id: string
          requirements?: string[] | null
          solutions_count?: number | null
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
          like_count?: number | null
          owner_id?: string
          requirements?: string[] | null
          solutions_count?: number | null
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
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
          visibility: string
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
          visibility?: string
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
          visibility?: string
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
      user_blocks: {
        Row: {
          blocked_user_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_user_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      user_restrictions: {
        Row: {
          created_at: string
          id: string
          restricted_user_id: string
          restrictor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          restricted_user_id: string
          restrictor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          restricted_user_id?: string
          restrictor_id?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      approve_solution: { Args: { _solution_id: string }; Returns: undefined }
      can_investor_view_solution: {
        Args: { _solution_id: string; _user_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_actor_avatar_url?: string
          p_actor_id?: string
          p_actor_name?: string
          p_data?: Json
          p_group_key?: string
          p_message: string
          p_priority?: number
          p_related_id?: string
          p_related_type?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      get_or_create_conversation: {
        Args: { _user_one: string; _user_two: string }
        Returns: string
      }
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
      increment_innovation_view_count: {
        Args: { _innovation_id: string }
        Returns: undefined
      }
      is_user_blocked: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
      mark_all_notifications_read: {
        Args: { p_user_id: string }
        Returns: number
      }
      track_enterprise_video_view: {
        Args: { _innovation_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "innovator" | "enterprise" | "investor"
      innovation_category:
        | "ai"
        | "healthtech"
        | "fintech"
        | "climatetech"
        | "edtech"
        | "saas"
        | "hardware"
        | "web3"
        | "other"
      innovation_status: "draft" | "published" | "featured" | "archived"
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
      innovation_category: [
        "ai",
        "healthtech",
        "fintech",
        "climatetech",
        "edtech",
        "saas",
        "hardware",
        "web3",
        "other",
      ],
      innovation_status: ["draft", "published", "featured", "archived"],
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
