import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/utils/getErrorMessage';

import {
  Count,
  ErrorMessage,
  FolderButton,
  FolderCard,
  FolderGrid,
  FolderIcon,
  FolderInfo,
  Header,
  Page,
  StatePanel,
} from './SourceFolderPage.styles';
import { getSourceFolders } from '../api/classificationApi';
import type { SourceFolder } from '../model/classification';

interface SourceFolderPageProps {
  onNavigate: (path: string) => void;
}

export default function SourceFolderPage({
  onNavigate,
}: SourceFolderPageProps) {
  const [folders, setFolders] = useState<SourceFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadFolders = async () => {
      try {
        const loadedFolders = await getSourceFolders();

        if (isCurrent) setFolders(loadedFolders);
      } catch (cause) {
        if (isCurrent) setError(getErrorMessage(cause));
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    void loadFolders();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <Page>
      <Header>
        <h1>수집 출처 폴더</h1>
        <p>
          담당할 수집 출처를 선택해 분류를 시작하세요. 출처별 폴더를 나누어 여러
          크루가 서로 다른 데이터 묶음을 분담할 수 있습니다.
        </p>
      </Header>

      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}

      {isLoading ? (
        <StatePanel aria-live="polite">
          수집 출처를 불러오는 중입니다.
        </StatePanel>
      ) : folders.length ? (
        <FolderGrid>
          {folders.map((folder) => (
            <FolderCard key={folder.name}>
              <FolderButton
                type="button"
                onClick={() =>
                  onNavigate(`/sources/${encodeURIComponent(folder.name)}`)
                }
              >
                <FolderIcon aria-hidden>▰</FolderIcon>
                <FolderInfo>
                  <strong>{folder.name}</strong>
                  <small>
                    분류 대기 <Count>{folder.pendingCount}개</Count>&nbsp; →
                  </small>
                </FolderInfo>
              </FolderButton>
            </FolderCard>
          ))}
        </FolderGrid>
      ) : (
        <StatePanel>표시할 수집 출처가 없습니다.</StatePanel>
      )}
    </Page>
  );
}
