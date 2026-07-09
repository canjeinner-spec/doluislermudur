import { palette } from '@/theme';

import type { ChatMessage, Participant, Room } from './types';

const tints = [
  '#C87F4C',
  '#5B8DEF',
  '#4ED08A',
  '#E0685E',
  '#D9A441',
  '#8A6FE0',
  '#3FB6C4',
  '#D067A8',
];

function makeParticipants(names: [string, string][], count: number): Participant[] {
  return names.slice(0, count).map(([name, handle], i) => ({
    id: `p${i}`,
    name,
    handle,
    role: i === 0 ? 'host' : i === 1 ? 'cohost' : 'member',
    online: i % 4 !== 3,
    watching: i % 3 !== 2,
    tint: tints[i % tints.length],
  }));
}

const crew: [string, string][] = [
  ['Can', '@cantrk'],
  ['Zeynep', '@zey'],
  ['Ali', '@alih'],
  ['Emir', '@emir'],
  ['Deniz', '@dnz'],
  ['Mert', '@mert'],
  ['Selin', '@selin'],
  ['Berke', '@berke'],
];

export const ROOMS: Room[] = [
  {
    id: 'r1',
    title: 'Interstellar',
    subtitle: 'Christopher Nolan',
    platform: 'netflix',
    platformLabel: 'Netflix',
    status: 'watching',
    isPublic: true,
    hostName: 'Can',
    participantCount: 9,
    maxParticipants: 10,
    posterIndex: 0,
    participants: makeParticipants(crew, 8),
  },
  {
    id: 'r2',
    title: 'The Dark Knight',
    subtitle: 'Christopher Nolan',
    platform: 'youtube',
    platformLabel: 'YouTube',
    status: 'waiting',
    isPublic: true,
    hostName: 'Zeynep',
    participantCount: 6,
    maxParticipants: 8,
    posterIndex: 3,
    participants: makeParticipants(crew, 6),
  },
  {
    id: 'r3',
    title: 'The Office (S5E3)',
    subtitle: 'Company Picnic',
    platform: 'prime',
    platformLabel: 'Prime Video',
    status: 'watching',
    isPublic: false,
    hostName: 'Ali',
    participantCount: 7,
    maxParticipants: 10,
    posterIndex: 5,
    participants: makeParticipants(crew, 7),
  },
  {
    id: 'r4',
    title: 'Inception',
    subtitle: 'Christopher Nolan',
    platform: 'gdrive',
    platformLabel: 'Google Drive',
    status: 'waiting',
    isPublic: true,
    hostName: 'Deniz',
    participantCount: 4,
    maxParticipants: 8,
    posterIndex: 2,
    participants: makeParticipants(crew, 4),
  },
  {
    id: 'r5',
    title: 'Dune: Part Two',
    subtitle: 'Denis Villeneuve',
    platform: 'netflix',
    platformLabel: 'Netflix',
    status: 'watching',
    isPublic: true,
    hostName: 'Selin',
    participantCount: 5,
    maxParticipants: 12,
    posterIndex: 1,
    participants: makeParticipants(crew, 5),
  },
  {
    id: 'r6',
    title: 'Blade Runner 2049',
    subtitle: 'Denis Villeneuve',
    platform: 'youtube',
    platformLabel: 'YouTube',
    status: 'waiting',
    isPublic: false,
    hostName: 'Mert',
    participantCount: 3,
    maxParticipants: 6,
    posterIndex: 4,
    participants: makeParticipants(crew, 3),
  },
];

/** Chat starts empty — real messages are added as participants type. */
export const CHAT_SEED: ChatMessage[] = [];

export const CURRENT_USER = {
  id: 'me',
  name: 'Can',
  handle: '@cantrk',
  tint: palette.copper,
};
