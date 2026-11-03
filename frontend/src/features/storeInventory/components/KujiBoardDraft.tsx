import { useId, useRef, useState } from 'react';

import * as S from './KujiBoardDraft.styles';

interface GradeDraft {
  id: number;
  label: string;
  prizeName: string;
  initial: string;
  remaining: string;
}

interface BoardDraft {
  nameKo: string;
  nameJa: string;
  boxCode: string;
  price: string;
  lastOne: string;
  grades: GradeDraft[];
}

interface GradeCount {
  initial: number;
  remaining: number;
}

const INITIAL_DRAFT: BoardDraft = {
  nameKo: '',
  nameJa: '',
  boxCode: '',
  price: '',
  lastOne: '',
  grades: [
    {
      id: 1,
      label: '',
      prizeName: '',
      initial: '',
      remaining: '',
    },
  ],
};

const parseCount = (value: string): number | null => {
  if (!/^(0|[1-9]\d*)$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const parseGradeCount = (grade: GradeDraft): GradeCount | null => {
  const initial = parseCount(grade.initial);
  const remaining = parseCount(grade.remaining);
  if (initial === null || remaining === null || remaining > initial)
    return null;
  return { initial, remaining };
};

const getGradeError = (
  grade: GradeDraft,
  grades: GradeDraft[],
): string | null => {
  const normalizedLabel = grade.label
    .trim()
    .normalize('NFKC')
    .toLocaleLowerCase();
  if (!normalizedLabel) return '등급 이름을 입력해 주세요.';
  if (
    grades.some(
      (other) =>
        other.id !== grade.id &&
        other.label.trim().normalize('NFKC').toLocaleLowerCase() ===
          normalizedLabel,
    )
  ) {
    return '같은 이름의 등급이 이미 있습니다.';
  }
  if (parseCount(grade.initial) === null) {
    return '초기 장수에 0 이상의 정수를 입력해 주세요.';
  }
  if (parseCount(grade.remaining) === null) {
    return '남은 장수에 0 이상의 정수를 입력해 주세요.';
  }
  if (Number(grade.remaining) > Number(grade.initial)) {
    return '남은 장수는 초기 장수보다 클 수 없습니다.';
  }
  return null;
};

const hasGradeInput = (grade: GradeDraft) =>
  [grade.label, grade.prizeName, grade.initial, grade.remaining].some(
    (value) => value.trim() !== '',
  );

const calculateTicketCounts = (grades: GradeDraft[]) => {
  const counts = grades.map(parseGradeCount);
  if (
    grades.length === 0 ||
    grades.some((grade) => getGradeError(grade, grades) !== null)
  ) {
    return { counts, total: null, hasUnsafeTotal: false };
  }

  let initial = 0;
  let remaining = 0;
  for (const count of counts) {
    if (!count) return { counts, total: null, hasUnsafeTotal: false };
    if (
      count.initial > Number.MAX_SAFE_INTEGER - initial ||
      count.remaining > Number.MAX_SAFE_INTEGER - remaining
    ) {
      return { counts, total: null, hasUnsafeTotal: true };
    }
    initial += count.initial;
    remaining += count.remaining;
  }

  return {
    counts,
    total: { initial, remaining },
    hasUnsafeTotal: false,
  };
};

const canExportDraft = (draft: BoardDraft, total: GradeCount | null) => {
  const price = parseCount(draft.price);
  return (
    total !== null &&
    total.initial > 0 &&
    (draft.nameKo.trim() !== '' || draft.nameJa.trim() !== '') &&
    draft.boxCode.trim() !== '' &&
    price !== null &&
    price > 0
  );
};

const formatWon = (value: string): string => {
  const parsed = parseCount(value);
  return parsed !== null && parsed > 0
    ? `${new Intl.NumberFormat('ko-KR').format(parsed)}원`
    : '가격 미입력';
};

const escapeCsvCell = (value: string | number): string => {
  const cell = String(value);
  const safeCell = /^[\s\u200B\u200C\u200D]*[=+\-@]/u.test(
    cell.normalize('NFKC'),
  )
    ? `'${cell}`
    : cell;
  return `"${safeCell.replace(/"/gu, '""')}"`;
};

export const createKujiBoardDraftCsv = (
  storeId: number,
  storeName: string,
  draft: BoardDraft,
): string => {
  const { total } = calculateTicketCounts(draft.grades);
  if (!canExportDraft(draft, total)) {
    throw new Error('쿠지 초안의 제목·상자·가격·티켓 장수를 확인해 주세요.');
  }

  const headers = [
    '자료 성격',
    '매장 ID',
    '매장명',
    '쿠지 제목 (한국어)',
    '쿠지 제목 (일본어)',
    '상자·로트 코드',
    '1회 가격 (원)',
    '등급 이름',
    '경품 설명',
    '초기 장수',
    '남은 장수',
    '라스트원 안내 (일반 티켓 합계 제외)',
  ];
  const rows = draft.grades.map((grade) => [
    '브라우저 임시 초안 · 서버 미저장',
    storeId,
    storeName,
    draft.nameKo.trim(),
    draft.nameJa.trim(),
    draft.boxCode.trim(),
    draft.price,
    grade.label.trim(),
    grade.prizeName.trim(),
    grade.initial,
    grade.remaining,
    draft.lastOne.trim(),
  ]);
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')}\r\n`;
};

export function KujiBoardDraft({
  storeId,
  storeName,
}: {
  storeId: number;
  storeName: string;
}) {
  const formId = useId();
  const nextGradeId = useRef(2);
  const [draft, setDraft] = useState<BoardDraft>(INITIAL_DRAFT);

  const updateField = (
    field: keyof Omit<BoardDraft, 'grades'>,
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const updateGrade = (
    id: number,
    field: keyof Omit<GradeDraft, 'id'>,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      grades: current.grades.map((grade) =>
        grade.id === id ? { ...grade, [field]: value } : grade,
      ),
    }));
  };

  const addGrade = () => {
    const id = nextGradeId.current++;
    setDraft((current) => ({
      ...current,
      grades: [
        ...current.grades,
        { id, label: '', prizeName: '', initial: '', remaining: '' },
      ],
    }));
  };

  const removeGrade = (id: number) => {
    setDraft((current) => ({
      ...current,
      grades: current.grades.filter((grade) => grade.id !== id),
    }));
  };

  const { counts, total, hasUnsafeTotal } = calculateTicketCounts(draft.grades);
  const remainingPercent =
    total && total.initial > 0
      ? Math.round((total.remaining / total.initial) * 100)
      : 0;
  const title =
    draft.nameKo.trim() || draft.nameJa.trim() || '쿠지 제목 미입력';
  const canExport = canExportDraft(draft, total);

  const downloadDraftCsv = () => {
    if (!canExport) return;
    const csv = createKujiBoardDraftCsv(storeId, storeName, draft);
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gachi-gacha-store-${storeId}-kuji-draft.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <S.Root aria-labelledby={`${formId}-heading`}>
      <S.Header>
        <div>
          <S.Eyebrow>STORE #{storeId} · KUJI WORKSPACE</S.Eyebrow>
          <h3 id={`${formId}-heading`}>상자별 설정 및 미리보기</h3>
          <p>상자별 등급과 남은 장수를 입력해 화면 구성을 미리 확인하세요.</p>
        </div>
        <S.PreviewBadge>빈 초안 · 서버 미저장</S.PreviewBadge>
      </S.Header>

      <S.Notice>
        <strong>저장되지 않는 시안입니다.</strong> 입력 내용은 이 화면의
        브라우저 메모리에만 남고 새로고침하거나 이동하면 사라집니다. 서버
        저장·기기 간 공유·실시간 갱신·소비자 공개는 지원하지 않습니다. 실제 매장
        재고를 가져오지 않는 빈 양식에서 시작합니다.
      </S.Notice>

      <S.Workspace>
        <S.Editor role="group" aria-label="쿠지 현황판 편집">
          <S.Fieldset>
            <legend>타이틀과 상자</legend>
            <S.FieldGrid>
              <S.Field>
                한국어 제목
                <input
                  maxLength={120}
                  value={draft.nameKo}
                  onChange={(event) =>
                    updateField('nameKo', event.target.value)
                  }
                  placeholder="한국어 제목"
                />
              </S.Field>
              <S.Field>
                일본어 제목
                <input
                  lang="ja"
                  maxLength={120}
                  value={draft.nameJa}
                  onChange={(event) =>
                    updateField('nameJa', event.target.value)
                  }
                  placeholder="日本語タイトル"
                />
              </S.Field>
              <S.Field>
                상자·로트 코드
                <input
                  maxLength={60}
                  value={draft.boxCode}
                  onChange={(event) =>
                    updateField('boxCode', event.target.value)
                  }
                  placeholder="예: BOX-01"
                />
              </S.Field>
              <S.Field>
                1회 가격 (원)
                <input
                  inputMode="numeric"
                  aria-invalid={
                    draft.price.trim() !== '' &&
                    (parseCount(draft.price) === null ||
                      Number(draft.price) <= 0)
                  }
                  value={draft.price}
                  onChange={(event) => updateField('price', event.target.value)}
                  placeholder="예: 10000"
                />
              </S.Field>
            </S.FieldGrid>
          </S.Fieldset>

          <S.Fieldset>
            <legend>등급별 티켓 장수</legend>
            <S.GradeEditorList>
              {draft.grades.map((grade, index) => {
                const error = getGradeError(grade, draft.grades);
                const isStarted = hasGradeInput(grade);
                return (
                  <S.GradeEditorCard
                    key={grade.id}
                    role="group"
                    aria-label={`등급 ${index + 1} 입력`}
                  >
                    <S.GradeEditorHeader>
                      <strong>등급 {index + 1}</strong>
                      <S.RemoveButton
                        type="button"
                        disabled={draft.grades.length <= 1}
                        onClick={() => removeGrade(grade.id)}
                        aria-label={`등급 ${index + 1} 삭제`}
                      >
                        삭제
                      </S.RemoveButton>
                    </S.GradeEditorHeader>
                    <S.FieldGrid>
                      <S.Field>
                        등급 이름
                        <input
                          maxLength={24}
                          aria-invalid={Boolean(
                            isStarted && error && error.includes('등급'),
                          )}
                          value={grade.label}
                          onChange={(event) =>
                            updateGrade(grade.id, 'label', event.target.value)
                          }
                          placeholder="예: A, 특상"
                        />
                      </S.Field>
                      <S.Field>
                        경품 설명 (선택)
                        <input
                          maxLength={120}
                          value={grade.prizeName}
                          onChange={(event) =>
                            updateGrade(
                              grade.id,
                              'prizeName',
                              event.target.value,
                            )
                          }
                          placeholder="예: 피규어"
                        />
                      </S.Field>
                      <S.Field>
                        초기 장수
                        <input
                          inputMode="numeric"
                          aria-invalid={
                            isStarted &&
                            (parseCount(grade.initial) === null ||
                              (parseCount(grade.remaining) !== null &&
                                Number(grade.remaining) >
                                  Number(grade.initial)))
                          }
                          value={grade.initial}
                          onChange={(event) =>
                            updateGrade(grade.id, 'initial', event.target.value)
                          }
                          placeholder="0 이상"
                        />
                      </S.Field>
                      <S.Field>
                        남은 장수
                        <input
                          inputMode="numeric"
                          aria-invalid={
                            isStarted &&
                            (parseCount(grade.remaining) === null ||
                              (parseCount(grade.initial) !== null &&
                                Number(grade.remaining) >
                                  Number(grade.initial)))
                          }
                          value={grade.remaining}
                          onChange={(event) =>
                            updateGrade(
                              grade.id,
                              'remaining',
                              event.target.value,
                            )
                          }
                          placeholder="0 이상"
                        />
                      </S.Field>
                    </S.FieldGrid>
                    {error && isStarted && (
                      <S.FieldError role="alert">{error}</S.FieldError>
                    )}
                  </S.GradeEditorCard>
                );
              })}
            </S.GradeEditorList>
            {hasUnsafeTotal && (
              <S.FieldError role="alert">
                전체 초기·남은 티켓 합계가 너무 큽니다. 장수를 확인해 주세요.
              </S.FieldError>
            )}
            <S.ActionButton type="button" onClick={addGrade}>
              + 등급 추가
            </S.ActionButton>
            <S.Field>
              라스트원 안내 (선택)
              <textarea
                aria-label="라스트원 안내 (선택)"
                maxLength={300}
                value={draft.lastOne}
                onChange={(event) => updateField('lastOne', event.target.value)}
                placeholder="이 상자에 라스트원이 없다면 비워 두세요."
              />
              <small>
                라스트원 경품은 일반 등급 장수와 총 티켓 수에 포함하지 않습니다.
              </small>
            </S.Field>
          </S.Fieldset>
          <S.ExportBar>
            <S.ActionButton
              type="button"
              disabled={!canExport}
              onClick={downloadDraftCsv}
            >
              현재 초안 CSV 다운로드
            </S.ActionButton>
            <small>
              제목·상자·가격·등급 장수를 입력하고 초기 티켓 합계가 1장 이상이면
              내려받을 수 있습니다.
            </small>
          </S.ExportBar>
        </S.Editor>

        <S.Preview aria-label="쿠지 현황판 미리보기">
          <S.PreviewHeader>
            <span>운영 화면 미리보기 · 비공개</span>
            <h4>{title}</h4>
            {draft.nameJa.trim() && draft.nameJa.trim() !== title && (
              <p lang="ja">{draft.nameJa.trim()}</p>
            )}
            <p>{storeName}</p>
          </S.PreviewHeader>
          <S.PreviewBody>
            <S.MetaRow>
              <span>상자 {draft.boxCode.trim() || '미입력'}</span>
              <span>1회 {formatWon(draft.price)}</span>
            </S.MetaRow>
            <S.Summary>
              <small>전체 남은 티켓 / 초기 티켓</small>
              <strong aria-live="polite">
                {total
                  ? `${total.remaining} / ${total.initial}장`
                  : '입력 확인 필요'}
              </strong>
              {total && total.initial > 0 ? (
                <>
                  <S.Track
                    role="progressbar"
                    aria-label="전체 티켓 잔여 비율"
                    aria-valuemin={0}
                    aria-valuemax={total.initial}
                    aria-valuenow={total.remaining}
                    aria-valuetext={`${remainingPercent}% 남음`}
                  >
                    <span style={{ width: `${remainingPercent}%` }} />
                  </S.Track>
                  <p>{remainingPercent}% 남음 · 입력한 장수 기준 수동 현황</p>
                </>
              ) : (
                <p>유효한 등급·장수를 입력하면 잔여 비율이 표시됩니다.</p>
              )}
            </S.Summary>
            <S.GradePreviewList aria-label="등급별 잔여 티켓">
              {draft.grades.map((grade, index) => {
                const count = counts[index];
                return (
                  <S.GradePreviewCard key={grade.id}>
                    <S.GradeSymbol aria-hidden="true">
                      {grade.label.trim().slice(0, 2) || '?'}
                    </S.GradeSymbol>
                    <div>
                      <strong>
                        {grade.label.trim() || '등급 이름 미입력'}
                      </strong>
                      <small>
                        {grade.prizeName.trim() || '경품 설명 미입력'}
                      </small>
                    </div>
                    <span>
                      {count
                        ? `${count.remaining} / ${count.initial}`
                        : '입력 확인'}
                    </span>
                  </S.GradePreviewCard>
                );
              })}
            </S.GradePreviewList>
            {draft.lastOne.trim() && (
              <S.LastOne>
                <strong>LAST ONE · 일반 티켓 합계 제외</strong>
                <p>{draft.lastOne.trim()}</p>
              </S.LastOne>
            )}
          </S.PreviewBody>
        </S.Preview>
      </S.Workspace>
    </S.Root>
  );
}

export default KujiBoardDraft;
