import type { ReactNode } from 'react';

interface ContentWrapperProps {
  children: ReactNode;
}

export function ContentWrapper({ children }: ContentWrapperProps) {
  return <main className="mx-auto max-w-[960px] px-6 py-9">{children}</main>;
}
