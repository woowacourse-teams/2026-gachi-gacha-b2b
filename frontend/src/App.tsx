import AppShell from '@/components/AppShell';
import QueuePage from '@/features/classification/pages/QueuePage';
import { useAppRoute } from '@/routing/useAppRoute';
import GlobalStyles from '@/styles/GlobalStyles';

export default function App() {
  const { route, navigate } = useAppRoute();
  const queueStatus = route.page === 'queue' ? route.status : 'UNCLASSIFIED';

  return (
    <>
      <GlobalStyles />
      <AppShell currentSection={queueStatus} onNavigate={navigate}>
        <QueuePage status={queueStatus} onNavigate={navigate} />
      </AppShell>
    </>
  );
}
