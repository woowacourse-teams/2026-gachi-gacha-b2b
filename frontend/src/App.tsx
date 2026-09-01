import AppShell from '@/components/AppShell';
import { AiSettingsProvider } from '@/features/ai/context/AiSettingsContext';
import ClassificationPage from '@/features/classification/pages/ClassificationPage';
import QueuePage from '@/features/classification/pages/QueuePage';
import RegistrationPage from '@/features/registration/pages/RegistrationPage';
import { useAppRoute } from '@/routing/useAppRoute';
import GlobalStyles from '@/styles/GlobalStyles';

function AppContent() {
  const { route, navigate } = useAppRoute();
  const currentSection = route.page === 'queue' ? route.status : 'UNCLASSIFIED';

  return (
    <>
      <GlobalStyles />
      <AppShell currentSection={currentSection} onNavigate={navigate}>
        {route.page === 'register' ? (
          <RegistrationPage onNavigate={navigate} />
        ) : route.page === 'classify' ? (
          <ClassificationPage
            itemId={route.itemId}
            maxId={route.maxId}
            minId={route.minId}
            onNavigate={navigate}
          />
        ) : (
          <QueuePage
            initialMaxId={route.maxId}
            initialMinId={route.minId}
            status={route.status}
            onNavigate={navigate}
          />
        )}
      </AppShell>
    </>
  );
}

export default function App() {
  return (
    <AiSettingsProvider>
      <AppContent />
    </AiSettingsProvider>
  );
}
