import { TextStyle } from 'react-native';

export const fontFamilies = {
  heading: 'Inter-Bold',
  headingSemiBold: 'Inter-SemiBold',
  body: 'Inter-Regular',
  bodySemiBold: 'Inter-SemiBold',
  mono: 'JetBrainsMono-Regular',
  monoSemiBold: 'JetBrainsMono-SemiBold',
  monoBold: 'JetBrainsMono-Bold',
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, fontFamily: fontFamilies.heading },
  h1: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, fontFamily: fontFamilies.heading },
  h2: { fontSize: 20, fontWeight: '600' as const, lineHeight: 26, fontFamily: fontFamilies.headingSemiBold },
  h3: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22, fontFamily: fontFamilies.headingSemiBold },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, fontFamily: fontFamilies.body },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22, fontFamily: fontFamilies.bodySemiBold },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, fontFamily: fontFamilies.body },
  captionBold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18, fontFamily: fontFamilies.bodySemiBold },
  stat: { fontSize: 28, fontWeight: '700' as const, fontFamily: fontFamilies.monoBold },
  statSmall: { fontSize: 20, fontWeight: '600' as const, fontFamily: fontFamilies.monoSemiBold },
  countdown: { fontSize: 36, fontWeight: '800' as const, lineHeight: 40, fontFamily: fontFamilies.monoBold },
  monoBody: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22, fontFamily: fontFamilies.mono },
  monoCaption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18, fontFamily: fontFamilies.mono },
  tiny: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, fontFamily: fontFamilies.body },
  pageTitle: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 34, fontFamily: fontFamilies.heading },
  sectionTitle: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.4, lineHeight: 16, fontFamily: fontFamilies.headingSemiBold },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
