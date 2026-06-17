import { Route, Routes } from "react-router-dom";
import AdminGate from "./components/AdminGate";
import Layout from "./components/Layout";
import AdminAvailability from "./pages/AdminAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMessages from "./pages/AdminMessages";
import AdminNewPlan from "./pages/AdminNewPlan";
import AdminUsers from "./pages/AdminUsers";
import AvailabilityPage from "./pages/AvailabilityPage";
import HomePage from "./pages/HomePage";
import MePage from "./pages/MePage";
import PlansPage from "./pages/PlansPage";
import PrivacyPage from "./pages/PrivacyPage";
import SignupPage from "./pages/SignupPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/free" element={<AvailabilityPage />} />
        <Route path="/me" element={<MePage />} />
        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminDashboard />
            </AdminGate>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminGate>
              <AdminUsers />
            </AdminGate>
          }
        />
        <Route
          path="/admin/availability"
          element={
            <AdminGate>
              <AdminAvailability />
            </AdminGate>
          }
        />
        <Route
          path="/admin/plans/new"
          element={
            <AdminGate>
              <AdminNewPlan />
            </AdminGate>
          }
        />
        <Route
          path="/admin/messages"
          element={
            <AdminGate>
              <AdminMessages />
            </AdminGate>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
      </Route>
    </Routes>
  );
}
