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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          joined_at: string | null
          profile_id: string
          role: Database["public"]["Enums"]["group_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          joined_at?: string | null
          profile_id: string
          role?: Database["public"]["Enums"]["group_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          joined_at?: string | null
          profile_id?: string
          role?: Database["public"]["Enums"]["group_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          archived: boolean
          created_at: string
          default_language: string
          description: string | null
          group_code: string
          id: string
          image_url: string | null
          is_private: boolean
          max_members: number | null
          name: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          default_language?: string
          description?: string | null
          group_code?: string
          id?: string
          image_url?: string | null
          is_private?: boolean
          max_members?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          default_language?: string
          description?: string | null
          group_code?: string
          id?: string
          image_url?: string | null
          is_private?: boolean
          max_members?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_team_players: {
        Row: {
          id: string
          match_team_id: string
          player_id: string
          session_player_id: string | null
        }
        Insert: {
          id?: string
          match_team_id: string
          player_id: string
          session_player_id?: string | null
        }
        Update: {
          id?: string
          match_team_id?: string
          player_id?: string
          session_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_team_players_match_team_id_fkey"
            columns: ["match_team_id"]
            isOneToOne: false
            referencedRelation: "match_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_team_players_session_player_fk"
            columns: ["session_player_id"]
            isOneToOne: false
            referencedRelation: "session_players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_teams: {
        Row: {
          created_at: string
          id: string
          match_id: string
          score: number
          team_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          score?: number
          team_number: number
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          score?: number
          team_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_teams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          archived: boolean
          created_at: string
          group_id: string | null
          id: string
          linked_profile_id: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["player_status"] | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          group_id?: string | null
          id?: string
          linked_profile_id?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["player_status"] | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          group_id?: string | null
          id?: string
          linked_profile_id?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["player_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_linked_profile_fk"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          last_seen_at: string | null
          onboarding_completed: boolean
          phone: string
          preferred_language: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          last_seen_at?: string | null
          onboarding_completed?: boolean
          phone: string
          preferred_language?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_seen_at?: string | null
          onboarding_completed?: boolean
          phone?: string
          preferred_language?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_players: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          player_id: string
          player_name_snapshot: string
          session_id: string
          status: Database["public"]["Enums"]["session_player_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          player_id: string
          player_name_snapshot: string
          session_id: string
          status?: Database["public"]["Enums"]["session_player_status"]
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          player_id?: string
          player_name_snapshot?: string
          session_id?: string
          status?: Database["public"]["Enums"]["session_player_status"]
        }
        Relationships: [
          {
            foreignKeyName: "session_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_runtime_events: {
        Row: {
          created_at: string
          event_type: string
          group_id: string | null
          id: string
          message: string
          player_id: string | null
          related_player_id: string | null
          round_number: number | null
          session_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          group_id?: string | null
          id?: string
          message: string
          player_id?: string | null
          related_player_id?: string | null
          round_number?: number | null
          session_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          group_id?: string | null
          id?: string
          message?: string
          player_id?: string | null
          related_player_id?: string | null
          round_number?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_runtime_events_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_runtime_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_runtime_events_related_player_id_fkey"
            columns: ["related_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_runtime_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_schedule_matches: {
        Row: {
          court_number: number | null
          explanation: string[]
          id: string
          is_completed: boolean
          match_id: string
          match_status: string
          modified: boolean
          origin: string
          position: number
          protection: string
          result_team1: number | null
          result_team2: number | null
          schedule_id: string
          team_a_player1: string
          team_a_player2: string
          team_b_player1: string
          team_b_player2: string
          warnings: string[]
        }
        Insert: {
          court_number?: number | null
          explanation?: string[]
          id?: string
          is_completed?: boolean
          match_id: string
          match_status?: string
          modified?: boolean
          origin: string
          position: number
          protection: string
          result_team1?: number | null
          result_team2?: number | null
          schedule_id: string
          team_a_player1: string
          team_a_player2: string
          team_b_player1: string
          team_b_player2: string
          warnings?: string[]
        }
        Update: {
          court_number?: number | null
          explanation?: string[]
          id?: string
          is_completed?: boolean
          match_id?: string
          match_status?: string
          modified?: boolean
          origin?: string
          position?: number
          protection?: string
          result_team1?: number | null
          result_team2?: number | null
          schedule_id?: string
          team_a_player1?: string
          team_a_player2?: string
          team_b_player1?: string
          team_b_player2?: string
          warnings?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "session_schedule_matches_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_matches_team_a_player1_fkey"
            columns: ["team_a_player1"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_matches_team_a_player2_fkey"
            columns: ["team_a_player2"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_matches_team_b_player1_fkey"
            columns: ["team_b_player1"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_matches_team_b_player2_fkey"
            columns: ["team_b_player2"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      session_schedule_player_states: {
        Row: {
          player_id: string
          replaced_by_player_id: string | null
          schedule_id: string
          session_player_id: string | null
          status: string
        }
        Insert: {
          player_id: string
          replaced_by_player_id?: string | null
          schedule_id: string
          session_player_id?: string | null
          status: string
        }
        Update: {
          player_id?: string
          replaced_by_player_id?: string | null
          schedule_id?: string
          session_player_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_player_states_session_player_fk"
            columns: ["session_player_id"]
            isOneToOne: false
            referencedRelation: "session_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_player_states_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_player_states_replaced_by_player_id_fkey"
            columns: ["replaced_by_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedule_player_states_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      session_schedules: {
        Row: {
          created_at: string
          current_match_index: number | null
          format_id: string
          group_id: string | null
          id: string
          session_id: string
          target_count: number
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          current_match_index?: number | null
          format_id: string
          group_id?: string | null
          id?: string
          session_id: string
          target_count: number
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          current_match_index?: number | null
          format_id?: string
          group_id?: string | null
          id?: string
          session_id?: string
          target_count?: number
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_schedules_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedules_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          archived: boolean
          booking_duration: number
          court_count: number
          created_at: string
          created_by_profile_id: string | null
          group_id: string | null
          id: string
          name: string
          notes: string | null
          scheduled_at: string
          session_date: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          archived?: boolean
          booking_duration?: number
          court_count?: number
          created_at?: string
          created_by_profile_id?: string | null
          group_id?: string | null
          id?: string
          name: string
          notes?: string | null
          scheduled_at: string
          session_date?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          archived?: boolean
          booking_duration?: number
          court_count?: number
          created_at?: string
          created_by_profile_id?: string | null
          group_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          scheduled_at?: string
          session_date?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_created_by_profile_fk"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_group_fk"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_group_code: { Args: never; Returns: string }
    }
    Enums: {
      group_role: "OWNER" | "ADMIN" | "MEMBER"
      member_status: "PENDING" | "ACTIVE" | "LEFT" | "REMOVED" | "BANNED"
      player_status: "ACTIVE" | "INACTIVE" | "LEFT" | "ARCHIVED"
      session_player_status:
        | "REGISTERED"
        | "PLAYING"
        | "RESTING"
        | "LEFT"
        | "REPLACED"
        | "ABSENT"
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
      group_role: ["OWNER", "ADMIN", "MEMBER"],
      member_status: ["PENDING", "ACTIVE", "LEFT", "REMOVED", "BANNED"],
      player_status: ["ACTIVE", "INACTIVE", "LEFT", "ARCHIVED"],
      session_player_status: [
        "REGISTERED",
        "PLAYING",
        "RESTING",
        "LEFT",
        "REPLACED",
        "ABSENT",
      ],
    },
  },
} as const
