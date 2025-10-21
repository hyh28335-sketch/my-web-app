"use client";

import { UserProvider } from '../lib/contexts/UserContext';

interface ClientWrapperProps {
  children: React.ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  );
}