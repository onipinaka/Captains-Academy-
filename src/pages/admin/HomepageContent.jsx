import { useState, useEffect, useRef } from 'react'
import { Save, Globe, BarChart3, Info, Phone, Image, AlertCircle, Upload, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, PageLoader } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Owner email - only this user can access this page
const OWNER_EMAIL = 'admingormi@gmail.com'
const STORAGE_BUCKET = 'homepage-images'

const tabs = [
  { id: 'hero', label: 'Hero Section', icon: Globe },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'about', label: 'About Section', icon: Info },
  { id: 'contact', label: 'Contact Info', icon: Phone },
]

function HomepageContent() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('hero')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Content state
  const [hero, setHero] = useState({
    title: 'Excel in Your',
    highlightedWord: 'Academics',
    titleSuffix: 'with Expert Guidance',
    subtitle: '',
    bannerImage: '/banner.png'
  })

  const [stats, setStats] = useState([
    { label: 'Students Enrolled', value: '500+' },
    { label: 'Success Rate', value: '95%' },
    { label: 'Years Experience', value: '3+' },
    { label: 'Expert Faculty', value: '5+' },
  ])

  const [about, setAbout] = useState({
    title: 'Why Choose Us?',
    subtitle: ''
  })

  const [contact, setContact] = useState({
    address: '',
    phone: '',
    email: ''
  })

  // Check if user is the owner
  const isOwner = user?.email === OWNER_EMAIL

  // Fetch content on mount
  useEffect(() => {
    if (!isOwner) {
      setLoading(false)
      return
    }
    fetchContent()
  }, [isOwner])

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_content')
        .select('section, content')

      if (error) throw error

      data?.forEach(item => {
        switch (item.section) {
          case 'hero':
            setHero(item.content)
            break
          case 'stats':
            setStats(item.content)
            break
          case 'about':
            setAbout(item.content)
            break
          case 'contact':
            setContact(item.content)
            break
        }
      })
    } catch (err) {
      console.error('Error fetching content:', err)
      setError('Failed to load content. The table may not exist yet.')
    } finally {
      setLoading(false)
    }
  }

  const saveSection = async (section, content) => {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('homepage_content')
        .upsert({
          section,
          content,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        }, { onConflict: 'section' })

      if (error) throw error
      alert('Content saved successfully!')
    } catch (err) {
      console.error('Error saving content:', err)
      setError(err.message || 'Failed to save. Make sure the database table exists.')
    } finally {
      setSaving(false)
    }
  }

  // Extract filename from Supabase Storage URL
  const getFilenameFromUrl = (url) => {
    if (!url || !url.includes(STORAGE_BUCKET)) return null
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  // Upload image with auto-delete of old one
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // 1. Delete old image if it exists in our storage
      const oldFilename = getFilenameFromUrl(hero.bannerImage)
      if (oldFilename) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([oldFilename])
      }

      // 2. Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `banner_${Date.now()}.${fileExt}`

      // 3. Upload new image
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 4. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)

      // 5. Update hero state with new URL
      setHero(prev => ({ ...prev, bannerImage: publicUrl }))
      
      alert('Image uploaded successfully! Click "Save Hero" to apply changes.')
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image. Make sure the storage bucket exists.')
    } finally {
      setUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Access denied for non-owners
  if (!isOwner) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              Only the site owner can edit homepage content.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Website Content</h1>
        <p className="text-gray-500 mt-1">Edit the content displayed on your homepage</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

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

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Title Start"
                value={hero.title}
                onChange={(e) => setHero(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Excel in Your"
              />
              <Input
                label="Highlighted Word"
                value={hero.highlightedWord}
                onChange={(e) => setHero(prev => ({ ...prev, highlightedWord: e.target.value }))}
                placeholder="Academics"
              />
              <Input
                label="Title End"
                value={hero.titleSuffix}
                onChange={(e) => setHero(prev => ({ ...prev, titleSuffix: e.target.value }))}
                placeholder="with Expert Guidance"
              />
            </div>
            <Textarea
              label="Subtitle / Description"
              value={hero.subtitle}
              onChange={(e) => setHero(prev => ({ ...prev, subtitle: e.target.value }))}
              rows={3}
              placeholder="Join the leading coaching center..."
            />
            
            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Banner Image</label>
              
              {/* Current Image Preview */}
              {hero.bannerImage && (
                <div className="relative w-full max-w-md">
                  <img 
                    src={hero.bannerImage} 
                    alt="Current banner" 
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-1 truncate">{hero.bannerImage}</p>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="banner-upload"
                />
                <label
                  htmlFor="banner-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors
                    ${uploading 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload New Image'}
                </label>
                <span className="text-sm text-gray-500">Max 2MB, JPG/PNG</span>
              </div>

              {/* Or use URL */}
              <div className="pt-2">
                <Input
                  label="Or paste image URL"
                  value={hero.bannerImage}
                  onChange={(e) => setHero(prev => ({ ...prev, bannerImage: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => saveSection('hero', hero)} disabled={saving || uploading}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Hero'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Edit the 4 stats displayed on the homepage hero section.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <Input
                    label={`Stat ${index + 1} Label`}
                    value={stat.label}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[index] = { ...stat, label: e.target.value }
                      setStats(newStats)
                    }}
                  />
                  <Input
                    label={`Stat ${index + 1} Value`}
                    value={stat.value}
                    onChange={(e) => {
                      const newStats = [...stats]
                      newStats[index] = { ...stat, value: e.target.value }
                      setStats(newStats)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveSection('stats', stats)} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Stats'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <Card>
          <CardHeader>
            <CardTitle>About Section</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Input
              label="Section Title"
              value={about.title}
              onChange={(e) => setAbout(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Why Choose Us?"
            />
            <Textarea
              label="Section Description"
              value={about.subtitle}
              onChange={(e) => setAbout(prev => ({ ...prev, subtitle: e.target.value }))}
              rows={3}
              placeholder="We provide the best learning environment..."
            />
            <div className="flex justify-end">
              <Button onClick={() => saveSection('about', about)} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save About'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Textarea
              label="Address"
              value={contact.address}
              onChange={(e) => setContact(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              placeholder="Captains Academy Gormi, Porsa Road..."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                value={contact.phone}
                onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 73546 20062"
              />
              <Input
                label="Email Address"
                value={contact.email}
                onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                placeholder="captainsacademybhind@gmail.com"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveSection('contact', contact)} disabled={saving}>
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Contact'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default HomepageContent
