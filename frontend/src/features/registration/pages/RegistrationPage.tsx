import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createCategory,
  deleteCategory,
  getCategories,
} from '@/features/classification/api/classificationApi';
import CategoryDialog from '@/features/classification/components/CategoryDialog';
import CategorySelector from '@/features/classification/components/CategorySelector';
import { toggleCategory } from '@/features/classification/model/category';
import type {
  Category,
  ClassificationItem,
} from '@/features/classification/model/classification';
import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  ActionButton,
  Actions,
  BackButton,
  EmptyImage,
  FieldHeader,
  FileInfo,
  FormBody,
  FormError,
  FormPanel,
  Header,
  HeaderCopy,
  HiddenInput,
  ImagePanel,
  ImageStage,
  NameInput,
  Page,
  PanelHeader,
  Preview,
  PreviewActions,
  PreviewFooter,
  PreviewImage,
  Progress,
  SourceBadge,
  SuccessActions,
  SuccessCard,
  SuccessMark,
  SuccessPanel,
  UploadButton,
  UploadOptions,
  Workspace,
} from './RegistrationPage.styles';
import {
  createFieldGacha,
  createFieldImageUploadTicket,
  uploadFieldImage,
} from '../api/registrationApi';
import {
  SUPPORTED_FIELD_IMAGE_TYPES,
  validateFieldImage,
} from '../model/registration';
import type { FieldGachaDraft, RegistrationStage } from '../model/registration';

interface RegistrationPageProps {
  onNavigate: (path: string) => void;
}

const INITIAL_DRAFT: FieldGachaDraft = { name: '', categoryIds: [] };

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
};

const getStageMessage = (stage: RegistrationStage) => {
  if (stage === 'PREPARING_UPLOAD')
    return '안전한 이미지 업로드 주소를 준비하고 있습니다.';
  if (stage === 'UPLOADING_IMAGE') return '이미지를 업로드하고 있습니다.';
  if (stage === 'SAVING_DATA')
    return '가챠 이름과 카테고리를 저장하고 있습니다.';
  return '';
};

