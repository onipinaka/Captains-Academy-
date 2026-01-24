import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import { supabase } from '../../lib/supabase'
import { 
  GraduationCap, Users, Award, Clock, MapPin, Phone, Mail, 
  ChevronRight, Star, BookOpen, CheckCircle, ArrowRight,
  Facebook, Instagram, Youtube, Twitter, Menu, X
} from 'lucide-react'

// Default fallback content (used if database fetch fails)
const defaultStats = [
  { label: 'Students Enrolled', value: '500+', icon: 'Users' },
  { label: 'Success Rate', value: '95%', icon: 'Award' },
  { label: 'Years Experience', value: '3+', icon: 'Clock' },
  { label: 'Expert Faculty', value: '5+', icon: 'GraduationCap' },
]

const defaultHero = {
  title: 'Excel in Your',
  highlightedWord: 'Academics',
  titleSuffix: 'with Expert Guidance',
  subtitle: 'Join the leading coaching center with 3+ years of excellence. We provide personalized coaching for Class 3-12 and competitive exams like Army, Airforce, Navy, Police, Bank, SSC, and more.',
  bannerImage: '/banner.png'
}

const defaultAbout = {
  title: 'Why Choose Us?',
  subtitle: 'We provide the best learning environment with experienced faculty and proven results'
}

const defaultContact = {
  address: 'Captains Academy Gormi, Porsa Road, Gormi, Bhind',
  phone: '+91 73546 20062',
  email: 'captainsacademybhind@gmail.com'
}

const defaultFeatures = [
  { title: 'Expert Faculty', description: 'Learn from experienced teachers with proven track records' },
  { title: 'Small Batches', description: 'Personalized attention with limited batch sizes' },
  { title: 'Regular Tests', description: 'Weekly tests to track progress and identify weak areas' },
  { title: 'Study Material', description: 'Comprehensive notes and practice materials provided' },
]

const defaultResults = [
  { name: 'Priya Sharma', exam: 'Class 12 Boards', score: '98.6%', year: '2024' },
  { name: 'Rahul Verma', exam: 'JEE Main', score: '99.2 percentile', year: '2024' },
  { name: 'Ananya Patel', exam: 'NEET', score: '685/720', year: '2024' },
  { name: 'Vikram Singh', exam: 'Class 10 Boards', score: '97.8%', year: '2024' },
  { name: 'Sneha Gupta', exam: 'JEE Advanced', score: 'AIR 1250', year: '2024' },
  { name: 'Arjun Kumar', exam: 'Class 12 Commerce', score: '96.4%', year: '2024' },
]

const defaultTestimonials = [
  { name: 'Parent of Priya S.', text: 'The faculty here is exceptional. My daughter improved from 70% to 95% in just 6 months. Highly recommended!' },
  { name: 'Rahul V., IIT Delhi', text: 'The systematic approach and regular tests helped me score 93% in 12th. The teachers are always available for doubts.' },
  { name: 'Parent of Arjun K.', text: 'Small batch sizes mean personal attention for each student. Worth every rupee!' },
]

const defaultTimings = [
  { batch: 'Class 10 Morning', days: 'Mon, Wed, Fri', time: '7:00 AM - 9:00 AM' },
  { batch: 'Class 10 Evening', days: 'Mon, Wed, Fri', time: '5:00 PM - 7:00 PM' },
  { batch: 'Class 12 Science', days: 'Tue, Thu, Sat', time: '4:00 PM - 7:00 PM' },
  { batch: 'Class 11 Commerce', days: 'Mon, Wed, Fri', time: '3:00 PM - 5:00 PM' },
  { batch: 'JEE/NEET Weekend', days: 'Sat, Sun', time: '9:00 AM - 1:00 PM' },
]

const defaultFooter = {
  description: 'Empowering students with quality education since 2014. Join us and achieve academic excellence.',
  weekdayHours: 'Mon - Sat: 7:00 AM - 9:00 PM',
  weekendHours: 'Sunday: 9:00 AM - 1:00 PM'
}

