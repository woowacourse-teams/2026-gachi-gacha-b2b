import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Layout = styled.div`
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  min-height: 100dvh;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding: 32px 20px 24px;
  border-right: 1px solid ${colors.border};
  background: ${colors.surface};

  @media (max-width: 820px) {
    position: static;
    z-index: 5;
    flex-direction: row;
    align-items: center;
    height: auto;
    padding: 14px 18px;
    border-right: 0;
    border-bottom: 1px solid ${colors.border};
  }
`;

export const Brand = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 6px;
  border: 0;
  color: ${colors.brand};
  background: transparent;
  text-align: left;
`;

export const Logo = styled.img`
  display: block;
  width: 48px;
  height: 52px;
  flex: 0 0 auto;
  object-fit: contain;
`;

export const BrandName = styled.strong`
  display: block;
  color: #ea321f;
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.055em;
`;

export const BrandCaption = styled.span`
  display: block;
  margin-top: 6px;

  @media (max-width: 480px) {
    display: none;
  }
`;

export const BrandKoreanName = styled.strong`
  display: block;
  color: #ea321f;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
`;

export const BrandRole = styled.span`
  display: block;
  margin-top: 4px;
  color: ${colors.textMuted};
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
`;

export const Navigation = styled.nav`
  display: grid;
  gap: 8px;
  margin-top: 64px;

  @media (max-width: 820px) {
    display: flex;
    gap: 4px;
    margin: 0 0 0 auto;
  }
`;

export const NavigationButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 0 15px;
  border: 0;
  border-left: 4px solid
    ${({ active }) => (active ? colors.brand : 'transparent')};
  border-radius: ${radii.small};
  color: ${({ active }) => (active ? colors.brand : colors.textMuted)};
  background: ${({ active }) => (active ? colors.brandSoft : 'transparent')};
  font-weight: 700;
  text-align: left;

  &:hover {
    background: ${colors.surfaceMuted};
  }

  @media (max-width: 820px) {
    min-height: 42px;
    padding: 0 12px;
    border-left: 0;
    border-bottom: 3px solid
      ${({ active }) => (active ? colors.brand : 'transparent')};
    white-space: nowrap;
  }

  @media (max-width: 560px) {
    span:first-of-type {
      display: none;
    }
  }
`;

export const NavCount = styled.span`
  display: inline-grid;
  min-width: 24px;
  height: 24px;
  margin-left: auto;
  padding: 0 7px;
  place-items: center;
  border-radius: ${radii.round};
  color: ${colors.brand};
  background: ${colors.surface};
  font-size: 12px;
`;

export const Main = styled.main`
  min-width: 0;
`;
