import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea } from '../../components/ui'
import { createBatch } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CreateBatch() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    standard: '',
    subject: '',
    days: [],
    start_time: '',
    end_time: '',
    start_date: new Date().toISOString().split('T')[0],
    monthly_fee: '',
    capacity: '25',
    status: 'Active'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
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
      const { error } = await createBatch(currentOrganization.id, formData)
      if (error) throw error
      
      alert('Batch created successfully!')
      navigate('/batches')
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Error creating batch')
    }

    setLoading(false)
  }

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
          <h1 className="text-2xl font-bold text-gray-800">Create New Batch</h1>
          <p className="text-gray-500 mt-1">Set up a new coaching batch</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Batch Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Batch Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Class 10 - Batch A"
            />

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Standard/Class"
                name="standard"
                value={formData.standard}
                onChange={handleChange}
                placeholder="e.g., 10, 12, etc."
              />
              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="e.g., Mathematics"
              />
            </div>

            {/* Days Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week *
              </label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${formData.days.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Start Time *"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
              <Input
                label="End Time *"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fee & Capacity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Monthly Fee (₹) *"
                name="monthly_fee"
                type="number"
                value={formData.monthly_fee}
                onChange={handleChange}
                required
                placeholder="Enter monthly fee"
              />
              <Input
                label="Max Capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Maximum students"
              />
            </div>

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
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
            Create Batch
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateBatch
