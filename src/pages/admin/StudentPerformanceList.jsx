import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, TrendingUp, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Input, Badge, PageLoader, EmptyState } from '../../components/ui'
import { getStudents, getTests } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function StudentPerformanceList() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [students, setStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
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
      const [studentsData, testsData] = await Promise.all([
        getStudents(currentOrganization.id),
        getTests(currentOrganization.id)
      ])

      // Calculate average scores for each student
      const studentPerformance = (studentsData || []).map(student => {
        const studentScores = (testsData || []).flatMap(test => 
          (test.scores || [])
            .filter(s => s.student_id === student.id)
            .map(s => (s.marks_obtained / test.total_marks) * 100)
        )
        
        const avgScore = studentScores.length > 0 
          ? Math.round(studentScores.reduce((a, b) => a + b, 0) / studentScores.length) 
          : 0

        return {
          ...student,
          avgScore,
          testsAttended: studentScores.length
        }
      })

      setStudents(studentPerformance)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.batches?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Student Performance</h1>
        <p className="text-gray-500 mt-1">Select a student to view detailed performance analytics</p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
        />
      </div>

      {/* Students Grid */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          description={searchQuery ? "Try a different search term" : "No students enrolled yet"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <Card 
              key={student.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/analytics/student/${student.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {student.full_name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{student.full_name}</h3>
                    <p className="text-sm text-gray-500">{student.batches?.name || 'No Batch'}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className={`text-sm font-medium ${
                          student.avgScore >= 80 ? 'text-green-600' : 
                          student.avgScore >= 60 ? 'text-blue-600' : 
                          student.avgScore >= 33 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.avgScore}%
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {student.testsAttended} tests
                      </span>
                    </div>
                  </div>
                  <Badge variant={
                    student.avgScore >= 80 ? 'success' : 
                    student.avgScore >= 60 ? 'default' : 
                    student.avgScore >= 33 ? 'warning' : 'danger'
                  }>
                    {student.avgScore >= 80 ? 'Excellent' : 
                     student.avgScore >= 60 ? 'Good' : 
                     student.avgScore >= 33 ? 'Average' : 'Low'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentPerformanceList
