import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Page = styled.div`
  min-height: 100dvh;
  padding: 28px clamp(20px, 4vw, 54px) 42px;
`;

export const Header = styled.header`
  display: flex;
  min-height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
`;

export const BackButton = styled.button`
  padding: 9px 2px;
  border: 0;
  color: ${colors.text};
  background: transparent;
  font-size: 15px;
  font-weight: 800;
`;

export const HeaderTitle = styled.h1`
  margin: 0;
  font-size: clamp(22px, 3vw, 30px);
`;

export const ItemCount = styled.span`
  color: ${colors.textMuted};
  font-size: 14px;
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

export const Panel = styled.section`
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
`;

export const ZoomControls = styled.div`
  display: flex;
  gap: 8px;

  button {
    display: grid;
    width: 36px;
    height: 36px;
    padding: 0;
    place-items: center;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    color: ${colors.textMuted};
    background: ${colors.surface};
    font-size: 20px;
    font-weight: 800;
  }
`;

export const ImageStage = styled.div`
  display: grid;
  overflow: hidden;
  padding: 32px;
  place-items: center;
  background:
    linear-gradient(45deg, #f7f7f9 25%, transparent 25%) 0 0 / 22px 22px,
    linear-gradient(-45deg, #f7f7f9 25%, transparent 25%) 0 0 / 22px 22px,
    ${colors.surface};
`;

export const GachaImage = styled.img<{ zoom: number }>`
  display: block;
  width: min(100%, 660px);
  max-height: 620px;
  border-radius: ${radii.medium};
  object-fit: contain;
  transform: scale(${({ zoom }) => zoom});
  transition: transform 160ms ease;
`;

export const ImageError = styled.div`
  display: grid;
  width: min(100%, 520px);
  min-height: 280px;
  padding: 32px;
  place-items: center;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radii.medium};
  color: ${colors.textMuted};
  background: ${colors.surfaceMuted};
  text-align: center;
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

  label,
  strong {
    font-size: 14px;
    font-weight: 800;
  }

  span {
    overflow: hidden;
    color: ${colors.textMuted};
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export const NameInputWrap = styled.div`
  position: relative;
  margin-bottom: 38px;

  input {
    width: 100%;
    min-height: 62px;
    padding: 0 48px 0 16px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.medium};
    outline: 0;
    font-size: 17px;

    &:focus {
      border-color: ${colors.brand};
      box-shadow: 0 0 0 3px rgba(173, 40, 49, 0.12);
    }
  }

  button {
    position: absolute;
    top: 50%;
    right: 12px;
    display: grid;
    width: 32px;
    height: 32px;
    padding: 0;
    place-items: center;
    border: 0;
    color: ${colors.textMuted};
    background: transparent;
    font-size: 22px;
    transform: translateY(-50%);
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

export const StatePanel = styled.div`
  display: grid;
  min-height: calc(100dvh - 60px);
  padding: 40px;
  place-items: center;
  color: ${colors.textMuted};
  text-align: center;

  h1 {
    margin: 0 0 12px;
    color: ${colors.text};
  }

  button {
    margin-top: 18px;
    padding: 12px 18px;
    border: 0;
    border-radius: ${radii.small};
    color: white;
    background: ${colors.brand};
    font-weight: 800;
  }
`;
