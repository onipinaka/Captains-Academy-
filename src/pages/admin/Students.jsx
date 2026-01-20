import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Users, Filter, Grid, List, Eye, Edit, Trash2, User, Phone, GraduationCap } from 'lucide-react'
import { Card, CardContent, Button, Badge, StatusDot, Input, Select, EmptyState, PageLoader } from '../../components/ui'
import { getStudents, getBatches, deleteStudent } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function getFeeStatus(dueAmount, lastPaidMonth) {
  if (dueAmount > 2000) return 'overdue'
  if (dueAmount > 0) return 'current'
  return 'paid'
}

function StudentCard({ student }) {
  const feeStatus = getFeeStatus(student.due_amount, student.last_paid_month)
  
  return (
    <Link to={`/students/${student.id}`}>
      <Card hover className="h-full">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-gray-800 truncate">{student.full_name}</h3>
                <StatusDot status={feeStatus} />
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="truncate">{student.batches?.name || 'No Batch'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{student.contact}</span>
                </div>
                <Badge 
                  variant={student.attendance_percent >= 90 ? 'success' : student.attendance_percent >= 75 ? 'warning' : 'danger'}
                  size="sm"
                >
                  {student.attendance_percent}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StudentRow({ student }) {
  const feeStatus = getFeeStatus(student.due_amount, student.last_paid_month)
  
  return (
    <Link to={`/students/${student.id}`} className="block">
      <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{student.full_name}</span>
            <StatusDot status={feeStatus} />
          </div>
          <span className="text-sm text-gray-500">{student.batches?.name || 'No Batch'}</span>
        </div>
        <div className="hidden sm:block text-sm text-gray-500">
          {student.contact}
        </div>
        <Badge 
          variant={student.attendance_percent >= 90 ? 'success' : student.attendance_percent >= 75 ? 'warning' : 'danger'}
          size="sm"
        >
          {student.attendance_percent}%
        </Badge>
      </div>
    </Link>
  )
}

function Students() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [students, setStudents] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [currentOrganization])


  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [studentsData, batchesData] = await Promise.all([
        getStudents(currentOrganization.id),
        getBatches(currentOrganization.id)
      ])
      // Add default attendance_percent for display
      const studentsWithDefaults = (studentsData || []).map(s => ({
        ...s,
        attendance_percent: s.attendance_percent || 0
      }))
      setStudents(studentsWithDefaults)
      setBatches(batchesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          student.contact?.includes(searchQuery)
    const matchesBatch = !selectedBatch || student.batch_id === selectedBatch
    return matchesSearch && matchesBatch
  })

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-500 mt-1">Manage all students in your coaching center</p>
        </div>
        <Button onClick={() => navigate('/students/add')}>
          <Plus className="w-4 h-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Batch Filter */}
            <div className="w-full sm:w-48">
              <Select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                options={batches.map(b => ({ value: b.id, label: b.name }))}
                placeholder="All Batches"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 border-l border-gray-300 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-500">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </CardContent>
      </Card>

      {/* Students List/Grid */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          title="No students found"
          description={searchQuery || selectedBatch ? "Try adjusting your filters" : "Add your first student to get started"}
          action={() => navigate('/students/add')}
          actionLabel="Add Student"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map(student => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredStudents.map(student => (
              <StudentRow key={student.id} student={student} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Students
