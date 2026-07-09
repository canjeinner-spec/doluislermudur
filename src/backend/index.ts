export { supabase } from './supabase';
export { isBackendConfigured } from './config';
export { ensureSession, updateDisplayName } from './auth';
export type {
  AuthedUser,
  Database,
  ProfileRow,
  RoomRow,
  RoomMemberRow,
  MessageRow,
  SyncEvent,
} from './types';
