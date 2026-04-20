import { getWorkoutRecommendation } from '../../services/weather';
import type { WeatherData } from '../../services/weather';

// getWorkoutRecommendation is a pure function — no mocking needed

const baseWeather: WeatherData = {
  temp: 20,
  feelsLike: 20,
  description: 'Clear sky',
  humidity: 50,
  windSpeed: 10,
  condition: 'clear',
  uvIndex: 3,
};

describe('getWorkoutRecommendation', () => {
  it('returns ideal/okay for pleasant clear weather', () => {
    const result = getWorkoutRecommendation(baseWeather);
    expect(result.isGoodForOutdoor).toBe(true);
    expect(['ideal', 'okay']).toContain(result.severity);
  });

  it('returns avoid for storm condition', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, condition: 'storm' });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid for rain condition', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, condition: 'rain' });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid for snow condition', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, condition: 'snow' });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid for extreme heat (temp > 35)', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, temp: 36, feelsLike: 40 });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid for high UV index (> 8)', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, uvIndex: 9 });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid for extreme cold (temp < -10)', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, temp: -11 });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid for high wind speed (> 60)', () => {
    const result = getWorkoutRecommendation({ ...baseWeather, windSpeed: 65 });
    expect(result.isGoodForOutdoor).toBe(false);
    expect(result.severity).toBe('avoid');
  });

  it('returns result with icon string', () => {
    const result = getWorkoutRecommendation(baseWeather);
    expect(typeof result.icon).toBe('string');
    expect(result.icon.length).toBeGreaterThan(0);
  });

  it('returns result with reason string', () => {
    const result = getWorkoutRecommendation(baseWeather);
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
