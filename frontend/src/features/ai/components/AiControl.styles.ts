import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Control = styled.section`
  display: grid;
  gap: 10px;
  margin-top: auto;
  padding: 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};

  @media (max-width: 820px) {
    position: fixed;
    right: 14px;
    bottom: 14px;
    z-index: 30;
    width: min(220px, calc(100vw - 28px));
    margin: 0;
    box-shadow: 0 10px 28px rgba(38, 30, 31, 0.16);
  }
`;

export const ControlHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    font-size: 13px;
  }
`;

export const Status = styled.span<{ enabled: boolean }>`
  color: ${({ enabled }) => (enabled ? colors.success : colors.textMuted)};
  font-size: 11px;
  font-weight: 900;
`;

export const ControlDescription = styled.p`
  margin: 0;
  color: ${colors.textMuted};
  font-size: 11px;
  line-height: 1.5;
`;

export const ControlActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;

  button {
    min-height: 34px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    color: ${colors.text};
    background: ${colors.surface};
    font-size: 11px;
    font-weight: 800;
  }

  button:only-child {
    grid-column: 1 / -1;
  }
`;

export const SettingsPanel = styled.div`
  width: min(100%, 500px);

  select,
  input {
    width: 100%;
    min-height: 46px;
    padding: 0 13px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    outline: 0;
    background: ${colors.surface};

    &:focus {
      border-color: ${colors.brand};
      box-shadow: 0 0 0 3px rgba(173, 40, 49, 0.12);
    }
  }
`;

export const SettingsFields = styled.div`
  display: grid;
  gap: 16px;
  margin-top: 20px;
`;

export const KeyField = styled.div`
  display: grid;
  gap: 8px;

  > input {
    width: 100%;
  }
`;

export const KeyLabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  color: ${colors.text};
  font-size: 14px;
  font-weight: 800;
`;

export const KeyHelp = styled.span`
  position: relative;
  display: inline-flex;

  &:hover > [role='tooltip'],
  &:focus-within > [role='tooltip'] {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
`;

export const KeyHelpButton = styled.button`
  display: inline-grid;
  width: 20px;
  height: 20px;
  padding: 0;
  place-items: center;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.round};
  color: ${colors.textMuted};
  background: ${colors.surface};
  font-size: 12px;
  font-weight: 900;

  &:hover,
  &:focus-visible {
    border-color: ${colors.brand};
    outline: 0;
    color: ${colors.brand};
  }
`;

export const KeyHelpTooltip = styled.span`
  position: absolute;
  z-index: 5;
  top: 28px;
  left: -96px;
  visibility: hidden;
  width: min(360px, calc(100vw - 72px));
  padding: 14px 16px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.medium};
  color: ${colors.text};
  background: ${colors.surface};
  box-shadow: 0 14px 36px rgba(38, 30, 31, 0.2);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.55;
  opacity: 0;
  transform: translateY(-4px);
  transition:
    opacity 120ms ease,
    transform 120ms ease;

  strong {
    display: block;
    margin-bottom: 7px;
    color: ${colors.brand};
  }

  ol {
    margin: 0;
    padding-left: 18px;
  }

  a {
    display: inline-block;
    margin-top: 9px;
    color: ${colors.brand};
    font-weight: 800;
  }

  small {
    display: block;
    margin-top: 9px;
    color: ${colors.textMuted};
  }
`;

export const SecurityNotice = styled.div`
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: ${radii.small};
  color: ${colors.textMuted};
  background: ${colors.surfaceMuted};
  font-size: 12px;
  line-height: 1.6;

  strong {
    color: ${colors.warning};
  }
`;
