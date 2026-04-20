import React, { createRef } from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('@/constants/haptics', () => ({ triggerHaptic: jest.fn() }));

import { PRCelebration, PRCelebrationHandle } from '../../../components/ui/PRCelebration';

describe('PRCelebration', () => {
  it('renders without crashing (initially hidden)', () => {
    expect(() => render(<PRCelebration />)).not.toThrow();
  });

  it('celebrate() can be called via ref without crashing', () => {
    const ref = createRef<PRCelebrationHandle>();
    render(<PRCelebration ref={ref} />);
    expect(() => ref.current?.celebrate('Bench Press', 'New 1RM: 100kg')).not.toThrow();
  });
});
