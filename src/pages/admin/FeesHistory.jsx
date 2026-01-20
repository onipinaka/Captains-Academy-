import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, EmptyState, PageLoader, Badge, Modal } from '../../components/ui'
import { getFeePayments, getStudents, deleteFeePayment } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

export default function FeesHistory() {
  const navigate = useNavigate()
  const { studentId } = useParams()
  const { currentOrganization } = useOrganization()
  const [payments, setPayments] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStudent, setFilterStudent] = useState(studentId || '')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData()
    }
  }, [filterStudent, currentOrganization])


  const loadData = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const [paymentsData, studentsData] = await Promise.all([
        getFeePayments(currentOrganization.id, filterStudent || null),
        getStudents(currentOrganization.id)
      ])
      setPayments(paymentsData || [])
      setStudents(studentsData || [])
    } catch (err) {
      console.error('Error loading fee history', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fees History</h1>
          <p className="text-gray-500 mt-1">View previous fee payments. Filter by student to see individual history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/fees')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Payment Records</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={filterStudent}
              onChange={(e) => setFilterStudent(e.target.value)}
              className="rounded-md border px-3 py-1 text-sm bg-white"
            >
              <option value="">All Students</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No payments found" description="No fee payments match the filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Months</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{p.payment_date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.students?.full_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.students?.batches?.name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{p.months_covered?.join(', ')}</td>
                      <td className="px-4 py-3"><Badge variant="info" size="sm">{p.payment_mode}</Badge></td>
                      <td className="px-4 py-3 text-sm text-blue-600">{p.receipt_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedPayment(p); setIsDeleteOpen(true) }}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Payment" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">Are you sure you want to delete this payment record? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={deleting} onClick={async () => {
              if (!selectedPayment) return
              try {
                setDeleting(true)
                const res = await deleteFeePayment(selectedPayment.id)
                if (res && res.error) throw res.error
                // remove locally
                setPayments(prev => prev.filter(x => x.id !== selectedPayment.id))
                setIsDeleteOpen(false)
                setSelectedPayment(null)
              } catch (err) {
                console.error('Failed to delete payment', err)
                setIsDeleteOpen(false)
              } finally {
                setDeleting(false)
              }
            }}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
