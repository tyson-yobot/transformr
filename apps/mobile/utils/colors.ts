// Color utility functions

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return '#22C55E';
  if (percentage >= 75) return '#3B82F6';
  if (percentage >= 50) return '#F59E0B';
  if (percentage >= 25) return '#F97316';
  return '#EF4444';
}

export function getMoodColor(mood: number): string {
  if (mood >= 8) return '#22C55E';
  if (mood >= 6) return '#3B82F6';
  if (mood >= 4) return '#F59E0B';
  if (mood >= 2) return '#F97316';
  return '#EF4444';
}

export function getReadinessColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#3B82F6';
  if (score >= 40) return '#F59E0B';
  if (score >= 20) return '#F97316';
  return '#EF4444';
}

export function getPainColor(level: number): string {
  if (level <= 2) return '#22C55E';
  if (level <= 4) return '#F59E0B';
  if (level <= 6) return '#F97316';
  if (level <= 8) return '#EF4444';
  return '#DC2626';
}

export function getStreakColor(days: number): string {
  if (days >= 100) return '#EAB308'; // gold
  if (days >= 30) return '#F97316';  // fire
  if (days >= 7) return '#EF4444';   // red
  return '#94A3B8';                   // muted
}

export function getTierColor(tier: string): string {
  const tierColors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#EAB308',
    diamond: '#B9F2FF',
  };
  return tierColors[tier] ?? '#94A3B8';
}

export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    fitness: '#22C55E',
    nutrition: '#3B82F6',
    business: '#F59E0B',
    financial: '#EAB308',
    personal: '#8B5CF6',
    relationship: '#EC4899',
    education: '#6366F1',
    health: '#22C55E',
    mindset: '#8B5CF6',
  };
  return categoryColors[category] ?? '#94A3B8';
}
