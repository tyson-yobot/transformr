import * as Haptics from 'expo-haptics';

export async function hapticLight() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticMedium() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticHeavy() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function hapticSuccess() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function hapticWarning() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export async function hapticError() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

export async function hapticSelection() {
  await Haptics.selectionAsync();
}

// Composite haptic patterns
export async function hapticPR() {
  await hapticHeavy();
  setTimeout(() => hapticSuccess(), 150);
  setTimeout(() => hapticHeavy(), 300);
}

export async function hapticStreakMilestone() {
  await hapticSuccess();
  setTimeout(() => hapticMedium(), 200);
  setTimeout(() => hapticSuccess(), 400);
}

export async function hapticAchievement() {
  await hapticHeavy();
  setTimeout(() => hapticSuccess(), 200);
  setTimeout(() => hapticMedium(), 400);
  setTimeout(() => hapticSuccess(), 600);
}

export async function hapticNudge() {
  await hapticMedium();
  setTimeout(() => hapticLight(), 100);
}
