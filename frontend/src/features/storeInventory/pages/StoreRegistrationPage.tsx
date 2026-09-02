import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type HTMLInputTypeAttribute,
} from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  ActionButton,
  Actions,
  BackButton,
  Description,
  FieldError,
  FieldGrid,
  FieldHint,
  FieldLabel,
  Form,
  FormError,
  FormSection,
  Header,
  Heading,
  Page,
  RequiredNotice,
  ToggleGrid,
  ToggleLabel,
} from './StoreRegistrationPage.styles';
import { createStore } from '../api/storeInventoryApi';
import {
  EMPTY_STORE_REGISTRATION_DRAFT,
  STORE_TEXT_MAX_LENGTH,
  validateStoreRegistration,
  type StoreRegistrationDraft,
  type StoreRegistrationErrors,
} from '../model/storeRegistration';

type TextDraftField = Exclude<
  keyof StoreRegistrationDraft,
  'hasSelectGacha' | 'hasRandomBox'
>;

interface RegistrationFieldProps {
  field: TextDraftField;
  label: string;
  value: string;
  error?: string | undefined;
  hint?: string | undefined;
  placeholder?: string | undefined;
  type?: HTMLInputTypeAttribute | undefined;
  inputMode?: 'decimal' | 'numeric' | 'text' | 'tel' | 'url' | undefined;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  multiline?: boolean;
  maxLength?: number | undefined;
  min?: string | undefined;
  max?: string | undefined;
  step?: string | undefined;
  autoComplete?: string | undefined;
  onChange: (field: TextDraftField, value: string) => void;
}

