import { Navigate, Route, Routes } from "react-router-dom";
import AdminGate from "./components/AdminGate";
import Layout from "./components/Layout";
import AdminAvailability from "./pages/AdminAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMessages from "./pages/AdminMessages";
import AdminNewPlan from "./pages/AdminNewPlan";
import AdminUsers from "./pages/AdminUsers";
import AvailabilityPage from "./pages/AvailabilityPage";
import CommunityStandardPage from "./pages/CommunityStandardPage";
import ConversationPage from "./pages/ConversationPage";
import EventsPage from "./pages/EventsPage";
import HomePage from "./pages/HomePage";
import JoinSignupPage from "./pages/JoinSignupPage";
import JoinThanksPage from "./pages/JoinThanksPage";
import MePage from "./pages/MePage";
import PlansPage from "./pages/PlansPage";
import PrivacyPage from "./pages/PrivacyPage";
import SigninPage from "./pages/SigninPage";
import SimulationPage from "./pages/SimulationPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  const fullAppEnabled =
    import.meta.env.DEV ||
    import.meta.env.VITE_SHADOW_MODE === "true" ||
    import.meta.env.VITE_FULL_APP === "true";

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/join" element={<HomePage />} />
        <Route path="/join/signup" element={<JoinSignupPage />} />
        <Route path="/join/thanks" element={<JoinThanksPage />} />
        <Route path="/signup" element={<Navigate to="/join/signup" replace />} />
        <Route path="/standard" element={<CommunityStandardPage />} />
        {fullAppEnabled ? (
          <>
            <Route path="/signin" element={<SigninPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/:planId/thread" element={<ConversationPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/free" element={<AvailabilityPage />} />
            <Route path="/me" element={<MePage />} />
            <Route path="/sim" element={<SimulationPage />} />
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
          </>
        ) : null}
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Route>
    </Routes>
  );
}
