import styled from '@emotion/styled';

import { colors, radii } from '@/styles/tokens';

import type { AiSuggestionStatus } from '../model/aiSuggestion';

export const Editor = styled.section`
  textarea {
    display: block;
    width: 100%;
    min-height: 104px;
    padding: 15px 16px;
    resize: vertical;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.medium};
    outline: 0;
    font: inherit;
    line-height: 1.6;

    &:focus {
      border-color: ${colors.brand};
      box-shadow: 0 0 0 3px rgba(173, 40, 49, 0.12);
    }

    &[aria-invalid='true'] {
      border-color: ${colors.danger};
    }

    &:disabled {
      background: ${colors.surfaceMuted};
    }
  }
`;

export const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;

  label {
    font-size: 14px;
    font-weight: 800;
  }

  div {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

export const TextButton = styled.button`
  padding: 7px 0;
  border: 0;
  background: transparent;
  font-size: 13px;
  font-weight: 800;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const RetryButton = styled(TextButton)`
  color: ${colors.success};
`;

export const ManageButton = styled(TextButton)`
  color: ${colors.brand};
`;

export const HelperText = styled.p`
  margin: 8px 0 0;
  color: ${colors.textMuted};
  font-size: 12px;
  line-height: 1.5;
`;

export const AiState = styled.p<{ status: AiSuggestionStatus }>`
  margin: 8px 0 0;
  color: ${({ status }) =>
    status === 'FAILED'
      ? colors.danger
      : status === 'READY'
        ? colors.success
        : colors.textMuted};
  font-size: 12px;
  font-weight: 700;
`;

export const UnknownCategoryMessage = styled.p`
  margin: 8px 0 0;
  color: ${colors.danger};
  font-size: 12px;
  font-weight: 700;
`;

export const CategoryCatalog = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radii.small};
  color: ${colors.textMuted};
  background: ${colors.surfaceMuted};
  font-size: 12px;

  strong {
    color: ${colors.text};
  }

  div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid ${colors.borderStrong};
    border-radius: ${radii.round};
    color: ${colors.textMuted};
    background: ${colors.surface};
    font-size: 12px;
    font-weight: 800;

    &[aria-pressed='true'] {
      border-color: ${colors.brand};
      color: ${colors.brand};
      background: ${colors.brandSoft};
    }

    &:hover:not(:disabled) {
      border-color: ${colors.brand};
      color: ${colors.brand};
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  .add-category {
    border-style: dashed;
    border-color: ${colors.brand};
    color: ${colors.brand};
  }
`;
