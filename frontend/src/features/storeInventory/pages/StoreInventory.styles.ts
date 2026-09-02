import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Page = styled.div`
  min-height: 100dvh;
  padding: 42px clamp(22px, 5vw, 72px) 72px;
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;

  @media (max-width: 720px) {
    display: grid;
  }
`;

export const Heading = styled.h1`
  margin: 0;
  font-size: clamp(30px, 4vw, 46px);
  letter-spacing: -0.045em;
`;

export const Description = styled.p`
  max-width: 780px;
  margin: 10px 0 0;
  color: ${colors.textMuted};
  font-size: 16px;
  line-height: 1.6;
`;

export const CountBadge = styled.div`
  min-width: 122px;
  padding: 15px 18px;
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
    color: ${colors.textMuted};
    font-size: 12px;
  }
`;

export const SearchForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 24px;

  label {
    display: flex;
    min-width: min(100%, 280px);
    flex: 1 1 420px;
    min-height: 46px;
    padding: 0 16px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.round};
    background: ${colors.surface};
  }

  input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
  }

  > button {
    min-height: 46px;
    padding: 0 20px;
    border-radius: ${radii.round};
    font-weight: 800;
  }

  > button[type='submit'] {
    border: 0;
    color: white;
    background: ${colors.brand};
  }

  > button[data-variant='secondary'] {
    border: 1px solid ${colors.borderStrong};
    color: ${colors.textMuted};
    background: ${colors.surface};
  }

  > button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

export const StoreGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 15px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const StoreCard = styled.button`
  display: grid;
  width: 100%;
  min-height: 150px;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 15px;
  padding: 18px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  color: ${colors.text};
  background: ${colors.surface};
  box-shadow: 0 8px 24px ${colors.shadow};
  text-align: left;

  &:hover,
  &:focus-visible {
    border-color: ${colors.brand};
    outline: 0;
    transform: translateY(-2px);
  }

  h2 {
    overflow: hidden;
    margin: 1px 0 7px;
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  p {
    display: -webkit-box;
    overflow: hidden;
    margin: 0;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  small {
    display: block;
    margin-top: 12px;
    color: ${colors.brand};
    font-weight: 800;
  }
`;

export const StoreThumbnail = styled.span`
  display: grid;
  overflow: hidden;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: ${radii.medium};
  color: ${colors.brand};
  background: ${colors.brandSoft};
  font-size: 24px;
  font-weight: 900;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const StatePanel = styled.div`
  display: grid;
  min-height: 360px;
  padding: 32px;
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

export const BackButton = styled.button`
  margin-bottom: 14px;
  padding: 7px 0;
  border: 0;
  color: ${colors.brand};
  background: transparent;
  font-weight: 800;
`;

export const StoreMeta = styled.div`
  margin-top: 10px;
  color: ${colors.textMuted};
  line-height: 1.6;

  span + span::before {
    margin: 0 8px;
    content: '·';
  }
`;

export const Section = styled.section`
  margin-top: 28px;
  padding: 22px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 10px 28px ${colors.shadow};
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 20px;
  }

  p {
    margin: 5px 0 0;
    color: ${colors.textMuted};
    font-size: 13px;
  }

  strong {
    color: ${colors.brand};
  }
`;

export const AssignedList = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const AssignedCard = styled.li`
  display: grid;
  min-width: 0;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};

  img,
  > span:first-of-type {
    display: grid;
    width: 48px;
    height: 48px;
    place-items: center;
    border-radius: ${radii.small};
    background: ${colors.surface};
    object-fit: cover;
  }

  strong {
    display: block;
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: ${colors.textMuted};
  }

  button {
    padding: 7px 9px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    color: ${colors.danger};
    background: ${colors.surface};
    font-size: 11px;
    font-weight: 800;
  }
`;

export const FilterPanel = styled.div`
  display: grid;
  gap: 14px;
  margin-bottom: 18px;
  padding: 16px;
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};
`;

export const CategoryToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  strong {
    flex: 0 0 auto;
    font-size: 13px;
  }

  input {
    width: min(100%, 320px);
    min-height: 36px;
    padding: 0 11px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    outline: 0;
    background: ${colors.surface};
  }
`;

export const CategoryList = styled.div`
  display: flex;
  overflow: auto;
  max-height: 126px;
  flex-wrap: wrap;
  gap: 7px;
  padding-right: 4px;

  button {
    min-height: 32px;
    padding: 0 11px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.round};
    color: ${colors.textMuted};
    background: ${colors.surface};
    font-size: 12px;
    font-weight: 800;
  }

  button[aria-pressed='true'] {
    border-color: ${colors.brand};
    color: ${colors.brand};
    background: ${colors.brandSoft};
  }
`;

export const CatalogList = styled.ul`
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  list-style: none;
`;

export const CatalogRow = styled.li`
  display: grid;
  min-height: 84px;
  grid-template-columns:
    56px 72px minmax(180px, 1.5fr) minmax(180px, 1fr)
    120px;
  align-items: center;
  gap: 14px;
  padding: 13px 16px;
  border-bottom: 1px solid ${colors.border};

  &:last-child {
    border-bottom: 0;
  }

  > strong:first-of-type {
    color: ${colors.brand};
    font-size: 13px;
  }

  @media (max-width: 920px) {
    grid-template-columns: 48px minmax(150px, 1fr) auto;

    > strong:first-of-type,
    > div:nth-of-type(2) {
      display: none;
    }
  }
`;

export const GachaThumbnail = styled.button`
  display: grid;
  overflow: hidden;
  width: 56px;
  height: 56px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: ${radii.small};
  color: ${colors.textMuted};
  background: ${colors.surfaceMuted};
  cursor: zoom-in;

  &:focus-visible {
    outline: 3px solid ${colors.brand};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: default;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const ImagePreviewOverlay = styled.div`
  position: fixed;
  z-index: 200;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgba(20, 22, 28, 0.78);
`;

export const ImagePreviewPanel = styled.div`
  display: grid;
  overflow: hidden;
  width: min(100%, 960px);
  max-height: calc(100dvh - 40px);
  grid-template-rows: auto minmax(0, 1fr);
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.36);
`;

export const ImagePreviewHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 18px;
  border-bottom: 1px solid ${colors.border};

  h2 {
    margin: 3px 0 0;
    font-size: clamp(17px, 2.5vw, 22px);
  }

  small {
    color: ${colors.brand};
    font-weight: 800;
  }
`;

export const ImagePreviewCloseButton = styled.button`
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border: 1px solid ${colors.borderStrong};
  border-radius: 50%;
  color: ${colors.text};
  background: ${colors.surface};
  font-size: 28px;
  line-height: 1;

  &:hover,
  &:focus-visible {
    border-color: ${colors.brand};
    outline: 0;
    color: ${colors.brand};
    background: ${colors.brandSoft};
  }
`;

export const ImagePreviewImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: calc(100dvh - 132px);
  object-fit: contain;
  background: ${colors.surfaceMuted};
`;

export const GachaName = styled.div`
  min-width: 0;

  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    display: block;
    overflow: hidden;
    margin-top: 5px;
    color: ${colors.textMuted};
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const Tags = styled.div`
  display: flex;
  overflow: hidden;
  flex-wrap: wrap;
  gap: 5px;

  span {
    padding: 4px 7px;
    border-radius: ${radii.round};
    color: ${colors.textMuted};
    background: ${colors.surfaceMuted};
    font-size: 11px;
  }
`;

export const RelationButton = styled.button<{ assigned: boolean }>`
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid
    ${({ assigned }) => (assigned ? colors.borderStrong : colors.brand)};
  border-radius: ${radii.small};
  color: ${({ assigned }) => (assigned ? colors.danger : 'white')};
  background: ${({ assigned }) => (assigned ? colors.surface : colors.brand)};
  font-size: 12px;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const LoadMoreButton = styled.button`
  display: block;
  min-width: 180px;
  min-height: 44px;
  margin: 18px auto 0;
  border: 1px solid ${colors.brand};
  border-radius: ${radii.round};
  color: ${colors.brand};
  background: ${colors.surface};
  font-weight: 800;
`;

export const Feedback = styled.div<{ error?: boolean }>`
  margin: 12px 0;
  color: ${({ error }) => (error ? colors.danger : colors.success)};
  font-size: 13px;
  font-weight: 700;
`;
