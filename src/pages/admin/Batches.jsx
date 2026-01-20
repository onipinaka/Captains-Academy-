import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, Clock, Calendar, GraduationCap } from 'lucide-react'
import { Card, CardContent, Button, Badge, StatusDot, EmptyState, PageLoader } from '../../components/ui'
import { getBatches } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function BatchCard({ batch }) {
  const isActive = batch.status === 'Active'
  const capacityPercent = (batch.student_count / batch.capacity) * 100
  
  return (
    <Link to={`/batches/${batch.id}`}>
      <Card hover className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <GraduationCap className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{batch.name}</h3>
                <p className="text-sm text-gray-500">{batch.subject}</p>
              </div>
            </div>
            <Badge variant={isActive ? 'success' : 'default'} size="sm">
              {batch.status}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Timing */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{batch.days?.join(', ')}</span>
              <span className="text-gray-400">•</span>
              <span>{batch.start_time} - {batch.end_time}</span>
            </div>

            {/* Students */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{batch.student_count} / {batch.capacity} students</span>
              </div>
              <span className="text-sm font-medium text-gray-800">₹{batch.monthly_fee?.toLocaleString()}/mo</span>
            </div>

            {/* Capacity Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${capacityPercent > 90 ? 'bg-red-500' : capacityPercent > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(capacityPercent, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function Batches() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (currentOrganization?.id) {
      loadBatches()
    }
  }, [currentOrganization])


  const loadBatches = async () => {
    if (!currentOrganization?.id) return
    
    try {
      setLoading(true)
      const data = await getBatches(currentOrganization.id)
      // Add student_count for each batch (will be 0 initially since no students yet)
      const batchesWithCount = (data || []).map(batch => ({
        ...batch,
        student_count: batch.student_count || 0
      }))
      setBatches(batchesWithCount)
    } catch (error) {
      console.error('Error loading batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBatches = batches.filter(batch => {
    if (filter === 'all') return true
    return batch.status === filter
  })

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Batches</h1>
          <p className="text-gray-500 mt-1">Manage all your coaching batches</p>
        </div>
        <Button onClick={() => navigate('/batches/create')}>
          <Plus className="w-4 h-4" />
          Create Batch
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'Active', 'Inactive'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${filter === status 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {status === 'all' ? 'All Batches' : status}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Batches</p>
            <p className="text-2xl font-bold text-gray-800">{batches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Active Batches</p>
            <p className="text-2xl font-bold text-green-600">
              {batches.filter(b => b.status === 'Active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-blue-600">
              {batches.reduce((sum, b) => sum + (b.student_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Capacity</p>
            <p className="text-2xl font-bold text-gray-800">
              {batches.reduce((sum, b) => sum + (b.capacity || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No batches found"
          description="Create your first batch to get started"
          action={() => navigate('/batches/create')}
          actionLabel="Create Batch"
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBatches.map(batch => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Batches
