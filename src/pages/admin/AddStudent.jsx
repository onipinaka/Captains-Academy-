import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea, PageLoader } from '../../components/ui'
import { createStudent, getBatches } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

function AddStudent() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [searchParams] = useSearchParams()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: '',
    contact: '',
    parent_name: '',
    parent_contact: '',
    email: '',
    address: '',
    batch_id: searchParams.get('batch') || '', // Pre-select batch from query param
    joining_date: new Date().toISOString().split('T')[0],
    monthly_fee: '',
    notes: ''
  })

  useEffect(() => {
    if (currentOrganization?.id) {
      loadBatches()
    }
  }, [currentOrganization])


  const loadBatches = async () => {
    if (!currentOrganization?.id) return
    try {
      const data = await getBatches(currentOrganization.id)
      setBatches(data || [])
    } catch (error) {
      console.error('Error loading batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Auto-fill monthly fee when batch is selected
      if (name === 'batch_id' && value) {
        const batch = batches.find(b => b.id === value)
        if (batch) {
          updated.monthly_fee = batch.monthly_fee?.toString() || ''
        }
      }
      
      return updated
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentOrganization?.id) {
      alert('No organization selected')
      return
    }
    setSaving(true)

    try {
      const { error } = await createStudent(currentOrganization.id, formData)
      if (error) throw error
      
      alert('Student added successfully!')
      navigate('/students')
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Error adding student')
    }

    setSaving(false)
  }

  if (loading || !currentOrganization) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Student</h1>
          <p className="text-gray-500 mt-1">Enter student details below</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' }
                ]}
              />
              <Input
                label="Contact Number *"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                required
                placeholder="Enter phone number"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Parent/Guardian Name"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                placeholder="Enter parent name"
              />
              <Input
                label="Parent Contact"
                name="parent_contact"
                value={formData.parent_contact}
                onChange={handleChange}
                placeholder="Enter parent phone"
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
            />

            <Textarea
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter complete address"
              rows={2}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Batch & Fee Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Select Batch *"
                name="batch_id"
                value={formData.batch_id}
                onChange={handleChange}
                required
                options={batches.map(b => ({ value: b.id, label: b.name }))}
              />
              <Input
                label="Joining Date"
                name="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={handleChange}
              />
            </div>

            <Input
              label="Monthly Fee (₹)"
              name="monthly_fee"
              type="number"
              value={formData.monthly_fee}
              onChange={handleChange}
              placeholder="Auto-filled from batch"
              helperText="Will be auto-filled when batch is selected"
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="w-4 h-4" />
            Save Student
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AddStudent
