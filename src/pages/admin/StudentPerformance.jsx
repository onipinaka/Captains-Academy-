import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, TrendingDown, Award, Target, BookOpen, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, PageLoader, EmptyState } from '../../components/ui'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { getStudent, getTests, getAttendance, getFeePayments } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function StudentPerformance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [student, setStudent] = useState(null)
  const [performanceData, setPerformanceData] = useState([])
  const [subjectData, setSubjectData] = useState([])
  const [testResults, setTestResults] = useState([])
  const [stats, setStats] = useState({
    avgScore: 0,
    totalTests: 0,
    passedTests: 0,
    attendance: 0,
    rank: 'N/A',
    improvement: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [id, currentOrganization])


  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [studentData, testsData, attendanceData] = await Promise.all([
        getStudent(currentOrganization.id, id),
        getTests(currentOrganization.id),
        getAttendance(currentOrganization.id)
      ])

      if (studentData) {
        setStudent(studentData)

        // Filter tests for this student's batch
        const batchTests = (testsData || []).filter(t => t.batch_id === studentData.batch_id)
        
        // Get student's scores
        const studentScores = studentData.scores || []
        
        // Calculate performance over time
        const testPerformance = batchTests
          .filter(t => studentScores.find(s => s.test_id === t.id))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(test => {
            const score = studentScores.find(s => s.test_id === test.id)
            const percentage = score ? Math.round((score.marks_obtained / test.total_marks) * 100) : 0
            return {
              name: test.name?.substring(0, 10) || test.date,
              date: test.date,
              score: percentage,
              subject: test.subject || 'General'
            }
          })
        setPerformanceData(testPerformance)

        // Calculate subject-wise performance
        const subjectScores = {}
        batchTests.forEach(test => {
          const subject = test.subject || 'General'
          const score = studentScores.find(s => s.test_id === test.id)
          if (score) {
            if (!subjectScores[subject]) {
              subjectScores[subject] = []
            }
            subjectScores[subject].push((score.marks_obtained / test.total_marks) * 100)
          }
        })
        
        const subjectPerformance = Object.entries(subjectScores).map(([subject, scores]) => ({
          subject,
          score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          fullMark: 100
        }))
        setSubjectData(subjectPerformance)

        // Test results list
        const results = batchTests.map(test => {
          const score = studentScores.find(s => s.test_id === test.id)
          return {
            id: test.id,
            name: test.name,
            date: test.date,
            subject: test.subject,
            totalMarks: test.total_marks,
            marksObtained: score?.marks_obtained || 0,
            percentage: score ? Math.round((score.marks_obtained / test.total_marks) * 100) : 0,
            status: score ? (
              score.marks_obtained >= test.total_marks / 3 ? 'passed' : 'failed'
            ) : 'absent'
          }
        }).sort((a, b) => new Date(b.date) - new Date(a.date))
        setTestResults(results)

        // Calculate stats
        const allPercentages = testPerformance.map(t => t.score)
        const avgScore = allPercentages.length > 0 
          ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length) 
          : 0
        
        const passedTests = results.filter(r => r.status === 'passed').length
        
        // Calculate improvement (last 3 tests avg vs first 3 tests avg)
        let improvement = 0
        if (testPerformance.length >= 6) {
          const first3Avg = testPerformance.slice(0, 3).reduce((a, b) => a + b.score, 0) / 3
          const last3Avg = testPerformance.slice(-3).reduce((a, b) => a + b.score, 0) / 3
          improvement = Math.round(last3Avg - first3Avg)
        }

        // Calculate attendance
        const studentAttendance = (attendanceData || []).filter(a => a.student_id === id)
        const present = studentAttendance.filter(a => a.status === 'present').length
        const total = studentAttendance.length
        const attendancePercent = total > 0 ? Math.round((present / total) * 100) : 0

        setStats({
          avgScore,
          totalTests: results.length,
          passedTests,
          attendance: attendancePercent,
          rank: 'N/A',
          improvement
        })
      }
    } catch (error) {
      console.error('Error loading student performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  if (!student) {
    return (
      <div className="p-8">
        <EmptyState
          title="Student not found"
          description="The student you're looking for doesn't exist."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{student.full_name} - Performance</h1>
          <p className="text-gray-500 mt-1">{student.batches?.name || 'No Batch'}</p>
        </div>
        <Link to={`/students/${id}`}>
          <Button variant="secondary">
            <User className="w-4 h-4" />
            View Profile
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.avgScore}%</p>
            <p className="text-sm text-gray-500">Avg Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.passedTests}/{stats.totalTests}</p>
            <p className="text-sm text-gray-500">Tests Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.attendance}%</p>
            <p className="text-sm text-gray-500">Attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.rank}</p>
            <p className="text-sm text-gray-500">Batch Rank</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`w-12 h-12 ${stats.improvement >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-2`}>
              {stats.improvement >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
            <p className={`text-2xl font-bold ${stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
            </p>
            <p className="text-sm text-gray-500">Improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {performanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value}%`, 'Score']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No test data" description="No tests taken yet" />
            )}
          </CardContent>
        </Card>

        {/* Subject-wise Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {subjectData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" fontSize={12} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No subject data" description="No subject-wise scores available" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {testResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {testResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{result.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{result.date}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{result.subject || 'General'}</td>
                      <td className="px-4 py-3 text-sm">
                        {result.marksObtained}/{result.totalMarks}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${result.percentage >= 80 ? 'text-green-600' : result.percentage >= 60 ? 'text-blue-600' : result.percentage >= 35 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={result.status === 'passed' ? 'success' : result.status === 'failed' ? 'danger' : 'default'}>
                          {result.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState title="No test results" description="No tests have been taken yet" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentPerformance
