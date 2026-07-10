export { supabase } from './supabase';
export { isBackendConfigured } from './config';
export {
  ensureSession,
  updateDisplayName,
  fetchMyProfile,
  emailExists,
  signIn,
  register,
  setHandle,
} from './auth';
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
  fetchMessages,
  sendMessage,
  subscribeMessages,
  toRoom,
} from './rooms';
export type { MessageWithAuthor } from './rooms';
export { useRooms, useRoomSession, useMyProfile, useMyId, useAuth } from './hooks';
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
