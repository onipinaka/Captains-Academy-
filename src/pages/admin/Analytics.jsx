import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, BookOpen, Award, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Select, Badge, PageLoader, EmptyState } from '../../components/ui'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getStudents, getBatches, getTests, getAttendance } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function Analytics() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    avgScore: 0,
    testsCount: 0,
    avgAttendance: 0,
    topPerformersCount: 0
  })
  const [performanceTrend, setPerformanceTrend] = useState([])
  const [batchWiseData, setBatchWiseData] = useState([])
  const [subjectWiseData, setSubjectWiseData] = useState([])
  const [attendanceDistribution, setAttendanceDistribution] = useState([])
  const [topPerformers, setTopPerformers] = useState([])
  const [needsAttention, setNeedsAttention] = useState([])

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [currentOrganization])


  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [students, batches, tests, attendance] = await Promise.all([
        getStudents(currentOrganization.id),
        getBatches(currentOrganization.id),
        getTests(currentOrganization.id),
        getAttendance(currentOrganization.id)
      ])

      // Calculate stats - use test.total_marks instead of score.total_marks
      const allScores = (tests || []).flatMap(t => 
        (t.scores || []).map(s => (s.marks_obtained / t.total_marks) * 100)
      )
      const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0
      
      // Calculate attendance
      const presentCount = (attendance || []).filter(a => a.status === 'present').length
      const totalAttendance = (attendance || []).length
      const avgAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0

      // Calculate top performers (students with avg > 85%)
      const studentScores = {}
      ;(tests || []).forEach(test => {
        (test.scores || []).forEach(score => {
          if (!studentScores[score.student_id]) {
            studentScores[score.student_id] = []
          }
          studentScores[score.student_id].push((score.marks_obtained / test.total_marks) * 100)
        })
      })
      
      const studentAvgs = Object.entries(studentScores).map(([id, scores]) => ({
        id,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }))
      
      const topPerformersCount = studentAvgs.filter(s => s.avg >= 85).length

      setStats({
        avgScore,
        testsCount: (tests || []).length,
        avgAttendance,
        topPerformersCount
      })

      // Batch-wise performance
      const batchData = (batches || []).map(batch => {
        const batchStudentIds = (students || []).filter(s => s.batch_id === batch.id).map(s => s.id)
        const batchScores = studentAvgs.filter(s => batchStudentIds.includes(s.id))
        const avgBatchScore = batchScores.length > 0 
          ? Math.round(batchScores.reduce((a, b) => a + b.avg, 0) / batchScores.length)
          : 0
        return {
          id: batch.id,
          name: batch.name?.substring(0, 15) || 'Unknown',
          average: avgBatchScore,
          students: batchStudentIds.length
        }
      }).filter(b => b.students > 0)
      setBatchWiseData(batchData)

      // Top performers list
      const topList = studentAvgs
        .filter(s => s.avg >= 80)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5)
        .map(s => {
          const student = (students || []).find(st => st.id === s.id)
          return {
            id: s.id,
            name: student?.full_name || 'Unknown',
            batch: student?.batches?.name || 'No Batch',
            avg: s.avg,
            trend: 'up'
          }
        })
      setTopPerformers(topList)

      // Needs attention (below 60%)
      const attentionList = studentAvgs
        .filter(s => s.avg < 60)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 5)
        .map(s => {
          const student = (students || []).find(st => st.id === s.id)
          return {
            id: s.id,
            name: student?.full_name || 'Unknown',
            batch: student?.batches?.name || 'No Batch',
            avg: s.avg,
            issue: 'Low scores'
          }
        })
      setNeedsAttention(attentionList)

      // Attendance distribution
      const studentAttendance = {}
      ;(attendance || []).forEach(a => {
        if (!studentAttendance[a.student_id]) {
          studentAttendance[a.student_id] = { present: 0, total: 0 }
        }
        studentAttendance[a.student_id].total++
        if (a.status === 'present') {
          studentAttendance[a.student_id].present++
        }
      })
      
      const attendancePercentages = Object.values(studentAttendance).map(a => (a.present / a.total) * 100)
      const distribution = [
        { name: '≥90%', value: attendancePercentages.filter(p => p >= 90).length, color: '#10b981' },
        { name: '75-89%', value: attendancePercentages.filter(p => p >= 75 && p < 90).length, color: '#3b82f6' },
        { name: '60-74%', value: attendancePercentages.filter(p => p >= 60 && p < 75).length, color: '#f59e0b' },
        { name: '<60%', value: attendancePercentages.filter(p => p < 60).length, color: '#ef4444' },
      ].filter(d => d.value > 0)
      setAttendanceDistribution(distribution.length > 0 ? distribution : [{ name: 'No Data', value: 1, color: '#9ca3af' }])

      // Subject-wise (if subjects available in tests)
      const subjectColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
      const subjectData = {}
      ;(tests || []).forEach(test => {
        const subject = test.subject || 'General'
        if (!subjectData[subject]) {
          subjectData[subject] = []
        }
        (test.scores || []).forEach(s => {
          subjectData[subject].push((s.marks_obtained / test.total_marks) * 100)
        })
      })
      
      const subjectWise = Object.entries(subjectData).map(([subject, scores], idx) => ({
        subject,
        average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        color: subjectColors[idx % subjectColors.length]
      })).filter(s => s.average > 0)
      setSubjectWiseData(subjectWise)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics Overview</h1>
          <p className="text-gray-500 mt-1">Track performance trends and insights</p>
        </div>
        <div className="w-48">
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={[
              { value: '3months', label: 'Last 3 Months' },
              { value: '6months', label: 'Last 6 Months' },
              { value: '1year', label: 'Last Year' },
            ]}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avgScore}%</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +5.2% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tests Conducted</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.testsCount}</p>
                <p className="text-xs text-gray-500 mt-1">Across all batches</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.avgAttendance}%</p>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <ArrowDownRight className="w-3 h-3" />
                  -2.1% from last month
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Top Performers</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.topPerformersCount}</p>
                <p className="text-xs text-gray-500 mt-1">Above 85% average</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} domain={[60, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Batch-wise Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Batch-wise Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={batchWiseData} 
                  layout="vertical"
                  onClick={(data) => {
                    if (data?.activePayload?.[0]?.payload?.id) {
                      navigate(`/analytics/batch/${data.activePayload[0].payload.id}`)
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Average']}
                  />
                  <Bar dataKey="average" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-wise */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {subjectWiseData.map(subject => (
                <div key={subject.subject}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                    <span className="text-sm font-bold text-gray-800">{subject.average}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${subject.average}%`, backgroundColor: subject.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {attendanceDistribution.map((entry, index) => (
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

      {/* Top Performers & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Performers</CardTitle>
              <Badge variant="success">Top 5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {topPerformers.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/analytics/student/${student.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.batch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-green-600">{student.avg}%</span>
                    {student.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
                    {student.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Needs Attention</CardTitle>
              <Badge variant="danger">Action Required</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {needsAttention.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/analytics/student/${student.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      <p className="text-xs text-gray-500">{student.batch}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{student.avg}%</span>
                    <p className="text-xs text-red-500">{student.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Analytics