// Icon mapping for dynamic stats and features
const iconMap = {
  Users, Award, Clock, GraduationCap, BookOpen, CheckCircle
}

// Feature icon mapping
const featureIconMap = {
  'Expert Faculty': GraduationCap,
  'Small Batches': Users,
  'Regular Tests': BookOpen,
  'Study Material': CheckCircle
}

const courses = [
  { name: 'Class 10 Board Preparation', duration: '10 months', subjects: ['Math', 'Science', 'English'], fee: '₹2,000/month' },
  { name: 'Class 12 Science (PCM)', duration: '10 months', subjects: ['Physics', 'Chemistry', 'Math'], fee: '₹2,500/month' },
  { name: 'Class 12 Science (PCB)', duration: '10 months', subjects: ['Physics', 'Chemistry', 'Biology'], fee: '₹2,500/month' },
  { name: 'Class 11 Commerce', duration: '10 months', subjects: ['Accounts', 'Economics', 'Math'], fee: '₹2,200/month' },
  { name: 'JEE Main Crash Course', duration: '3 months', subjects: ['Physics', 'Chemistry', 'Math'], fee: '₹15,000' },
  { name: 'NEET Crash Course', duration: '3 months', subjects: ['Physics', 'Chemistry', 'Biology'], fee: '₹15,000' },
]

