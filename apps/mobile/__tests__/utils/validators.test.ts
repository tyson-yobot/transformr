import {
  isValidEmail,
  isValidPassword,
  isValidWeight,
  isValidReps,
  isValidSets,
  isValidCalories,
  isValidMacro,
  isValidWaterOz,
  isValidRPE,
  isValidMood,
  isValidPainLevel,
  isValidPercentage,
  isValidCurrency,
  isNotEmpty,
  isWithinLength,
  sanitizeInput,
} from '../../utils/validators';

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@domain.co')).toBe(true);
    expect(isValidEmail('a+b@c.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@no-user.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts a strong password', () => {
    const result = isValidPassword('MyP@ssw0rd');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = isValidPassword('Ab1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must be at least 8 characters');
  });

  it('rejects password without uppercase letter', () => {
    const result = isValidPassword('lowercase1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain an uppercase letter');
  });

  it('rejects password without lowercase letter', () => {
    const result = isValidPassword('UPPERCASE1');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain a lowercase letter');
  });

  it('rejects password without a number', () => {
    const result = isValidPassword('NoNumbersHere');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain a number');
  });

  it('returns multiple errors for very weak password', () => {
    const result = isValidPassword('ab');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts minimum valid password', () => {
    const result = isValidPassword('Abcdefg1');
    expect(result.valid).toBe(true);
  });
});

describe('isValidWeight', () => {
  it('accepts valid weights', () => {
    expect(isValidWeight(150)).toBe(true);
    expect(isValidWeight(0.5)).toBe(true);
    expect(isValidWeight(999)).toBe(true);
  });

  it('rejects invalid weights', () => {
    expect(isValidWeight(0)).toBe(false);
    expect(isValidWeight(-10)).toBe(false);
    expect(isValidWeight(1000)).toBe(false);
    expect(isValidWeight(1500)).toBe(false);
  });
});

describe('isValidReps', () => {
  it('accepts valid reps', () => {
    expect(isValidReps(1)).toBe(true);
    expect(isValidReps(10)).toBe(true);
    expect(isValidReps(999)).toBe(true);
  });

  it('rejects invalid reps', () => {
    expect(isValidReps(0)).toBe(false);
    expect(isValidReps(-1)).toBe(false);
    expect(isValidReps(1000)).toBe(false);
    expect(isValidReps(5.5)).toBe(false); // must be integer
  });
});

describe('isValidSets', () => {
  it('accepts valid sets', () => {
    expect(isValidSets(1)).toBe(true);
    expect(isValidSets(5)).toBe(true);
    expect(isValidSets(20)).toBe(true);
  });

  it('rejects invalid sets', () => {
    expect(isValidSets(0)).toBe(false);
    expect(isValidSets(21)).toBe(false);
    expect(isValidSets(3.5)).toBe(false);
  });
});

describe('isValidCalories', () => {
  it('accepts valid calorie values', () => {
    expect(isValidCalories(0)).toBe(true);
    expect(isValidCalories(2500)).toBe(true);
    expect(isValidCalories(10000)).toBe(true);
  });

  it('rejects invalid calorie values', () => {
    expect(isValidCalories(-1)).toBe(false);
    expect(isValidCalories(10001)).toBe(false);
  });
});

describe('isValidRPE', () => {
  it('accepts valid RPE values (1-10)', () => {
    expect(isValidRPE(1)).toBe(true);
    expect(isValidRPE(5)).toBe(true);
    expect(isValidRPE(10)).toBe(true);
    expect(isValidRPE(7.5)).toBe(true);
  });

  it('rejects invalid RPE values', () => {
    expect(isValidRPE(0)).toBe(false);
    expect(isValidRPE(11)).toBe(false);
    expect(isValidRPE(-1)).toBe(false);
  });
});

describe('isValidMacro', () => {
  it('accepts valid macro values', () => {
    expect(isValidMacro(0)).toBe(true);
    expect(isValidMacro(150)).toBe(true);
    expect(isValidMacro(2000)).toBe(true);
  });

  it('rejects invalid macro values', () => {
    expect(isValidMacro(-1)).toBe(false);
    expect(isValidMacro(2001)).toBe(false);
  });
});

describe('isValidWaterOz', () => {
  it('accepts valid water amounts', () => {
    expect(isValidWaterOz(8)).toBe(true);
    expect(isValidWaterOz(200)).toBe(true);
  });

  it('rejects invalid water amounts', () => {
    expect(isValidWaterOz(0)).toBe(false);
    expect(isValidWaterOz(201)).toBe(false);
  });
});

describe('isValidMood', () => {
  it('accepts valid mood values', () => {
    expect(isValidMood(1)).toBe(true);
    expect(isValidMood(10)).toBe(true);
  });

  it('rejects non-integer mood', () => {
    expect(isValidMood(5.5)).toBe(false);
  });

  it('rejects out-of-range mood', () => {
    expect(isValidMood(0)).toBe(false);
    expect(isValidMood(11)).toBe(false);
  });
});

describe('isValidPainLevel', () => {
  it('accepts valid pain levels', () => {
    expect(isValidPainLevel(1)).toBe(true);
    expect(isValidPainLevel(10)).toBe(true);
  });

  it('rejects invalid pain levels', () => {
    expect(isValidPainLevel(0)).toBe(false);
    expect(isValidPainLevel(11)).toBe(false);
    expect(isValidPainLevel(5.5)).toBe(false);
  });
});

describe('isValidPercentage', () => {
  it('accepts valid percentages', () => {
    expect(isValidPercentage(0)).toBe(true);
    expect(isValidPercentage(50)).toBe(true);
    expect(isValidPercentage(100)).toBe(true);
  });

  it('rejects invalid percentages', () => {
    expect(isValidPercentage(-1)).toBe(false);
    expect(isValidPercentage(101)).toBe(false);
  });
});

describe('isValidCurrency', () => {
  it('accepts valid currency amounts', () => {
    expect(isValidCurrency(0)).toBe(true);
    expect(isValidCurrency(99.99)).toBe(true);
    expect(isValidCurrency(999999999)).toBe(true);
  });

  it('rejects invalid currency amounts', () => {
    expect(isValidCurrency(-1)).toBe(false);
    expect(isValidCurrency(1000000000)).toBe(false);
  });
});

describe('isNotEmpty', () => {
  it('returns true for non-empty strings', () => {
    expect(isNotEmpty('hello')).toBe(true);
    expect(isNotEmpty('  hello  ')).toBe(true);
  });

  it('returns false for empty or whitespace-only strings', () => {
    expect(isNotEmpty('')).toBe(false);
    expect(isNotEmpty('   ')).toBe(false);
    expect(isNotEmpty('\t')).toBe(false);
  });
});

describe('isWithinLength', () => {
  it('returns true when within bounds', () => {
    expect(isWithinLength('hello', 1, 10)).toBe(true);
    expect(isWithinLength('ab', 2, 5)).toBe(true);
  });

  it('returns false when too short', () => {
    expect(isWithinLength('a', 2, 10)).toBe(false);
  });

  it('returns false when too long', () => {
    expect(isWithinLength('abcdefghijk', 1, 5)).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isWithinLength('  ab  ', 2, 5)).toBe(true);
    expect(isWithinLength('  a  ', 2, 5)).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('removes angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  it('leaves normal text unchanged', () => {
    expect(sanitizeInput('normal text')).toBe('normal text');
  });

  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('handles string with only angle brackets', () => {
    expect(sanitizeInput('<>')).toBe('');
  });
});
