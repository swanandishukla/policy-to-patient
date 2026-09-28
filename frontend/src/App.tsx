/**
 * Policy-to-Patient — Application Root
 * Routes and layout configuration.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import OverviewPage from './pages/OverviewPage';
import PolicyAnalysisPage from './pages/PolicyAnalysisPage';
import TreatmentEstimatePage from './pages/TreatmentEstimatePage';
import SourcesAboutPage from './pages/SourcesAboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="overview" element={<OverviewPage />} />
          <Route path="policy" element={<PolicyAnalysisPage />} />
          <Route path="treatment" element={<TreatmentEstimatePage />} />
          <Route path="about" element={<SourcesAboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
