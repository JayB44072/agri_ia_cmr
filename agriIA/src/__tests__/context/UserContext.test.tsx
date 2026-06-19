import React from 'react';
import { Text } from 'react-native';
import { render, act, fireEvent } from '@testing-library/react-native';
import { UserProvider, useUser, type UserProfile } from '@/context/UserContext';

const SAMPLE_PROFILE: UserProfile = {
  nom: 'Jean Mbarga',
  ville: 'Yaoundé',
  region: 'Centre',
  zoneClimatique: 'Équatorial',
  cultures: ['Maïs', 'Tomate'],
  superficie: '5 ha',
  nbParcelles: '3',
  objectif: 'Augmenter le rendement',
  experience: '5 ans',
  defis: ['Irrigation', 'Ravageurs'],
};

function Consumer() {
  const { profile, setProfile } = useUser();
  return (
    <>
      <Text testID="name">{profile?.nom ?? 'none'}</Text>
      <Text testID="set" onPress={() => setProfile(SAMPLE_PROFILE)}>
        set
      </Text>
    </>
  );
}

describe('UserContext', () => {
  it('provides null profile by default', () => {
    const { getByTestId } = render(
      <UserProvider>
        <Consumer />
      </UserProvider>,
    );
    expect(getByTestId('name').props.children).toBe('none');
  });

  it('updates profile via setProfile', () => {
    const { getByTestId } = render(
      <UserProvider>
        <Consumer />
      </UserProvider>,
    );

    fireEvent.press(getByTestId('set'));
    expect(getByTestId('name').props.children).toBe('Jean Mbarga');
  });

  it('useUser returns noop setProfile when used outside provider', () => {
    function Standalone() {
      const { profile, setProfile } = useUser();
      return <Text testID="val">{profile?.nom ?? 'empty'}</Text>;
    }

    const { getByTestId } = render(<Standalone />);
    expect(getByTestId('val').props.children).toBe('empty');
  });
});