const RegistrationField = ({
  field,
  label,
  value,
  error,
  hint,
  placeholder,
  type = 'text',
  inputMode,
  required = false,
  disabled = false,
  fullWidth = false,
  multiline = false,
  maxLength,
  min,
  max,
  step,
  autoComplete,
  onChange,
}: RegistrationFieldProps) => {
  const id = `store-${field}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const sharedProps = {
    id,
    value,
    disabled,
    maxLength,
    placeholder,
    required,
    'aria-describedby': describedBy,
    'aria-invalid': Boolean(error),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(field, event.target.value),
  };

  return (
    <FieldLabel data-span={fullWidth ? 'full' : undefined} htmlFor={id}>
      <span>
        {label}
        {required && <strong aria-label="필수">*</strong>}
      </span>
      {multiline ? (
        <textarea {...sharedProps} />
      ) : (
        <input
          {...sharedProps}
          autoComplete={autoComplete}
          inputMode={inputMode}
          max={max}
          min={min}
          step={step}
          type={type}
        />
      )}
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      {error && (
        <FieldError id={errorId} role="alert">
          {error}
        </FieldError>
      )}
    </FieldLabel>
  );
};

interface StoreRegistrationPageProps {
  onNavigate: (path: string) => void;
}

const FIELD_ORDER: TextDraftField[] = [
  'name',
  'address',
  'latitude',
  'longitude',
  'floor',
  'unit',
  'thumbnailUrl',
  'phoneNumber',
  'instagramId',
  'businessHours',
  'paymentMethods',
  'gachaMachineAmount',
  'coinPrice',
  'gachaPriceMin',
  'gachaPriceMax',
  'kujiAmount',
  'kujiPriceMin',
  'kujiPriceMax',
  'selectGachaPriceMin',
  'selectGachaPriceMax',
  'facilities',
];

export default function StoreRegistrationPage({
  onNavigate,
}: StoreRegistrationPageProps) {
  const [draft, setDraft] = useState<StoreRegistrationDraft>(() => ({
    ...EMPTY_STORE_REGISTRATION_DRAFT,
  }));
  const [fieldErrors, setFieldErrors] = useState<StoreRegistrationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateDraft = <Field extends keyof StoreRegistrationDraft>(
    field: Field,
    value: StoreRegistrationDraft[Field],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors({});
    setSubmitError('');
  };

  const updateTextDraft = (field: TextDraftField, value: string) => {
    updateDraft(field, value);
  };

  const focusFirstError = (errors: StoreRegistrationErrors) => {
    const firstField = FIELD_ORDER.find((field) => errors[field]);
    if (!firstField) return;

    window.requestAnimationFrame(() => {
      document.getElementById(`store-${firstField}`)?.focus();
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const validation = validateStoreRegistration(draft);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setSubmitError('입력값을 확인한 뒤 다시 등록해 주세요.');
      focusFirstError(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const created = await createStore(validation.value);
      onNavigate(`/stores/${created.id}/gachas`);
    } catch (cause) {
      setSubmitError(getErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      <Header>
        <BackButton type="button" onClick={() => onNavigate('/stores')}>
          ← 매장 목록
        </BackButton>
        <Heading>새 매장 등록</Heading>
        <Description>
          운영 DB에 매장을 추가합니다. 등록이 끝나면 새 매장의 가챠 관리
          화면으로 바로 이동합니다.
        </Description>
        <RequiredNotice>
          <strong>*</strong> 표시는 필수 입력입니다.
        </RequiredNotice>
      </Header>

      <Form noValidate onSubmit={handleSubmit}>
        <FormSection>
          <legend>기본 정보</legend>
          <p>매장 목록과 상세 화면에서 가장 먼저 사용하는 정보입니다.</p>
          <FieldGrid>
            <RegistrationField
              required
              autoComplete="organization"
              error={fieldErrors.name}
              field="name"
              label="매장 이름"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="예: 캡슐 스테이션 연남"
              value={draft.name}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.thumbnailUrl}
              field="thumbnailUrl"
              inputMode="url"
              label="썸네일 URL"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="https://..."
              type="url"
              value={draft.thumbnailUrl}
              onChange={updateTextDraft}
            />
            <RegistrationField
              required
              fullWidth
              autoComplete="street-address"
              error={fieldErrors.address}
              field="address"
              label="주소"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="도로명 주소를 입력해 주세요."
              value={draft.address}
              onChange={updateTextDraft}
            />
          </FieldGrid>
        </FormSection>

        <FormSection>
          <legend>위치·연락처</legend>
          <p>
            위도와 경도는 지도 노출에 사용합니다. 지하는 음수 층으로 입력할 수
            있습니다.
          </p>
          <FieldGrid>
            <RegistrationField
              required
              error={fieldErrors.latitude}
              field="latitude"
              inputMode="decimal"
              label="위도"
              max="90"
              min="-90"
              placeholder="37.5621"
              step="any"
              type="number"
              value={draft.latitude}
              onChange={updateTextDraft}
            />
            <RegistrationField
              required
              error={fieldErrors.longitude}
              field="longitude"
              inputMode="decimal"
              label="경도"
              max="180"
              min="-180"
              placeholder="126.9252"
              step="any"
              type="number"
              value={draft.longitude}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.floor}
              field="floor"
              hint="지하는 -1, -2처럼 입력하며 0층은 사용할 수 없습니다."
              inputMode="numeric"
              label="층"
              placeholder="예: 2"
              step="1"
              type="number"
              value={draft.floor}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.unit}
              field="unit"
              label="호수 또는 점포 번호"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="예: 201호"
              value={draft.unit}
              onChange={updateTextDraft}
            />
            <RegistrationField
              autoComplete="tel"
              error={fieldErrors.phoneNumber}
              field="phoneNumber"
              inputMode="tel"
              label="전화번호"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="02-1234-5678"
              type="tel"
              value={draft.phoneNumber}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.instagramId}
              field="instagramId"
              label="인스타그램 ID"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="@ 없이 입력"
              value={draft.instagramId}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.businessHours}
              field="businessHours"
              label="영업시간"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="예: 매일 10:00-22:00"
              value={draft.businessHours}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.paymentMethods}
              field="paymentMethods"
              label="결제 방법"
              maxLength={STORE_TEXT_MAX_LENGTH}
              placeholder="예: 현금, 카드"
              value={draft.paymentMethods}
              onChange={updateTextDraft}
            />
          </FieldGrid>
        </FormSection>

        <FormSection>
          <legend>가챠·쿠지 운영 정보</legend>
          <p>알 수 없는 숫자는 0으로 입력하지 말고 비워 두세요.</p>
          <ToggleGrid>
            <ToggleLabel>
              <input
                checked={draft.hasRandomBox}
                type="checkbox"
                onChange={(event) =>
                  updateDraft('hasRandomBox', event.target.checked)
                }
              />
              랜덤박스 취급
            </ToggleLabel>
            <ToggleLabel>
              <input
                checked={draft.hasSelectGacha}
                type="checkbox"
                onChange={(event) => {
                  const checked = event.target.checked;
                  setDraft((current) => ({
                    ...current,
                    hasSelectGacha: checked,
                    ...(checked
                      ? {}
                      : {
                          selectGachaPriceMin: '',
                          selectGachaPriceMax: '',
                        }),
                  }));
                  setFieldErrors({});
                  setSubmitError('');
                }}
              />
              선택 가챠 취급
            </ToggleLabel>
          </ToggleGrid>
          <FieldGrid>
            <RegistrationField
              error={fieldErrors.gachaMachineAmount}
              field="gachaMachineAmount"
              inputMode="numeric"
              label="가챠 기계 수"
              min="0"
              placeholder="예: 24"
              step="1"
              type="number"
              value={draft.gachaMachineAmount}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.coinPrice}
              field="coinPrice"
              inputMode="numeric"
              label="동전 가격"
              min="0"
              placeholder="예: 500"
              step="1"
              type="number"
              value={draft.coinPrice}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.gachaPriceMin}
              field="gachaPriceMin"
              inputMode="numeric"
              label="가챠 최소 가격"
              min="0"
              placeholder="예: 3000"
              step="1"
              type="number"
              value={draft.gachaPriceMin}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.gachaPriceMax}
              field="gachaPriceMax"
              inputMode="numeric"
              label="가챠 최대 가격"
              min="0"
              placeholder="예: 5000"
              step="1"
              type="number"
              value={draft.gachaPriceMax}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.kujiAmount}
              field="kujiAmount"
              inputMode="numeric"
              label="쿠지 수"
              min="0"
              placeholder="예: 5"
              step="1"
              type="number"
              value={draft.kujiAmount}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.kujiPriceMin}
              field="kujiPriceMin"
              inputMode="numeric"
              label="쿠지 최소 가격"
              min="0"
              placeholder="예: 5000"
              step="1"
              type="number"
              value={draft.kujiPriceMin}
              onChange={updateTextDraft}
            />
            <RegistrationField
              error={fieldErrors.kujiPriceMax}
              field="kujiPriceMax"
              inputMode="numeric"
              label="쿠지 최대 가격"
              min="0"
              placeholder="예: 10000"
              step="1"
              type="number"
              value={draft.kujiPriceMax}
              onChange={updateTextDraft}
            />
            <RegistrationField
              disabled={!draft.hasSelectGacha}
              error={fieldErrors.selectGachaPriceMin}
              field="selectGachaPriceMin"
              inputMode="numeric"
              label="선택 가챠 최소 가격"
              min="0"
              placeholder="선택 가챠 취급 시 입력"
              step="1"
              type="number"
              value={draft.selectGachaPriceMin}
              onChange={updateTextDraft}
            />
            <RegistrationField
              disabled={!draft.hasSelectGacha}
              error={fieldErrors.selectGachaPriceMax}
              field="selectGachaPriceMax"
              inputMode="numeric"
              label="선택 가챠 최대 가격"
              min="0"
              placeholder="선택 가챠 취급 시 입력"
              step="1"
              type="number"
              value={draft.selectGachaPriceMax}
              onChange={updateTextDraft}
            />
          </FieldGrid>
        </FormSection>

        <FormSection>
          <legend>편의시설</legend>
          <p>
            쉼표 또는 줄바꿈으로 구분하면 중복과 빈 항목을 정리해 저장합니다.
          </p>
          <FieldGrid>
            <RegistrationField
              multiline
              fullWidth
              error={fieldErrors.facilities}
              field="facilities"
              label="편의시설 목록"
              placeholder={'동전교환기, 주차장\n엘리베이터'}
              value={draft.facilities}
              onChange={updateTextDraft}
            />
          </FieldGrid>
        </FormSection>

        {submitError && <FormError role="alert">{submitError}</FormError>}

        <Actions>
          <ActionButton
            disabled={isSubmitting}
            type="button"
            onClick={() => onNavigate('/stores')}
          >
            취소
          </ActionButton>
          <ActionButton kind="primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? '등록 중...' : '매장 등록 후 가챠 관리'}
          </ActionButton>
        </Actions>
      </Form>
    </Page>
  );
}
