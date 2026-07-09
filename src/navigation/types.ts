import type { PlatformId } from '@/components/icons';

/** Draft assembled in Create Room, carried through platform + sign-in. */
export interface RoomDraft {
  isPublic: boolean;
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
    /** Title captured from the provider page (the content being watched). */
    title?: string;
  };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
