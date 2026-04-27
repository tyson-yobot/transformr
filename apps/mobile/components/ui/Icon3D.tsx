// =============================================================================
// TRANSFORMR -- Icon3D
// Renders 3D Fluent Emoji PNG icons as Image components.
// MIT Licensed — Microsoft Fluent Emoji (github.com/microsoft/fluentui-emoji)
// =============================================================================

import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

// Icon asset map — each key maps to a local require() for the 3D PNG
const ICON_MAP = {
  // Fitness
  dumbbell: require('../../assets/icons/3d/dumbbell.png'),
  calendar: require('../../assets/icons/3d/calendar.png'),
  'chart-up': require('../../assets/icons/3d/chart-up.png'),
  'video-camera': require('../../assets/icons/3d/video-camera.png'),
  running: require('../../assets/icons/3d/running.png'),
  store: require('../../assets/icons/3d/store.png'),
  camera: require('../../assets/icons/3d/camera.png'),
  bandage: require('../../assets/icons/3d/bandage.png'),
  bicep: require('../../assets/icons/3d/bicep.png'),
  body: require('../../assets/icons/3d/body.png'),
  medal: require('../../assets/icons/3d/medal.png'),
  stopwatch: require('../../assets/icons/3d/stopwatch.png'),

  // Nutrition / Meals
  sun: require('../../assets/icons/3d/sun.png'),
  'fork-knife': require('../../assets/icons/3d/fork-knife.png'),
  moon: require('../../assets/icons/3d/moon.png'),
  cookie: require('../../assets/icons/3d/cookie.png'),
  drink: require('../../assets/icons/3d/drink.png'),
  lightning: require('../../assets/icons/3d/lightning.png'),
  fire: require('../../assets/icons/3d/fire.png'),
  flask: require('../../assets/icons/3d/flask.png'),
  cart: require('../../assets/icons/3d/cart.png'),

  // Dashboard / General
  home: require('../../assets/icons/3d/home.png'),
  target: require('../../assets/icons/3d/target.png'),
  profile: require('../../assets/icons/3d/profile.png'),
  'heart-pulse': require('../../assets/icons/3d/heart-pulse.png'),
  scale: require('../../assets/icons/3d/scale.png'),
  trophy: require('../../assets/icons/3d/trophy.png'),
  rocket: require('../../assets/icons/3d/rocket.png'),
  star: require('../../assets/icons/3d/star.png'),
  sparkles: require('../../assets/icons/3d/sparkles.png'),
  brain: require('../../assets/icons/3d/brain.png'),
  sleep: require('../../assets/icons/3d/sleep.png'),
  'bar-chart': require('../../assets/icons/3d/bar-chart.png'),
  bookmark: require('../../assets/icons/3d/bookmark.png'),
  search: require('../../assets/icons/3d/search.png'),
  check: require('../../assets/icons/3d/check.png'),
  plus: require('../../assets/icons/3d/plus.png'),
  gear: require('../../assets/icons/3d/gear.png'),
  bell: require('../../assets/icons/3d/bell.png'),
  eye: require('../../assets/icons/3d/eye.png'),

  // Communication / Actions
  heart: require('../../assets/icons/3d/heart.png'),
  lock: require('../../assets/icons/3d/lock.png'),
  people: require('../../assets/icons/3d/people.png'),
  clock: require('../../assets/icons/3d/clock.png'),
  bulb: require('../../assets/icons/3d/bulb.png'),
  document: require('../../assets/icons/3d/document.png'),
  warning: require('../../assets/icons/3d/warning.png'),
  mail: require('../../assets/icons/3d/mail.png'),
  music: require('../../assets/icons/3d/music.png'),
  cloud: require('../../assets/icons/3d/cloud.png'),
  pencil: require('../../assets/icons/3d/pencil.png'),
  trash: require('../../assets/icons/3d/trash.png'),
  shield: require('../../assets/icons/3d/shield.png'),
  book: require('../../assets/icons/3d/book.png'),
  flag: require('../../assets/icons/3d/flag.png'),
  money: require('../../assets/icons/3d/money.png'),
  smile: require('../../assets/icons/3d/smile.png'),
  mic: require('../../assets/icons/3d/mic.png'),
  share: require('../../assets/icons/3d/share.png'),
  clipboard: require('../../assets/icons/3d/clipboard.png'),
  barcode: require('../../assets/icons/3d/barcode.png'),
  speech: require('../../assets/icons/3d/speech.png'),
  link: require('../../assets/icons/3d/link.png'),
  megaphone: require('../../assets/icons/3d/megaphone.png'),
  'crystal-ball': require('../../assets/icons/3d/crystal-ball.png'),
  gift: require('../../assets/icons/3d/gift.png'),
  palette: require('../../assets/icons/3d/palette.png'),
} as const;

export type Icon3DName = keyof typeof ICON_MAP;

interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export function Icon3D({ name, size = 24, style }: Icon3DProps) {
  return (
    <Image
      source={ICON_MAP[name]}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
