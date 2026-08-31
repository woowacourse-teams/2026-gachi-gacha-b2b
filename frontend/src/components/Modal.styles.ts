import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Overlay = styled.div`
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgba(20, 22, 28, 0.58);
`;

export const DialogPanel = styled.div`
  width: min(100%, 460px);
  padding: 26px;
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);

  h2 {
    margin: 0;
    font-size: 23px;
  }

  p {
    margin: 10px 0 22px;
    color: ${colors.textMuted};
    line-height: 1.6;
  }
`;

export const FieldLabel = styled.label`
  display: grid;
  gap: 8px;
  color: ${colors.text};
  font-size: 14px;
  font-weight: 800;

  input,
  textarea {
    width: 100%;
    padding: 13px 14px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    outline: 0;
    resize: vertical;

    &:focus {
      border-color: ${colors.brand};
      box-shadow: 0 0 0 3px rgba(173, 40, 49, 0.12);
    }
  }
`;

export const DialogError = styled.div`
  margin-top: 12px;
  color: ${colors.danger};
  font-size: 13px;
`;

export const DialogActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 22px;
`;

export const DialogButton = styled.button<{ kind?: 'primary' | 'danger' }>`
  min-height: 46px;
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
    opacity: 0.55;
  }
`;
