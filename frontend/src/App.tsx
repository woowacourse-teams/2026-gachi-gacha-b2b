import AppShell from '@/components/AppShell';
import ClassificationPage from '@/features/classification/pages/ClassificationPage';
import QueuePage from '@/features/classification/pages/QueuePage';
import SourceFolderPage from '@/features/classification/pages/SourceFolderPage';
import { useAppRoute } from '@/routing/useAppRoute';
import GlobalStyles from '@/styles/GlobalStyles';

export default function App() {
  const { route, navigate } = useAppRoute();
  const currentSection = route.page === 'queue' ? route.status : 'UNCLASSIFIED';

  return (
    <>
      <GlobalStyles />
      <AppShell currentSection={currentSection} onNavigate={navigate}>
        {route.page === 'sources' ? (
          <SourceFolderPage onNavigate={navigate} />
        ) : route.page === 'classify' ? (
          <ClassificationPage itemId={route.itemId} onNavigate={navigate} />
        ) : (
          <QueuePage
            source={route.source}
            status={route.status}
            onNavigate={navigate}
          />
        )}
      </AppShell>
    </>
  );
}
