import { Route, Routes } from "react-router-dom";
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
import SignupPage from "./pages/SignupPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/free" element={<AvailabilityPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/availability" element={<AdminAvailability />} />
        <Route path="/admin/plans/new" element={<AdminNewPlan />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
      </Route>
    </Routes>
  );
}

