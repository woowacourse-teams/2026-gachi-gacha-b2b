import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import GachaImagePreviewDialog from './GachaImagePreviewDialog';
import {
  CoinSetup,
  DraftActions,
  DraftBadge,
  DraftEmpty,
  DraftFeedback,
  DraftField,
  DraftGuide,
  DraftHeader,
  DraftImport,
  DraftSection,
  DraftWarning,
  FieldError,
  GachaAssignButton,
  GachaChoice,
  GachaChoices,
  GachaPicker,
  GachaPickerHeader,
  GachaPickerResults,
  GachaPreviewButton,
  GroupCountInput,
  GroupSetupCard,
  GroupSetupGrid,
  MachineDetails,
  MachineGrid,
  MachineGachaChoice,
  MachineListHeader,
  MachinePickerAction,
  MachineTile,
  MoreButton,
  PlacementFields,
  ReserveItem,
  ReserveList,
  ReservePicker,
  ReserveSection,
} from './MachinePlacementDraft.styles';
import {
  DEFAULT_COIN_UNIT,
  calculateMachinePrice,
  createEmptyMachinePlacementRow,
  createMachinePlacementDraftCsv,
  hasMachinePlacementContent,
  parseMachinePlacementDraftCsv,
  validateCoinUnit,
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
  storeCoinPrice?: number | null;
  gachas: DraftGacha[];
}

const PRESET_COINS = ['4', '6', '8'] as const;
const MAX_GROUP_MACHINES = 1000;
const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
const MACHINE_PAGE_SIZE = 24;
const GACHA_PAGE_SIZE = 32;
const EDITABLE_FIELDS = ['tier', 'gachaId', 'quantity'] as const;

const initialCoinUnit = (storeCoinPrice?: number | null) =>
  storeCoinPrice && Number.isSafeInteger(storeCoinPrice) && storeCoinPrice > 0
    ? String(storeCoinPrice)
    : String(DEFAULT_COIN_UNIT);

const normalizeSearch = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/gu, '');

const isValidCount = (value: string) =>
  /^\d+$/u.test(value) &&
  Number.isSafeInteger(Number(value)) &&
  Number(value) <= MAX_GROUP_MACHINES;

const machineName = (coins: string, ordinal: number) =>
  coins + '코인 · ' + ordinal + '번 기기';

