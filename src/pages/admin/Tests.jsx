import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, Calendar, GraduationCap, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, Button, Badge, Select, EmptyState, PageLoader } from '../../components/ui'
import { getTests, getBatches } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function Tests() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [tests, setTests] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [currentOrganization])


  const loadData = async () => {
    if (!currentOrganization?.id) return
    
    try {
      setLoading(true)
      const [testsData, batchesData] = await Promise.all([
        getTests(currentOrganization.id),
        getBatches(currentOrganization.id)
      ])
      setTests(testsData || [])
      setBatches(batchesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          test.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBatch = !selectedBatch || test.batch_id === selectedBatch
    const matchesStatus = !selectedStatus || 
                          (selectedStatus === 'completed' && test.scores_entered) ||
                          (selectedStatus === 'pending' && !test.scores_entered)
    return matchesSearch && matchesBatch && matchesStatus
  })

  const pendingCount = tests.filter(t => !t.scores_entered).length

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tests & Assessments</h1>
          <p className="text-gray-500 mt-1">Manage tests and record student scores</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button variant="warning" onClick={() => navigate('/tests/scores')}>
              <Clock className="w-4 h-4" />
              {pendingCount} Pending
            </Button>
          )}
          <Button onClick={() => navigate('/tests/create')}>
            <Plus className="w-4 h-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Tests</p>
            <p className="text-2xl font-bold text-gray-800">{tests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Scores Entered</p>
            <p className="text-2xl font-bold text-green-600">
              {tests.filter(t => t.scores_entered).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending Entry</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">This Month</p>
            <p className="text-2xl font-bold text-blue-600">
              {tests.filter(t => t.date?.startsWith('2025-12')).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by test name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              options={batches.map(b => ({ value: b.id, label: b.name }))}
              placeholder="All Batches"
              className="w-full sm:w-48"
            />
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: 'completed', label: 'Scores Entered' },
                { value: 'pending', label: 'Pending Entry' }
              ]}
              placeholder="All Status"
              className="w-full sm:w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tests Table */}
      {filteredTests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tests found"
          description="Create your first test to get started"
          action={() => navigate('/tests/create')}
          actionLabel="Create Test"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{test.name}</p>
                            <p className="text-xs text-gray-500">{test.topic}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{test.date}</td>
                      <td className="px-4 py-3 text-sm">{test.batches?.name}</td>
                      <td className="px-4 py-3 text-sm">{test.subject}</td>
                      <td className="px-4 py-3 text-sm font-medium">{test.total_marks}</td>
                      <td className="px-4 py-3">
                        {test.scores_entered ? (
                          <Badge 
                            variant={test.avg_score >= (test.total_marks / 3) ? 'success' : 'danger'}
                          >
                            {test.avg_score} ({Math.round(test.avg_score / test.total_marks * 100)}%)
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={test.scores_entered ? 'success' : 'warning'}>
                          {test.scores_entered ? 'Completed' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {test.scores_entered ? (
                          <Link to={`/tests/${test.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View
                          </Link>
                        ) : (
                          <Link to={`/tests/${test.id}/scores`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Add Scores
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Tests
