import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('react-native', () => require('../__helpers__/rnMocks').mockReactNative());
jest.mock('react-native-reanimated', () => require('../__helpers__/rnMocks').mockReanimated());
jest.mock('@theme/index', () => require('../__helpers__/rnMocks').mockTheme());
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('react-native-draggable-flatlist', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ data, renderItem }: {
      data: Array<{ id: string }>;
      renderItem: (params: { item: { id: string }; getIndex: () => number; drag: () => void; isActive: boolean }) => React.ReactNode;
    }) => (
      <View>
        {data.map((item, i) =>
          renderItem({ item, getIndex: () => i, drag: jest.fn(), isActive: false }),
        )}
      </View>
    ),
    ScaleDecorator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

import { DraggableGrid } from '../../../components/ui/DraggableGrid';

interface TestItem { id: string; label: string; }

const mockData: TestItem[] = [
  { id: '1', label: 'Item 1' },
  { id: '2', label: 'Item 2' },
];

describe('DraggableGrid', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <DraggableGrid
          data={mockData}
          onReorder={jest.fn()}
          renderItem={(item) => <Text key={item.id}>{item.label}</Text>}
        />,
      ),
    ).not.toThrow();
  });

  it('renders all items', () => {
    const { getByText } = render(
      <DraggableGrid
        data={mockData}
        onReorder={jest.fn()}
        renderItem={(item) => <Text key={item.id}>{item.label}</Text>}
      />,
    );
    expect(getByText('Item 1')).toBeTruthy();
    expect(getByText('Item 2')).toBeTruthy();
  });
});
