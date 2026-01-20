import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Users, TrendingUp, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, PageLoader, EmptyState } from '../../components/ui'
import { getTest, getStudents, getTestScores } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function TestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [test, setTest] = useState(null)
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState([])
  const [stats, setStats] = useState({
    avgScore: 0,
    passCount: 0,
    failCount: 0,
    absentCount: 0,
    highestScore: 0,
    lowestScore: 0
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
      const [testData, studentsData, scoresData] = await Promise.all([
        getTest(currentOrganization.id, id),
        getStudents(currentOrganization.id),
        getTestScores(id)
      ])

      if (testData) {
        setTest(testData)
        
        // Filter students for this batch
        const batchStudents = (studentsData || []).filter(s => s.batch_id === testData.batch_id)
        setStudents(batchStudents)
        
        const testScores = scoresData?.data || []
        setScores(testScores)

        // Calculate stats
        const relevantScores = testScores.filter(s => s.status === 'present' && s.marks_obtained != null)
        const marks = relevantScores.map(s => s.marks_obtained)
        
        const avgScore = marks.length > 0 
          ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10
          : 0

        const passingMarks = testData.total_marks / 3
        const passCount = relevantScores.filter(s => s.marks_obtained >= passingMarks).length
        const failCount = relevantScores.filter(s => s.marks_obtained < passingMarks).length
        const absentCount = testScores.filter(s => s.status === 'absent').length

        setStats({
          avgScore,
          passCount,
          failCount,
          absentCount,
          highestScore: marks.length > 0 ? Math.max(...marks) : 0,
          lowestScore: marks.length > 0 ? Math.min(...marks) : 0
        })
      }
    } catch (error) {
      console.error('Error loading test details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  if (!test) {
    return (
      <div className="p-8">
        <EmptyState
          title="Test not found"
          description="The test you're looking for doesn't exist."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/tests')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{test.name}</h1>
            <Badge variant="secondary">{test.test_type}</Badge>
            {test.scores_entered && <Badge variant="success">Completed</Badge>}
          </div>
          <p className="text-gray-500 mt-1">
            {test.subject} • {test.date} • Total Marks: {test.total_marks}
          </p>
        </div>
        <Link to={`/tests/${id}/scores`}>
          <Button variant="outline">
            Edit Scores
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.avgScore}</p>
            <p className="text-sm text-gray-500">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.passCount}</p>
            <p className="text-sm text-gray-500">Students Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.failCount}</p>
            <p className="text-sm text-gray-500">Students Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.absentCount}</p>
            <p className="text-sm text-gray-500">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => {
                  const score = scores.find(s => s.student_id === student.id)
                  const marks = score?.marks_obtained || 0
                  const percentage = Math.round((marks / test.total_marks) * 100)
                  const passingMarks = test.total_marks / 3
                  const isPassed = marks >= passingMarks
                  const isAbsent = score?.status === 'absent'

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                            {student.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{student.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{student.roll_no || '-'}</td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {isAbsent ? 'AB' : marks}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {!isAbsent && `${percentage}%`}
                      </td>
                      <td className="px-4 py-3">
                        {isAbsent ? (
                          <Badge variant="warning">Absent</Badge>
                        ) : (
                          <Badge variant={isPassed ? 'success' : 'danger'}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </Badge>
                        )}
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

export default TestDetail
