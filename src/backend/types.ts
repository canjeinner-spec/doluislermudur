/**
 * Hand-written types mirroring supabase/schema.sql. Kept in sync manually (the
 * schema is small); regenerate with the Supabase CLI later if it grows.
 */

// NOTE: these must be `type` aliases (not `interface`) so they satisfy
// Supabase's `Record<string, unknown>` GenericTable constraint — interfaces
// have no implicit index signature and would silently degrade the client to
// `never`.
export type ProfileRow = {
  id: string; // = auth.users.id
  handle: string;
  display_name: string;
  avatar_tint: string;
  minutes_watched: number;
  rooms_hosted: number;
  created_at: string;
};

export type RoomRow = {
  id: string;
  code: string; // short join code, e.g. 8F3K2Q
  title: string;
  platform: string;
  platform_label: string;
  content_url: string | null;
  host_id: string;
  is_public: boolean;
  status: 'watching' | 'waiting';
  member_count: number; // maintained by trigger; the list sorts on this
  max_participants: number;
  created_at: string;
};

export type RoomMemberRow = {
  room_id: string;
  user_id: string;
  role: 'host' | 'cohost' | 'member';
  joined_at: string;
};

export type RoomBanRow = {
  room_id: string;
  user_id: string;
  banned_at: string;
};

export type MessageRow = {
  id: string;
  room_id: string;
  author_id: string;
  text: string;
  created_at: string;
};

/** Minimal Database shape for the typed Supabase client. */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      rooms: {
        Row: RoomRow;
        Insert: Partial<RoomRow> & { host_id: string; title: string; platform: string };
        Update: Partial<RoomRow>;
        Relationships: [];
      };
      room_members: {
        Row: RoomMemberRow;
        Insert: Partial<RoomMemberRow> & { room_id: string; user_id: string };
        Update: Partial<RoomMemberRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Partial<MessageRow> & { room_id: string; author_id: string; text: string };
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      room_bans: {
        Row: RoomBanRow;
        Insert: Partial<RoomBanRow> & { room_id: string; user_id: string };
        Update: Partial<RoomBanRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      kick_member: {
        Args: { p_room: string; p_user: string };
        Returns: undefined;
      };
      invite_member: {
        Args: { p_room: string; p_handle: string };
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

/** The identity our app carries once signed in (anonymous or real). */
export interface AuthedUser {
  id: string;
  handle: string;
  displayName: string;
  avatarTint: string;
}

/**
 * Realtime playback-sync payloads broadcast on a room channel. Host-authoritative:
 * only the host emits `control` and `heartbeat`; followers apply them.
 */
export type SyncEvent =
  | { kind: 'control'; action: 'play' | 'pause' | 'seek'; time: number; at: number }
  | { kind: 'heartbeat'; time: number; paused: boolean; at: number }
  | { kind: 'content'; url: string; title: string; at: number }
  // A follower asks the host to push its current state right now (on join).
  | { kind: 'request'; at: number }
  // The host removed a user — that user's client ejects itself from the room.
  | { kind: 'kicked'; userId: string; at: number };
