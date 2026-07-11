export { supabase } from './supabase';
export { isBackendConfigured } from './config';
export { checkEmailPolicy, ALLOWED_EMAIL_DOMAINS } from './emailPolicy';
export {
  ensureSession,
  updateDisplayName,
  uploadAvatar,
  fetchMyProfile,
  emailExists,
  signIn,
  register,
  setHandle,
  signOut,
  deleteAccount,
} from './auth';
export {
  createRoom,
  joinRoom,
  leaveRoom,
  currentUserId,
  updateRoomContent,
  kickMember,
  inviteByHandle,
  addWatchMinutes,
  fetchRooms,
  fetchRoom,
  fetchMembers,
  fetchMessages,
  sendMessage,
  subscribeMessages,
  openRoomPresence,
  toRoom,
} from './rooms';
export type { MessageWithAuthor, PresenceUser } from './rooms';
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
