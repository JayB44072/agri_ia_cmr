import React from 'react';
import { render } from '@testing-library/react-native';
import Badge from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders the label text', () => {
    const { getByText } = render(<Badge label="Urgent" />);
    expect(getByText('Urgent')).toBeTruthy();
  });

  it('defaults to "primary" variant', () => {
    const { toJSON } = render(<Badge label="Test" />);
    const tree = toJSON() as any;
    const bg = tree.props.style[1].backgroundColor;
    expect(bg).toBe('rgba(60,185,90,0.15)');
  });

  it('applies "danger" variant colors', () => {
    const { toJSON } = render(<Badge label="Alert" variant="danger" />);
    const tree = toJSON() as any;
    const bg = tree.props.style[1].backgroundColor;
    expect(bg).toBe('rgba(231,76,60,0.15)');
  });

  it('applies "warning" variant colors', () => {
    const { toJSON } = render(<Badge label="Warn" variant="warning" />);
    const tree = toJSON() as any;
    const bg = tree.props.style[1].backgroundColor;
    expect(bg).toBe('rgba(245,166,35,0.15)');
  });

  it('applies "info" variant colors', () => {
    const { toJSON } = render(<Badge label="Info" variant="info" />);
    const tree = toJSON() as any;
    const bg = tree.props.style[1].backgroundColor;
    expect(bg).toBe('rgba(52,152,219,0.15)');
  });

  it('applies "success" variant colors', () => {
    const { toJSON } = render(<Badge label="OK" variant="success" />);
    const tree = toJSON() as any;
    const bg = tree.props.style[1].backgroundColor;
    expect(bg).toBe('rgba(39,174,96,0.15)');
  });

  it('applies custom style prop', () => {
    const { toJSON } = render(<Badge label="X" style={{ marginTop: 10 }} />);
    const tree = toJSON() as any;
    const styles = tree.props.style;
    const hasMarginTop = styles.some(
      (s: any) => s && s.marginTop === 10,
    );
    expect(hasMarginTop).toBe(true);
  });
});
