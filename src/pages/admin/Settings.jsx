import { useState, useEffect } from 'react'
import { User, Building, IndianRupee, Tag, Bell, Lock, Save, Trash2, Plus, Edit2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Textarea, Badge, PageLoader } from '../../components/ui'
import { useOrganization } from '../../context/OrganizationContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
]

const sampleFeeStructure = [
  { id: 1, name: 'Class 10 - Monthly', type: 'Monthly', amount: 2000 },
  { id: 2, name: 'Class 12 Science - Monthly', type: 'Monthly', amount: 2500 },
  { id: 3, name: 'Class 11 Commerce - Monthly', type: 'Monthly', amount: 2200 },
  { id: 4, name: 'Crash Course - JEE', type: 'One-time', amount: 15000 },
  { id: 5, name: 'Admission Fee', type: 'One-time', amount: 1000 },
]

const expenseCategories = [
  { id: 1, name: 'Salaries', color: 'blue' },
  { id: 2, name: 'Rent', color: 'purple' },
  { id: 3, name: 'Utilities', color: 'green' },
  { id: 4, name: 'Supplies', color: 'yellow' },
  { id: 5, name: 'Maintenance', color: 'orange' },
  { id: 6, name: 'Marketing', color: 'pink' },
]

function Settings() {
  const { currentOrganization } = useOrganization()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // Profile Form State - use actual user data
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin'
  })

  // Institute Form State - use actual organization data
  const [institute, setInstitute] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: ''
  })

  // Notification Settings
  const [notifications, setNotifications] = useState({
    feeReminders: true,
    attendanceAlerts: true,
    testNotifications: true,
    emailDigest: 'daily',
    whatsappAlerts: false
  })

  // Password Change State
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Load user and organization data
  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || ''
      }))
    }
  }, [user])

  useEffect(() => {
    if (currentOrganization) {
      setInstitute(prev => ({
        ...prev,
        name: currentOrganization.name || ''
      }))
    }
  }, [currentOrganization])

  const handleProfileChange = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleInstituteChange = (field) => (e) => {
    setInstitute(prev => ({ ...prev, [field]: e.target.value }))
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const handlePasswordChange = async () => {
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordState.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (!passwordState.currentPassword) {
      alert('Current password is required to set a new password')
      return
    }

    setPasswordLoading(true)
    try {
      // 1. Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordState.currentPassword
      })

      if (signInError) {
        throw new Error('Incorrect current password')
      }

      // 2. Update to new password
      const { error } = await supabase.auth.updateUser({ 
        password: passwordState.newPassword 
      })

      if (error) throw error

      alert('Password updated successfully!')
      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      alert(error.message || 'Error updating password')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!currentOrganization) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(profile.name)}
                </div>
                <div>
                  <Button variant="secondary" size="sm">Change Photo</Button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG. Max 2MB</p>
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={handleProfileChange('name')}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={handleProfileChange('email')}
                  disabled
                />
                <Input
                  label="Phone Number"
                  value={profile.phone}
                  onChange={handleProfileChange('phone')}
                />
                <Input
                  label="Role"
                  value={profile.role}
                  disabled
                />
              </div>

              {/* Password Section */}
              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Change Password
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Password - Optional for Supabase but good for UI flow */}
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordState.currentPassword}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <div></div>
                  <Input
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordState.newPassword}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwordState.confirmPassword}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Institute Tab */}
      {activeTab === 'institute' && (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Institute Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Building className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <Button variant="secondary" size="sm">Upload Logo</Button>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px</p>
                </div>
              </div>

              <Input
                label="Institute Name"
                value={institute.name}
                onChange={handleInstituteChange('name')}
              />

              <Textarea
                label="Address"
                value={institute.address}
                onChange={handleInstituteChange('address')}
                rows={2}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  value={institute.phone}
                  onChange={handleInstituteChange('phone')}
                />
                <Input
                  label="Email"
                  type="email"
                  value={institute.email}
                  onChange={handleInstituteChange('email')}
                />
              </div>

              <Input
                label="Website"
                value={institute.website}
                onChange={handleInstituteChange('website')}
              />

              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fee Structure Tab */}
      {activeTab === 'fees' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fee Structure</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Add Fee Type
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sampleFeeStructure.map(fee => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{fee.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={fee.type === 'Monthly' ? 'primary' : 'secondary'}>
                        {fee.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      ₹{fee.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expense Categories</CardTitle>
              <Button size="sm">
                <Plus className="w-4 h-4" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenseCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                    <span className="font-medium text-gray-800">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Toggle Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Fee Payment Reminders</p>
                    <p className="text-sm text-gray-500">Send reminders for pending fee payments</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, feeReminders: !prev.feeReminders }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.feeReminders ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.feeReminders ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Attendance Alerts</p>
                    <p className="text-sm text-gray-500">Notify for low attendance students</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, attendanceAlerts: !prev.attendanceAlerts }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.attendanceAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.attendanceAlerts ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">Test Notifications</p>
                    <p className="text-sm text-gray-500">Updates about test schedules and results</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, testNotifications: !prev.testNotifications }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.testNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.testNotifications ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800">WhatsApp Alerts</p>
                    <p className="text-sm text-gray-500">Receive alerts via WhatsApp</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => ({ ...prev, whatsappAlerts: !prev.whatsappAlerts }))}
                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications.whatsappAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.whatsappAlerts ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Email Digest */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Email Digest</p>
                    <p className="text-sm text-gray-500">Receive summary emails</p>
                  </div>
                  <Select
                    value={notifications.emailDigest}
                    onChange={(e) => setNotifications(prev => ({ ...prev, emailDigest: e.target.value }))}
                    options={[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'never', label: 'Never' },
                    ]}
                    className="w-32"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="w-4 h-4" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Settings
