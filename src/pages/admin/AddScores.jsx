import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle, XCircle, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, PageLoader } from '../../components/ui'
import { getTest, getStudents, upsertTestScores, getTestScores } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function AddScores() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [test, setTest] = useState(null)
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState({})
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [id, currentOrganization])


  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [testData, studentsData, existingScores] = await Promise.all([
        getTest(currentOrganization.id, id),
        getStudents(currentOrganization.id),
        getTestScores(id)
      ])
      
      if (testData) {
        setTest(testData)
        // Filter students by test's batch
        const batchStudents = (studentsData || []).filter(s => s.batch_id === testData.batch_id)
        setStudents(batchStudents)
        
        // Initialize scores and statuses with existing data if available
        const initialScores = {}
        const initialStatuses = {}
        const existingScoresData = existingScores?.data || []
        
        batchStudents.forEach(s => {
          const existingScore = existingScoresData.find(es => es.student_id === s.id)
          if (existingScore) {
            initialScores[s.id] = existingScore.marks_obtained?.toString() || ''
            initialStatuses[s.id] = existingScore.status || 'present'
          } else {
            initialScores[s.id] = ''
            initialStatuses[s.id] = 'present'
          }
        })
        setScores(initialScores)
        setStatuses(initialStatuses)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (studentId, value) => {
    // Validate score doesn't exceed total marks
    const numValue = parseInt(value) || 0
    if (numValue > test.total_marks) {
      value = test.total_marks.toString()
    }
    if (numValue < 0) {
      value = '0'
    }
    setScores(prev => ({ ...prev, [studentId]: value }))
  }

  const toggleStatus = (studentId) => {
    setStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }))
    // Clear score if marking absent
    if (statuses[studentId] === 'present') {
      setScores(prev => ({ ...prev, [studentId]: '' }))
    }
  }

  const setFullMarks = (studentId) => {
    setScores(prev => ({ ...prev, [studentId]: test.total_marks.toString() }))
  }

  const markAllPresent = () => {
    const newStatuses = {}
    students.forEach(s => {
      newStatuses[s.id] = 'present'
    })
    setStatuses(newStatuses)
  }

  const handleSubmit = async () => {
    if (!test) return
    setSaving(true)

    try {
      // Prepare scores data (total_marks is stored in the tests table, not test_scores)
      const scoresData = students.map(student => ({
        test_id: test.id,
        student_id: student.id,
        marks_obtained: statuses[student.id] === 'present' ? (parseFloat(scores[student.id]) || 0) : null,
        status: statuses[student.id]
      }))

      const { error } = await upsertTestScores(scoresData, currentOrganization.id)
      if (error) throw error

      alert('Scores saved successfully!')
      navigate('/tests')
    } catch (error) {
      console.error('Error saving scores:', error)
      alert('Error saving scores')
    }

    setSaving(false)
  }

  const enteredCount = students.filter(s => statuses[s.id] === 'present' && scores[s.id] !== '').length
  const absentCount = students.filter(s => statuses[s.id] === 'absent').length

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Scores</h1>
          <p className="text-gray-500 mt-1">Enter student scores for this test</p>
        </div>
      </div>

      {/* Test Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Test Name</p>
              <p className="font-semibold">{test.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold">{test.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batch</p>
              <p className="font-semibold">{test.batches?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Marks</p>
              <p className="font-semibold text-blue-600">{test.total_marks}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm">
                  <span className="font-semibold">{enteredCount}</span> / {students.length} entered
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm">
                  <span className="font-semibold">{absentCount}</span> absent
                </span>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={markAllPresent}>
              Mark All Present
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Score Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Student Scores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {students.map((student) => (
              <div
                key={student.id}
                className={`flex items-center justify-between px-4 py-3 ${statuses[student.id] === 'absent' ? 'bg-gray-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`font-medium ${statuses[student.id] === 'absent' ? 'text-gray-400' : 'text-gray-800'}`}>
                    {student.full_name}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Score Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={test.total_marks}
                      value={scores[student.id] || ''}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      disabled={statuses[student.id] === 'absent'}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                        disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="0"
                    />
                    <span className="text-gray-500">/ {test.total_marks}</span>
                  </div>

                  {/* Quick Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFullMarks(student.id)}
                    disabled={statuses[student.id] === 'absent'}
                  >
                    Full
                  </Button>

                  {/* Present/Absent Toggle */}
                  <button
                    onClick={() => toggleStatus(student.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${statuses[student.id] === 'present'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  >
                    {statuses[student.id] === 'present' ? 'Present' : 'Absent'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-xl shadow-lg border border-gray-200">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          <Save className="w-4 h-4" />
          Save All Scores
        </Button>
      </div>
    </div>
  )
}

export default AddScores
