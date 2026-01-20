import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Users,
  Clock,
  Calendar,
  GraduationCap,
  DollarSign,
  TrendingUp,
  User,
  BarChart3
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { getBatch, getStudents, getTests, getAttendance, getFeePayments } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const tabsList = [
  { id: 'students', label: 'Students' },
  { id: 'performance', label: 'Performance' },
  { id: 'tests', label: 'Tests' },
  { id: 'schedule', label: 'Schedule' }
]

function BatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [activeTab, setActiveTab] = useState('students')
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [tests, setTests] = useState([])
  const [testTrends, setTestTrends] = useState([])
  const [topicPerformance, setTopicPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadBatchData()
    }
  }, [id, currentOrganization])


  const loadBatchData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [batchData, studentsData, testsData, attendanceData, paymentsData] = await Promise.all([
        getBatch(currentOrganization.id, id),
        getStudents(currentOrganization.id),
        getTests(currentOrganization.id),
        getAttendance(currentOrganization.id),
        getFeePayments(currentOrganization.id)
      ])

      if (batchData) {
        setBatch(batchData)

        // Filter students by batch
        const batchStudents = (studentsData || []).filter(s => s.batch_id === id)
        
        // Process students with fee status, attendance, and scores
        const processedStudents = batchStudents.map(student => {
          const studentPayments = (paymentsData || []).filter(p => p.student_id === student.id)
          const studentAttendance = (attendanceData || []).filter(a => a.student_id === student.id)
          const present = studentAttendance.filter(a => a.status === 'present').length
          const total = studentAttendance.length
          
          return {
            ...student,
            fee_status: studentPayments.length > 0 ? 'paid' : 'overdue',
            attendance_percent: total > 0 ? Math.round((present / total) * 100) : 0,
            avg_score: 0 // Would need to calculate from test scores
          }
        })
        setStudents(processedStudents)

        // Filter tests by batch
        const batchTests = (testsData || []).filter(t => t.batch_id === id)
        setTests(batchTests.map(t => ({
          ...t,
          avg_score: 0,
          scores_entered: (t.scores || []).length > 0
        })))

        // Generate test trends
        setTestTrends(batchTests.slice(-5).map(t => ({
          name: t.name?.substring(0, 10) || 'Test',
          avg: 70 // Would calculate from actual scores
        })))
      }
    } catch (error) {
      console.error('Error loading batch data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  if (!batch) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Batch not found</p>
        <Button onClick={() => navigate('/batches')} className="mt-4">Back to Batches</Button>
      </div>
    )
  }

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
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${batch.status === 'Active' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <GraduationCap className={`w-7 h-7 ${batch.status === 'Active' ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-800">{batch.name}</h1>
                <Badge variant={batch.status === 'Active' ? 'success' : 'default'}>
                  {batch.status}
                </Badge>
              </div>
              <p className="text-gray-500">{batch.subject} • Class {batch.standard}</p>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/batches/${id}/edit`)}>
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Students</p>
                <p className="text-xl font-bold text-gray-800">{students.length} / {batch.capacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Fee</p>
                <p className="text-xl font-bold text-gray-800">₹{batch.monthly_fee?.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Timing</p>
                <p className="text-xl font-bold text-gray-800">{batch.start_time} - {batch.end_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Score</p>
                <p className="text-xl font-bold text-gray-800">
                  {Math.round(students.reduce((sum, s) => sum + s.avg_score, 0) / students.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabsList} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'students' && (
          <StudentsTab students={students} batchId={id} navigate={navigate} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab students={students} topicData={topicPerformance} trendData={testTrends} />
        )}
        {activeTab === 'tests' && (
          <TestsTab tests={tests} />
        )}
        {activeTab === 'schedule' && (
          <ScheduleTab batch={batch} />
        )}
      </div>
    </div>
  )
}

function StudentsTab({ students, batchId, navigate }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Students in Batch</CardTitle>
        <Button size="sm" onClick={() => navigate(`/students/add?batch=${batchId}`)}>
          <Users className="w-4 h-4" />
          Add Student
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/students/${student.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-800 hover:text-blue-600">{student.full_name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{student.contact}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={student.fee_status} />
                      <span className="text-sm capitalize">{student.fee_status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={student.attendance_percent >= 75 ? 'success' : 'danger'} size="sm">
                      {student.attendance_percent}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={student.avg_score >= 75 ? 'success' : student.avg_score >= 50 ? 'warning' : 'danger'} size="sm">
                      {student.avg_score}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function PerformanceTab({ students, topicData, trendData }) {
  const topPerformers = [...students].sort((a, b) => b.avg_score - a.avg_score).slice(0, 5)
  const needsAttention = students.filter(s => s.avg_score < 50)

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Topic-wise Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Topic-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="topic" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="avgScore" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Test Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Test Score Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Needs Attention */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {topPerformers.map((student, index) => (
                <div key={student.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium">{student.full_name}</span>
                  </div>
                  <Badge variant="success">{student.avg_score}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {needsAttention.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                All students performing above 50%! 🎉
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {needsAttention.map((student) => (
                  <div key={student.id} className="flex items-center justify-between px-4 py-3">
                    <span className="font-medium">{student.full_name}</span>
                    <Badge variant="danger">{student.avg_score}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TestsTab({ tests }) {
  const navigate = useNavigate()
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tests Conducted</CardTitle>
        <Button size="sm" onClick={() => navigate('/tests/create')}>
          Create Test
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Marks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{test.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{test.date}</td>
                  <td className="px-4 py-3 text-sm">{test.total_marks}</td>
                  <td className="px-4 py-3">
                    <Badge variant={test.avg_score / test.total_marks * 100 >= 60 ? 'success' : 'warning'}>
                      {test.avg_score} ({Math.round(test.avg_score / test.total_marks * 100)}%)
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={test.scores_entered ? 'success' : 'warning'}>
                      {test.scores_entered ? 'Completed' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleTab({ batch }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Days</p>
            <div className="flex flex-wrap gap-2">
              {batch.days?.map(day => (
                <Badge key={day} variant="primary">{day}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Timing</p>
            <p className="text-lg font-semibold">{batch.start_time} - {batch.end_time}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Start Date</p>
            <p className="text-lg font-semibold">{batch.start_date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Subject</p>
            <p className="text-lg font-semibold">{batch.subject}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BatchDetail
