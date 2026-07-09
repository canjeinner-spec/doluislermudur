import type { PlatformId } from '@/components/icons';

export type RoomStatus = 'watching' | 'waiting';
export type ParticipantRole = 'host' | 'cohost' | 'member';

export interface Participant {
  id: string;
  name: string;
  handle: string;
  role: ParticipantRole;
  online: boolean;
  watching: boolean;
  /** Avatar accent used for the monogram fallback. */
  tint: string;
}

export interface Room {
  id: string;
  title: string;
  subtitle: string;
  platform: PlatformId;
  platformLabel: string;
  status: RoomStatus;
  isPublic: boolean;
  hostName: string;
  participantCount: number;
  maxParticipants: number;
  /** Two-stop gradient standing in for a movie poster. */
  posterIndex: number;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  tint: string;
  text: string;
  time: string;
  /** True when the local user sent it (right-aligned bubble). */
  mine?: boolean;
}

export interface Platform {
  id: PlatformId;
  name: string;
  description: string;
  /** Domain shown in the in-app browser chrome during sign-in. */
  domain: string;
  loginUrl: string;
}
