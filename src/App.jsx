import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Context
import { AuthProvider } from './context/AuthContext'
import { OrganizationProvider } from './context/OrganizationContext'

// Components
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import AdminLayout from './components/layout/AdminLayout'

// Public Pages
import Homepage from './pages/public/Homepage'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import UpdatePassword from './pages/auth/UpdatePassword'

// Admin Pages
import Dashboard from './pages/admin/Dashboard'
import Students from './pages/admin/Students'
import AddStudent from './pages/admin/AddStudent'
import StudentProfile from './pages/admin/StudentProfile'
import Batches from './pages/admin/Batches'
import CreateBatch from './pages/admin/CreateBatch'
import EditBatch from './pages/admin/EditBatch'
import BatchDetail from './pages/admin/BatchDetail'
import Tests from './pages/admin/Tests'
import CreateTest from './pages/admin/CreateTest'
import TestDetail from './pages/admin/TestDetail'
import AddScores from './pages/admin/AddScores'
import Fees from './pages/admin/Fees'
import AddPayment from './pages/admin/AddPayment'
import FeesHistory from './pages/admin/FeesHistory'
import Attendance from './pages/admin/Attendance'
import AttendanceReports from './pages/admin/AttendanceReports'
import Analytics from './pages/admin/Analytics'
import StudentPerformanceList from './pages/admin/StudentPerformanceList'
import StudentPerformance from './pages/admin/StudentPerformance'
import BatchPerformanceList from './pages/admin/BatchPerformanceList'
import BatchPerformance from './pages/admin/BatchPerformance'
import Expenses from './pages/admin/Expenses'
import AddExpense from './pages/admin/AddExpense'
import Settings from './pages/admin/Settings'

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/signup" element={
              // lazy load signup page to avoid bundle churn
              <React.Suspense fallback={<div>Loading...</div>}>
                <Signup />
              </React.Suspense>
            } />

            {/* Protected Admin Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Students */}
              <Route path="students" element={<Students />} />
              <Route path="students/add" element={<AddStudent />} />
              <Route path="students/:id" element={<StudentProfile />} />
              
              {/* Batches */}
              <Route path="batches" element={<Batches />} />
              <Route path="batches/create" element={<CreateBatch />} />
              <Route path="batches/:id" element={<BatchDetail />} />
              <Route path="batches/:id/edit" element={<EditBatch />} />
              
              {/* Tests */}
              <Route path="tests" element={<Tests />} />
              <Route path="tests/create" element={<CreateTest />} />
              <Route path="tests/:id" element={<TestDetail />} />
              <Route path="tests/:id/scores" element={<AddScores />} />
              
              {/* Fees */}
              <Route path="fees" element={<Fees />} />
              <Route path="fees/add" element={<AddPayment />} />
              <Route path="fees/history" element={<FeesHistory />} />
              <Route path="fees/history/:studentId" element={<FeesHistory />} />
              
              {/* Attendance */}
              <Route path="attendance" element={<Attendance />} />
              <Route path="attendance/reports" element={<AttendanceReports />} />
              
              {/* Analytics */}
              <Route path="analytics" element={<Analytics />} />
              <Route path="analytics/student" element={<StudentPerformanceList />} />
              <Route path="analytics/student/:id" element={<StudentPerformance />} />
              <Route path="analytics/batch" element={<BatchPerformanceList />} />
              <Route path="analytics/batch/:id" element={<BatchPerformance />} />
              
              {/* Expenses */}
              <Route path="expenses" element={<Expenses />} />
              <Route path="expenses/add" element={<AddExpense />} />
              
              {/* Settings */}
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </OrganizationProvider>
    </AuthProvider>
  )
}

export default App
