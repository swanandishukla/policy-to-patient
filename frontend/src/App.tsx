/**
 * Policy-to-Patient — Application Root
 * Routes and layout configuration.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import PolicyAnalysisPage from './pages/PolicyAnalysisPage';
import TreatmentEstimatePage from './pages/TreatmentEstimatePage';
import SourcesAboutPage from './pages/SourcesAboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="policy" element={<PolicyAnalysisPage />} />
          <Route path="treatment" element={<TreatmentEstimatePage />} />
          <Route path="about" element={<SourcesAboutPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
