import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, TrendingUp, BookOpen } from 'lucide-react'
import { Card, CardContent, Input, Badge, PageLoader, EmptyState } from '../../components/ui'
import { getBatches, getStudents, getTests } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function BatchPerformanceList() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [batches, setBatches] = useState([])
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
      const [batchesData, studentsData, testsData] = await Promise.all([
        getBatches(currentOrganization.id),
        getStudents(currentOrganization.id),
        getTests(currentOrganization.id)
      ])

      // Calculate performance for each batch
      const batchPerformance = (batchesData || []).map(batch => {
        const batchStudentIds = (studentsData || [])
          .filter(s => s.batch_id === batch.id)
          .map(s => s.id)
        
        const batchTests = (testsData || []).filter(t => t.batch_id === batch.id)
        
        const batchScores = batchTests.flatMap(test => 
          (test.scores || []).map(s => (s.marks_obtained / test.total_marks) * 100)
        )
        
        const avgScore = batchScores.length > 0 
          ? Math.round(batchScores.reduce((a, b) => a + b, 0) / batchScores.length) 
          : 0

        return {
          ...batch,
          avgScore,
          studentCount: batchStudentIds.length,
          testCount: batchTests.length
        }
      })

      setBatches(batchPerformance)
    } catch (error) {
      console.error('Error loading batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBatches = batches.filter(batch =>
    batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Batch Performance</h1>
        <p className="text-gray-500 mt-1">Select a batch to view detailed performance analytics</p>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search batches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
        />
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          title="No batches found"
          description={searchQuery ? "Try a different search term" : "No batches created yet"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map(batch => (
            <Card 
              key={batch.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/analytics/batch/${batch.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge variant={
                    batch.avgScore >= 80 ? 'success' : 
                    batch.avgScore >= 60 ? 'default' : 
                    batch.avgScore >= 35 ? 'warning' : 'danger'
                  }>
                    {batch.avgScore}% Avg
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-gray-800 text-lg">{batch.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{batch.subject || 'General'}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{batch.studentCount} students</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{batch.testCount} tests</span>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        batch.avgScore >= 80 ? 'bg-green-500' : 
                        batch.avgScore >= 60 ? 'bg-blue-500' : 
                        batch.avgScore >= 35 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${batch.avgScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default BatchPerformanceList
