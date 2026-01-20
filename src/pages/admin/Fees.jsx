import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertCircle, TrendingUp, Users, Clock, CheckCircle, User } from 'lucide-react'
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, StatusDot, Tabs, PageLoader, Modal
} from '../../components/ui'
import { getFeePayments, getStudents, deleteFeePayment } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const tabsList = [
  { id: 'pending', label: 'Pending Fees' },
  { id: 'recent', label: 'Recent Payments' },
  { id: 'all', label: 'All Students' }
]

const DAY = 1000 * 60 * 60 * 24
const MONTH = DAY * 30

export default function Fees() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [activeTab, setActiveTab] = useState('pending')
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [currentOrganization])

  const loadData = async () => {
    if (!currentOrganization?.id) return
    
    try {
      setLoading(true)
      const [paymentsData, studentsData] = await Promise.all([
        getFeePayments(currentOrganization.id),
        getStudents(currentOrganization.id)
      ])

      const normalizedPayments = (paymentsData || []).map(p => ({
        ...p,
        amount: Number(p.amount || 0)
      }))

      const now = new Date()

      const processedStudents = (studentsData || []).map(student => {
        const studentPayments = normalizedPayments.filter(p => p.student_id === student.id)

        const totalPaid = studentPayments.reduce((s, p) => s + p.amount, 0)
        const lastPayment = studentPayments[0] // already ordered desc
        const lastPaidDate = lastPayment ? new Date(lastPayment.payment_date) : null

        const monthlyFee = Number(student.batches?.monthly_fee || 0)
        const joiningDate = new Date(student.joining_date || student.created_at)

        const monthsSinceJoin = Math.max(
          1,
          Math.ceil((now - joiningDate) / MONTH)
        )

        const totalDueTillNow = monthsSinceJoin * monthlyFee
        const remainingDue = Math.max(0, totalDueTillNow - totalPaid)

        const daysSinceLastPaid = lastPaidDate
          ? Math.floor((now - lastPaidDate) / DAY)
          : Math.floor((now - joiningDate) / DAY)

        const daysOverdue = Math.max(0, daysSinceLastPaid - 30)

        return {
          ...student,
          batch: student.batches?.name || 'No Batch',
          monthly_fee: monthlyFee,
          total_paid: totalPaid,
          due_amount: remainingDue,
          last_paid: lastPaidDate ? lastPayment.payment_date : 'Never',
          last_paid_month: lastPaidDate ? lastPayment.payment_date.slice(0, 7) : 'Never',
          next_due: lastPaidDate
            ? new Date(lastPaidDate.getTime() + MONTH).toISOString().split('T')[0]
            : 'N/A',
          days_overdue: daysOverdue,
          status:
            remainingDue === 0
              ? 'paid'
              : daysOverdue > 0
              ? 'overdue'
              : 'current'
        }
      })

      setPayments(normalizedPayments)
      setStudents(processedStudents)
    } catch (err) {
      console.error('Fee load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const pendingStudents = students.filter(s => s.due_amount > 0)

  const monthCollection = payments.reduce((sum, p) => {
    const d = new Date(p.payment_date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      ? sum + p.amount
      : sum
  }, 0)

  const totalPending = pendingStudents.reduce((s, st) => s + st.due_amount, 0)
  const overdueCount = pendingStudents.filter(s => s.days_overdue > 30).length

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Fee Management</h1>
          <p className="text-gray-500">Track payments & dues</p>
        </div>
        <Button onClick={() => navigate('/fees/add')}>
          <Plus className="w-4 h-4" /> Add Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="This Month" value={`₹${monthCollection}`} />
        <StatCard icon={AlertCircle} label="Pending" value={`₹${totalPending}`} red />
        <StatCard icon={Users} label="Students Due" value={pendingStudents.length} />
        <StatCard icon={Clock} label="Overdue (30+)" value={overdueCount} />
      </div>

      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'pending' && <PendingFeesTab students={pendingStudents} />}
      {activeTab === 'recent' && <RecentPaymentsTab payments={payments} />}
      {activeTab === 'all' && <AllStudentsTab students={students} />}
    </div>
  )
}

/* ---------- SMALL COMPONENTS ---------- */

const StatCard = ({ icon: Icon, label, value, red }) => (
  <Card>
    <CardContent className="p-4 flex gap-3 items-center">
      <Icon className={`w-5 h-5 ${red ? 'text-red-600' : 'text-green-600'}`} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
)

function PendingFeesTab({ students }) {
  const navigate = useNavigate()

  if (!students.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="mx-auto w-12 h-12 text-green-500" />
          <p className="mt-2 font-medium">All fees collected 🎉</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Fees</CardTitle>
      </CardHeader>
      <CardContent>
        {students.map(s => (
          <div key={s.id} className="flex justify-between py-2 border-b">
            <div>
              <p className="font-medium">{s.full_name}</p>
              <p className="text-sm text-gray-500">{s.batch}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-red-600">₹{s.due_amount}</p>
              <Button size="sm" onClick={() => navigate('/fees/add', { state: { student: s } })}>Collect</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecentPaymentsTab({ payments }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 && <p className="text-gray-500">No payments yet</p>}
        {payments.map(p => (
          <div key={p.id} className="flex justify-between py-2 border-b">
            <span>{p.students?.full_name}</span>
            <span className="font-semibold text-green-600">₹{p.amount}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AllStudentsTab({ students }) {
  const navigate = useNavigate()
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Students</CardTitle>
      </CardHeader>
      <CardContent>
        {students.map(s => (
          <div
            key={s.id}
            className="flex justify-between py-2 border-b cursor-pointer"
            onClick={() => navigate(`/students/${s.id}`)}
          >
            <span>{s.full_name}</span>
            <StatusDot status={s.status} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
