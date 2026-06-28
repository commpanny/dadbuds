import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import CommunityStandardPage from "./pages/CommunityStandardPage";
import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import JoinSignupPage from "./pages/JoinSignupPage";
import JoinThanksPage from "./pages/JoinThanksPage";

const fullAppEnabled =
  import.meta.env.DEV ||
  import.meta.env.VITE_SHADOW_MODE === "true" ||
  import.meta.env.VITE_FULL_APP === "true";
const AdminGate = fullAppEnabled
  ? lazy(() => import("./components/AdminGate"))
  : null;
const AdminAvailability = fullAppEnabled
  ? lazy(() => import("./pages/AdminAvailability"))
  : null;
const AdminDashboard = fullAppEnabled
  ? lazy(() => import("./pages/AdminDashboard"))
  : null;
const AdminMessages = fullAppEnabled
  ? lazy(() => import("./pages/AdminMessages"))
  : null;
const AdminNewPlan = fullAppEnabled
  ? lazy(() => import("./pages/AdminNewPlan"))
  : null;
const AdminUsers = fullAppEnabled
  ? lazy(() => import("./pages/AdminUsers"))
  : null;
const AvailabilityPage = fullAppEnabled
  ? lazy(() => import("./pages/AvailabilityPage"))
  : null;
const ConversationPage = fullAppEnabled
  ? lazy(() => import("./pages/ConversationPage"))
  : null;
const EventsPage = fullAppEnabled
  ? lazy(() => import("./pages/EventsPage"))
  : null;
const MePage = fullAppEnabled ? lazy(() => import("./pages/MePage")) : null;
const PlansPage = fullAppEnabled
  ? lazy(() => import("./pages/PlansPage"))
  : null;
const PrivacyPage = fullAppEnabled
  ? lazy(() => import("./pages/PrivacyPage"))
  : null;
const SigninPage = fullAppEnabled
  ? lazy(() => import("./pages/SigninPage"))
  : null;
const SimulationPage = fullAppEnabled
  ? lazy(() => import("./pages/SimulationPage"))
  : null;
const TermsPage = fullAppEnabled
  ? lazy(() => import("./pages/TermsPage"))
  : null;

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/join" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/join/signup" element={<JoinSignupPage />} />
        <Route path="/join/thanks" element={<JoinThanksPage />} />
        <Route path="/signup" element={<Navigate to="/join/signup" replace />} />
        <Route path="/standard" element={<CommunityStandardPage />} />
        {fullAppEnabled &&
        AdminAvailability &&
        AdminDashboard &&
        AdminGate &&
        AdminMessages &&
        AdminNewPlan &&
        AdminUsers &&
        AvailabilityPage &&
        ConversationPage &&
        EventsPage &&
        MePage &&
        PlansPage &&
        PrivacyPage &&
        SigninPage &&
        SimulationPage &&
        TermsPage ? (
          <>
            <Route
              path="/signin"
              element={
                <Suspense fallback={null}>
                  <SigninPage />
                </Suspense>
              }
            />
            <Route
              path="/plans"
              element={
                <Suspense fallback={null}>
                  <PlansPage />
                </Suspense>
              }
            />
            <Route
              path="/plans/:planId/thread"
              element={
                <Suspense fallback={null}>
                  <ConversationPage />
                </Suspense>
              }
            />
            <Route
              path="/events"
              element={
                <Suspense fallback={null}>
                  <EventsPage />
                </Suspense>
              }
            />
            <Route
              path="/free"
              element={
                <Suspense fallback={null}>
                  <AvailabilityPage />
                </Suspense>
              }
            />
            <Route
              path="/me"
              element={
                <Suspense fallback={null}>
                  <MePage />
                </Suspense>
              }
            />
            <Route
              path="/sim"
              element={
                <Suspense fallback={null}>
                  <SimulationPage />
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={null}>
                  <AdminGate>
                    <AdminDashboard />
                  </AdminGate>
                </Suspense>
              }
            />
            <Route
              path="/admin/users"
              element={
                <Suspense fallback={null}>
                  <AdminGate>
                    <AdminUsers />
                  </AdminGate>
                </Suspense>
              }
            />
            <Route
              path="/admin/availability"
              element={
                <Suspense fallback={null}>
                  <AdminGate>
                    <AdminAvailability />
                  </AdminGate>
                </Suspense>
              }
            />
            <Route
              path="/admin/plans/new"
              element={
                <Suspense fallback={null}>
                  <AdminGate>
                    <AdminNewPlan />
                  </AdminGate>
                </Suspense>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <Suspense fallback={null}>
                  <AdminGate>
                    <AdminMessages />
                  </AdminGate>
                </Suspense>
              }
            />
            <Route
              path="/privacy"
              element={
                <Suspense fallback={null}>
                  <PrivacyPage />
                </Suspense>
              }
            />
            <Route
              path="/terms"
              element={
                <Suspense fallback={null}>
                  <TermsPage />
                </Suspense>
              }
            />
          </>
        ) : null}
        <Route path="*" element={<Navigate to="/join" replace />} />
      </Route>
    </Routes>
  );
}
