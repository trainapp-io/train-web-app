import Navigation from './components/navigation/Navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkoutLogProvider } from './app/workout-logs/contexts/WorkoutLogContext';
import './styles/global.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkoutLogProvider>
        <div className="app-root">
          <Navigation />
        </div>
      </WorkoutLogProvider>
    </QueryClientProvider>
  );
}

export default App;