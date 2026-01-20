import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea, PageLoader } from '../../components/ui'
import { createTest, getBatches } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const testTypes = [
  { value: 'Weekly', label: 'Weekly Test' },
  { value: 'Monthly', label: 'Monthly Test' },
  { value: 'Mock', label: 'Mock Exam' },
  { value: 'Final', label: 'Final Exam' },
  { value: 'Unit', label: 'Unit Test' },
]

function CreateTest() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    batch_id: '',
    subject: '',
    topic: '',
    total_marks: '',
    test_type: 'Weekly',
    duration: '',
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
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!currentOrganization?.id) {
      alert('No organization selected')
      return
    }
    setSaving(true)

    try {
      const { data, error } = await createTest(currentOrganization.id, {
        ...formData,
        total_marks: parseInt(formData.total_marks) || 0,
        duration: parseInt(formData.duration) || null
      })
      if (error) throw error
      
      alert('Test created successfully! Now add student scores.')
      navigate(`/tests/${data?.id || ''}/scores`)
    } catch (error) {
      console.error('Error creating test:', error)
      alert('Error creating test')
    }

    setSaving(false)
  }

  if (loading || !currentOrganization) return <PageLoader />

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
          <h1 className="text-2xl font-bold text-gray-800">Create New Test</h1>
          <p className="text-gray-500 mt-1">Set up a new test or assessment</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Test Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Test Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Unit Test 1, Monthly Exam"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
              <Select
                label="Batch *"
                name="batch_id"
                value={formData.batch_id}
                onChange={handleChange}
                required
                options={batches.map(b => ({ value: b.id, label: b.name }))}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Mathematics"
              />
              <Input
                label="Topic"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="e.g., Algebra, Chapter 5"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Total Marks *"
                name="total_marks"
                type="number"
                value={formData.total_marks}
                onChange={handleChange}
                required
                placeholder="100"
              />
              <Select
                label="Test Type"
                name="test_type"
                value={formData.test_type}
                onChange={handleChange}
                options={testTypes}
              />
            </div>

            <Input
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              placeholder="60"
            />

            <Textarea
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about the test..."
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
            Create & Add Scores
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateTest
