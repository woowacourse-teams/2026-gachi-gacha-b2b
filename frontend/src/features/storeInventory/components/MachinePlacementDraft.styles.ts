import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

export const DraftSection = styled.section`
  min-width: 0;
`;

export const DraftHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  h3 {
    margin: 0;
    font-size: 20px;
  }

  p {
    margin: 7px 0 0;
    color: ${colors.textMuted};
    font-size: 14px;
    line-height: 1.6;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const DraftBadge = styled.span`
  flex: 0 0 auto;
  padding: 7px 11px;
  border-radius: ${radii.round};
  color: ${colors.warning};
  background: #fff5e8;
  font-size: 12px;
  font-weight: 800;
`;

export const DraftWarning = styled.div`
  margin-top: 16px;
  padding: 13px 16px;
  border: 1px solid #f3d3a5;
  border-radius: ${radii.medium};
  color: #704007;
  background: #fff8ef;
  font-size: 13px;
  line-height: 1.6;

  strong {
    display: block;
    margin-bottom: 2px;
    font-size: 14px;
  }
`;

export const DraftImport = styled.div`
  margin-top: 16px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  h4 {
    margin: 0;
    font-size: 16px;
  }

  > p:not([role]) {
    margin: 7px 0 0;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.6;
  }

  > label {
    max-width: 560px;
    margin-top: 12px;
  }
`;

export const DraftGuide = styled.p`
  margin: 13px 0 0;
  color: ${colors.textMuted};
  font-size: 13px;
  line-height: 1.6;
`;

export const DraftEmpty = styled.p`
  margin: 16px 0 0;
  padding: 14px;
  border: 1px dashed ${colors.border};
  border-radius: ${radii.medium};
  color: ${colors.textMuted};
  background: ${colors.surfaceMuted};
  font-size: 13px;
`;

export const CoinSetup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 12px;
  margin-top: 18px;

  > label {
    flex: 1 1 260px;
    max-width: 400px;
  }

  > button {
    min-height: 42px;
    padding: 9px 15px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    color: ${colors.text};
    background: ${colors.surface};
    font-weight: 800;
  }

  > button:hover,
  > button:focus-visible {
    border-color: ${colors.brand};
    color: ${colors.brand};
  }
`;

export const GroupSetupGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin-top: 12px;
`;

export const GroupSetupCard = styled.div<{ active?: boolean }>`
  display: grid;
  align-content: start;
  gap: 9px;
  min-width: 0;
  padding: 12px;
  border: 1px solid ${({ active }) => (active ? colors.brand : colors.border)};
  border-radius: ${radii.medium};
  background: ${({ active }) => (active ? '#fff8f6' : colors.surface)};

  > button:first-of-type {
    display: grid;
    gap: 3px;
    width: 100%;
    padding: 0;
    border: 0;
    color: ${colors.text};
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  > button:first-of-type strong {
    font-size: 16px;
  }

  > button:first-of-type span {
    color: ${colors.brand};
    font-size: 13px;
    font-weight: 800;
  }

  > button:first-of-type small {
    color: ${colors.textMuted};
    font-size: 12px;
  }

  > label {
    display: grid;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
  }

  > .remove-group {
    justify-self: start;
    padding: 3px 0;
    border: 0;
    color: ${colors.textMuted};
    background: transparent;
    font-size: 12px;
    text-decoration: underline;
  }

  > button:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 3px;
  }
`;

export const GroupCountInput = styled.input`
  width: 100%;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.small};
  color: ${colors.text};
  background: ${colors.surface};
  font: inherit;
  font-size: 14px;

  &[aria-invalid='true'] {
    border-color: ${colors.danger};
  }

  &:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 1px;
  }
`;

export const MachineGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 12px;
`;

export const MachineTile = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 70px;
  padding: 9px;
  border: 1px solid ${({ active }) => (active ? colors.brand : colors.border)};
  border-radius: ${radii.medium};
  color: ${colors.text};
  background: ${({ active }) => (active ? '#fff8f6' : colors.surface)};
  text-align: left;
  cursor: pointer;

  > img,
  > .image-placeholder {
    display: grid;
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    place-items: center;
    border-radius: ${radii.small};
    background: ${colors.surfaceMuted};
    color: ${colors.textMuted};
    font-size: 11px;
    object-fit: cover;
  }

  > .machine-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 13px;
  }

  small {
    color: ${colors.textMuted};
    font-size: 12px;
  }

  &:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }
`;

export const MachineDetails = styled.fieldset`
  min-width: 0;
  margin: 18px 0 0;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surface};

  legend {
    padding: 0 5px;
    font-size: 15px;
    font-weight: 800;
  }

  > p {
    margin: 0 0 12px;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.5;
  }

  > .assigned-gacha {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
    padding: 10px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
  }

  > .assigned-gacha img,
  > .assigned-gacha .image-placeholder {
    display: grid;
    flex: 0 0 auto;
    width: 64px;
    height: 64px;
    place-items: center;
    border-radius: ${radii.small};
    background: ${colors.surfaceMuted};
    color: ${colors.textMuted};
    font-size: 11px;
    object-fit: cover;
  }

  > .assigned-gacha > span:not(.image-placeholder) {
    display: grid;
    flex: 1 1 140px;
    min-width: 0;
    gap: 4px;
  }

  > .assigned-gacha strong {
    overflow-wrap: anywhere;
    font-size: 14px;
  }

  > .assigned-gacha small {
    color: ${colors.textMuted};
    font-size: 12px;
  }

  > .assigned-gacha button {
    padding: 7px 10px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    color: ${colors.textMuted};
    background: ${colors.surface};
    font-size: 12px;
    font-weight: 800;
  }
`;

export const GachaPicker = styled.section`
  min-width: 0;
  margin-top: 12px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};

  h4 {
    margin: 0 0 10px;
    font-size: 15px;
  }

  > label {
    max-width: 420px;
  }
`;

export const GachaChoices = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 9px;
  margin-top: 12px;
`;

export const GachaChoice = styled.button`
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  min-height: 76px;
  padding: 8px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.small};
  color: ${colors.text};
  background: ${colors.surface};
  text-align: left;
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: ${colors.brand};
    background: #fff8f6;
  }

  > img,
  > .image-placeholder {
    display: grid;
    flex: 0 0 auto;
    width: 58px;
    height: 58px;
    place-items: center;
    border-radius: ${radii.small};
    background: ${colors.surfaceMuted};
    color: ${colors.textMuted};
    font-size: 11px;
    object-fit: cover;
  }

  > span:last-child {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    font-size: 12px;
  }

  small {
    color: ${colors.textMuted};
    font-size: 11px;
  }

  &:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }
`;

export const MoreButton = styled.button`
  margin-top: 10px;
  padding: 8px 12px;
  border: 1px solid ${colors.borderStrong};
  border-radius: ${radii.small};
  color: ${colors.text};
  background: ${colors.surface};
  font-size: 12px;
  font-weight: 800;

  &:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }
`;

export const PlacementList = styled.ol`
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
`;

export const PlacementItem = styled.li`
  min-width: 0;
`;

export const PlacementCard = styled.fieldset`
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

export const PlacementCardActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;

  button {
    padding: 6px 9px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    color: ${colors.textMuted};
    background: ${colors.surface};
    font-size: 12px;
    font-weight: 700;
  }

  button:hover,
  button:focus-visible {
    border-color: ${colors.danger};
    color: ${colors.danger};
  }
`;

export const PlacementFields = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 13px;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const DraftField = styled.label`
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 6px;
  color: ${colors.text};
  font-size: 13px;
  font-weight: 700;

  input,
  select {
    width: 100%;
    min-height: 42px;
    padding: 9px 11px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    color: ${colors.text};
    background: ${colors.surface};
    font: inherit;
    font-weight: 400;
  }

  input:focus-visible,
  select:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 1px;
  }

  input[aria-invalid='true'],
  select[aria-invalid='true'] {
    border-color: ${colors.danger};
  }

  small {
    color: ${colors.textMuted};
    font-size: 11px;
    font-weight: 400;
    line-height: 1.4;
  }
`;

export const FieldError = styled.span`
  color: ${colors.danger};
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
`;

export const GachaPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  margin-top: 12px;
  color: ${colors.textMuted};
  font-size: 12px;

  img,
  > span[data-placeholder] {
    display: grid;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: ${radii.small};
    background: ${colors.surfaceMuted};
    object-fit: cover;
  }

  > span:last-child {
    overflow-wrap: anywhere;
  }
`;

export const ReserveSection = styled.section`
  margin-top: 18px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.medium};
  background: ${colors.surfaceMuted};

  h3 {
    margin: 0;
    font-size: 16px;
  }

  p {
    margin: 7px 0 0;
    color: ${colors.textMuted};
    font-size: 13px;
    line-height: 1.6;
  }
`;

export const ReserveList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ReservePicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 9px;
  margin-top: 13px;

  label {
    display: grid;
    flex: 1 1 280px;
    gap: 6px;
    color: ${colors.text};
    font-size: 13px;
    font-weight: 700;
  }

  select {
    width: 100%;
    min-height: 42px;
    padding: 9px 11px;
    border: 1px solid ${colors.border};
    border-radius: ${radii.small};
    color: ${colors.text};
    background: ${colors.surface};
  }

  button {
    min-height: 42px;
    padding: 9px 13px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.small};
    color: ${colors.text};
    background: ${colors.surface};
    font-weight: 800;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  select:focus-visible,
  button:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 1px;
  }
`;

export const ReserveItem = styled.div`
  min-width: 0;
  padding: 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.small};
  background: ${colors.surface};

  > button {
    margin-top: 8px;
    padding: 4px 0;
    border: 0;
    color: ${colors.textMuted};
    background: transparent;
    font-size: 12px;
    font-weight: 700;
  }

  > button:hover,
  > button:focus-visible {
    color: ${colors.danger};
    text-decoration: underline;
  }
`;

export const DraftActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;

  button {
    min-height: 42px;
    padding: 9px 15px;
    border-radius: ${radii.small};
    font-weight: 800;
  }

  button {
    border: 1px solid ${colors.brand};
    color: ${colors.surface};
    background: ${colors.brand};
  }

  button:hover,
  button:focus-visible {
    background: ${colors.brandDark};
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

export const DraftFeedback = styled.p<{ error?: boolean }>`
  margin: 13px 0 0;
  color: ${({ error }) => (error ? colors.danger : colors.success)};
  font-size: 13px;
  line-height: 1.5;
`;
