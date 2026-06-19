import React, { createContext, useContext, useState } from 'react';

export interface UserProfile {
  nom: string;
  ville: string;
  region: string;
  zoneClimatique: string;
  cultures: string[];
  superficie: string;
  nbParcelles: string;
  objectif: string;
  experience: string;
  defis: string[];
  avatarUrl?: string | null;
}

interface UserContextType {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
}

const UserContext = createContext<UserContextType>({
  profile: null,
  setProfile: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  return (
    <UserContext.Provider value={{ profile, setProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);