export default function RegistrationPage({
  onNavigate,
}: RegistrationPageProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<FieldGachaDraft>(INITIAL_DRAFT);
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [pendingObjectKey, setPendingObjectKey] = useState<string | null>(null);
  const [stage, setStage] = useState<RegistrationStage>('IDLE');
  const [error, setError] = useState('');
  const [hasSubmitFailed, setHasSubmitFailed] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [createdItem, setCreatedItem] = useState<ClassificationItem | null>(
    null,
  );
  const isSubmitting = stage !== 'IDLE';
  const isDirty = Boolean(
    !createdItem && (file || draft.name.trim() || draft.categoryIds.length > 0),
  );
  const canSubmit = Boolean(
    file && draft.name.trim() && draft.categoryIds.length > 0 && !isSubmitting,
  );
  const acceptedImageTypes = useMemo(
    () => SUPPORTED_FIELD_IMAGE_TYPES.join(','),
    [],
  );

  useEffect(() => {
    void getCategories()
      .then(setCategories)
      .catch((cause: unknown) => setError(getErrorMessage(cause)));
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!isDirty) return;

    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [isDirty]);

  const selectFile = (selectedFile: File | undefined) => {
    if (!selectedFile) return;

    setHasSubmitFailed(false);
    const validationError = validateFieldImage(selectedFile);

    if (validationError) {
      setError(validationError);
      return;
    }

    const nameFromFile = selectedFile.name.replace(/\.[^.]+$/, '').trim();
    setFile(selectedFile);
    setDraft((current) => ({
      ...current,
      name: current.name || nameFromFile,
    }));
    setPendingObjectKey(null);
    setError('');
    setHasSubmitFailed(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.currentTarget.files?.[0]);
    event.currentTarget.value = '';
  };

  const removeFile = () => {
    if (isSubmitting) return;
    setFile(null);
    setPendingObjectKey(null);
    setError('');
    setHasSubmitFailed(false);
  };

  const handleCreateCategory = async (name: string) => {
    const category = await createCategory(name);
    setCategories((current) => [...current, category]);
    setDraft((current) => ({
      ...current,
      categoryIds: [...current.categoryIds, category.id],
    }));
    setHasSubmitFailed(false);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    await deleteCategory(categoryId);
    setCategories((current) =>
      current.filter((category) => category.id !== categoryId),
    );
    setDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.filter((id) => id !== categoryId),
    }));
    setHasSubmitFailed(false);
  };

  const handleSubmit = async () => {
    if (!file || !draft.name.trim() || draft.categoryIds.length === 0) {
      setError('사진, 이름, 카테고리를 모두 입력해 주세요.');
      return;
    }

    setError('');
    setHasSubmitFailed(false);

    try {
      let objectKey = pendingObjectKey;

      if (!objectKey) {
        setStage('PREPARING_UPLOAD');
        const ticket = await createFieldImageUploadTicket(file);
        setStage('UPLOADING_IMAGE');
        await uploadFieldImage(file, ticket);
        objectKey = ticket.objectKey;
        setPendingObjectKey(objectKey);
      }

      setStage('SAVING_DATA');
      const result = await createFieldGacha({ file, objectKey, draft });
      setCreatedItem(result.item);
    } catch (cause) {
      setError(`${getErrorMessage(cause)} 다시 시도해 주세요.`);
      setHasSubmitFailed(true);
    } finally {
      setStage('IDLE');
    }
  };

  const handleBack = () => {
    if (isSubmitting) return;

    if (
      isDirty &&
      !window.confirm('등록하지 않은 내용이 있습니다. 나갈까요?')
    ) {
      return;
    }

    onNavigate('/');
  };

  const resetForm = () => {
    setFile(null);
    setDraft(INITIAL_DRAFT);
    setPendingObjectKey(null);
    setCreatedItem(null);
    setError('');
    setHasSubmitFailed(false);
  };

  if (createdItem) {
    return (
      <SuccessPanel>
        <SuccessCard aria-live="polite">
          <SuccessMark aria-hidden>✓</SuccessMark>
          <h1>가챠 등록을 완료했습니다.</h1>
          <p>
            ID #{createdItem.id} · {createdItem.name}
          </p>
          <SuccessActions>
            <ActionButton type="button" onClick={resetForm}>
              다른 사진 등록
            </ActionButton>
            <ActionButton
              kind="primary"
              type="button"
              onClick={() => onNavigate('/classified')}
            >
              분류 완료 목록 확인
            </ActionButton>
          </SuccessActions>
        </SuccessCard>
      </SuccessPanel>
    );
  }

  return (
    <Page>
      <Header>
        <BackButton disabled={isSubmitting} type="button" onClick={handleBack}>
          ← 목록으로
        </BackButton>
        <HeaderCopy>
          <h1>현장 가챠 사진 등록</h1>
          <p>사진과 분류 정보를 한 번에 등록합니다.</p>
        </HeaderCopy>
        <SourceBadge>수집 경로 · FIELD</SourceBadge>
      </Header>

      <Workspace>
        <ImagePanel aria-labelledby="field-image-title">
          <PanelHeader>
            <h2 id="field-image-title">사진 추가</h2>
            <span>JPG, PNG, WebP · 최대 10MB</span>
          </PanelHeader>
          <ImageStage>
            {file && previewUrl ? (
              <Preview>
                <PreviewImage alt="등록할 가챠 미리보기" src={previewUrl} />
                <PreviewFooter>
                  <FileInfo>
                    <strong>{file.name}</strong>
                    <span>
                      {file.type} · {formatFileSize(file.size)}
                    </span>
                  </FileInfo>
                  <PreviewActions>
                    <UploadButton
                      disabled={isSubmitting}
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      사진 교체
                    </UploadButton>
                    <UploadButton
                      disabled={isSubmitting}
                      type="button"
                      onClick={removeFile}
                    >
                      제거
                    </UploadButton>
                  </PreviewActions>
                </PreviewFooter>
              </Preview>
            ) : (
              <EmptyImage>
                <strong>등록할 가챠 사진을 선택해 주세요.</strong>
                <p>
                  웹에서는 파일을 선택하고, 모바일에서는 갤러리 또는 카메라를
                  사용할 수 있습니다.
                </p>
                <UploadOptions>
                  <UploadButton
                    kind="primary"
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                  >
                    파일·갤러리 선택
                  </UploadButton>
                  <UploadButton
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    카메라로 촬영
                  </UploadButton>
                </UploadOptions>
              </EmptyImage>
            )}
            <HiddenInput
              ref={galleryInputRef}
              accept={acceptedImageTypes}
              aria-label="파일 또는 갤러리에서 가챠 사진 선택"
              type="file"
              onChange={handleFileChange}
            />
            <HiddenInput
              ref={cameraInputRef}
              accept={acceptedImageTypes}
              aria-label="카메라로 가챠 사진 촬영"
              capture="environment"
              type="file"
              onChange={handleFileChange}
            />
          </ImageStage>
        </ImagePanel>

        <FormPanel aria-labelledby="field-gacha-form-title">
          <FormBody>
            <FieldHeader>
              <label id="field-gacha-form-title" htmlFor="field-gacha-name">
                가챠 이름
              </label>
              <span>최대 100자</span>
            </FieldHeader>
            <NameInput
              id="field-gacha-name"
              disabled={isSubmitting}
              maxLength={100}
              placeholder="가챠 이름을 입력해 주세요"
              value={draft.name}
              onChange={(event) => {
                setDraft({ ...draft, name: event.target.value });
                setError('');
                setHasSubmitFailed(false);
              }}
            />

            <CategorySelector
              categories={categories}
              disabled={isSubmitting}
              selectedCategoryIds={draft.categoryIds}
              onManage={() => setIsCategoryDialogOpen(true)}
              onToggle={(categoryId) => {
                setDraft({
                  ...draft,
                  categoryIds: toggleCategory(draft.categoryIds, categoryId),
                });
                setError('');
                setHasSubmitFailed(false);
              }}
            />

            {getStageMessage(stage) && (
              <Progress aria-live="polite">{getStageMessage(stage)}</Progress>
            )}
            {error && <FormError role="alert">{error}</FormError>}
          </FormBody>

          <Actions>
            <ActionButton
              disabled={isSubmitting}
              type="button"
              onClick={handleBack}
            >
              취소
            </ActionButton>
            <ActionButton
              disabled={!canSubmit}
              kind="primary"
              type="button"
              onClick={() => void handleSubmit()}
            >
              {isSubmitting
                ? '등록 중...'
                : hasSubmitFailed
                  ? '다시 시도'
                  : '가챠 등록하기'}
            </ActionButton>
          </Actions>
        </FormPanel>
      </Workspace>

      {isCategoryDialogOpen && (
        <CategoryDialog
          categories={categories}
          onClose={() => setIsCategoryDialogOpen(false)}
          onCreate={handleCreateCategory}
          onDelete={handleDeleteCategory}
        />
      )}
    </Page>
  );
}
