import type { ReactNode } from 'react';

import logoSymbol from '@/assets/gachi-gacha-logo-symbol.svg';
import AiControl from '@/features/ai/components/AiControl';

import {
  Brand,
  BrandCaption,
  BrandKoreanName,
  BrandName,
  BrandRole,
  Layout,
  Logo,
  Main,
  Navigation,
  NavigationButton,
  Sidebar,
} from './AppShell.styles';

interface AppShellProps {
  children: ReactNode;
  currentSection: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED' | 'STORES';
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
          <Logo aria-hidden src={logoSymbol} />
          <span>
            <BrandName>GACHIGACHA</BrandName>
            <BrandCaption>
              <BrandKoreanName>가치 가챠</BrandKoreanName>
              <BrandRole>데이터 분류 관리자</BrandRole>
            </BrandCaption>
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
            active={currentSection === 'CLASSIFIED'}
            type="button"
            onClick={() => onNavigate('/classified')}
          >
            <span aria-hidden>✓</span>
            <span>분류 완료</span>
          </NavigationButton>
          {__USE_MOCK_API__ && (
            <NavigationButton
              active={currentSection === 'SKIPPED'}
              type="button"
              onClick={() => onNavigate('/skipped')}
            >
              <span aria-hidden>↶</span>
              <span>건너뛴 데이터</span>
            </NavigationButton>
          )}
          <NavigationButton
            active={currentSection === 'STORES'}
            type="button"
            onClick={() => onNavigate('/stores')}
          >
            <span aria-hidden>店</span>
            <span>매장 가챠 관리</span>
          </NavigationButton>
        </Navigation>
        <AiControl />
      </Sidebar>
      <Main>{children}</Main>
    </Layout>
  );
}
