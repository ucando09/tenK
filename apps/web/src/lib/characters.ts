export interface Character {
  id:    string;
  name:  string;
  emoji: string;
  color: string;  // accent ring / highlight
  bg:    string;  // avatar background
}

export const CHARACTERS: Character[] = [
  { id: 'owl',    name: 'Owl',    emoji: '🦉', color: '#7c6cf0', bg: '#1a1640' },
  { id: 'fox',    name: 'Fox',    emoji: '🦊', color: '#f0906c', bg: '#301810' },
  { id: 'bear',   name: 'Bear',   emoji: '🐻', color: '#c8a060', bg: '#251808' },
  { id: 'cat',    name: 'Cat',    emoji: '🐱', color: '#60b8f0', bg: '#081828' },
  { id: 'robot',  name: 'Robot',  emoji: '🤖', color: '#4cdf90', bg: '#041c10' },
  { id: 'wizard', name: 'Wizard', emoji: '🧙', color: '#c060f0', bg: '#180830' },
  { id: 'ninja',  name: 'Ninja',  emoji: '🥷', color: '#aaaaaa', bg: '#101010' },
  { id: 'alien',  name: 'Alien',  emoji: '👽', color: '#80ff80', bg: '#061406' },
];

export const DEFAULT_CHARACTER_ID = 'owl';

export function getCharacter(id: string | null | undefined): Character {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}
