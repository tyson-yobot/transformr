import { TextStyle } from 'react-native';

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  stat: { fontSize: 28, fontWeight: '700' as const },
  statSmall: { fontSize: 20, fontWeight: '600' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
