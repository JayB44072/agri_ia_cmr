import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import Card from '@/components/ui/Card';

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.useColorScheme = jest.fn(() => 'light');
  return rn;
});

import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

const mockUseColorScheme = useColorScheme as jest.Mock;

describe('Card', () => {
  afterEach(() => jest.resetAllMocks());

  it('renders children', () => {
    const { getByText } = render(
      <Card><Text>Hello</Text></Card>,
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('uses light theme colors by default', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { toJSON } = render(
      <Card><Text>Content</Text></Card>,
    );
    const tree = toJSON() as any;
    const bgStyle = tree.props.style.find(
      (s: any) => s && s.backgroundColor === Colors.light.card,
    );
    expect(bgStyle).toBeTruthy();
  });

  it('uses dark theme colors when scheme is dark', () => {
    mockUseColorScheme.mockReturnValue('dark');
    const { toJSON } = render(
      <Card><Text>Dark</Text></Card>,
    );
    const tree = toJSON() as any;
    const bgStyle = tree.props.style.find(
      (s: any) => s && s.backgroundColor === Colors.dark.card,
    );
    expect(bgStyle).toBeTruthy();
  });

  it('flat variant does not apply shadow', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { toJSON } = render(
      <Card variant="flat"><Text>Flat</Text></Card>,
    );
    const tree = toJSON() as any;
    const hasShadow = tree.props.style.some(
      (s: any) => s && s.elevation !== undefined,
    );
    expect(hasShadow).toBe(false);
  });

  it('default variant applies shadow', () => {
    mockUseColorScheme.mockReturnValue('light');
    const { toJSON } = render(
      <Card variant="default"><Text>Shadow</Text></Card>,
    );
    const tree = toJSON() as any;
    const hasShadow = tree.props.style.some(
      (s: any) => s && s.elevation !== undefined,
    );
    expect(hasShadow).toBe(true);
  });
});
