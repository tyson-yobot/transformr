// Color utility functions

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getDimColor(hex: string, opacity: number = 0.12): string {
  return hexToRgba(hex, opacity);
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return '#10B981';
  if (percentage >= 75) return '#A855F7';
  if (percentage >= 50) return '#F59E0B';
  if (percentage >= 25) return '#F97316';
  return '#EF4444';
}

export function getMoodColor(mood: number): string {
  if (mood >= 8) return '#10B981';
  if (mood >= 6) return '#A855F7';
  if (mood >= 4) return '#F59E0B';
  if (mood >= 2) return '#F97316';
  return '#EF4444';
}

export function getReadinessColor(score: number): string {
  if (score >= 70) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
}

export function getPainColor(level: number): string {
  if (level <= 2) return '#10B981';
  if (level <= 4) return '#F59E0B';
  if (level <= 6) return '#F97316';
  if (level <= 8) return '#EF4444';
  return '#DC2626';
}

export function getStreakColor(days: number): string {
  if (days >= 100) return '#EAB308';
  if (days >= 30) return '#F97316';
  if (days >= 7) return '#EF4444';
  return '#6B5E8A';
}

export function getTierColor(tier: string): string {
  const tierColors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#EAB308',
    diamond: '#B9F2FF',
  };
  return tierColors[tier] ?? '#6B5E8A';
}

export function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    fitness: '#10B981',
    nutrition: '#3B82F6',
    business: '#F59E0B',
    financial: '#EAB308',
    personal: '#A855F7',
    relationship: '#EC4899',
    education: '#22D3EE',
    health: '#10B981',
    mindset: '#A855F7',
  };
  return categoryColors[category] ?? '#6B5E8A';
}
