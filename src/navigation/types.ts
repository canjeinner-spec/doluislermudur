import type { PlatformId } from '@/components/icons';

/** Draft assembled in Create Room, carried through platform + sign-in. */
export interface RoomDraft {
  name: string;
  description: string;
  isPublic: boolean;
  maxParticipants: number;
}

export type RootStackParamList = {
  Home: undefined;
  CreateRoom: undefined;
  PlatformSelect: { draft: RoomDraft };
  WebViewLogin: { platformId: PlatformId; draft: RoomDraft };
  Room: {
    roomId?: string;
    draft?: RoomDraft;
    platformId?: PlatformId;
  };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
