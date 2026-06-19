import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SectionTitle from '@/components/ui/SectionTitle';

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.useColorScheme = jest.fn(() => 'light');
  return rn;
});

describe('SectionTitle', () => {
  it('renders the title text', () => {
    const { getByText } = render(<SectionTitle title="Parcelles" />);
    expect(getByText('Parcelles')).toBeTruthy();
  });

  it('does not render action button when actionLabel is absent', () => {
    const { queryByText } = render(<SectionTitle title="Test" />);
    expect(queryByText('Voir tout')).toBeNull();
  });

  it('renders action button when actionLabel and onAction are provided', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <SectionTitle title="Sol" actionLabel="Voir tout" onAction={onAction} />,
    );
    expect(getByText('Voir tout')).toBeTruthy();
  });

  it('calls onAction when action button is pressed', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <SectionTitle title="Sol" actionLabel="Details" onAction={onAction} />,
    );
    fireEvent.press(getByText('Details'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action when only actionLabel is provided (no onAction)', () => {
    const { queryByText } = render(
      <SectionTitle title="Sol" actionLabel="Details" />,
    );
    expect(queryByText('Details')).toBeNull();
  });
});
