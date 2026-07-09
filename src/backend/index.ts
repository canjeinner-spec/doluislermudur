export { supabase } from './supabase';
export { isBackendConfigured } from './config';
export { ensureSession, updateDisplayName } from './auth';
export {
  createRoom,
  joinRoom,
  leaveRoom,
  updateRoomContent,
  kickMember,
  inviteByHandle,
  fetchRooms,
  fetchRoom,
  fetchMembers,
  toRoom,
} from './rooms';
export { useRooms, useRoomSession } from './hooks';
export type { RoomSession } from './hooks';
export type {
  AuthedUser,
  Database,
  ProfileRow,
  RoomRow,
  RoomMemberRow,
  MessageRow,
  SyncEvent,
} from './types';
