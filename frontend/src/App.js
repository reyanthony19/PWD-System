import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';


// Admin Components
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import ForgotPassword from './ForgotPassword';
import Profile from './Profile';
import MemberList from './MemberList';
import MemberProfile from './MemberProfile';
import StaffList from './StaffList';
import StaffProfile from './StaffProfile';
import MemberRegister from './MemberRegister';
import Events from './Events';
import Attendances from './Attendances';
import CreateEvent from './CreateEvent';
import Print from './Print';
import BenefitsList from './BenefitsList';
import BenefitsCreate from './BenefitsCreate';
import BenefitsClaimRecord from './BenefitsClaimRecord';
import PrintBenefitsReport from './PrintBenefitsReport';
import PrintAttendanceReport from './PrintAttendance';

// Route Guards
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/member" element={<MemberList />} />
          <Route path="/member/register" element={<MemberRegister />} />
          <Route path="/members/:id" element={<MemberProfile />} />
          <Route path="/print/:id" element={<Print />} />

          <Route path="/staff" element={<StaffList />} />
          <Route path="/staff/:id" element={<StaffProfile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/attendances" element={<Attendances />} />
          <Route path="/events/create" element={<CreateEvent />} />

          <Route path="/benefits/list" element={<BenefitsList />} />
          <Route path="/benefits/create" element={<BenefitsCreate />} />
          <Route path="/benefits/:benefitId/participants" element={<BenefitsClaimRecord />} />
          <Route path="/print-benefits/:benefitId" element={<PrintBenefitsReport />} />
          <Route path="/events/:eventId/attendance/print" element={<PrintAttendanceReport />} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
