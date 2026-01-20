import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, Users, Award, Target, BookOpen, User, BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, PageLoader, EmptyState, StatusDot } from '../../components/ui'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getBatch, getStudents, getTests, getAttendance, getFeePayments } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function BatchPerformance() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [testTrends, setTestTrends] = useState([])
  const [subjectPerformance, setSubjectPerformance] = useState([])
  const [studentRankings, setStudentRankings] = useState([])
  const [gradeDistribution, setGradeDistribution] = useState([])
  const [stats, setStats] = useState({
    avgScore: 0,
    totalTests: 0,
    avgAttendance: 0,
    topPerformers: 0,
    needsAttention: 0
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
      const [batchData, studentsData, testsData, attendanceData] = await Promise.all([
        getBatch(currentOrganization.id, id),
        getStudents(currentOrganization.id),
        getTests(currentOrganization.id),
        getAttendance(currentOrganization.id)
      ])

      if (batchData) {
        setBatch(batchData)

        // Filter data for this batch
        const batchStudents = (studentsData || []).filter(s => s.batch_id === id)
        const batchTests = (testsData || []).filter(t => t.batch_id === id)
        const batchAttendance = (attendanceData || []).filter(a => a.batch_id === id)

        setStudents(batchStudents)

        // Calculate test trends over time
        const testTrendData = batchTests
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(test => {
            const scores = test.scores || []
            const avgScore = scores.length > 0
              ? Math.round(scores.reduce((a, s) => a + (s.marks_obtained / test.total_marks) * 100, 0) / scores.length)
              : 0
            return {
              name: test.name?.substring(0, 10) || test.date,
              date: test.date,
              average: avgScore,
              highest: scores.length > 0 ? Math.round(Math.max(...scores.map(s => (s.marks_obtained / test.total_marks) * 100))) : 0,
              lowest: scores.length > 0 ? Math.round(Math.min(...scores.map(s => (s.marks_obtained / test.total_marks) * 100))) : 0
            }
          })
        setTestTrends(testTrendData)

        // Calculate subject-wise performance
        const subjectData = {}
        batchTests.forEach(test => {
          const subject = test.subject || 'General'
          if (!subjectData[subject]) {
            subjectData[subject] = { scores: [], tests: 0 }
          }
          subjectData[subject].tests++
          ;(test.scores || []).forEach(s => {
            subjectData[subject].scores.push((s.marks_obtained / test.total_marks) * 100)
          })
        })
        
        const subjectPerf = Object.entries(subjectData).map(([subject, data]) => ({
          subject,
          average: data.scores.length > 0 
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) 
            : 0,
          tests: data.tests
        })).sort((a, b) => b.average - a.average)
        setSubjectPerformance(subjectPerf)

        // Calculate student rankings
        const studentScoreData = {}
        batchTests.forEach(test => {
          (test.scores || []).forEach(score => {
            if (!studentScoreData[score.student_id]) {
              studentScoreData[score.student_id] = []
            }
            studentScoreData[score.student_id].push((score.marks_obtained / test.total_marks) * 100)
          })
        })

        const rankings = Object.entries(studentScoreData)
          .map(([studentId, scores]) => {
            const student = batchStudents.find(s => s.id === studentId)
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            
            // Calculate attendance for this student
            const studentAtt = batchAttendance.filter(a => a.student_id === studentId)
            const present = studentAtt.filter(a => a.status === 'present').length
            const attendance = studentAtt.length > 0 ? Math.round((present / studentAtt.length) * 100) : 0

            return {
              id: studentId,
              name: student?.full_name || 'Unknown',
              average: avg,
              testsAttended: scores.length,
              attendance,
              trend: 'stable'
            }
          })
          .sort((a, b) => b.average - a.average)
          .map((s, idx) => ({ ...s, rank: idx + 1 }))
        
        setStudentRankings(rankings)

        // Grade distribution
        const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 }
        rankings.forEach(s => {
          if (s.average >= 80) grades.A++
          else if (s.average >= 70) grades.B++
          else if (s.average >= 60) grades.C++
          else if (s.average >= 33) grades.D++
          else grades.F++
        })
        
        const gradeColors = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }
        const gradeDist = Object.entries(grades)
          .filter(([, count]) => count > 0)
          .map(([grade, count]) => ({
            name: `Grade ${grade}`,
            value: count,
            color: gradeColors[grade]
          }))
        setGradeDistribution(gradeDist.length > 0 ? gradeDist : [{ name: 'No Data', value: 1, color: '#9ca3af' }])

        // Calculate stats
        const allAvgs = rankings.map(r => r.average)
        const overallAvg = allAvgs.length > 0 
          ? Math.round(allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length) 
          : 0

        const presentCount = batchAttendance.filter(a => a.status === 'present').length
        const avgAttendance = batchAttendance.length > 0 
          ? Math.round((presentCount / batchAttendance.length) * 100) 
          : 0

        setStats({
          avgScore: overallAvg,
          totalTests: batchTests.length,
          avgAttendance,
          topPerformers: rankings.filter(r => r.average >= 80).length,
          needsAttention: rankings.filter(r => r.average < 50).length
        })
      }
    } catch (error) {
      console.error('Error loading batch performance:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  if (!batch) {
    return (
      <div className="p-8">
        <EmptyState
          title="Batch not found"
          description="The batch you're looking for doesn't exist."
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
          <h1 className="text-2xl font-bold text-gray-800">{batch.name} - Performance Analytics</h1>
          <p className="text-gray-500 mt-1">{batch.subject} • {students.length} Students</p>
        </div>
        <Link to={`/batches/${id}`}>
          <Button variant="secondary">
            <Users className="w-4 h-4" />
            View Batch
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
            <p className="text-sm text-gray-500">Batch Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.totalTests}</p>
            <p className="text-sm text-gray-500">Tests Conducted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.avgAttendance}%</p>
            <p className="text-sm text-gray-500">Avg Attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.topPerformers}</p>
            <p className="text-sm text-gray-500">Top Performers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
            <p className="text-sm text-gray-500">Need Attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Test Performance Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {testTrends.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={testTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="average" stroke="#3b82f6" strokeWidth={3} name="Average" />
                    <Line type="monotone" dataKey="highest" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Highest" />
                    <Line type="monotone" dataKey="lowest" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Lowest" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState title="No test data" description="No tests conducted yet" />
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {subjectPerformance.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`${value}%`, 'Average']}
                  />
                  <Bar dataKey="average" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No subject data" description="No subject-wise data available" />
          )}
        </CardContent>
      </Card>

      {/* Student Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Student Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {studentRankings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tests</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentRankings.map((student) => (
                    <tr 
                      key={student.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/analytics/student/${student.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${student.rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                          {student.rank}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${student.average >= 80 ? 'text-green-600' : student.average >= 60 ? 'text-blue-600' : student.average >= 35 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {student.average}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{student.testsAttended}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${student.attendance >= 80 ? 'text-green-600' : student.attendance >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {student.attendance}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={student.average >= 70 ? 'success' : student.average >= 50 ? 'warning' : 'danger'}>
                          {student.average >= 70 ? 'Good' : student.average >= 50 ? 'Average' : 'Needs Help'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState title="No student data" description="No students with scores in this batch" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BatchPerformance
