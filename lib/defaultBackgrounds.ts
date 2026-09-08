export interface DefaultBackground {
  id: string;
  title: string;
  category: string;
  url: string;
  recommendedMode: 'ambient' | 'map';
  recommendedBlur: number;
  recommendedPixelate: boolean;
  recommendedDimming: number;
}

export const DEFAULT_BACKGROUNDS: DefaultBackground[] = [
  {
    id: 'castle-sunset',
    title: 'Castle Sunset',
    category: 'Kingdom',
    url: '/backgrounds/castle-sunset.jpg',
    recommendedMode: 'ambient',
    recommendedBlur: 14,
    recommendedPixelate: true,
    recommendedDimming: 25,
  },
  {
    id: 'forest-sword',
    title: 'Sacred Grove',
    category: 'Mythic',
    url: '/backgrounds/forest-sword.jpg',
    recommendedMode: 'ambient',
    recommendedBlur: 12,
    recommendedPixelate: true,
    recommendedDimming: 20,
  },
  {
    id: 'knight-legion',
    title: 'Knight Legion',
    category: 'Dark Fantasy',
    url: '/backgrounds/knight-legion.jpg',
    recommendedMode: 'ambient',
    recommendedBlur: 16,
    recommendedPixelate: false,
    recommendedDimming: 30,
  },
  {
    id: 'sunlit-cathedral',
    title: 'Sunlit Sanctuary',
    category: 'Gothic',
    url: '/backgrounds/sunlit-cathedral.jpg',
    recommendedMode: 'ambient',
    recommendedBlur: 18,
    recommendedPixelate: false,
    recommendedDimming: 25,
  },
];
