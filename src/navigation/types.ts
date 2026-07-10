import type { PlatformId } from '@/components/icons';

/** Draft assembled in Create Room, carried through platform + sign-in. */
export interface RoomDraft {
  isPublic: boolean;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  CreateRoom: undefined;
  PlatformSelect: { draft: RoomDraft; returnToRoom?: boolean; roomId?: string };
  WebViewLogin: { platformId: PlatformId; draft: RoomDraft; returnToRoom?: boolean; roomId?: string };
  Room: {
    roomId?: string;
    draft?: RoomDraft;
    platformId?: PlatformId;
    /** Title captured from the provider page (the content being watched). */
    title?: string;
    /** The provider content URL to load in the room's embedded player. */
    contentUrl?: string;
  };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
