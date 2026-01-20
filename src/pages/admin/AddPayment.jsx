import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save, Receipt } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea, PageLoader } from '../../components/ui'
import { createFeePayment, getStudents, getBatches } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const paymentModes = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Online', label: 'Online Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Card', label: 'Card' },
]

// Generate dynamic months
const generateMonths = () => {
  const months = []
  const now = new Date()
  for (let i = -2; i < 4; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = date.toISOString().slice(0, 7)
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    months.push({ value, label })
  }
  return months
}

const months = generateMonths()

function AddPayment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentOrganization } = useOrganization()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'Cash',
    months_covered: [],
    receipt_number: `REC-${Date.now().toString().slice(-6)}`,
    notes: ''
  })

  useEffect(() => {
    if (currentOrganization?.id) {
      loadStudents()
    }
  }, [currentOrganization])

  const loadStudents = async () => {
    if (!currentOrganization?.id) return
    try {
      const data = await getStudents(currentOrganization.id)
      const processed = (data || []).map(s => ({
        ...s,
        batch: s.batches?.name || 'No Batch',
        monthly_fee: s.batches?.monthly_fee || 0
      }))
      setStudents(processed)
      // If navigated with a student in state, prefill selection
      const prefill = location?.state?.student
      if (prefill) {
        const found = processed.find(s => s.id === prefill.id || s.id === prefill.student_id)
        if (found) {
          setFormData(prev => ({ ...prev, student_id: found.id }))
          setSelectedStudent(found)
        }
      }
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Update selected student when student_id changes
      if (name === 'student_id' && value) {
        const student = students.find(s => s.id === value)
        setSelectedStudent(student)
      }
      
      return updated
    })
  }

  const handleMonthToggle = (month) => {
    setFormData(prev => ({
      ...prev,
      months_covered: prev.months_covered.includes(month)
        ? prev.months_covered.filter(m => m !== month)
        : [...prev.months_covered, month]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!currentOrganization?.id) {
        alert('Organization not loaded')
        return
      }
      const { error } = await createFeePayment(currentOrganization.id, {
        ...formData,
        amount: parseFloat(formData.amount)
      })
      if (error) throw error
      
      alert('Payment recorded successfully!')
      navigate('/fees')
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Error recording payment')
    }

    setSaving(false)
  }

  if (loading || !currentOrganization) return <PageLoader />

  const totalDue = selectedStudent ? selectedStudent.monthly_fee * formData.months_covered.length : 0
  const balance = formData.amount ? totalDue - parseFloat(formData.amount) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Record Fee Payment</h1>
          <p className="text-gray-500 mt-1">Add a new fee payment record</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Select Student *"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              required
              options={students.map(s => ({ 
                value: s.id, 
                label: `${s.full_name} (${s.batch})` 
              }))}
            />

            {selectedStudent && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Monthly Fee:</span> ₹{selectedStudent.monthly_fee.toLocaleString()}
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Amount Paid (₹) *"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="Enter amount"
              />
              <Input
                label="Payment Date"
                name="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={handleChange}
              />
            </div>

            <Select
              label="Payment Mode"
              name="payment_mode"
              value={formData.payment_mode}
              onChange={handleChange}
              options={paymentModes}
            />

            {/* Months Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                For Months *
              </label>
              <div className="flex flex-wrap gap-2">
                {months.map(month => (
                  <button
                    key={month.value}
                    type="button"
                    onClick={() => handleMonthToggle(month.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${formData.months_covered.includes(month.value)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Receipt Number"
              name="receipt_number"
              value={formData.receipt_number}
              onChange={handleChange}
              placeholder="Auto-generated"
            />

            <Textarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes..."
              rows={2}
            />
          </CardContent>
        </Card>

        {/* Summary Card */}
        {selectedStudent && formData.months_covered.length > 0 && (
          <Card className="mt-6 bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Fee</p>
                  <p className="font-semibold">₹{selectedStudent.monthly_fee.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Months Selected</p>
                  <p className="font-semibold">{formData.months_covered.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Due</p>
                  <p className="font-semibold">₹{totalDue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Paying</p>
                  <p className="font-semibold text-green-600">₹{(parseFloat(formData.amount) || 0).toLocaleString()}</p>
                </div>
                <div className="col-span-2 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800'}`}>
                    {balance > 0 ? `₹${balance.toLocaleString()} (Due)` : 
                     balance < 0 ? `₹${Math.abs(balance).toLocaleString()} (Advance)` : 
                     '₹0 (Exact)'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4" />
            Save Payment
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddPayment
