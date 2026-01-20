import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, IndianRupee } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea } from '../../components/ui'
import { createExpense } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const categories = [
  { value: 'Salaries', label: 'Salaries' },
  { value: 'Rent', label: 'Rent' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Supplies', label: 'Supplies' },
  { value: 'Maintenance', label: 'Maintenance' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Other', label: 'Other' },
]

const paymentModes = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Online', label: 'Online (UPI/Card)' },
  { value: 'Cheque', label: 'Cheque' },
]

function AddExpense() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    payment_mode: '',
    description: '',
    notes: ''
  })

  const handleChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentOrganization?.id) {
      alert('No organization selected')
      return
    }
    setLoading(true)

    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      const { error } = await createExpense(currentOrganization.id, expenseData)
      if (error) throw error

      alert('Expense recorded successfully!')
      navigate('/expenses')
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense')
    }

    setLoading(false)
  }

  const isFormValid = formData.date && formData.category && formData.amount && formData.payment_mode && formData.description

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/expenses')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add Expense</h1>
          <p className="text-gray-500 mt-1">Record a new expense</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Expense Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={handleChange('date')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <Select
                    label="Category"
                    required
                    value={formData.category}
                    onChange={handleChange('category')}
                    options={categories}
                    placeholder="Select category"
                  />
                </div>

                <Input
                  label="Description"
                  required
                  placeholder="What was this expense for?"
                  value={formData.description}
                  onChange={handleChange('description')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange('amount')}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <Select
                    label="Payment Mode"
                    required
                    value={formData.payment_mode}
                    onChange={handleChange('payment_mode')}
                    options={paymentModes}
                    placeholder="Select payment mode"
                  />
                </div>

                <Textarea
                  label="Notes (Optional)"
                  placeholder="Any additional notes..."
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange('notes')}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium text-gray-800">
                      {formData.date ? new Date(formData.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-gray-800">{formData.category || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Mode</span>
                    <span className="font-medium text-gray-800">{formData.payment_mode || '-'}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Amount</span>
                      <span className="text-2xl font-bold text-gray-800">
                        ₹{formData.amount ? parseFloat(formData.amount).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Make sure to keep receipts for all expenses for accounting purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={!isFormValid}
            >
              <Save className="w-4 h-4" />
              Record Expense
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddExpense
