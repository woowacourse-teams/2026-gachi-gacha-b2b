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

export const CardGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
  gap: 22px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Card = styled.li`
  overflow: hidden;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 12px 28px ${colors.shadow};

  &:hover img {
    transform: scale(1.025);
  }
`;

export const ImageWrap = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: ${colors.surfaceMuted};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 180ms ease;
  }
`;

export const StatusBadge = styled.span<{
  status: 'UNCLASSIFIED' | 'CLASSIFIED' | 'SKIPPED';
}>`
  position: absolute;
  top: 12px;
  right: 12px;
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

export const IdBadge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 6px 10px;
  border-radius: ${radii.round};
  color: white;
  background: rgba(23, 26, 33, 0.82);
  font-size: 12px;
  font-weight: 800;
`;

export const CardBody = styled.div`
  padding: 18px;
`;

export const Source = styled.p`
  margin: 0 0 7px;
  color: ${colors.textMuted};
  font-size: 13px;
`;

export const CardTitle = styled.h2`
  overflow: hidden;
  min-height: 58px;
  margin: 0;
  font-size: 21px;
  line-height: 1.35;
  letter-spacing: -0.025em;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const Caption = styled.p`
  overflow: hidden;
  height: 44px;
  margin: 8px 0 16px;
  color: ${colors.textMuted};
  font-size: 14px;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const CategoryTags = styled.div`
  display: flex;
  min-height: 30px;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
`;

export const CategoryTag = styled.span`
  padding: 5px 9px;
  border-radius: ${radii.round};
  color: ${colors.brand};
  background: ${colors.brandSoft};
  font-size: 12px;
  font-weight: 800;
`;

export const CardButton = styled.button<{ secondary?: boolean }>`
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
