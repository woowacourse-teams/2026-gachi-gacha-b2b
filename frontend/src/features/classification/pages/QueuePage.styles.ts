import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Page = styled.div`
  min-height: 100dvh;
  padding: 42px clamp(24px, 5vw, 72px) 64px;
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 34px;

  @media (max-width: 720px) {
    display: grid;
  }
`;

export const Heading = styled.h1`
  margin: 0;
  font-size: clamp(30px, 4vw, 46px);
  letter-spacing: -0.04em;
`;

export const Description = styled.p`
  margin: 10px 0 0;
  color: ${colors.textMuted};
  font-size: 17px;
`;

export const Stats = styled.div`
  display: flex;
  gap: 12px;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column-reverse;
  }
`;

export const Stat = styled.div`
  min-width: 126px;
  padding: 16px 20px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.medium};
  background: ${colors.surface};
  text-align: center;

  strong {
    display: block;
    color: ${colors.brand};
    font-size: 25px;
  }

  span {
    display: block;
    margin-top: 5px;
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const IdRangeForm = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 560px) {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
`;

export const IdInput = styled.input`
  width: 108px;
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.small};
  outline: 0;
  background: ${colors.surface};

  &:focus {
    border-color: ${colors.brand};
  }

  @media (max-width: 560px) {
    width: 100%;
  }
`;

export const RangeButton = styled.button`
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid ${colors.brand};
  border-radius: ${radii.small};
  color: ${colors.brand};
  background: ${colors.surface};
  font-size: 13px;
  font-weight: 800;

  &:hover {
    color: white;
    background: ${colors.brand};
  }
`;

export const SearchLabel = styled.label`
  display: flex;
  align-items: center;
  width: min(100%, 460px);
  min-height: 46px;
  padding: 0 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.round};
  background: ${colors.surface};

  input {
    width: 100%;
    border: 0;
    outline: 0;
    color: ${colors.text};
    background: transparent;
  }
`;

export const PrimaryButton = styled.button`
  min-height: 46px;
  padding: 0 22px;
  border: 0;
  border-radius: ${radii.round};
  color: white;
  background: ${colors.brand};
  font-weight: 800;

  &:hover:not(:disabled) {
    background: ${colors.brandDark};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const CategoryFilterPanel = styled.section`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: -4px 0 24px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const FilterLabel = styled.strong`
  flex: 0 0 auto;
  padding-top: 7px;
  font-size: 13px;
`;

export const CategoryFilterList = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
`;

export const CategoryFilterButton = styled.button<{ selected: boolean }>`
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid
    ${({ selected }) => (selected ? colors.brand : colors.border)};
  border-radius: ${radii.round};
  color: ${({ selected }) => (selected ? colors.brand : colors.textMuted)};
  background: ${({ selected }) => (selected ? colors.brandSoft : colors.surface)};
  font-size: 12px;
  font-weight: 800;

  &:hover {
    border-color: ${colors.brand};
  }
`;

export const ClearFilterButton = styled.button`
  min-height: 34px;
  flex: 0 0 auto;
  padding: 0 10px;
  border: 0;
  color: ${colors.textMuted};
  background: transparent;
  font-size: 12px;
  text-decoration: underline;
`;

const listColumns =
  '108px minmax(220px, 2fr) minmax(160px, 1fr) minmax(180px, 1.4fr) 150px';

export const ListHeader = styled.div`
  display: grid;
  grid-template-columns: ${listColumns};
  gap: 16px;
  padding: 0 20px 10px;
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 800;

  @media (max-width: 960px) {
    display: none;
  }
`;

export const List = styled.ul`
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 12px 28px ${colors.shadow};
  list-style: none;
`;

export const ListRow = styled.li`
  display: grid;
  min-height: 76px;
  grid-template-columns: ${listColumns};
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid ${colors.border};

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: ${colors.surfaceMuted};
  }

  @media (max-width: 960px) {
    grid-template-columns: minmax(94px, auto) 1fr;

    & > :nth-of-type(n + 3) {
      grid-column: 2;
    }
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;

    & > :nth-of-type(n) {
      grid-column: 1;
    }
  }
`;

export const IdCell = styled.div`
  display: grid;
  justify-items: start;
  gap: 6px;

  strong {
    font-variant-numeric: tabular-nums;
  }
`;

export const StatusBadge = styled.span<{
  status: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED';
}>`
  display: inline-flex;
  padding: 6px 10px;
  border-radius: ${radii.round};
  color: ${({ status }) => {
    if (status === 'UNCLASSIFIED') return colors.brand;
    if (status === 'CLASSIFIED') return colors.success;
    return colors.warning;
  }};
  background: ${({ status }) => {
    if (status === 'UNCLASSIFIED') return colors.brandSoft;
    if (status === 'CLASSIFIED') return '#eaf7ef';
    return '#fff3df';
  }};
  font-size: 12px;
  font-weight: 800;
`;

export const ListNameCell = styled.div`
  display: grid;
  min-width: 0;
  gap: 5px;

  strong,
  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  span {
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

export const ListMetaCell = styled.div`
  display: grid;
  min-width: 0;
  gap: 5px;

  strong,
  span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  span {
    color: ${colors.textMuted};
    font-size: 13px;
  }
`;

export const ListCategoryCell = styled.div`
  min-width: 0;
  color: ${colors.textMuted};
  font-size: 13px;
`;

export const CategoryTags = styled.div`
  display: flex;
  min-height: 30px;
  flex-wrap: wrap;
  gap: 6px;
`;

export const CategoryTag = styled.span`
  padding: 5px 9px;
  border-radius: ${radii.round};
  color: ${colors.brand};
  background: ${colors.brandSoft};
  font-size: 12px;
  font-weight: 800;
`;

export const ListActionButton = styled.button<{ secondary?: boolean }>`
  width: 100%;
  min-height: 42px;
  border: 1px solid ${colors.brand};
  border-radius: ${radii.small};
  color: ${({ secondary }) => (secondary ? colors.brand : 'white')};
  background: ${({ secondary }) => (secondary ? colors.surface : colors.brand)};
  font-weight: 800;

  &:hover:not(:disabled) {
    color: white;
    background: ${colors.brandDark};
  }

  &:disabled {
    opacity: 0.55;
  }
`;

export const ListActionPlaceholder = styled.span`
  color: ${colors.textMuted};
  text-align: center;
`;

export const ListFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 4px 0;
  color: ${colors.textMuted};
  font-size: 13px;

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const LoadMoreButton = styled.button`
  min-height: 42px;
  padding: 0 18px;
  border: 1px solid ${colors.brand};
  border-radius: ${radii.small};
  color: ${colors.brand};
  background: ${colors.surface};
  font-weight: 800;

  &:hover:not(:disabled) {
    color: white;
    background: ${colors.brand};
  }

  &:disabled {
    cursor: wait;
    opacity: 0.55;
  }
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

  strong {
    display: block;
    margin-bottom: 8px;
    color: ${colors.text};
    font-size: 20px;
  }
`;

export const ErrorMessage = styled.div`
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid #efb4b8;
  border-radius: ${radii.small};
  color: ${colors.danger};
  background: ${colors.brandSoft};
`;
