import { NodeType } from '@/types/node';
import {
  Sparkles, User, MapPin, Zap, Wand2, Calendar, Users, Box, ScrollText, Lightbulb, CircleHelp, Globe,
  type LucideIcon,
} from 'lucide-react';

export interface NodeTypeConfig {
  label: string;
  icon: LucideIcon;
  symbol: string;
  color: string;
  bg: string;
  border: string;
}

export const NODE_TYPE_CONFIG: Record<NodeType, NodeTypeConfig> = {
  ROOT: {
    label: 'Root Idea',
    icon: Globe,
    symbol: '✻',
    color: '#8A4938', // rust
    bg: 'rgba(138, 73, 56, 0.08)',
    border: 'rgba(138, 73, 56, 0.3)',
  },
  CREATURE: {
    label: 'Creature',
    icon: Sparkles,
    symbol: '●',
    color: '#9E6B47', // ochre
    bg: 'rgba(158, 107, 71, 0.08)',
    border: 'rgba(158, 107, 71, 0.25)',
  },
  CHARACTER: {
    label: 'Character',
    icon: User,
    symbol: '●',
    color: '#657560', // olive
    bg: 'rgba(101, 117, 96, 0.08)',
    border: 'rgba(101, 117, 96, 0.25)',
  },
  LOCATION: {
    label: 'Location',
    icon: MapPin,
    symbol: '▲',
    color: '#596A72', // slate
    bg: 'rgba(89, 106, 114, 0.08)',
    border: 'rgba(89, 106, 114, 0.25)',
  },
  ABILITY: {
    label: 'Ability',
    icon: Zap,
    symbol: '◆',
    color: '#A06D3B', // warm amber
    bg: 'rgba(160, 109, 59, 0.08)',
    border: 'rgba(160, 109, 59, 0.25)',
  },
  MAGIC: {
    label: 'Magic',
    icon: Wand2,
    symbol: '✦',
    color: '#7B5E7B', // muted plum
    bg: 'rgba(123, 94, 123, 0.08)',
    border: 'rgba(123, 94, 123, 0.25)',
  },
  EVENT: {
    label: 'Event',
    icon: Calendar,
    symbol: '■',
    color: '#8A4938', // rust
    bg: 'rgba(138, 73, 56, 0.08)',
    border: 'rgba(138, 73, 56, 0.25)',
  },
  FACTION: {
    label: 'Faction',
    icon: Users,
    symbol: '⬟',
    color: '#4B6B75', // deep teal
    bg: 'rgba(75, 107, 117, 0.08)',
    border: 'rgba(75, 107, 117, 0.25)',
  },
  OBJECT: {
    label: 'Object',
    icon: Box,
    symbol: '⬡',
    color: '#857865', // clay
    bg: 'rgba(133, 120, 101, 0.08)',
    border: 'rgba(133, 120, 101, 0.25)',
  },
  LORE: {
    label: 'Lore',
    icon: ScrollText,
    symbol: '○',
    color: '#73716B', // muted graphite
    bg: 'rgba(115, 113, 107, 0.08)',
    border: 'rgba(115, 113, 107, 0.25)',
  },
  CONCEPT: {
    label: 'Concept',
    icon: Lightbulb,
    symbol: '◇',
    color: '#657560', // sage
    bg: 'rgba(101, 117, 96, 0.08)',
    border: 'rgba(101, 117, 96, 0.25)',
  },
  QUESTION: {
    label: 'Question',
    icon: CircleHelp,
    symbol: '?',
    color: '#A29E95', // tertiary gray
    bg: 'rgba(162, 158, 149, 0.08)',
    border: 'rgba(162, 158, 149, 0.25)',
  },
};

export const NODE_TYPES_LIST: NodeType[] = [
  'CREATURE', 'CHARACTER', 'LOCATION', 'ABILITY', 'MAGIC',
  'EVENT', 'FACTION', 'OBJECT', 'LORE', 'CONCEPT', 'QUESTION'
];
