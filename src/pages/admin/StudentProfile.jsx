import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  DollarSign,
  TrendingUp,
  User,
  Plus
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatusDot,
  Tabs,
  PageLoader,
  EmptyState
} from '../../components/ui'
import { Input, Select, Textarea, Modal } from '../../components/ui'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { getStudent, getFeePayments, getAttendance, updateStudent, getBatches } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const tabsList = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'fees', label: 'Fees' },
  { id: 'academics', label: 'Academics' },
  { id: 'attendance', label: 'Attendance' }
]

function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [activeTab, setActiveTab] = useState('personal')
  const [student, setStudent] = useState(null)
  const [feePayments, setFeePayments] = useState([])
  const [testScores, setTestScores] = useState([])
  const [attendance, setAttendance] = useState({ total_classes: 0, present: 0, absent: 0, percentage: 0 })
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editData, setEditData] = useState(null)
  const [batches, setBatches] = useState([])

  useEffect(() => {
    if (currentOrganization?.id) {
      loadStudentData()
    }
  }, [id, currentOrganization])


  const loadStudentData = async () => {
    if (!currentOrganization?.id) return
    
    try {
      setLoading(true)
      const [studentData, paymentsData, attendanceData] = await Promise.all([
        getStudent(currentOrganization.id, id),
        getFeePayments(currentOrganization.id),
        getAttendance(currentOrganization.id)
      ])

      if (studentData) {
        // Calculate fee status
        const studentPayments = (paymentsData || []).filter(p => p.student_id === id)
        const lastPayment = studentPayments.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))[0]
        
        setStudent({
          ...studentData,
          monthly_fee: studentData.batches?.monthly_fee || 0,
          last_paid_month: lastPayment?.payment_date?.substring(0, 7) || null,
          due_amount: 0, // Calculate based on payments
          next_due_date: lastPayment ? new Date(new Date(lastPayment.payment_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'N/A'
        })
        setFeePayments(studentPayments)

        // Process attendance for this student
        const studentAttendance = (attendanceData || []).filter(a => a.student_id === id)
        const present = studentAttendance.filter(a => a.status === 'present').length
        const total = studentAttendance.length
        setAttendance({
          total_classes: total,
          present: present,
          absent: total - present,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0
        })

        // Process test scores (from student's scores if available)
        const scores = studentData.scores || []
        setTestScores(scores.map(s => ({
          id: s.id,
          test_name: s.tests?.name || 'Unknown Test',
          date: s.tests?.date || '',
          subject: s.tests?.subject || 'General',
          marks_obtained: s.marks_obtained || 0,
          total_marks: s.total_marks || s.tests?.total_marks || 100
        })))
      }
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Student not found</p>
        <Button onClick={() => navigate('/students')} className="mt-4">Back to Students</Button>
      </div>
    )
  }

  const feeStatus = student.due_amount > 2000 ? 'overdue' : student.due_amount > 0 ? 'current' : 'paid'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">{student.full_name}</h1>
                <StatusDot status={feeStatus} />
              </div>
              <p className="text-gray-500 flex items-center gap-1">
                <GraduationCap className="w-4 h-4" />
                {student.batches?.name}
              </p>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={async () => {
          // load batches before opening edit modal
          if (!currentOrganization?.id) return
          try {
            const b = await getBatches(currentOrganization.id)
            setBatches(b || [])
          } catch (err) {
            console.error('Failed to load batches', err)
          }
          setEditData({
            full_name: student.full_name || '',
            dob: student.dob || '',
            gender: student.gender || '',
            contact: student.contact || '',
            parent_name: student.parent_name || '',
            parent_contact: student.parent_contact || '',
            email: student.email || '',
            address: student.address || '',
            batch_id: student.batch_id || student.batches?.id || '',
            monthly_fee: student.monthly_fee || student.batches?.monthly_fee || '',
            joining_date: student.joining_date || '' ,
            due_amount: student.due_amount || 0
          })
          setIsEditOpen(true)
        }}>
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Student" size="md">
        {editData ? (
          <form onSubmit={async (e) => {
            e.preventDefault()
            try {
              setEditSaving(true)
              const payload = {
                full_name: editData.full_name,
                dob: editData.dob,
                gender: editData.gender,
                contact: editData.contact,
                parent_name: editData.parent_name,
                parent_contact: editData.parent_contact,
                email: editData.email,
                address: editData.address,
                batch_id: editData.batch_id || null,
                monthly_fee: editData.monthly_fee || null,
                joining_date: editData.joining_date || null,
                due_amount: Number(editData.due_amount) || 0
              }
              const { data, error } = await updateStudent(currentOrganization.id, student.id, payload)
              if (error) throw error
              // refresh student
              await loadStudentData()
              setIsEditOpen(false)
            } catch (err) {
              console.error('Error updating student', err)
              alert('Failed to update student')
            } finally {
              setEditSaving(false)
            }
          }}>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" name="full_name" value={editData.full_name} onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))} required />
                <Input label="Date of Birth" name="dob" type="date" value={editData.dob || ''} onChange={(e) => setEditData(prev => ({ ...prev, dob: e.target.value }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Gender" name="gender" value={editData.gender || ''} onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
                <Input label="Contact" name="contact" value={editData.contact || ''} onChange={(e) => setEditData(prev => ({ ...prev, contact: e.target.value }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Parent Name" name="parent_name" value={editData.parent_name || ''} onChange={(e) => setEditData(prev => ({ ...prev, parent_name: e.target.value }))} />
                <Input label="Parent Contact" name="parent_contact" value={editData.parent_contact || ''} onChange={(e) => setEditData(prev => ({ ...prev, parent_contact: e.target.value }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Email" name="email" type="email" value={editData.email || ''} onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))} />
                <Select label="Batch" name="batch_id" value={editData.batch_id || ''} onChange={(e) => {
                  const id = e.target.value
                  const sel = (batches || []).find(x => x.id === id)
                  setEditData(prev => ({ ...prev, batch_id: id, monthly_fee: sel ? sel.monthly_fee : prev.monthly_fee }))
                }} options={(batches || []).map(b => ({ value: b.id, label: b.name }))} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Monthly Fee (₹)" name="monthly_fee" type="number" value={editData.monthly_fee || ''} onChange={(e) => setEditData(prev => ({ ...prev, monthly_fee: Number(e.target.value) }))} />
                <Input label="Joining Date" name="joining_date" type="date" value={editData.joining_date || ''} onChange={(e) => setEditData(prev => ({ ...prev, joining_date: e.target.value }))} />
              </div>
              <Textarea label="Address" name="address" value={editData.address || ''} onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))} rows={2} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Due Amount (₹)" name="due_amount" type="number" value={editData.due_amount || 0} onChange={(e) => setEditData(prev => ({ ...prev, due_amount: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" loading={editSaving}>Save</Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6">Loading...</div>
        )}
      </Modal>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'personal' && (
          <PersonalInfoTab student={student} />
        )}
        {activeTab === 'fees' && (
          <FeesTab student={student} payments={feePayments} feeStatus={feeStatus} />
        )}
        {activeTab === 'academics' && (
          <AcademicsTab scores={testScores} />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTab attendance={attendance} />
        )}
      </div>
    </div>
  )
}

function PersonalInfoTab({ student }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{student.contact}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{student.email || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{student.address || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parent/Guardian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{student.parent_name || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">{student.parent_contact || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">{student.dob || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">{student.gender || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Joining Date</p>
              <p className="font-medium">{student.joining_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batch</p>
              <p className="font-medium">{student.batches?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Monthly Fee</p>
              <p className="font-medium">₹{student.monthly_fee?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Paid</p>
              <p className="font-medium">{student.last_paid_month || 'Not paid'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Amount</p>
              <p className={`font-medium ${student.due_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{student.due_amount?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Next Due</p>
              <p className="font-medium">{student.next_due_date || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeesTab({ student, payments, feeStatus }) {
  const navigate = useNavigate()
  
  return (
    <div className="space-y-6">
      {/* Fee Status Card */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <Badge variant={feeStatus === 'paid' ? 'success' : feeStatus === 'current' ? 'warning' : 'danger'} size="lg">
              {feeStatus === 'paid' ? 'Paid' : feeStatus === 'current' ? 'Due Soon' : 'Overdue'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Last Paid</p>
            <p className="text-xl font-bold text-gray-800">{student.last_paid_month || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Due Amount</p>
            <p className={`text-xl font-bold ${student.due_amount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{student.due_amount?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Next Due</p>
            <p className="text-xl font-bold text-gray-800">{student.next_due_date || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Button */}
      <div className="flex justify-end">
        <Button onClick={() => navigate('/fees/add')}>
          <Plus className="w-4 h-4" />
          Record Payment
        </Button>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">For Months</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{payment.payment_date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">₹{payment.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{payment.months_covered?.join(', ')}</td>
                    <td className="px-4 py-3 text-sm">{payment.payment_mode}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{payment.receipt_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AcademicsTab({ scores }) {
  if (!scores || scores.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-800">No Test Scores Yet</p>
          <p className="text-gray-500">Test scores will appear here once recorded.</p>
        </CardContent>
      </Card>
    )
  }

  const avgScore = scores.reduce((sum, s) => sum + (s.marks_obtained / s.total_marks * 100), 0) / scores.length
  const highestScore = Math.max(...scores.map(s => s.marks_obtained / s.total_marks * 100))
  const lowestScore = Math.min(...scores.map(s => s.marks_obtained / s.total_marks * 100))

  // Generate performance data from scores
  const performanceData = scores.slice().reverse().map(s => ({
    name: s.date ? new Date(s.date).toLocaleDateString('en-US', { month: 'short' }) : 'N/A',
    score: Math.round((s.marks_obtained / s.total_marks) * 100)
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Average Score</p>
            <p className="text-2xl font-bold text-blue-600">{avgScore.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Highest Score</p>
            <p className="text-2xl font-bold text-green-600">{highestScore.toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Lowest Score</p>
            <p className="text-2xl font-bold text-red-600">{lowestScore.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Graph */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Test Scores Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Test Scores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.map((score) => {
                  const percentage = (score.marks_obtained / score.total_marks) * 100
                  return (
                    <tr key={score.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{score.test_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{score.date}</td>
                      <td className="px-4 py-3 text-sm">{score.subject}</td>
                      <td className="px-4 py-3 text-sm">{score.marks_obtained}/{score.total_marks}</td>
                      <td className="px-4 py-3">
                        <Badge variant={percentage >= 75 ? 'success' : percentage >= 50 ? 'warning' : 'danger'}>
                          {percentage.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AttendanceTab({ attendance }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Total Classes</p>
            <p className="text-2xl font-bold text-gray-800">{attendance.total_classes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Present</p>
            <p className="text-2xl font-bold text-green-600">{attendance.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Absent</p>
            <p className="text-2xl font-bold text-red-600">{attendance.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Attendance %</p>
            <p className={`text-2xl font-bold ${attendance.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {attendance.percentage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Calendar Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Calendar view coming soon</p>
            <p className="text-sm">View attendance history by date</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentProfile
