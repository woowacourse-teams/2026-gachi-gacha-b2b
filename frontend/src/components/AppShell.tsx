import type { ReactNode } from 'react';

import {
  Brand,
  BrandCaption,
  BrandName,
  Layout,
  Logo,
  Main,
  Navigation,
  NavigationButton,
  Sidebar,
} from './AppShell.styles';

interface AppShellProps {
  children: ReactNode;
  currentSection: 'UNCLASSIFIED' | 'SKIPPED';
  onNavigate: (path: string) => void;
}

export default function AppShell({
  children,
  currentSection,
  onNavigate,
}: AppShellProps) {
  return (
    <Layout>
      <Sidebar>
        <Brand type="button" onClick={() => onNavigate('/')}>
          <Logo aria-hidden>G</Logo>
          <span>
            <BrandName>Gachi Gacha</BrandName>
            <BrandCaption>데이터 분류 관리자</BrandCaption>
          </span>
        </Brand>

        <Navigation aria-label="데이터 분류 메뉴">
          <NavigationButton
            active={currentSection === 'UNCLASSIFIED'}
            type="button"
            onClick={() => onNavigate('/')}
          >
            <span aria-hidden>▣</span>
            <span>미분류 데이터</span>
          </NavigationButton>
          <NavigationButton
            active={currentSection === 'SKIPPED'}
            type="button"
            onClick={() => onNavigate('/skipped')}
          >
            <span aria-hidden>↶</span>
            <span>건너뛴 데이터</span>
          </NavigationButton>
        </Navigation>
      </Sidebar>
      <Main>{children}</Main>
    </Layout>
  );
}
