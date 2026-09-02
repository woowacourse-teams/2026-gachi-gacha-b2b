import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Page = styled.div`
  min-height: 100dvh;
  padding: 42px clamp(22px, 5vw, 72px) 72px;
`;

export const Header = styled.header`
  max-width: 1120px;
  margin: 0 auto 28px;
`;

export const BackButton = styled.button`
  margin-bottom: 14px;
  padding: 7px 0;
  border: 0;
  color: ${colors.brand};
  background: transparent;
  font-weight: 800;
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

export const RequiredNotice = styled.p`
  margin: 14px 0 0;
  color: ${colors.textMuted};
  font-size: 13px;

  strong {
    color: ${colors.danger};
  }
`;

export const Form = styled.form`
  display: grid;
  max-width: 1120px;
  gap: 18px;
  margin: 0 auto;
`;

export const FormSection = styled.fieldset`
  min-width: 0;
  padding: 26px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 10px 28px ${colors.shadow};

  legend {
    padding: 0 8px;
    font-size: 20px;
    font-weight: 900;
  }

  > p {
    margin: 0 0 22px;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.6;
  }
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const FieldLabel = styled.label`
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  color: ${colors.text};
  font-size: 14px;
  font-weight: 800;

  &[data-span='full'] {
    grid-column: 1 / -1;
  }

  > span > strong {
    margin-left: 3px;
    color: ${colors.danger};
  }

  input,
  textarea {
    width: 100%;
    min-height: 46px;
    padding: 12px 14px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    outline: 0;
    background: ${colors.surface};
    color: ${colors.text};
    font: inherit;
    font-weight: 500;
  }

  textarea {
    min-height: 92px;
    resize: vertical;
  }

  input:focus,
  textarea:focus {
    border-color: ${colors.brand};
    box-shadow: 0 0 0 3px rgba(173, 40, 49, 0.12);
  }

  input[aria-invalid='true'],
  textarea[aria-invalid='true'] {
    border-color: ${colors.danger};
  }

  input:disabled {
    cursor: not-allowed;
    background: ${colors.surfaceMuted};
    opacity: 0.7;
  }
`;

export const FieldHint = styled.small`
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
`;

export const FieldError = styled.small`
  color: ${colors.danger};
  font-size: 12px;
  font-weight: 700;
  line-height: 1.5;
`;

export const ToggleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const ToggleLabel = styled.label`
  display: flex;
  min-height: 58px;
  padding: 14px 16px;
  align-items: center;
  gap: 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};
  font-size: 14px;
  font-weight: 800;

  input {
    width: 18px;
    height: 18px;
    accent-color: ${colors.brand};
  }
`;

export const FormError = styled.div`
  padding: 14px 16px;
  border: 1px solid rgba(180, 35, 46, 0.2);
  border-radius: ${radii.small};
  color: ${colors.danger};
  background: ${colors.brandSoft};
  font-size: 14px;
  font-weight: 700;
`;

export const Actions = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;

  @media (max-width: 560px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
`;

export const ActionButton = styled.button<{ kind?: 'primary' }>`
  min-width: 148px;
  min-height: 52px;
  padding: 0 20px;
  border: 1px solid ${({ kind }) => (kind ? colors.brand : colors.borderStrong)};
  border-radius: ${radii.small};
  color: ${({ kind }) => (kind ? 'white' : colors.text)};
  background: ${({ kind }) => (kind ? colors.brand : colors.surface)};
  font-weight: 800;

  &:hover:not(:disabled) {
    background: ${({ kind }) =>
      kind ? colors.brandDark : colors.surfaceMuted};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 560px) {
    min-width: 0;
  }
`;
