import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Calendar, IndianRupee, TrendingUp, Download, Receipt, ChevronDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Badge, Input, EmptyState, PageLoader } from '../../components/ui'
import { getExpenses } from '../../lib/supabase'
import { useOrganization } from '../../context/OrganizationContext'

const categories = ['All', 'Salaries', 'Rent', 'Utilities', 'Supplies', 'Maintenance', 'Marketing', 'Other']

const categoryColors = {
  'Salaries': 'bg-blue-100 text-blue-700',
  'Rent': 'bg-purple-100 text-purple-700',
  'Utilities': 'bg-green-100 text-green-700',
  'Supplies': 'bg-yellow-100 text-yellow-700',
  'Maintenance': 'bg-orange-100 text-orange-700',
  'Marketing': 'bg-pink-100 text-pink-700',
  'Other': 'bg-gray-100 text-gray-700',
}

function Expenses() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedMonth, setSelectedMonth] = useState('January')


  useEffect(() => {
    if (currentOrganization?.id) {
      loadExpenses()
    }
  }, [currentOrganization])

  const loadExpenses = async () => {
    if (!currentOrganization?.id) return
    try {
      setLoading(true)
      const data = await getExpenses(currentOrganization.id)
      setExpenses(data || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !currentOrganization) return <PageLoader />

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalThisMonth = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const avgMonthly = expenses.length > 0 ? Math.round(totalThisMonth / Math.max(1, new Set(expenses.map(e => e.date?.substring(0, 7))).size)) : 0

  // Category breakdown
  const categoryBreakdown = categories.slice(1).map(cat => ({
    name: cat,
    amount: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0)
  })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

  // Get biggest category
  const biggestCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].name : 'None'

  // Monthly trend data
  const monthlyData = Object.entries(
    expenses.reduce((acc, e) => {
      const month = e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'long' }) : 'Unknown'
      acc[month] = (acc[month] || 0) + (e.amount || 0)
      return acc
    }, {})
  ).map(([month, total]) => ({ month, total })).slice(-6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-gray-500 mt-1">Track and manage all expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={() => navigate('/expenses/add')}>
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <IndianRupee className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalThisMonth.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Monthly Avg</p>
                <p className="text-2xl font-bold text-gray-800">₹{avgMonthly.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold text-gray-800">{expenses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Biggest Category</p>
                <p className="text-2xl font-bold text-gray-800">{biggestCategory}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search expenses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    options={categories.map(c => ({ value: c, label: c }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Table */}
          <Card>
            <CardContent className="p-0">
              {filteredExpenses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Description</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredExpenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {new Date(expense.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-800">{expense.description}</p>
                              <p className="text-xs text-gray-500">{expense.paymentMode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[expense.category]}`}>
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-gray-800">
                              ₹{expense.amount.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No expenses found"
                  description="Try adjusting your search or filters"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {categoryBreakdown.map(category => {
                  const percentage = Math.round((category.amount / totalThisMonth) * 100)
                  return (
                    <div key={category.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{category.name}</span>
                        <span className="text-sm font-bold text-gray-800">₹{category.amount.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${categoryColors[category.name]?.replace('text-', 'bg-').replace('-700', '-500') || 'bg-gray-400'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {monthlyData.slice(-4).reverse().map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{month.month}</span>
                    <span className={`font-medium ${index === 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                      ₹{month.total.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Expenses