export default function MachinePlacementDraft({
  storeId,
  storeName,
  machineCount,
  storeCoinPrice,
  gachas,
}: MachinePlacementDraftProps) {
  const [coinUnit, setCoinUnit] = useState(() =>
    initialCoinUnit(storeCoinPrice),
  );
  const [coinUnitError, setCoinUnitError] = useState('');
  const [customCoins, setCustomCoins] = useState<string[]>([]);
  const [customCoinInput, setCustomCoinInput] = useState('');
  const [customCoinError, setCustomCoinError] = useState('');
  const [countInputs, setCountInputs] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<MachinePlacementDraftRow[]>([]);
  const [activeCoins, setActiveCoins] = useState<string>('4');
  const [selectedMachineKey, setSelectedMachineKey] = useState<string | null>(
    null,
  );
  const [visibleMachineCount, setVisibleMachineCount] =
    useState(MACHINE_PAGE_SIZE);
  const [gachaQuery, setGachaQuery] = useState('');
  const [isGachaPickerOpen, setIsGachaPickerOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const isPickerPositioned = pickerPosition !== null;
  const [previewGacha, setPreviewGacha] = useState<DraftGacha | null>(null);
  const [visibleGachaCount, setVisibleGachaCount] = useState(GACHA_PAGE_SIZE);
  const [reserveQuery, setReserveQuery] = useState('');
  const [isReservePickerOpen, setIsReservePickerOpen] = useState(false);
  const [visibleReserveCount, setVisibleReserveCount] =
    useState(GACHA_PAGE_SIZE);
  const [errors, setErrors] = useState<MachinePlacementDraftErrors>({});
  const [reserveQuantities, setReserveQuantities] =
    useState<MachineReserveQuantities>({});
  const [reserveErrors, setReserveErrors] = useState<MachineReserveErrors>({});
  const [reserveOnlyGachaIds, setReserveOnlyGachaIds] = useState<number[]>([]);
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [importFeedback, setImportFeedback] = useState('');
  const [importFeedbackIsError, setImportFeedbackIsError] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(
    () => new Set(),
  );
  const nextKeyRef = useRef(1);
  const importGenerationRef = useRef(0);
  const hasCurrentDraftRef = useRef(false);
  const selectedTileRef = useRef<HTMLButtonElement | null>(null);
  const pickerRef = useRef<HTMLElement | null>(null);
  const pickerSearchRef = useRef<HTMLInputElement | null>(null);
  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const quickPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pickerOriginRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    hasCurrentDraftRef.current =
      rows.length > 0 ||
      reserveOnlyGachaIds.length > 0 ||
      customCoins.length > 0 ||
      customCoinInput.trim().length > 0 ||
      Object.keys(countInputs).length > 0 ||
      coinUnit !== initialCoinUnit(storeCoinPrice);
  }, [
    rows,
    reserveOnlyGachaIds,
    customCoins,
    customCoinInput,
    countInputs,
    coinUnit,
    storeCoinPrice,
  ]);

  useLayoutEffect(
    () => () => {
      importGenerationRef.current += 1;
    },
    [storeId, storeCoinPrice],
  );

  useEffect(() => {
    importGenerationRef.current += 1;
    nextKeyRef.current = 1;
    setCoinUnit(initialCoinUnit(storeCoinPrice));
    setCoinUnitError('');
    setCustomCoins([]);
    setCustomCoinInput('');
    setCustomCoinError('');
    setCountInputs({});
    setRows([]);
    setActiveCoins('4');
    setSelectedMachineKey(null);
    setVisibleMachineCount(MACHINE_PAGE_SIZE);
    setGachaQuery('');
    setIsGachaPickerOpen(false);
    setPickerPosition(null);
    setPreviewGacha(null);
    setVisibleGachaCount(GACHA_PAGE_SIZE);
    setReserveQuery('');
    setIsReservePickerOpen(false);
    setVisibleReserveCount(GACHA_PAGE_SIZE);
    setErrors({});
    setReserveQuantities({});
    setReserveErrors({});
    setReserveOnlyGachaIds([]);
    setFeedback('');
    setFeedbackIsError(false);
    setImportFeedback('');
    setImportFeedbackIsError(false);
    setIsImporting(false);
    setFailedImages(new Set());
  }, [storeId, storeCoinPrice]);

  const groupCoins = useMemo(
    () => [...PRESET_COINS, ...customCoins],
    [customCoins],
  );
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
  const filteredForReserve = useMemo(() => {
    const query = normalizeSearch(reserveQuery);
    if (!query) return availableForReserve;
    return availableForReserve.filter((gacha) =>
      normalizeSearch(
        [gacha.id, gacha.name, gacha.nameJa ?? ''].join(' '),
      ).includes(query),
    );
  }, [availableForReserve, reserveQuery]);
  const activeRows = rows.filter((row) => row.coinsPerPlay === activeCoins);
  const activeRow =
    activeRows.find((row) => row.key === selectedMachineKey) ??
    activeRows[0] ??
    null;
  const activeGacha = activeRow
    ? gachaById.get(Number(activeRow.gachaId))
    : undefined;
  const configuredMachineCount = rows.length;
  const filteredGachas = useMemo(() => {
    const query = normalizeSearch(gachaQuery);
    if (!query) return availableGachas;
    return availableGachas.filter((gacha) =>
      normalizeSearch(
        [gacha.id, gacha.name, gacha.nameJa ?? ''].join(' '),
      ).includes(query),
    );
  }, [availableGachas, gachaQuery]);

  useLayoutEffect(() => {
    if (!isGachaPickerOpen) return;

    const positionPicker = () => {
      const gutter = 16;
      const gap = 8;
      const viewportWidth = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth || window.innerWidth,
      );
      const viewportHeight = window.innerHeight;
      const isVisible = (rect: DOMRect | undefined) =>
        rect &&
        rect.bottom > gutter &&
        rect.top < viewportHeight - gutter &&
        rect.right > gutter &&
        rect.left < viewportWidth - gutter;
      const tileRect = selectedTileRef.current?.getBoundingClientRect();
      const trigger = pickerOriginRef.current?.isConnected
        ? pickerOriginRef.current
        : pickerTriggerRef.current;
      const triggerRect = trigger?.getBoundingClientRect();
      const rect = isVisible(tileRect)
        ? tileRect
        : isVisible(triggerRect)
          ? triggerRect
          : undefined;
      const width = Math.min(960, Math.max(0, viewportWidth - gutter * 2));
      const left = rect
        ? Math.min(
            Math.max(gutter, rect.left),
            Math.max(gutter, viewportWidth - width - gutter),
          )
        : gutter;
      const below = rect ? viewportHeight - rect.bottom - gutter - gap : 0;
      const above = rect ? rect.top - gutter - gap : 0;
      const availableHeight = Math.max(0, viewportHeight - gutter * 2);
      let top = gutter;
      let maxHeight = Math.min(640, availableHeight);

      if (rect && below >= 280) {
        top = rect.bottom + gap;
        maxHeight = Math.min(maxHeight, below);
      } else if (rect && above >= 280) {
        maxHeight = Math.min(maxHeight, above);
        top = rect.top - gap - maxHeight;
      }

      top = Math.max(
        gutter,
        Math.min(top, viewportHeight - maxHeight - gutter),
      );
      setPickerPosition({ top, left, width, maxHeight });
    };

    const handleScroll = (event: Event) => {
      if (
        event.target instanceof Node &&
        pickerRef.current?.contains(event.target)
      ) {
        return;
      }
      positionPicker();
    };

    positionPicker();
    window.addEventListener('resize', positionPicker);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', positionPicker);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isGachaPickerOpen, activeRow?.key]);

  useEffect(() => {
    if (!isGachaPickerOpen || !isPickerPositioned) return;
    pickerSearchRef.current?.focus({ preventScroll: true });
  }, [isGachaPickerOpen, isPickerPositioned]);

  useEffect(() => {
    if (!isGachaPickerOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (previewGacha) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        pickerRef.current?.contains(target) ||
        pickerTriggerRef.current?.contains(target) ||
        quickPickerTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setIsGachaPickerOpen(false);
      window.requestAnimationFrame(() => {
        if (
          document.activeElement === document.body ||
          !document.activeElement?.isConnected
        ) {
          (pickerOriginRef.current?.isConnected
            ? pickerOriginRef.current
            : pickerTriggerRef.current
          )?.focus();
        }
      });
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || previewGacha) return;
      setIsGachaPickerOpen(false);
      (pickerOriginRef.current?.isConnected
        ? pickerOriginRef.current
        : pickerTriggerRef.current
      )?.focus();
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isGachaPickerOpen, previewGacha]);

  const closeGachaPicker = (restoreFocus = false) => {
    setIsGachaPickerOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() =>
        (pickerOriginRef.current?.isConnected
          ? pickerOriginRef.current
          : pickerTriggerRef.current
        )?.focus(),
      );
    }
  };

  const openGachaPicker = (origin: HTMLButtonElement) => {
    pickerOriginRef.current = origin;
    setGachaQuery('');
    setVisibleGachaCount(GACHA_PAGE_SIZE);
    setPickerPosition(null);
    setIsGachaPickerOpen(true);
  };

  const clearValidation = () => {
    setErrors({});
    setReserveErrors({});
    setFeedback('');
  };

  const rememberReserve = (gachaIds: number[]) => {
    const toRemember = gachaIds.filter(
      (id) => id > 0 && reserveQuantities[id]?.trim(),
    );
    if (toRemember.length > 0) {
      setReserveOnlyGachaIds((current) => [
        ...new Set([...current, ...toRemember]),
      ]);
    }
  };

  const updateRow = (
    rowKey: string,
    field: 'area' | 'tier' | 'gachaId' | 'quantity',
    value: string,
  ) => {
    const previous = rows.find((row) => row.key === rowKey);
    if (!previous) return false;
    if (field === 'gachaId' && previous.gachaId !== value) {
      if (
        previous.quantity.trim() &&
        !window.confirm(
          '가챠를 바꾸면 이 기기의 기존 확인 수량이 지워집니다. 계속할까요?',
        )
      ) {
        return false;
      }
      rememberReserve([Number(previous.gachaId)]);
    }
    setRows((current) =>
      current.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              [field]: value,
              ...(field === 'gachaId' && row.gachaId !== value
                ? { quantity: '' }
                : {}),
            }
          : row,
      ),
    );
    clearValidation();
    return true;
  };

  const commitGroupCount = (coins: string, rawValue: string) => {
    const groupRows = rows.filter((row) => row.coinsPerPlay === coins);
    if (!isValidCount(rawValue)) {
      setFeedbackIsError(true);
      setFeedback('기기 대수는 0부터 1,000대까지 정수로 입력해 주세요.');
      return;
    }
    const targetCount = Number(rawValue);
    setCountInputs((current) => ({
      ...current,
      [coins]: String(targetCount),
    }));
    if (targetCount === groupRows.length) return;

    if (targetCount < groupRows.length) {
      const removed = groupRows.slice(targetCount);
      if (
        removed.some(hasMachinePlacementContent) &&
        !window.confirm(
          '줄어드는 기기에 적힌 가챠·위치·수량 초안이 사라집니다. 계속할까요?',
        )
      ) {
        setCountInputs((current) => ({
          ...current,
          [coins]: String(groupRows.length),
        }));
        return;
      }
      const removedKeys = new Set(removed.map((row) => row.key));
      rememberReserve(removed.map((row) => Number(row.gachaId)));
      setRows((current) => current.filter((row) => !removedKeys.has(row.key)));
      if (selectedMachineKey && removedKeys.has(selectedMachineKey)) {
        setIsGachaPickerOpen(false);
        setSelectedMachineKey(
          targetCount > 0 ? (groupRows[0]?.key ?? null) : null,
        );
      }
    } else {
      const additions = Array.from(
        { length: targetCount - groupRows.length },
        (_, offset) =>
          createEmptyMachinePlacementRow(
            String(nextKeyRef.current++),
            machineName(coins, groupRows.length + offset + 1),
            coins,
          ),
      );
      setRows((current) => [...current, ...additions]);
      if (activeCoins === coins && !selectedMachineKey) {
        setSelectedMachineKey(additions[0]?.key ?? null);
      }
    }
    clearValidation();
  };

  const addCustomGroup = () => {
    const value = customCoinInput.trim();
    if (
      !/^\d+$/u.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) < 1
    ) {
      setCustomCoinError('회당 코인 수를 1 이상의 정수로 입력해 주세요.');
      return;
    }
    const normalized = String(Number(value));
    if (groupCoins.includes(normalized)) {
      setCustomCoinError('이미 등록된 코인 수입니다.');
      return;
    }
    setCustomCoins((current) => [...current, normalized]);
    setCustomCoinInput('');
    setCustomCoinError('');
    setActiveCoins(normalized);
    setSelectedMachineKey(null);
    setIsGachaPickerOpen(false);
    setVisibleMachineCount(MACHINE_PAGE_SIZE);
  };

  const removeCustomGroup = (coins: string) => {
    const removed = rows.filter((row) => row.coinsPerPlay === coins);
    if (
      removed.some(hasMachinePlacementContent) &&
      !window.confirm(
        coins +
          '코인 기기와 배치 초안을 모두 지울까요? 입력값은 복구할 수 없습니다.',
      )
    ) {
      return;
    }
    rememberReserve(removed.map((row) => Number(row.gachaId)));
    setRows((current) => current.filter((row) => row.coinsPerPlay !== coins));
    setCustomCoins((current) => current.filter((item) => item !== coins));
    setCountInputs((current) => {
      const next = { ...current };
      delete next[coins];
      return next;
    });
    if (activeCoins === coins) {
      setIsGachaPickerOpen(false);
      setActiveCoins('4');
      setSelectedMachineKey(
        rows.find((row) => row.coinsPerPlay === '4')?.key ?? null,
      );
    }
    clearValidation();
  };

  const selectGroup = (coins: string) => {
    setIsGachaPickerOpen(false);
    setActiveCoins(coins);
    setSelectedMachineKey(
      rows.find((row) => row.coinsPerPlay === coins)?.key ?? null,
    );
    setVisibleMachineCount(MACHINE_PAGE_SIZE);
    setGachaQuery('');
    setVisibleGachaCount(GACHA_PAGE_SIZE);
  };

  const selectMachine = (row: MachinePlacementDraftRow) => {
    setSelectedMachineKey(row.key);
    setIsGachaPickerOpen(false);
  };

  const addReserveOnlyGacha = (gachaId: number) => {
    if (!gachaById.has(gachaId)) return;
    setReserveOnlyGachaIds((current) => [...new Set([...current, gachaId])]);
    setReserveQuery('');
    setVisibleReserveCount(GACHA_PAGE_SIZE);
    setFeedback('');
  };

  const exportCsv = () => {
    const unitError = validateCoinUnit(coinUnit);
    if (unitError) {
      setCoinUnitError(unitError);
      setFeedbackIsError(true);
      setFeedback('매장 공통 코인 단가를 확인해 주세요.');
      document.getElementById('store-coin-unit')?.focus();
      return;
    }

    const invalidGroup = groupCoins.find((coins) => {
      const value = countInputs[coins];
      return value !== undefined && !isValidCount(value);
    });
    if (invalidGroup) {
      setFeedbackIsError(true);
      setFeedback('기기 대수는 0부터 1,000대까지 정수로 입력해 주세요.');
      document.getElementById('machine-count-' + invalidGroup)?.focus();
      return;
    }

    if (rows.length === 0 && reserveOnlyGachaIds.length === 0) {
      setFeedbackIsError(true);
      setFeedback('기기 대수를 설정하거나 보관 품목을 추가해 주세요.');
      return;
    }

    const nextErrors = validateMachinePlacementDraft(
      rows,
      availableGachas,
      coinUnit,
    );
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
      setFeedback('가챠 선택과 기기·보관 수량을 확인해 주세요.');
      const firstInvalid = rows.find((row) => nextErrors[row.key]);
      if (firstInvalid) {
        setActiveCoins(firstInvalid.coinsPerPlay);
        setSelectedMachineKey(firstInvalid.key);
        const index = rows
          .filter((row) => row.coinsPerPlay === firstInvalid.coinsPerPlay)
          .findIndex((row) => row.key === firstInvalid.key);
        setVisibleMachineCount(Math.max(MACHINE_PAGE_SIZE, index + 1));
        const field = EDITABLE_FIELDS.find(
          (candidate) => nextErrors[firstInvalid.key]?.[candidate],
        );
        setIsGachaPickerOpen(field === 'gachaId');
        if (field === 'gachaId') {
          pickerOriginRef.current = pickerTriggerRef.current;
          setGachaQuery('');
          setVisibleGachaCount(GACHA_PAGE_SIZE);
        }
        window.requestAnimationFrame(() =>
          document
            .getElementById(
              field
                ? 'placement-' + firstInvalid.key + '-' + field
                : 'machine-count-' + firstInvalid.coinsPerPlay,
            )
            ?.focus(),
        );
      } else {
        const firstReserveInvalid = selectedGachas.find(
          (gacha) => nextReserveErrors[gacha.id],
        );
        if (firstReserveInvalid) {
          window.requestAnimationFrame(() =>
            document
              .getElementById('reserve-' + firstReserveInvalid.id + '-quantity')
              ?.focus(),
          );
        }
      }
      return;
    }

    try {
      const csv = createMachinePlacementDraftCsv(
        storeId,
        storeName,
        rows,
        availableGachas,
        coinUnit,
        reserveQuantities,
        reserveOnlyGachaIds,
        customCoins,
      );
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download =
        'gachi-gacha-store-' + storeId + '-machine-placement-draft.csv';
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

  const importCsv = async (file: File) => {
    const generation = ++importGenerationRef.current;
    setImportFeedbackIsError(false);
    if (!/\.csv$/iu.test(file.name)) {
      setImportFeedbackIsError(true);
      setImportFeedback('CSV 파일(.csv)을 선택해 주세요.');
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setImportFeedbackIsError(true);
      setImportFeedback('CSV 파일은 5MB 이하만 불러올 수 있습니다.');
      return;
    }

    setIsImporting(true);
    setImportFeedback('CSV 초안을 확인하는 중입니다.');
    try {
      const bytes = await file.arrayBuffer();
      let csv: string;
      try {
        csv = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        throw new Error('UTF-8 형식으로 저장한 CSV 파일만 불러올 수 있습니다.');
      }
      if (generation !== importGenerationRef.current) return;
      const imported = parseMachinePlacementDraftCsv(
        csv,
        storeId,
        availableGachas,
        initialCoinUnit(storeCoinPrice),
      );
      if (generation !== importGenerationRef.current) return;

      if (
        hasCurrentDraftRef.current &&
        !window.confirm(
          '현재 기기 배치 초안을 업로드한 CSV 내용으로 바꿀까요? 지금 입력한 내용은 사라집니다.',
        )
      ) {
        setImportFeedback(
          'CSV 불러오기를 취소했습니다. 현재 초안은 그대로입니다.',
        );
        return;
      }

      nextKeyRef.current = imported.nextKey;
      setCoinUnit(imported.coinUnit);
      setCoinUnitError('');
      setCustomCoins(imported.customCoins);
      setCustomCoinInput('');
      setCustomCoinError('');
      setCountInputs(
        Object.fromEntries(
          [...PRESET_COINS, ...imported.customCoins].map((coins) => [
            coins,
            String(
              imported.rows.filter((row) => row.coinsPerPlay === coins).length,
            ),
          ]),
        ),
      );
      setRows(imported.rows);
      setActiveCoins(imported.rows[0]?.coinsPerPlay ?? '4');
      setSelectedMachineKey(imported.rows[0]?.key ?? null);
      setVisibleMachineCount(MACHINE_PAGE_SIZE);
      setGachaQuery('');
      setIsGachaPickerOpen(false);
      setPickerPosition(null);
      setPreviewGacha(null);
      setVisibleGachaCount(GACHA_PAGE_SIZE);
      setReserveQuery('');
      setIsReservePickerOpen(false);
      setVisibleReserveCount(GACHA_PAGE_SIZE);
      setReserveQuantities(imported.reserveQuantities);
      setReserveOnlyGachaIds(imported.reserveOnlyGachaIds);
      setErrors({});
      setReserveErrors({});
      setFailedImages(new Set());
      setFeedback('');
      setFeedbackIsError(false);
      setImportFeedbackIsError(false);
      setImportFeedback(
        'CSV 초안을 불러왔습니다. 이 내용은 이 탭에만 있으며 서버 재고에는 반영되지 않습니다.',
      );
    } catch (error) {
      if (generation !== importGenerationRef.current) return;
      setImportFeedbackIsError(true);
      setImportFeedback(
        error instanceof Error
          ? error.message
          : 'CSV를 읽지 못했습니다. UTF-8 형식의 파일인지 확인해 주세요.',
      );
    } finally {
      if (generation === importGenerationRef.current) setIsImporting(false);
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
          <h3 id="machine-placement-input-title">매장 기기 배치</h3>
          <p>
            코인 수별 기기 대수를 정하고, 매장에 등록된 가챠를 사진으로 골라
            배치해 보세요.
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

      <DraftImport>
        <h4>지난 CSV 초안 이어가기</h4>
        <p>
          이 화면에서 내려받은 UTF-8 CSV를 수정한 뒤 다시 올릴 수 있습니다. 같은
          매장의 가챠 ID만 사용하며, 제목과 사진은 현재 등록된 정보로
          표시합니다. 파일을 불러와도 서버 재고는 바뀌지 않습니다.
        </p>
        <DraftField>
          초안 CSV 파일 선택
          <input
            accept=".csv,text/csv"
            aria-describedby="machine-csv-upload-help"
            disabled={isImporting}
            type="file"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (file) void importCsv(file);
            }}
          />
        </DraftField>
        <p id="machine-csv-upload-help">
          기기 행에서 구역·설치 단·가챠 ID·기기 내 확인 수량을, 보관 재고 행에서
          보관 수량을 수정할 수 있습니다. 코인 단가와 기기 대수는 업로드 후 이
          화면에서 조정하면 편리합니다.
        </p>
        {importFeedback && (
          <DraftFeedback
            error={importFeedbackIsError}
            role={importFeedbackIsError ? 'alert' : 'status'}
          >
            {importFeedback}
          </DraftFeedback>
        )}
      </DraftImport>

      <CoinSetup>
        <DraftField>
          매장 공통 코인 단가 (원)
          <input
            aria-invalid={Boolean(coinUnitError)}
            id="store-coin-unit"
            inputMode="numeric"
            value={coinUnit}
            onChange={(event) => {
              setCoinUnit(event.target.value);
              setCoinUnitError('');
              clearValidation();
            }}
          />
          <small>
            {storeCoinPrice &&
            Number.isSafeInteger(storeCoinPrice) &&
            storeCoinPrice > 0
              ? '매장 정보 기준으로 시작합니다. 여기서 변경한 값은 시안과 CSV에만 적용됩니다.'
              : '매장 등록 코인 단가를 조회할 수 없어 1,000원으로 시작합니다. 이 값은 시안과 CSV에만 적용됩니다.'}
          </small>
          {coinUnitError && <FieldError>{coinUnitError}</FieldError>}
        </DraftField>
      </CoinSetup>

      <DraftGuide>
        기존 매장 정보의 기계 수는 {machineCount}대입니다. 아래 코인 수별 구성은
        별도의 미저장 초안이며, 현재 설정한 기기는 {configuredMachineCount}
        대입니다. 코인 단가를 바꾸면 모든 기기의 회당 가격이 함께 바뀝니다. 설치
        단은 기계를 쌓아 둔 위치 메모입니다. 기기 수량은 수기 확인값으로,
        판매량이나 완판 여부를 자동 추정하지 않습니다.
      </DraftGuide>

      <section aria-labelledby="machine-groups-title">
        <h4 id="machine-groups-title">코인 수별 기기 구성</h4>
        <GroupSetupGrid>
          {groupCoins.map((coins) => {
            const groupRows = rows.filter((row) => row.coinsPerPlay === coins);
            const assignedCount = groupRows.filter((row) =>
              Boolean(row.gachaId),
            ).length;
            const price = calculateMachinePrice(coinUnit, coins);
            const countInput = countInputs[coins] ?? String(groupRows.length);
            const groupError = groupRows.find(
              (row) => errors[row.key]?.coinsPerPlay,
            );
            return (
              <GroupSetupCard active={activeCoins === coins} key={coins}>
                <button
                  aria-pressed={activeCoins === coins}
                  type="button"
                  onClick={() => selectGroup(coins)}
                >
                  <strong>{coins}코인 기기</strong>
                  <span>
                    {groupRows.length}대 중 {assignedCount}대 배치
                  </span>
                  <small>
                    {price === undefined
                      ? '회당 가격 미확인'
                      : '회당 ' + price.toLocaleString('ko-KR') + '원'}
                  </small>
                </button>
                <label>
                  기기 대수
                  <GroupCountInput
                    aria-invalid={!isValidCount(countInput)}
                    id={'machine-count-' + coins}
                    inputMode="numeric"
                    value={countInput}
                    onBlur={(event) =>
                      commitGroupCount(coins, event.currentTarget.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        event.currentTarget.blur();
                      }
                    }}
                    onChange={(event) =>
                      setCountInputs((current) => ({
                        ...current,
                        [coins]: event.target.value,
                      }))
                    }
                  />
                </label>
                {!isValidCount(countInput) && (
                  <FieldError>
                    기기 대수는 0부터 1,000대까지 입력해 주세요.
                  </FieldError>
                )}
                {groupError && (
                  <FieldError>
                    {errors[groupError.key]?.coinsPerPlay}
                  </FieldError>
                )}
                {!PRESET_COINS.includes(
                  coins as (typeof PRESET_COINS)[number],
                ) && (
                  <button
                    className="remove-group"
                    type="button"
                    onClick={() => removeCustomGroup(coins)}
                  >
                    이 종류 지우기
                  </button>
                )}
              </GroupSetupCard>
            );
          })}
        </GroupSetupGrid>
        <CoinSetup>
          <DraftField>
            다른 코인 수 추가
            <input
              inputMode="numeric"
              placeholder="예: 10 또는 18"
              value={customCoinInput}
              onChange={(event) => {
                setCustomCoinInput(event.target.value);
                setCustomCoinError('');
              }}
            />
            {customCoinError && <FieldError>{customCoinError}</FieldError>}
          </DraftField>
          <button type="button" onClick={addCustomGroup}>
            + 기기 종류 추가
          </button>
        </CoinSetup>
      </section>

      <section aria-labelledby="machine-list-title">
        <MachineListHeader>
          <h4 id="machine-list-title">{activeCoins}코인 기기</h4>
          {activeRow && (
            <button
              aria-controls="machine-gacha-picker"
              aria-expanded={isGachaPickerOpen}
              ref={quickPickerTriggerRef}
              type="button"
              onClick={(event) => {
                if (isGachaPickerOpen) {
                  pickerOriginRef.current = event.currentTarget;
                  closeGachaPicker(true);
                } else {
                  openGachaPicker(event.currentTarget);
                }
              }}
            >
              선택한 {activeRow.machineLabel}에 가챠{' '}
              {activeRow.gachaId ? '바꾸기' : '넣기'}
            </button>
          )}
        </MachineListHeader>
        {activeRows.length === 0 ? (
          <DraftEmpty>
            위에서 {activeCoins}코인 기기 대수를 입력하면 기기 카드가 생깁니다.
          </DraftEmpty>
        ) : (
          <>
            <MachineGrid>
              {activeRows.slice(0, visibleMachineCount).map((row) => {
                const selectedGacha = gachaById.get(Number(row.gachaId));
                const imageUrl = selectedGacha?.imageUrl;
                return (
                  <MachineTile
                    aria-pressed={activeRow?.key === row.key}
                    active={activeRow?.key === row.key}
                    key={row.key}
                    ref={
                      activeRow?.key === row.key ? selectedTileRef : undefined
                    }
                    type="button"
                    onClick={() => selectMachine(row)}
                  >
                    {imageUrl && !failedImages.has(imageUrl) ? (
                      <img
                        alt=""
                        loading="lazy"
                        src={imageUrl}
                        onError={() =>
                          setFailedImages(
                            (current) => new Set([...current, imageUrl]),
                          )
                        }
                      />
                    ) : (
                      <span aria-hidden className="image-placeholder">
                        {row.gachaId ? '사진 없음' : '+'}
                      </span>
                    )}
                    <span className="machine-copy">
                      <strong>{row.machineLabel}</strong>
                      <small>
                        {selectedGacha?.name ??
                          (row.gachaId
                            ? '매장 목록에서 제거된 가챠'
                            : '가챠를 배치해 주세요')}
                      </small>
                    </span>
                  </MachineTile>
                );
              })}
            </MachineGrid>
            {activeRows.length > visibleMachineCount && (
              <MoreButton
                type="button"
                onClick={() =>
                  setVisibleMachineCount((current) =>
                    Math.min(current + MACHINE_PAGE_SIZE, activeRows.length),
                  )
                }
              >
                기기 더 보기 ({Math.min(visibleMachineCount, activeRows.length)}
                /{activeRows.length}대)
              </MoreButton>
            )}
          </>
        )}
      </section>

      {activeRow && (
        <>
          <MachineDetails>
            <legend>{activeRow.machineLabel} 상세</legend>
            <p>
              {calculateMachinePrice(coinUnit, activeRow.coinsPerPlay) ===
              undefined
                ? '회당 가격 미확인'
                : '회당 가격 ' +
                  calculateMachinePrice(
                    coinUnit,
                    activeRow.coinsPerPlay,
                  )!.toLocaleString('ko-KR') +
                  '원'}
            </p>
            {activeGacha ? (
              <div className="assigned-gacha">
                {activeGacha.imageUrl &&
                !failedImages.has(activeGacha.imageUrl) ? (
                  <img
                    alt=""
                    src={activeGacha.imageUrl}
                    onError={() => {
                      if (!activeGacha.imageUrl) return;
                      setFailedImages(
                        (current) =>
                          new Set([...current, activeGacha.imageUrl!]),
                      );
                    }}
                  />
                ) : (
                  <span aria-hidden className="image-placeholder">
                    사진 없음
                  </span>
                )}
                <span>
                  <strong>{activeGacha.name}</strong>
                  <small>#{activeGacha.id}</small>
                </span>
                <button
                  type="button"
                  onClick={() => updateRow(activeRow.key, 'gachaId', '')}
                >
                  배치 해제
                </button>
              </div>
            ) : activeRow.gachaId ? (
              <DraftEmpty role="status">
                이 가챠는 매장 등록 목록에서 제거되었습니다. 가챠 바꾸기를 눌러
                다른 가챠를 선택해 주세요.
              </DraftEmpty>
            ) : (
              <p>가챠 넣기를 눌러 매장 등록 가챠를 검색하고 배치해 주세요.</p>
            )}
            <MachinePickerAction
              aria-controls="machine-gacha-picker"
              aria-expanded={isGachaPickerOpen}
              ref={pickerTriggerRef}
              type="button"
              onClick={(event) => {
                if (isGachaPickerOpen) {
                  pickerOriginRef.current = event.currentTarget;
                  closeGachaPicker(true);
                } else {
                  openGachaPicker(event.currentTarget);
                }
              }}
            >
              {activeRow.gachaId ? '가챠 바꾸기' : '가챠 넣기'}
            </MachinePickerAction>
            <PlacementFields>
              <DraftField>
                매장 내 구역 (선택)
                <input
                  id={'placement-' + activeRow.key + '-area'}
                  maxLength={80}
                  placeholder="예: 입구 오른쪽"
                  value={activeRow.area}
                  onChange={(event) =>
                    updateRow(activeRow.key, 'area', event.target.value)
                  }
                />
              </DraftField>
              <DraftField>
                설치 단 (선택)
                <input
                  aria-invalid={Boolean(fieldError(activeRow, 'tier'))}
                  id={'placement-' + activeRow.key + '-tier'}
                  inputMode="numeric"
                  placeholder="예: 2 (2단에 쌓인 기기)"
                  value={activeRow.tier}
                  onChange={(event) =>
                    updateRow(activeRow.key, 'tier', event.target.value)
                  }
                />
                {fieldError(activeRow, 'tier') && (
                  <FieldError>{fieldError(activeRow, 'tier')}</FieldError>
                )}
              </DraftField>
              <DraftField>
                기기 내 확인 수량 (선택)
                <input
                  aria-invalid={Boolean(fieldError(activeRow, 'quantity'))}
                  id={'placement-' + activeRow.key + '-quantity'}
                  inputMode="numeric"
                  placeholder="모르면 비워 두세요"
                  value={activeRow.quantity}
                  onChange={(event) =>
                    updateRow(activeRow.key, 'quantity', event.target.value)
                  }
                />
                <small>0은 확인 수량 0개이며 판매량이 아닙니다.</small>
                {fieldError(activeRow, 'quantity') && (
                  <FieldError>{fieldError(activeRow, 'quantity')}</FieldError>
                )}
              </DraftField>
            </PlacementFields>
          </MachineDetails>

          {isGachaPickerOpen && (
            <GachaPicker
              aria-labelledby="machine-gacha-picker-title"
              id="machine-gacha-picker"
              ref={pickerRef}
              role="dialog"
              style={
                pickerPosition
                  ? {
                      top: pickerPosition.top,
                      left: pickerPosition.left,
                      width: pickerPosition.width,
                      maxHeight: pickerPosition.maxHeight,
                    }
                  : { visibility: 'hidden' }
              }
            >
              <GachaPickerHeader>
                <div>
                  <h4 id="machine-gacha-picker-title">
                    {activeRow.machineLabel}에 넣을 가챠 선택
                  </h4>
                  <small>
                    사진은 확대해서 확인하고, 카드 이름을 눌러 배치하세요.
                  </small>
                </div>
                <button
                  aria-label="가챠 선택 닫기"
                  type="button"
                  onClick={() => closeGachaPicker(true)}
                >
                  ×
                </button>
              </GachaPickerHeader>
              <DraftField>
                매장 등록 가챠 검색
                <input
                  aria-invalid={Boolean(fieldError(activeRow, 'gachaId'))}
                  id={'placement-' + activeRow.key + '-gachaId'}
                  placeholder="이름, 일본어 이름 또는 ID"
                  ref={pickerSearchRef}
                  value={gachaQuery}
                  onChange={(event) => {
                    setGachaQuery(event.target.value);
                    setVisibleGachaCount(GACHA_PAGE_SIZE);
                  }}
                />
              </DraftField>
              {fieldError(activeRow, 'gachaId') && (
                <FieldError>{fieldError(activeRow, 'gachaId')}</FieldError>
              )}
              <GachaPickerResults>
                {availableGachas.length === 0 ? (
                  <DraftEmpty role="status">
                    이 매장에 등록된 가챠가 없습니다. 먼저 매장 가챠 목록에서
                    가챠를 추가해 주세요.
                  </DraftEmpty>
                ) : filteredGachas.length === 0 ? (
                  <DraftEmpty role="status">검색 결과가 없습니다.</DraftEmpty>
                ) : (
                  <>
                    <GachaChoices>
                      {filteredGachas
                        .slice(0, visibleGachaCount)
                        .map((gacha) => {
                          const imageUrl = gacha.imageUrl;
                          return (
                            <MachineGachaChoice
                              key={gacha.id}
                              selected={activeRow.gachaId === String(gacha.id)}
                            >
                              {imageUrl && !failedImages.has(imageUrl) ? (
                                <GachaPreviewButton
                                  aria-label={gacha.name + ' 이미지 확대'}
                                  title="이미지 확대"
                                  type="button"
                                  onClick={() => setPreviewGacha(gacha)}
                                >
                                  <img
                                    alt=""
                                    loading="lazy"
                                    src={imageUrl}
                                    onError={() =>
                                      setFailedImages(
                                        (current) =>
                                          new Set([...current, imageUrl]),
                                      )
                                    }
                                  />
                                </GachaPreviewButton>
                              ) : (
                                <span aria-hidden className="image-placeholder">
                                  사진 없음
                                </span>
                              )}
                              <GachaAssignButton
                                aria-label={
                                  gacha.name + ' #' + gacha.id + ' 배치'
                                }
                                aria-pressed={
                                  activeRow.gachaId === String(gacha.id)
                                }
                                type="button"
                                onClick={() => {
                                  if (
                                    updateRow(
                                      activeRow.key,
                                      'gachaId',
                                      String(gacha.id),
                                    )
                                  ) {
                                    closeGachaPicker(true);
                                  }
                                }}
                              >
                                <strong>{gacha.name}</strong>
                                <small>
                                  #{gacha.id}
                                  {gacha.nameJa ? ' · ' + gacha.nameJa : ''}
                                </small>
                              </GachaAssignButton>
                            </MachineGachaChoice>
                          );
                        })}
                    </GachaChoices>
                    {filteredGachas.length > visibleGachaCount && (
                      <MoreButton
                        type="button"
                        onClick={() =>
                          setVisibleGachaCount((current) =>
                            Math.min(
                              current + GACHA_PAGE_SIZE,
                              filteredGachas.length,
                            ),
                          )
                        }
                      >
                        가챠 더 보기 (
                        {Math.min(visibleGachaCount, filteredGachas.length)}/
                        {filteredGachas.length}종)
                      </MoreButton>
                    )}
                  </>
                )}
              </GachaPickerResults>
            </GachaPicker>
          )}
        </>
      )}

      <ReserveSection aria-labelledby="machine-reserve-draft-title">
        <h3 id="machine-reserve-draft-title">기기에 넣기 전 보관 수량</h3>
        <p>
          입고 후 매장에 보관 중인 수량을 가챠 종류별로 한 번만 적습니다. 같은
          가챠를 여러 기기에 배치해도 이 수량을 반복 합산하지 않습니다. 모르면
          비워 두세요. 기기 내 확인 수량이나 판매량과는 별개입니다.
        </p>
        <MoreButton
          aria-expanded={isReservePickerOpen}
          type="button"
          onClick={() => setIsReservePickerOpen((current) => !current)}
        >
          {isReservePickerOpen ? '보관 가챠 고르기 닫기' : '+ 보관 가챠 고르기'}
        </MoreButton>
        {isReservePickerOpen && (
          <>
            <ReservePicker>
              <DraftField>
                기기 배치 없이 보관할 가챠 검색
                <input
                  placeholder="이름, 일본어 이름 또는 ID"
                  value={reserveQuery}
                  onChange={(event) => {
                    setReserveQuery(event.target.value);
                    setVisibleReserveCount(GACHA_PAGE_SIZE);
                  }}
                />
              </DraftField>
            </ReservePicker>
            {availableForReserve.length === 0 ? (
              <p>추가할 매장 등록 가챠가 없습니다.</p>
            ) : filteredForReserve.length === 0 ? (
              <p>검색 결과가 없습니다.</p>
            ) : (
              <>
                <GachaChoices>
                  {filteredForReserve
                    .slice(0, visibleReserveCount)
                    .map((gacha) => {
                      const imageUrl = gacha.imageUrl;
                      return (
                        <GachaChoice
                          aria-label={gacha.name + ' 보관 품목 추가'}
                          key={gacha.id}
                          type="button"
                          onClick={() => addReserveOnlyGacha(gacha.id)}
                        >
                          {imageUrl && !failedImages.has(imageUrl) ? (
                            <img
                              alt=""
                              loading="lazy"
                              src={imageUrl}
                              onError={() =>
                                setFailedImages(
                                  (current) => new Set([...current, imageUrl]),
                                )
                              }
                            />
                          ) : (
                            <span aria-hidden className="image-placeholder">
                              사진 없음
                            </span>
                          )}
                          <span>
                            <strong>{gacha.name}</strong>
                            <small>
                              #{gacha.id}
                              {gacha.nameJa ? ' · ' + gacha.nameJa : ''}
                            </small>
                          </span>
                        </GachaChoice>
                      );
                    })}
                </GachaChoices>
                {filteredForReserve.length > visibleReserveCount && (
                  <MoreButton
                    type="button"
                    onClick={() =>
                      setVisibleReserveCount((current) =>
                        Math.min(
                          current + GACHA_PAGE_SIZE,
                          filteredForReserve.length,
                        ),
                      )
                    }
                  >
                    보관할 가챠 더 보기 (
                    {Math.min(visibleReserveCount, filteredForReserve.length)}/
                    {filteredForReserve.length}종)
                  </MoreButton>
                )}
              </>
            )}
          </>
        )}
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
                      id={'reserve-' + gacha.id + '-quantity'}
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
                            gacha.name + '의 보관 수량 초안을 제외할까요?',
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
        <button type="button" onClick={exportCsv}>
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
      {previewGacha?.imageUrl && (
        <GachaImagePreviewDialog
          gachaId={previewGacha.id}
          imageUrl={previewGacha.imageUrl}
          name={previewGacha.name}
          onClose={() => setPreviewGacha(null)}
          onImageError={() => {
            if (!previewGacha.imageUrl) return;
            setFailedImages(
              (current) => new Set([...current, previewGacha.imageUrl!]),
            );
          }}
        />
      )}
    </DraftSection>
  );
}
