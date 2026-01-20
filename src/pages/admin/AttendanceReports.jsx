import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Users, TrendingUp, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Badge, Input, PageLoader } from '../../components/ui'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday, parseISO } from 'date-fns'
import { getBatches, getStudents, getAttendance } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function AttendanceReports() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState([])
  const [viewMode, setViewMode] = useState('calendar')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [currentOrganization])

  // Ensure a student is selected when switching to student view
  useEffect(() => {
    if (viewMode === 'student' && !selectedStudentId) {
      const batchList = students.filter(s => s.batch_id === selectedBatch)
      if (batchList.length > 0) setSelectedStudentId(batchList[0].id)
    }
  }, [viewMode, students, selectedBatch, selectedStudentId])

  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [batchesData, studentsData, attendanceRaw] = await Promise.all([
        getBatches(currentOrganization.id),
        getStudents(currentOrganization.id),
        getAttendance(currentOrganization.id)
      ])
      setBatches(batchesData || [])
      setStudents(studentsData || [])
      setAttendanceData(attendanceRaw || [])
      
      if (batchesData?.length > 0) {
        setSelectedBatch(batchesData[0].id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  })

  const firstDayOfMonth = getDay(startOfMonth(currentMonth))
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Filter students by selected batch
  const batchStudents = students.filter(s => s.batch_id === selectedBatch)
  
  // Filter attendance by selected batch
  const batchAttendance = attendanceData.filter(a => a.batch_id === selectedBatch)

  // Calculate stats
  const totalClasses = monthDays.filter(d => getDay(d) !== 0 && d <= new Date()).length
  const presentRecords = batchAttendance.filter(a => a.status === 'present').length
  const totalRecords = batchAttendance.length
  const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0

  // Get attendance for a specific date
  const getDateAttendance = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayRecords = batchAttendance.filter(r => r.date === dateStr)
    if (dayRecords.length === 0) return null

    const present = dayRecords.filter(r => r.status === 'present').length
    const total = dayRecords.length
    return { present, total, percentage: Math.round((present / total) * 100) }
  }

  // Calculate student-wise stats
  const studentStats = batchStudents.map(student => {
    const records = batchAttendance.filter(r => r.student_id === student.id)
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const total = records.length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return {
      ...student,
      present,
      absent,
      total,
      percentage
    }
  })

  

  // Records for selected student within the current month
  const studentMonthRecords = selectedStudentId
    ? attendanceData.filter(r => r.student_id === selectedStudentId && isSameMonth(parseISO(r.date), currentMonth))
    : []

  const studentPresentDates = studentMonthRecords.filter(r => r.status === 'present').map(r => r.date).sort()
  const studentAbsentDates = studentMonthRecords.filter(r => r.status === 'absent').map(r => r.date).sort()

  // Records for selected date (batch scope)
  const dateRecords = attendanceData.filter(r => r.date === selectedDate && r.batch_id === selectedBatch)
  const datePresent = dateRecords.filter(r => r.status === 'present').map(r => ({ ...r, student: students.find(s => s.id === r.student_id) }))
  const dateAbsent = dateRecords.filter(r => r.status === 'absent').map(r => ({ ...r, student: students.find(s => s.id === r.student_id) }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/attendance')}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Reports</h1>
            <p className="text-gray-500 mt-1">View and analyze attendance data</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <Select
              label="Batch"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              options={batches.map(b => ({ value: b.id, label: b.name }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Select
              label="View"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              options={[
                { value: 'calendar', label: 'Calendar (Batch)' },
                { value: 'student', label: "Student's Attendance" },
                { value: 'datewise', label: 'Date-wise (Batch)' }
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Classes Held</p>
                <p className="text-xl font-bold text-gray-800">{totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg. Attendance</p>
                <p className="text-xl font-bold text-green-600">{avgAttendance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-xl font-bold text-gray-800">{batchStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extra Controls for Student or Date view */}
      {viewMode === 'student' && (
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <Select
                label="Student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={batchStudents.map(s => ({ value: s.id, label: s.full_name }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Prev</Button>
                  <div className="px-4 py-2 border rounded">{format(currentMonth, 'MMMM yyyy')}</div>
                  <Button variant="secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'datewise' && (
        <Card>
          <CardHeader>
            <CardTitle>Date-wise Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <Input
                label="Date"
                name="report_date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <div className="text-right">
                <p className="text-sm text-gray-500">Batch</p>
                <p className="font-medium">{(batches.find(b => b.id === selectedBatch) || {}).name || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Detail View */}
      {viewMode === 'student' && selectedStudentId && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance for { (students.find(s => s.id === selectedStudentId) || {}).full_name }</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Present</p>
                <p className="text-xl font-bold text-green-600">{studentPresentDates.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Absent</p>
                <p className="text-xl font-bold text-red-600">{studentAbsentDates.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-800">{studentMonthRecords.length}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2">Present Dates</p>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {studentPresentDates.length === 0 && <li className="text-gray-400">No records</li>}
                  {studentPresentDates.map(d => (
                    <li key={d}>{format(parseISO(d), 'dd MMM yyyy')}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Absent Dates</p>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {studentAbsentDates.length === 0 && <li className="text-gray-400">No records</li>}
                  {studentAbsentDates.map(d => (
                    <li key={d}>{format(parseISO(d), 'dd MMM yyyy')}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date-wise Result View */}
      {viewMode === 'datewise' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance on {format(parseISO(selectedDate), 'dd MMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Student</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batchStudents.map(s => {
                    const rec = dateRecords.find(r => r.student_id === s.id)
                    const status = rec ? rec.status : 'absent'
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800">{s.full_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={status === 'present' ? 'success' : 'danger'}>
                            {status === 'present' ? 'Present' : 'Absent'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-gray-800 min-w-[150px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {monthDays.map(day => {
              const attendance = getDateAttendance(day)
              const isSunday = getDay(day) === 0
              const isPast = day <= new Date()
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square p-1 rounded-lg border ${isCurrentDay ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100'} ${isSunday ? 'bg-gray-50' : ''}`}
                >
                  <div className="h-full flex flex-col">
                    <span className={`text-xs font-medium ${isCurrentDay ? 'text-blue-600' : 'text-gray-600'}`}>
                      {format(day, 'd')}
                    </span>
                    {!isSunday && isPast && attendance && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className={`text-xs font-bold ${attendance.percentage >= 80 ? 'text-green-600' : attendance.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {attendance.percentage}%
                        </span>
                      </div>
                    )}
                    {isSunday && (
                      <span className="text-xs text-gray-400 text-center mt-auto">Off</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-sm text-gray-600">≥80%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-sm text-gray-600">60-79%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-sm text-gray-600">&lt;60%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Student-wise Stats */}
      {viewMode === 'calendar' && (
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Student</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Present</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Absent</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Total</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">Percentage</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentStats.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{student.full_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">
                      {student.present}
                    </td>
                    <td className="px-4 py-3 text-center text-red-600 font-medium">
                      {student.absent}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {student.total}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${student.percentage >= 80 ? 'text-green-600' : student.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {student.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={student.percentage >= 80 ? 'success' : student.percentage >= 60 ? 'warning' : 'danger'}>
                        {student.percentage >= 80 ? 'Good' : student.percentage >= 60 ? 'Average' : 'Low'}
                      </Badge>
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

export default AttendanceReports
