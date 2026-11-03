import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const Root = styled.section`
  padding: 24px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 10px 28px ${colors.shadow};

  @media (max-width: 720px) {
    padding: 18px;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;

  h3 {
    margin: 4px 0 6px;
    font-size: clamp(20px, 2.5vw, 25px);
  }

  p {
    margin: 0;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.6;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const Eyebrow = styled.span`
  color: ${colors.brand};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.09em;
`;

export const PreviewBadge = styled.span`
  flex: 0 0 auto;
  padding: 7px 10px;
  border-radius: ${radii.round};
  color: ${colors.warning};
  background: #fff4e5;
  font-size: 11px;
  font-weight: 800;
`;

export const Notice = styled.p`
  margin: 0 0 20px;
  padding: 12px 14px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.medium};
  color: ${colors.text};
  background: ${colors.brandSoft};
  font-size: 13px;
  line-height: 1.6;

  strong {
    color: ${colors.brandDark};
  }
`;

export const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(310px, 0.92fr) minmax(0, 1.08fr);
  align-items: start;
  gap: 20px;

  @media (max-width: 1050px) {
    grid-template-columns: 1fr;
  }
`;

export const Editor = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
`;

export const Fieldset = styled.fieldset`
  display: grid;
  gap: 12px;
  min-width: 0;
  margin: 0;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  legend {
    padding: 0 5px;
    font-size: 14px;
    font-weight: 800;
  }
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 590px) {
    grid-template-columns: 1fr;
  }
`;

export const Field = styled.label`
  display: grid;
  min-width: 0;
  gap: 5px;
  color: ${colors.textMuted};
  font-size: 12px;
  font-weight: 700;

  input,
  textarea {
    width: 100%;
    min-height: 42px;
    padding: 9px 11px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    outline: 0;
    color: ${colors.text};
    background: ${colors.surface};
    font: inherit;
    font-size: 14px;
    font-weight: 500;
  }

  textarea {
    min-height: 72px;
    resize: vertical;
  }

  input:focus-visible,
  textarea:focus-visible {
    border-color: ${colors.brand};
    box-shadow: 0 0 0 3px ${colors.brandSoft};
  }

  input[aria-invalid='true'] {
    border-color: ${colors.danger};
  }

  small {
    color: ${colors.textMuted};
    font-size: 11px;
    font-weight: 500;
    line-height: 1.5;
  }
`;

export const GradeEditorList = styled.div`
  display: grid;
  gap: 12px;
`;

export const GradeEditorCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};
`;

export const GradeEditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    font-size: 13px;
  }
`;

export const FieldError = styled.p`
  margin: 0;
  color: ${colors.danger};
  font-size: 12px;
  line-height: 1.5;
`;

export const ActionButton = styled.button`
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.small};
  color: ${colors.text};
  background: ${colors.surface};
  font-size: 12px;
  font-weight: 800;

  &:hover,
  &:focus-visible {
    border-color: ${colors.brand};
    outline: 0;
    color: ${colors.brand};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const RemoveButton = styled(ActionButton)`
  min-height: 32px;
  padding: 5px 9px;
  color: ${colors.danger};
`;

export const ExportBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;

  small {
    color: ${colors.textMuted};
    font-size: 11px;
    line-height: 1.5;
  }
`;

export const Preview = styled.section`
  overflow: hidden;
  min-width: 0;
  border: 1px solid ${colors.border};
  border-radius: ${radii.large};
  background: ${colors.surface};
  box-shadow: 0 8px 20px ${colors.shadow};
`;

export const PreviewHeader = styled.header`
  padding: 22px;
  color: ${colors.surface};
  background: ${colors.text};

  > span {
    color: #ffb5b5;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.07em;
  }

  h4 {
    margin: 8px 0 3px;
    font-size: clamp(19px, 2.6vw, 27px);
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  p {
    margin: 3px 0 0;
    color: #d7d9df;
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
`;

export const PreviewBody = styled.div`
  display: grid;
  gap: 18px;
  padding: 20px 22px 22px;
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    padding: 5px 8px;
    border-radius: ${radii.small};
    color: ${colors.textMuted};
    background: ${colors.surfaceMuted};
    font-size: 11px;
    font-weight: 700;
  }
`;

export const Summary = styled.div`
  display: grid;
  gap: 6px;

  small {
    color: ${colors.textMuted};
    font-size: 11px;
    font-weight: 700;
  }

  strong {
    color: ${colors.text};
    font-size: clamp(24px, 3.6vw, 34px);
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: ${colors.textMuted};
    font-size: 12px;
    line-height: 1.5;
  }
`;

export const Track = styled.div`
  overflow: hidden;
  height: 11px;
  border-radius: ${radii.round};
  background: ${colors.surfaceMuted};

  > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: ${colors.brand};
    transition: width 180ms ease-out;
  }
`;

export const GradePreviewList = styled.ul`
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const GradePreviewCard = styled.li`
  display: grid;
  min-width: 0;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  > div {
    min-width: 0;
  }

  strong {
    font-size: 13px;
    overflow-wrap: anywhere;
  }

  small {
    display: block;
    margin-top: 3px;
    color: ${colors.textMuted};
    font-size: 11px;
    overflow-wrap: anywhere;
  }

  > span:last-child {
    color: ${colors.brandDark};
    font-size: 15px;
    font-weight: 900;
    white-space: nowrap;
  }

  @media (max-width: 520px) {
    grid-template-columns: 42px minmax(0, 1fr);

    > span:last-child {
      grid-column: 2;
    }
  }
`;

export const GradeSymbol = styled.span`
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: ${radii.small};
  color: ${colors.brand};
  background: ${colors.brandSoft};
  font-size: 15px;
  font-weight: 900;
  overflow-wrap: anywhere;
`;

export const LastOne = styled.div`
  padding: 14px;
  border: 1px dashed ${colors.borderStrong};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};

  strong {
    color: ${colors.brandDark};
    font-size: 12px;
  }

  p {
    margin: 5px 0 0;
    color: ${colors.text};
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
`;
