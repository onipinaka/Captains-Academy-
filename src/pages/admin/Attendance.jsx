import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, CheckCircle, XCircle, User, Calendar } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Badge, PageLoader } from '../../components/ui'
import { getStudents, getBatches, upsertAttendance } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function Attendance() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [batches, setBatches] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [students, setStudents] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [currentOrganization])

  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [batchesData, studentsData] = await Promise.all([
        getBatches(currentOrganization.id),
        getStudents(currentOrganization.id)
      ])
      setBatches(batchesData || [])
      setAllStudents(studentsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Filter students by selected batch
    if (selectedBatch) {
      const filteredStudents = allStudents.filter(s => s.batch_id === selectedBatch)
      setStudents(filteredStudents)
      // Initialize all students as present
      const initialAttendance = {}
      filteredStudents.forEach(s => {
        initialAttendance[s.id] = 'present'
      })
      setAttendance(initialAttendance)
    } else {
      setStudents([])
      setAttendance({})
    }
  }, [selectedBatch, allStudents])

  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }))
  }

  const markAllPresent = () => {
    const newAttendance = {}
    students.forEach(s => {
      newAttendance[s.id] = 'present'
    })
    setAttendance(newAttendance)
  }

  const markAllAbsent = () => {
    const newAttendance = {}
    students.forEach(s => {
      newAttendance[s.id] = 'absent'
    })
    setAttendance(newAttendance)
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      const attendanceRecords = students.map(student => ({
        date: selectedDate,
        batch_id: selectedBatch,
        student_id: student.id,
        status: attendance[student.id]
      }))


      const { error } = await upsertAttendance(attendanceRecords, currentOrganization.id)
      if (error) throw error

      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Error saving attendance')
    }

    setSaving(false)
  }

  if (loading || !currentOrganization) return <PageLoader />

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mark Attendance</h1>
          <p className="text-gray-500 mt-1">Record daily attendance for your batches</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/attendance/reports')}>
          View Reports
        </Button>
      </div>

      {/* Date & Batch Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <Select
                label="Select Batch"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                options={batches.map(b => ({ value: b.id, label: b.name }))}
                placeholder="Choose a batch"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Marking */}
      {selectedBatch ? (
        <>
          {/* Stats & Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">
                      Present: <span className="font-semibold text-green-600">{presentCount}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm">
                      Absent: <span className="font-semibold text-red-600">{absentCount}</span>
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Total: {students.length}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={markAllPresent}>
                    Mark All Present
                  </Button>
                  <Button variant="ghost" size="sm" onClick={markAllAbsent}>
                    Mark All Absent
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>
                Students - {batches.find(b => b.id === selectedBatch)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between px-4 py-3 ${attendance[student.id] === 'absent' ? 'bg-red-50/50' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${attendance[student.id] === 'present' ? 'bg-green-100' : 'bg-red-100'}`}>
                        <User className={`w-5 h-5 ${attendance[student.id] === 'present' ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <span className="font-medium text-gray-800">{student.full_name}</span>
                    </div>
                    
                    <button
                      onClick={() => toggleAttendance(student.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                        ${attendance[student.id] === 'present'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                    >
                      {attendance[student.id] === 'present' ? (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Present
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Absent
                        </span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end sticky bottom-4">
            <Button onClick={handleSubmit} loading={saving} className="shadow-lg">
              <Save className="w-4 h-4" />
              Save Attendance
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-800">Select a Batch</p>
            <p className="text-gray-500">Choose a batch to mark attendance</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Attendance
