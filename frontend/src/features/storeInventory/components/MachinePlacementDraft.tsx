import { useEffect, useMemo, useRef, useState } from 'react';

import {
  DraftActions,
  DraftBadge,
  DraftEmpty,
  DraftFeedback,
  DraftField,
  DraftGuide,
  DraftHeader,
  DraftSection,
  DraftWarning,
  FieldError,
  GachaPreview,
  PlacementCard,
  PlacementCardActions,
  PlacementFields,
  PlacementItem,
  PlacementList,
  ReserveItem,
  ReserveList,
  ReservePicker,
  ReserveSection,
} from './MachinePlacementDraft.styles';
import {
  createEmptyMachinePlacementRow,
  createMachinePlacementDraftCsv,
  hasMachinePlacementContent,
  validateMachinePlacementDraft,
  validateMachineReserveQuantities,
  type MachinePlacementDraftErrors,
  type MachinePlacementDraftField,
  type MachinePlacementDraftRow,
  type MachineReserveErrors,
  type MachineReserveQuantities,
} from '../model/machinePlacementDraftCsv';

export type DraftGacha = {
  id: number;
  name: string;
  nameJa?: string;
  imageUrl?: string;
};

interface MachinePlacementDraftProps {
  storeId: number;
  storeName: string;
  machineCount: number;
  gachas: DraftGacha[];
}

const FIELD_ORDER: MachinePlacementDraftField[] = [
  'machineCode',
  'area',
  'slot',
  'pricePerPlay',
  'gachaId',
  'quantity',
];

