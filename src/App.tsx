import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { DoctorsPage } from './pages/doctors/DoctorsPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { BillingPage } from './pages/billing/BillingPage';
import { InvoiceDetailPage } from './pages/billing/InvoiceDetailPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { PharmacyPage } from './pages/pharmacy/PharmacyPage';
import { BloodBankPage } from './pages/bloodbank/BloodBankPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/misc/SettingsPage';
import { NotificationsPage } from './pages/misc/NotificationsPage';
import { StaffPage } from './pages/staff/StaffPage';
import { RegisterUserPage } from './pages/admin/RegisterUserPage';
import { MyPatientsPage } from './pages/doctor/MyPatientsPage';
import { MySchedulePage } from './pages/doctor/MySchedulePage';
import { RequestAppointmentPage } from './pages/patients/RequestAppointmentPage';
import { MedicalHistoryPage } from './pages/patients/MedicalHistoryPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(226,232,240,0.8)',
                color: '#0f172a',
                fontSize: '14px',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 8px 32px -8px rgba(16,24,40,0.12)',
              },
              className: 'dark:!bg-ink-900/90 dark:!border-ink-800 dark:!text-ink-100',
            }}
          />
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected app routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* All roles */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Patient only */}
              <Route path="/request-appointment" element={<ProtectedRoute roles={['patient']}><RequestAppointmentPage /></ProtectedRoute>} />
              <Route path="/medical-history" element={<ProtectedRoute roles={['patient']}><MedicalHistoryPage /></ProtectedRoute>} />

              {/* Admin + Doctor */}
              <Route path="/appointments" element={<ProtectedRoute roles={['admin', 'doctor']}><AppointmentsPage /></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute roles={['admin']}><PatientsPage /></ProtectedRoute>} />
              <Route path="/patients/:id" element={<ProtectedRoute roles={['admin', 'doctor']}><PatientDetailPage /></ProtectedRoute>} />

              {/* Admin only */}
              <Route path="/doctors" element={<ProtectedRoute roles={['admin']}><DoctorsPage /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute roles={['admin', 'patient']}><BillingPage /></ProtectedRoute>} />
              <Route path="/billing/:id" element={<ProtectedRoute roles={['admin', 'patient']}><InvoiceDetailPage /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute roles={['admin']}><ReportsPage /></ProtectedRoute>} />

              {/* General staff only */}
              <Route path="/inventory" element={<ProtectedRoute roles={['general_staff']}><InventoryPage /></ProtectedRoute>} />
              <Route path="/pharmacy" element={<ProtectedRoute roles={['general_staff']}><PharmacyPage /></ProtectedRoute>} />
              <Route path="/blood-bank" element={<ProtectedRoute roles={['general_staff']}><BloodBankPage /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute roles={['admin']}><StaffPage /></ProtectedRoute>} />
              <Route path="/register-user" element={<ProtectedRoute roles={['admin']}><RegisterUserPage /></ProtectedRoute>} />

              {/* Doctor only */}
              <Route path="/my-patients" element={<ProtectedRoute roles={['doctor']}><MyPatientsPage /></ProtectedRoute>} />
              <Route path="/my-schedule" element={<ProtectedRoute roles={['doctor']}><MySchedulePage /></ProtectedRoute>} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
