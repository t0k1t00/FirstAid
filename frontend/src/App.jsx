import { useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import Home from './components/Home';
import GuideList from './components/GuideList';
import GuideWalkthrough from './components/GuideWalkthrough';
import Dashboard from './components/Dashboard';
import MedicalSources from './components/MedicalSources';
import AppShell from './components/AppShell';
import Toaster from './ui/Toaster';
import { startSyncListeners } from './sync/syncManager';

// Keyed by guide id so jumping from one guide straight into another
// (e.g. choking -> CPR) resets the walkthrough state.
function GuideRoute() {
  const { guideId } = useParams();
  return <GuideWalkthrough key={guideId} />;
}

export default function App() {
  // Drain the incident queue on start, on reconnect, and on tab focus.
  useEffect(() => startSyncListeners(), []);

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guide" element={<GuideList />} />
          <Route path="/guide/:guideId" element={<GuideRoute />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sources" element={<MedicalSources />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </AppShell>
      <Toaster />
    </>
  );
}