export default function MachinePlacementDraft({
  storeId,
  storeName,
  machineCount,
  gachas,
}: MachinePlacementDraftProps) {
  const [rows, setRows] = useState<MachinePlacementDraftRow[]>(() => [
    createEmptyMachinePlacementRow('1'),
  ]);
  const [errors, setErrors] = useState<MachinePlacementDraftErrors>({});
  const [reserveQuantities, setReserveQuantities] =
    useState<MachineReserveQuantities>({});
  const [reserveErrors, setReserveErrors] = useState<MachineReserveErrors>({});
  const [reserveOnlyGachaIds, setReserveOnlyGachaIds] = useState<number[]>([]);
  const [reservePick, setReservePick] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(
    () => new Set(),
  );
  const nextKeyRef = useRef(2);

  useEffect(() => {
    nextKeyRef.current = 2;
    setRows([createEmptyMachinePlacementRow('1')]);
    setErrors({});
    setReserveQuantities({});
    setReserveErrors({});
    setReserveOnlyGachaIds([]);
    setReservePick('');
    setFeedback('');
    setFailedImages(new Set());
  }, [storeId]);

  const availableGachas = useMemo(
    () => [...new Map(gachas.map((gacha) => [gacha.id, gacha])).values()],
    [gachas],
  );
  const gachaById = useMemo(
    () => new Map(availableGachas.map((gacha) => [gacha.id, gacha])),
    [availableGachas],
  );
  const selectedGachas = useMemo(
    () =>
      [
        ...new Set([
          ...rows.map((row) => Number(row.gachaId)),
          ...reserveOnlyGachaIds,
        ]),
      ]
        .map((id) => gachaById.get(id))
        .filter((gacha): gacha is DraftGacha => Boolean(gacha)),
    [rows, reserveOnlyGachaIds, gachaById],
  );
  const availableForReserve = availableGachas.filter(
    (gacha) => !selectedGachas.some(({ id }) => id === gacha.id),
  );

  const updateRow = (
    rowKey: string,
    field: MachinePlacementDraftField,
    value: string,
  ) => {
    if (field === 'gachaId') {
      const previousGachaId = Number(
        rows.find((row) => row.key === rowKey)?.gachaId,
      );
      if (previousGachaId > 0 && reserveQuantities[previousGachaId]?.trim()) {
        setReserveOnlyGachaIds((current) => [
          ...new Set([...current, previousGachaId]),
        ]);
      }
    }
    setRows((current) =>
      current.map((row) =>
        row.key === rowKey ? { ...row, [field]: value } : row,
      ),
    );
    setErrors({});
    setReserveErrors({});
    setFeedback('');
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      createEmptyMachinePlacementRow(String(nextKeyRef.current++)),
    ]);
    setErrors({});
    setReserveErrors({});
    setFeedback('');
  };

  const removeRow = (row: MachinePlacementDraftRow) => {
    if (
      hasMachinePlacementContent(row) &&
      !window.confirm(
        '이 기기 배치 초안 행을 지울까요? 입력값은 복구할 수 없습니다.',
      )
    ) {
      return;
    }

    const previousGachaId = Number(row.gachaId);
    if (previousGachaId > 0 && reserveQuantities[previousGachaId]?.trim()) {
      setReserveOnlyGachaIds((current) => [
        ...new Set([...current, previousGachaId]),
      ]);
    }

    setRows((current) =>
      current.length === 1
        ? [createEmptyMachinePlacementRow(row.key)]
        : current.filter(({ key }) => key !== row.key),
    );
    setErrors({});
    setReserveErrors({});
    setFeedback('');
  };

  const addReserveOnlyGacha = () => {
    const gachaId = Number(reservePick);
    if (!gachaById.has(gachaId)) return;
    setReserveOnlyGachaIds((current) => [...new Set([...current, gachaId])]);
    setReservePick('');
    setFeedback('');
  };

  const exportCsv = () => {
    if (
      !rows.some(hasMachinePlacementContent) &&
      reserveOnlyGachaIds.length === 0
    ) {
      setErrors({
        [rows[0]?.key ?? '1']: {
          machineCode: '기기 배치를 입력하거나 보관 품목을 추가해 주세요.',
        },
      });
      setFeedbackIsError(true);
      setFeedback('기기 배치를 입력하거나 보관 품목을 추가해 주세요.');
      return;
    }

    const nextErrors = validateMachinePlacementDraft(rows, availableGachas);
    const nextReserveErrors = validateMachineReserveQuantities(
      rows,
      reserveQuantities,
      reserveOnlyGachaIds,
    );
    if (
      Object.keys(nextErrors).length > 0 ||
      Object.keys(nextReserveErrors).length > 0
    ) {
      setErrors(nextErrors);
      setReserveErrors(nextReserveErrors);
      setFeedbackIsError(true);
      setFeedback(
        '필수 입력과 중복 기기·슬롯, 기기/보관 수량을 확인해 주세요.',
      );

      const firstInvalid = rows.flatMap((row) =>
        FIELD_ORDER.filter((field) => nextErrors[row.key]?.[field]).map(
          (field) => `placement-${row.key}-${field}`,
        ),
      )[0];
      const firstReserveInvalid = selectedGachas.find(
        (gacha) => nextReserveErrors[gacha.id],
      );
      const focusId =
        firstInvalid ??
        (firstReserveInvalid
          ? `reserve-${firstReserveInvalid.id}-quantity`
          : undefined);
      if (focusId) {
        window.requestAnimationFrame(() =>
          document.getElementById(focusId)?.focus(),
        );
      }
      return;
    }

    try {
      const csv = createMachinePlacementDraftCsv(
        storeId,
        storeName,
        rows,
        availableGachas,
        reserveQuantities,
        reserveOnlyGachaIds,
      );
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `gachi-gacha-store-${storeId}-machine-placement-draft.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setFeedbackIsError(false);
      setFeedback(
        '초안 CSV를 내려받았습니다. 파일을 수정해도 사이트나 소비자 화면에는 반영되지 않습니다.',
      );
    } catch {
      setFeedbackIsError(true);
      setFeedback(
        'CSV를 만들지 못했습니다. 입력값을 확인하고 다시 시도해 주세요.',
      );
    }
  };

  const fieldError = (
    row: MachinePlacementDraftRow,
    field: MachinePlacementDraftField,
  ) => errors[row.key]?.[field];

  return (
    <DraftSection aria-labelledby="machine-placement-input-title">
      <DraftHeader>
        <div>
          <h3 id="machine-placement-input-title">기기별 배치 입력</h3>
          <p>
            매장에 등록된 가챠를 어느 기기와 슬롯에 넣을지 미리 적어 보는 현장
            조사 양식입니다.
          </p>
        </div>
        <DraftBadge>시안 · 서버 저장 안 됨</DraftBadge>
      </DraftHeader>

      <DraftWarning role="note">
        <strong>이 화면의 입력은 이 탭에서만 유지됩니다.</strong>
        새로고침하거나 화면을 떠나면 사라집니다. 서버 저장·다른 기기 공유·실시간
        재고 및 소비자 화면 반영은 하지 않습니다. 계속 보관하려면 CSV를 내려받아
        주세요.
      </DraftWarning>

      <DraftGuide>
        매장 정보에 적힌 기계 수는 {machineCount}대입니다. 이 숫자는 참고용이며
        아래 행을 자동 생성하거나 실제 기기 목록으로 확정하지 않습니다. 같은
        기기에 여러 슬롯이 있으면 기기 코드를 반복하고 서로 다른 슬롯 코드를
        적어 주세요. 기기 내 수량은 수기 확인 메모로, 판매량이나 완판 여부를
        자동 추정하지 않습니다. 가챠 교체도 판매로 계산하지 않습니다.
      </DraftGuide>

      {availableGachas.length === 0 && (
        <DraftEmpty role="status">
          이 매장에 등록된 가챠가 없어 배치할 상품을 선택할 수 없습니다. 먼저
          위에서 가챠 종류를 매장 목록에 등록해 주세요.
        </DraftEmpty>
      )}

      <PlacementList>
        {rows.map((row, index) => {
          const selectedGacha = gachaById.get(Number(row.gachaId));
          const imageUrl = selectedGacha?.imageUrl;
          const hasImage = imageUrl && !failedImages.has(imageUrl);

          return (
            <PlacementItem key={row.key}>
              <PlacementCard>
                <legend>배치 {index + 1}</legend>
                <PlacementCardActions>
                  <button type="button" onClick={() => removeRow(row)}>
                    이 행 지우기
                  </button>
                </PlacementCardActions>
                <PlacementFields>
                  <DraftField>
                    기기 코드 *
                    <input
                      aria-invalid={Boolean(fieldError(row, 'machineCode'))}
                      autoComplete="off"
                      id={`placement-${row.key}-machineCode`}
                      maxLength={40}
                      placeholder="예: A-01"
                      value={row.machineCode}
                      onChange={(event) =>
                        updateRow(row.key, 'machineCode', event.target.value)
                      }
                    />
                    {fieldError(row, 'machineCode') && (
                      <FieldError>{fieldError(row, 'machineCode')}</FieldError>
                    )}
                  </DraftField>
                  <DraftField>
                    매장 내 구역
                    <input
                      aria-invalid={Boolean(fieldError(row, 'area'))}
                      id={`placement-${row.key}-area`}
                      maxLength={80}
                      placeholder="예: 입구 오른쪽"
                      value={row.area}
                      onChange={(event) =>
                        updateRow(row.key, 'area', event.target.value)
                      }
                    />
                  </DraftField>
                  <DraftField>
                    슬롯 코드 (선택)
                    <input
                      aria-invalid={Boolean(fieldError(row, 'slot'))}
                      id={`placement-${row.key}-slot`}
                      maxLength={40}
                      placeholder="예: 1번 칸"
                      value={row.slot}
                      onChange={(event) =>
                        updateRow(row.key, 'slot', event.target.value)
                      }
                    />
                    {fieldError(row, 'slot') && (
                      <FieldError>{fieldError(row, 'slot')}</FieldError>
                    )}
                  </DraftField>
                  <DraftField>
                    회당 가격 (원, 선택)
                    <input
                      aria-invalid={Boolean(fieldError(row, 'pricePerPlay'))}
                      id={`placement-${row.key}-pricePerPlay`}
                      inputMode="numeric"
                      placeholder="예: 3000"
                      value={row.pricePerPlay}
                      onChange={(event) =>
                        updateRow(row.key, 'pricePerPlay', event.target.value)
                      }
                    />
                    {fieldError(row, 'pricePerPlay') && (
                      <FieldError>{fieldError(row, 'pricePerPlay')}</FieldError>
                    )}
                  </DraftField>
                  <DraftField>
                    연결된 가챠 *
                    <select
                      aria-invalid={Boolean(fieldError(row, 'gachaId'))}
                      disabled={availableGachas.length === 0}
                      id={`placement-${row.key}-gachaId`}
                      value={row.gachaId}
                      onChange={(event) =>
                        updateRow(row.key, 'gachaId', event.target.value)
                      }
                    >
                      <option value="">매장 등록 가챠 선택</option>
                      {row.gachaId && !selectedGacha && (
                        <option value={row.gachaId}>
                          매장 목록에서 제거된 가챠 #{row.gachaId} — 다시 선택
                          필요
                        </option>
                      )}
                      {availableGachas.map((gacha) => (
                        <option key={gacha.id} value={gacha.id}>
                          #{gacha.id} {gacha.name}
                          {gacha.nameJa ? ` · ${gacha.nameJa}` : ''}
                        </option>
                      ))}
                    </select>
                    {fieldError(row, 'gachaId') && (
                      <FieldError>{fieldError(row, 'gachaId')}</FieldError>
                    )}
                  </DraftField>
                  <DraftField>
                    기기 내 확인 수량 (선택)
                    <input
                      aria-invalid={Boolean(fieldError(row, 'quantity'))}
                      id={`placement-${row.key}-quantity`}
                      inputMode="numeric"
                      placeholder="모르면 비워 두세요"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(row.key, 'quantity', event.target.value)
                      }
                    />
                    <small>
                      0은 기기 내 확인 수량 0개이며 판매량이 아닙니다.
                    </small>
                    {fieldError(row, 'quantity') && (
                      <FieldError>{fieldError(row, 'quantity')}</FieldError>
                    )}
                  </DraftField>
                </PlacementFields>
                {selectedGacha && (
                  <GachaPreview>
                    {hasImage ? (
                      <img
                        alt=""
                        src={imageUrl}
                        onError={() => {
                          if (!imageUrl) return;
                          setFailedImages(
                            (current) => new Set([...current, imageUrl]),
                          );
                        }}
                      />
                    ) : (
                      <span aria-hidden data-placeholder>
                        ?
                      </span>
                    )}
                    <span>
                      #{selectedGacha.id} {selectedGacha.name}
                    </span>
                  </GachaPreview>
                )}
              </PlacementCard>
            </PlacementItem>
          );
        })}
      </PlacementList>

      <ReserveSection aria-labelledby="machine-reserve-draft-title">
        <h3 id="machine-reserve-draft-title">기기에 넣기 전 보관 수량</h3>
        <p>
          입고 후 매장에 보관 중인 수량을 가챠 종류별로 한 번만 적습니다. 같은
          가챠를 여러 기기에 배치해도 이 수량을 반복 합산하지 않습니다. 모르면
          비워 두세요. 기기 내 확인 수량이나 판매량과는 별개입니다.
        </p>
        <ReservePicker>
          <label>
            기기 배치 없이 보관할 가챠
            <select
              disabled={availableForReserve.length === 0}
              value={reservePick}
              onChange={(event) => setReservePick(event.target.value)}
            >
              <option value="">매장 등록 가챠 선택</option>
              {availableForReserve.map((gacha) => (
                <option key={gacha.id} value={gacha.id}>
                  #{gacha.id} {gacha.name}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!reservePick}
            type="button"
            onClick={addReserveOnlyGacha}
          >
            보관 품목 추가
          </button>
        </ReservePicker>
        {selectedGachas.length === 0 ? (
          <p>
            위에서 가챠를 배치하거나 보관 품목을 추가하면 수량 입력칸이
            나타납니다.
          </p>
        ) : (
          <ReserveList>
            {selectedGachas.map((gacha) => {
              const isPlaced = rows.some(
                (row) => Number(row.gachaId) === gacha.id,
              );
              return (
                <ReserveItem key={gacha.id}>
                  <DraftField>
                    #{gacha.id} {gacha.name} 보관 수량 (선택)
                    <input
                      aria-invalid={Boolean(reserveErrors[gacha.id])}
                      id={`reserve-${gacha.id}-quantity`}
                      inputMode="numeric"
                      placeholder="모르면 비워 두세요"
                      value={reserveQuantities[gacha.id] ?? ''}
                      onChange={(event) => {
                        setReserveQuantities((current) => ({
                          ...current,
                          [gacha.id]: event.target.value,
                        }));
                        setReserveErrors({});
                        setFeedback('');
                      }}
                    />
                    {reserveErrors[gacha.id] && (
                      <FieldError>{reserveErrors[gacha.id]}</FieldError>
                    )}
                  </DraftField>
                  {!isPlaced && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          reserveQuantities[gacha.id]?.trim() &&
                          !window.confirm(
                            `${gacha.name}의 보관 수량 초안을 제외할까요?`,
                          )
                        ) {
                          return;
                        }
                        setReserveOnlyGachaIds((current) =>
                          current.filter((id) => id !== gacha.id),
                        );
                        setReserveQuantities((current) => {
                          const next = { ...current };
                          delete next[gacha.id];
                          return next;
                        });
                        setReserveErrors({});
                        setFeedback('');
                      }}
                    >
                      보관 품목 제외
                    </button>
                  )}
                </ReserveItem>
              );
            })}
          </ReserveList>
        )}
      </ReserveSection>

      <DraftActions>
        <button type="button" onClick={addRow}>
          + 배치 행 추가
        </button>
        <button
          disabled={availableGachas.length === 0}
          type="button"
          onClick={exportCsv}
        >
          배치 초안 CSV 내려받기
        </button>
      </DraftActions>
      {feedback && (
        <DraftFeedback
          error={feedbackIsError}
          role={feedbackIsError ? 'alert' : 'status'}
        >
          {feedback}
        </DraftFeedback>
      )}
    </DraftSection>
  );
}
