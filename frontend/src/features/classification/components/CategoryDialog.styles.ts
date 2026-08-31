import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const CategorySection = styled.section`
  margin-top: 24px;

  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
`;

export const CategoryList = styled.ul`
  display: grid;
  max-height: 210px;
  gap: 8px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
`;

export const CategoryRow = styled.li`
  display: flex;
  min-height: 42px;
  padding: 7px 9px 7px 13px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.small};
  background: ${colors.surfaceMuted};
  font-size: 14px;
  font-weight: 700;
`;

export const DeleteButton = styled.button`
  min-width: 52px;
  min-height: 30px;
  padding: 0 8px;
  border: 1px solid #e7b4b8;
  border-radius: 6px;
  color: ${colors.danger};
  background: ${colors.surface};
  font-size: 12px;
  font-weight: 800;

  &:hover:not(:disabled) {
    color: white;
    background: ${colors.danger};
  }
`;

export const DeleteConfirm = styled.div`
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #e7b4b8;
  border-radius: ${radii.small};
  background: #fff7f7;

  p {
    margin: 0 0 12px;
    color: ${colors.text};
    font-size: 13px;
  }
`;

export const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  button {
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid ${colors.borderStrong};
    border-radius: 6px;
    background: ${colors.surface};
    font-size: 12px;
    font-weight: 800;
  }

  button:last-of-type {
    border-color: ${colors.danger};
    color: white;
    background: ${colors.danger};
  }
`;
