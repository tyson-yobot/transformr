import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) => {
    const { Text } = require('react-native');
    return <Text testID={`icon-${name}`}>{name}</Text>;
  },
}));
jest.mock('@components/ui/Chip', () => ({ Chip: ({ label }: { label: string }) => {
  const { Text } = require('react-native');
  return <Text>{label}</Text>;
}}));
jest.mock('@components/ui/Disclaimer', () => ({ Disclaimer: () => null }));
jest.mock('@components/ui/GatePromptCard', () => ({ GatePromptCard: () => null }));
jest.mock('@components/ui/HelpBubble', () => ({ HelpBubble: () => null }));
jest.mock('@stores/chatStore', () => ({
  useChatStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      messages: [],
      messagesByConversation: {},
      activeConversationId: null,
      isLoading: false,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
      conversations: [],
      currentTopic: 'general',
      setTopic: jest.fn(),
      createConversation: jest.fn().mockResolvedValue('conv-1'),
      loadConversation: jest.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@hooks/useFeatureGate', () => ({
  useFeatureGate: jest.fn(() => ({
    isAvailable: true,
    requiredTier: 'free',
    showUpgradeModal: jest.fn(),
    checkAndPrompt: jest.fn(),
    upgradeMessage: '',
  })),
  upgradeModalEvents: { emit: jest.fn(), setListener: jest.fn() },
}));
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticWarning: jest.fn(),
}));
jest.mock('@services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ data: [], error: null })) })) })),
    functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

import ChatScreen from '../../app/chat';

describe('Chat screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChatScreen />)).not.toThrow();
  });

  it('renders topic chips', () => {
    const { getByText } = render(<ChatScreen />);
    expect(getByText('General')).toBeTruthy();
  });
});
