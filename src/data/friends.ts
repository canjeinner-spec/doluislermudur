/** Friends exist ONLY to receive room invitations — there is no DM system. */
export interface Friend {
  id: string;
  name: string;
  handle: string;
  tint: string;
  online: boolean;
}

export const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Zeynep Kaya', handle: '@zey', tint: '#5B8DEF', online: true },
  { id: 'f2', name: 'Ali Han', handle: '@alih', tint: '#4ED08A', online: true },
  { id: 'f3', name: 'Emir Yılmaz', handle: '@emir', tint: '#E0685E', online: false },
  { id: 'f4', name: 'Deniz Aras', handle: '@dnz', tint: '#D9A441', online: true },
  { id: 'f5', name: 'Selin Su', handle: '@selin', tint: '#8A6FE0', online: false },
  { id: 'f6', name: 'Mert Demir', handle: '@mert', tint: '#3FB6C4', online: true },
  { id: 'f7', name: 'Berke Yıldız', handle: '@berke', tint: '#D067A8', online: false },
];
