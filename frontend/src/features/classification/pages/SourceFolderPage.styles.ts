import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Page = styled.div`
  min-height: 100dvh;
  padding: 52px clamp(24px, 6vw, 80px) 64px;
`;

export const Header = styled.header`
  margin-bottom: 38px;

  h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 46px);
    letter-spacing: -0.04em;
  }

  p {
    max-width: 720px;
    margin: 12px 0 0;
    color: ${colors.textMuted};
    font-size: 17px;
    line-height: 1.6;
  }
`;

export const FolderGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 22px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const FolderCard = styled.li`
  min-width: 0;
`;

export const FolderButton = styled.button`
  display: grid;
  width: 100%;
  min-height: 220px;
  padding: 28px;
  align-content: space-between;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.large};
  color: ${colors.text};
  background: ${colors.surface};
  box-shadow: 0 12px 28px ${colors.shadow};
  text-align: left;
  transition:
    transform 160ms ease,
    border-color 160ms ease;

  &:hover {
    border-color: ${colors.brand};
    transform: translateY(-3px);
  }
`;

export const FolderIcon = styled.span`
  display: grid;
  width: 62px;
  height: 54px;
  place-items: center;
  border-radius: 10px 10px 14px 14px;
  color: ${colors.brand};
  background: ${colors.brandSoft};
  font-size: 32px;
`;

export const FolderInfo = styled.span`
  display: block;

  strong {
    display: block;
    overflow: hidden;
    font-size: 24px;
    letter-spacing: -0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    display: block;
    margin-top: 8px;
    color: ${colors.textMuted};
    font-size: 14px;
  }
`;

export const Count = styled.span`
  color: ${colors.brand};
  font-weight: 800;
`;

export const StatePanel = styled.div`
  display: grid;
  min-height: 300px;
  padding: 40px;
  place-items: center;
  border: 1px dashed ${colors.border};
  border-radius: ${radii.large};
  color: ${colors.textMuted};
  background: ${colors.surface};
  text-align: center;
`;

export const ErrorMessage = styled.div`
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid #efb4b8;
  border-radius: ${radii.small};
  color: ${colors.danger};
  background: ${colors.brandSoft};
`;
