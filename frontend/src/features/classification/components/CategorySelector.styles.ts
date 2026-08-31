import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 10px;

  strong {
    font-size: 14px;
    font-weight: 800;
  }
`;

export const ManageButton = styled.button`
  padding: 7px 0;
  border: 0;
  color: ${colors.brand};
  background: transparent;
  font-size: 13px;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const CategoryButton = styled.button<{ selected: boolean }>`
  position: relative;
  min-height: 62px;
  padding: 10px 18px;
  border: 2px solid
    ${({ selected }) => (selected ? colors.brand : colors.border)};
  border-radius: ${radii.small};
  color: ${({ selected }) => (selected ? colors.brand : colors.text)};
  background: ${({ selected }) => (selected ? colors.brandSoft : colors.surface)};
  font-weight: ${({ selected }) => (selected ? 800 : 600)};

  &:hover {
    border-color: ${colors.brand};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const Shortcut = styled.span`
  position: absolute;
  top: -8px;
  right: -5px;
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 5px;
  color: white;
  background: ${colors.text};
  font-size: 11px;
`;
