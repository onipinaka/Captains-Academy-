import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Wallet,
  ArrowRight
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, PageLoader, EmptyState } from '../../components/ui'
import { getDashboardStats, getFeePayments, getStudents } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function StatCard({ title, value, icon: Icon, color, link }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600'
  }

  return (
    <Link to={link}>
      <Card hover className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function QuickActionCard({ title, description, icon: Icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700'
  }

  return (
    <div className={`w-full p-4 my-4 rounded-xl text-white text-left transition-colors ${colorClasses[color]}`}>
      <Icon className="w-6 h-6 mb-2" />
      <p className="font-medium">{title}</p>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  )
}

function Dashboard() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeBatches: 0,
    todayAttendance: 0,
    monthCollection: 0,
    pendingFees: 0,
    pendingStudents: 0
  })
  const [recentPayments, setRecentPayments] = useState([])
  const [pendingStudentsList, setPendingStudentsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadDashboardData()
    }
  }, [currentOrganization])


  const loadDashboardData = async () => {
    if (!currentOrganization?.id) return
    
    setLoading(true)
    try {
      const [dashboardStats, payments, students] = await Promise.all([
        getDashboardStats(currentOrganization.id),
        getFeePayments(currentOrganization.id),
        getStudents(currentOrganization.id)
      ])

      setStats(dashboardStats)
      setRecentPayments((payments || []).slice(0, 5))
      setPendingStudentsList(
        (students || []).filter(s => s.due_amount > 0).slice(0, 5)
      )
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
    setLoading(false)
  }

  // Show loading if either organization context is loading OR data is loading
  if (loading || !currentOrganization) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm text-gray-500">Today's Date</p>
          <p className="font-medium text-gray-800">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
          link="/students"
        />
        <StatCard
          title="Active Batches"
          value={stats.activeBatches}
          icon={GraduationCap}
          color="purple"
          link="/batches"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={Calendar}
          color="green"
          link="/attendance"
        />
        <StatCard
          title="Month Collection"
          value={`₹${stats.monthCollection.toLocaleString()}`}
          icon={DollarSign}
          color="cyan"
          link="/fees"
        />
        <StatCard
          title="Pending Fees"
          value={`₹${stats.pendingFees.toLocaleString()}`}
          icon={AlertCircle}
          color="red"
          link="/fees"
        />
        <StatCard
          title="Pending Students"
          value={stats.pendingStudents}
          icon={Users}
          color="yellow"
          link="/fees"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-3 gap-6 ">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/attendance">
              <QuickActionCard
                title="Mark Attendance"
                description="Today's attendance"
                icon={CheckCircle}
                color="green"
              />
            </Link>
            <Link to="/tests">
              <QuickActionCard
                title="Add Test Scores"
                description="Enter test results"
                icon={ClipboardList}
                color="blue"
              />
            </Link>
            <Link to="/fees/add">
              <QuickActionCard
                title="Collect Fee"
                description="Record payment"
                icon={DollarSign}
                color="purple"
              />
            </Link>
            <Link to="/expenses/add">
              <QuickActionCard
                title="Record Expense"
                description="Add expense"
                icon={Wallet}
                color="yellow"
              />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Fee Payments</CardTitle>
            <Link to="/fees" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentPayments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{payment.students?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {payment.payment_mode}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">+₹{payment.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No recent payments" description="Payments will appear here once recorded" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Fees Alert */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Pending Fee Alerts
          </CardTitle>
          <Link to="/fees" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {pendingStudentsList.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {pendingStudentsList.map((student) => (
                <div 
                  key={student.id} 
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{student.full_name}</p>
                      <p className="text-xs text-gray-500">{student.batches?.name || 'No batch'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-red-600">₹{student.due_amount?.toLocaleString()}</span>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No pending fees" description="All students have cleared their dues" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
