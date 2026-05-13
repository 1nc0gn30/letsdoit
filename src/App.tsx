import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Events from './pages/Events';
import DailyPicks from './pages/DailyPicks';
import ProfilePage from './pages/ProfilePage';
import PlaceDetail from './pages/PlaceDetail';

export default function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const needsOnboarding = !user || (profile && (!profile.preferences || profile.preferences.length === 0));

  if (needsOnboarding) {
    return <Onboarding onComplete={() => {}} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/events" element={<Events />} />
        <Route path="/daily-picks" element={<DailyPicks />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/place/:id" element={<PlaceDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
