import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Page = styled.div`
  min-height: 100dvh;
  padding: 28px clamp(20px, 4vw, 54px) 42px;
`;

export const Header = styled.header`
  display: grid;
  grid-template-columns: auto 1fr auto;
  min-height: 66px;
  align-items: center;
  gap: 22px;
  margin-bottom: 20px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr auto;
  }
`;

export const BackButton = styled.button`
  padding: 9px 2px;
  border: 0;
  color: ${colors.text};
  background: transparent;
  font-size: 15px;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const HeaderCopy = styled.div`
  h1 {
    margin: 0;
    font-size: clamp(22px, 3vw, 30px);
  }

  p {
    margin: 5px 0 0;
    color: ${colors.textMuted};
    font-size: 13px;
  }

  @media (max-width: 760px) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
`;

export const SourceBadge = styled.span`
  padding: 8px 12px;
  border-radius: ${radii.round};
  color: ${colors.brand};
  background: ${colors.brandSoft};
  font-size: 12px;
  font-weight: 800;
`;

export const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.82fr);
  gap: 24px;
  min-height: calc(100dvh - 156px);

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  overflow: hidden;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 12px 34px ${colors.shadow};
`;

export const ImagePanel = styled(Panel)`
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 640px;
`;

export const PanelHeader = styled.div`
  display: flex;
  min-height: 76px;
  padding: 0 26px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid ${colors.border};

  h2 {
    margin: 0;
    font-size: 20px;
  }

  span {
    color: ${colors.textMuted};
    font-size: 12px;
  }
`;

export const ImageStage = styled.div`
  display: grid;
  min-height: 520px;
  padding: 32px;
  place-items: center;
  background:
    linear-gradient(45deg, #f7f7f9 25%, transparent 25%) 0 0 / 22px 22px,
    linear-gradient(-45deg, #f7f7f9 25%, transparent 25%) 0 0 / 22px 22px,
    ${colors.surface};
`;

export const EmptyImage = styled.div`
  width: min(100%, 520px);
  padding: 52px 34px;
  border: 2px dashed ${colors.borderStrong};
  border-radius: ${radii.large};
  background: rgba(255, 255, 255, 0.92);
  text-align: center;

  strong {
    display: block;
    font-size: 22px;
  }

  p {
    margin: 10px 0 24px;
    color: ${colors.textMuted};
    font-size: 14px;
    line-height: 1.6;
  }
`;

export const UploadOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
`;

export const UploadButton = styled.button<{ kind?: 'primary' }>`
  min-height: 44px;
  padding: 0 16px;
  border: 1px solid ${({ kind }) => (kind ? colors.brand : colors.borderStrong)};
  border-radius: ${radii.small};
  color: ${({ kind }) => (kind ? 'white' : colors.text)};
  background: ${({ kind }) => (kind ? colors.brand : colors.surface)};
  font-weight: 800;

  &:hover:not(:disabled) {
    background: ${({ kind }) => (kind ? colors.brandDark : colors.surfaceMuted)};
  }
`;

export const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
`;

export const Preview = styled.div`
  width: min(100%, 700px);
`;

export const PreviewImage = styled.img`
  display: block;
  width: 100%;
  max-height: 560px;
  border-radius: ${radii.medium};
  object-fit: contain;
`;

export const PreviewFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  @media (max-width: 560px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const FileInfo = styled.div`
  min-width: 0;

  strong,
  span {
    display: block;
  }

  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    margin-top: 4px;
    color: ${colors.textMuted};
    font-size: 12px;
  }
`;

export const PreviewActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
`;

export const FormPanel = styled(Panel)`
  display: flex;
  min-height: 640px;
  flex-direction: column;
`;

export const FormBody = styled.div`
  flex: 1;
  padding: 28px;
`;

export const FieldHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 10px;

  label {
    font-size: 14px;
    font-weight: 800;
  }

  span {
    color: ${colors.textMuted};
    font-size: 12px;
  }
`;

export const NameInput = styled.input`
  width: 100%;
  min-height: 62px;
  margin-bottom: 38px;
  padding: 0 16px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.medium};
  outline: 0;
  font-size: 17px;

  &:focus {
    border-color: ${colors.brand};
    box-shadow: 0 0 0 3px rgba(173, 40, 49, 0.12);
  }
`;

export const FormError = styled.div`
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: ${radii.small};
  color: ${colors.danger};
  background: ${colors.brandSoft};
  font-size: 14px;
`;

export const Progress = styled.div`
  margin-top: 20px;
  padding: 12px 14px;
  border-radius: ${radii.small};
  color: ${colors.success};
  background: #eaf7ef;
  font-size: 14px;
  font-weight: 800;
`;

export const Actions = styled.footer`
  display: grid;
  grid-template-columns: minmax(120px, 0.46fr) 1fr;
  gap: 12px;
  padding: 20px 26px;
  border-top: 1px solid ${colors.border};
  background: #fbfbfd;
`;

export const ActionButton = styled.button<{ kind?: 'primary' }>`
  min-height: 54px;
  border: 1px solid ${({ kind }) => (kind ? colors.brand : colors.borderStrong)};
  border-radius: ${radii.small};
  color: ${({ kind }) => (kind ? 'white' : colors.text)};
  background: ${({ kind }) => (kind ? colors.brand : colors.surface)};
  font-weight: 800;

  &:hover:not(:disabled) {
    background: ${({ kind }) => (kind ? colors.brandDark : colors.surfaceMuted)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const SuccessPanel = styled.div`
  display: grid;
  min-height: calc(100dvh - 60px);
  padding: 40px;
  place-items: center;
`;

export const SuccessCard = styled.section`
  width: min(100%, 560px);
  padding: 42px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 18px 50px ${colors.shadow};
  text-align: center;

  h1 {
    margin: 14px 0 8px;
  }

  p {
    margin: 0;
    color: ${colors.textMuted};
  }
`;

export const SuccessMark = styled.span`
  display: inline-grid;
  width: 58px;
  height: 58px;
  place-items: center;
  border-radius: 50%;
  color: white;
  background: ${colors.success};
  font-size: 28px;
  font-weight: 900;
`;

export const SuccessActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 28px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;