function Homepage() {
  const formRef = useRef()
  const [contactForm, setContactForm] = useState({
    name: '', phone: '', email: '', course: '', message: ''
  })
  const [sending, setSending] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Dynamic content state with defaults
  const [hero, setHero] = useState(defaultHero)
  const [stats, setStats] = useState(defaultStats)
  const [about, setAbout] = useState(defaultAbout)
  const [contact, setContact] = useState(defaultContact)
  const [features, setFeatures] = useState(defaultFeatures)
  const [results, setResults] = useState(defaultResults)
  const [testimonials, setTestimonials] = useState(defaultTestimonials)
  const [timings, setTimings] = useState(defaultTimings)
  const [footer, setFooter] = useState(defaultFooter)

  // Fetch dynamic content from Supabase
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('homepage_content')
          .select('section, content')

        if (error) {
          console.log('Homepage content table not found, using defaults')
          return
        }

        data?.forEach(item => {
          switch (item.section) {
            case 'hero':
              setHero(prev => ({ ...prev, ...item.content }))
              break
            case 'stats':
              setStats(item.content)
              break
            case 'about':
              setAbout(prev => ({ ...prev, ...item.content }))
              break
            case 'contact':
              setContact(prev => ({ ...prev, ...item.content }))
              break
            case 'features':
              setFeatures(item.content)
              break
            case 'achievers':
              setResults(item.content)
              break
            case 'testimonials':
              setTestimonials(item.content)
              break
            case 'timings':
              setTimings(item.content)
              break
            case 'footer':
              setFooter(prev => ({ ...prev, ...item.content }))
              break
          }
        })
      } catch (err) {
        console.log('Using default homepage content')
      }
    }

    fetchContent()
  }, [])

  // EmailJS Configuration - Replace with your actual credentials from https://www.emailjs.com/
  const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'    // e.g., 'service_abc123'
  const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'  // e.g., 'template_xyz789'
  const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'    // e.g., 'AbCdEfGhIjKlMnOp'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)

    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        EMAILJS_PUBLIC_KEY
      )
      alert('Thank you for your inquiry! We will contact you soon.')
      setContactForm({ name: '', phone: '', email: '', course: '', message: '' })
    } catch (error) {
      console.error('EmailJS error:', error)
      alert('Failed to send message. Please try again or call us directly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">Captains Academy</span>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-gray-600 hover:text-blue-600">About</a>
              <a href="#timings" className="text-gray-600 hover:text-blue-600">Courses</a>
              <a href="#results" className="text-gray-600 hover:text-blue-600">Results</a>
              <a href="#timings" className="text-gray-600 hover:text-blue-600">Timings</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600">Contact</a>
              <Link 
                to="/login" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Admin Login
              </Link>
            </div>
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#about" 
                className="block py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a 
                href="#timings" 
                className="block py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Courses
              </a>
              <a 
                href="#results" 
                className="block py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Results
              </a>
              <a 
                href="#timings" 
                className="block py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Timings
              </a>
              <a 
                href="#contact" 
                className="block py-2 text-gray-600 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <Link 
                to="/login" 
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                {hero.title} <span className="text-blue-600">{hero.highlightedWord}</span> {hero.titleSuffix}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                {hero.subtitle}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a 
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Enroll Now <ArrowRight className="w-5 h-5" />
                </a>
                <a 
                  href="#timings"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  View Courses
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-blue-200 rounded-full opacity-30 blur-3xl"></div>
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-purple-200 rounded-full opacity-30 blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl p-8">
                <img 
                  src={hero.bannerImage} 
                  alt="Students studying"
                  className="w-full h-64 object-cover rounded-xl"
                />
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {stats.map((stat) => {
                    const IconComponent = iconMap[stat.icon] || Users
                    return (
                      <div key={stat.label} className="text-center p-4 bg-gray-50 rounded-xl">
                        <IconComponent className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Features Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">{about.title}</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {about.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const FeatureIcon = featureIconMap[feature.title] || CheckCircle
              return (
                <div key={feature.title || index} className="p-6 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <FeatureIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      {/* <section id="courses" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Courses</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive courses designed for board exams and competitive preparations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {course.duration}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {course.subjects.map(subject => (
                    <span key={subject} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-xl font-bold text-blue-600">{course.fee}</span>
                  <a href="#contact" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    Enquire <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Results Section */}
      <section id="results" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Achievers</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Celebrating the success of our students in various examinations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {result.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{result.name}</p>
                    <p className="text-sm text-gray-500">{result.exam}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">{result.score}</span>
                  <span className="text-sm text-gray-500">{result.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">What Parents & Students Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                <p className="font-semibold text-gray-800">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timings Section */}
      <section id="timings" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Batch Timings</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Choose a batch that fits your schedule
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Batch</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Days</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {timings.map((timing, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{timing.batch}</td>
                      <td className="px-6 py-4 text-gray-600">{timing.days}</td>
                      <td className="px-6 py-4 text-gray-600">{timing.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Get In Touch</h2>
              <p className="text-lg text-gray-600 mb-8">
                Have questions? Fill out the form and we'll get back to you within 24 hours.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Address</p>
                    <p className="text-gray-600">{contact.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Phone</p>
                    <p className="text-gray-600">{contact.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <p className="text-gray-600">{contact.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <a href="#" className="p-3 bg-gray-100 rounded-xl hover:bg-blue-100 transition-colors">
                  <Facebook className="w-5 h-5 text-gray-600" />
                </a>
                <a href="#" className="p-3 bg-gray-100 rounded-xl hover:bg-pink-100 transition-colors">
                  <Instagram className="w-5 h-5 text-gray-600" />
                </a>
                <a href="#" className="p-3 bg-gray-100 rounded-xl hover:bg-red-100 transition-colors">
                  <Youtube className="w-5 h-5 text-gray-600" />
                </a>
                <a href="#" className="p-3 bg-gray-100 rounded-xl hover:bg-blue-100 transition-colors">
                  <Twitter className="w-5 h-5 text-gray-600" />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Enquiry Form</h3>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="from_name"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="reply_to"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interested Course</label>
                  <select
                    name="course"
                    value={contactForm.course}
                    onChange={(e) => setContactForm({ ...contactForm, course: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course, i) => (
                      <option key={i} value={course.name}>{course.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any specific queries..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Submit Enquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Captains Academy</span>
              </div>
              <p className="text-gray-400 max-w-md">
                {footer.description}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#courses" className="hover:text-white transition-colors">Courses</a></li>
                <li><a href="#results" className="hover:text-white transition-colors">Results</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Timings</h4>
              <ul className="space-y-2">
                <li>{footer.weekdayHours}</li>
                <li>{footer.weekendHours}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Captains Academy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Homepage
