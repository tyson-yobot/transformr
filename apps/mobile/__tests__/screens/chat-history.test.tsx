import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => require('../components/__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../components/__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../components/__helpers__/rnMocks').mockTheme());
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
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
jest.mock('@components/ui/ScreenSkeleton', () => ({ ListSkeleton: () => null }));
jest.mock('@stores/chatStore', () => ({
  useChatStore: jest.fn((selector: (s: object) => unknown) => {
    const state = {
      conversations: [],
      isLoading: false,
      loadConversations: jest.fn(),
      deleteConversation: jest.fn(),
      fetchConversationList: jest.fn().mockResolvedValue(undefined),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock('@utils/haptics', () => ({
  hapticLight: jest.fn(),
  hapticMedium: jest.fn(),
  hapticWarning: jest.fn(),
}));

import ChatHistoryScreen from '../../app/chat-history';

describe('ChatHistory screen', () => {
  it('renders without crashing', () => {
    expect(() => render(<ChatHistoryScreen />)).not.toThrow();
  });

  it('renders screen header', () => {
    const { getByText } = render(<ChatHistoryScreen />);
    expect(getByText('Chat History')).toBeTruthy();
  });
});
