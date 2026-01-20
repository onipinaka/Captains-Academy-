import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// =====================================================
// ORGANIZATION HELPERS
// =====================================================

export const getUserOrganizations = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data, error } = await supabase
    .from('user_organizations')
    .select('organization_id, organizations(*)')
    .eq('user_id', user.id)
  
  if (error) throw error
  return (data || []).map(d => d.organizations).filter(Boolean)
}

// =====================================================
// STUDENTS
// =====================================================

export const getStudents = async (organizationId, batchId = null) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  let query = supabase
    .from('students')
    .select('*, batches(name, monthly_fee)')
    .eq('organization_id', organizationId)
  
  if (batchId) query = query.eq('batch_id', batchId)
  
  const { data, error } = await query.order('full_name')
  if (error) throw error
  return data
}

export const getStudent = async (organizationId, id) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('students')
    .select('*, batches(name, monthly_fee), scores:test_scores(*, tests(name, date, subject, total_marks))')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()
  
  if (error) throw error
  return data
}

export const createStudent = async (organizationId, student) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('students')
    .insert({ ...student, organization_id: organizationId })
    .select()
    .single()
  
  return { data, error }
}

export const updateStudent = async (organizationId, id, updates) => {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteStudent = async (organizationId, id) => {
  const { error } = await supabase.from('students').delete().eq('id', id)
  return { error }
}

// =====================================================
// BATCHES
// =====================================================

export const getBatches = async (organizationId) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('batches')
    .select('*, students(id)')
    .eq('organization_id', organizationId)
    .order('name')
  
  if (error) throw error
  
  return (data || []).map(batch => ({
    ...batch,
    student_count: batch.students?.length || 0,
    students: undefined
  }))
}

export const getBatch = async (organizationId, id) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()
  
  if (error) throw error
  return data
}

export const createBatch = async (organizationId, batch) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('batches')
    .insert({ ...batch, organization_id: organizationId })
    .select()
    .single()
  
  return { data, error }
}

export const updateBatch = async (organizationId, id, updates) => {
  const { data, error } = await supabase
    .from('batches')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteBatch = async (organizationId, id) => {
  const { error } = await supabase.from('batches').delete().eq('id', id)
  return { error }
}

// =====================================================
// TESTS
// =====================================================

export const getTests = async (organizationId, batchId = null) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  let query = supabase
    .from('tests')
    .select('*, batches(name), scores:test_scores(*)')
    .eq('organization_id', organizationId)
  
  if (batchId) query = query.eq('batch_id', batchId)
  
  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  
  // Calculate avg_score for each test from its scores
  const testsWithAvg = (data || []).map(test => {
    const validScores = (test.scores || []).filter(s => s.status === 'present' && s.marks_obtained != null)
    const avgScore = validScores.length > 0 
      ? validScores.reduce((sum, s) => sum + (s.marks_obtained || 0), 0) / validScores.length
      : 0
    return {
      ...test,
      avg_score: Math.round(avgScore * 10) / 10 // Round to 1 decimal place
    }
  })
  
  return testsWithAvg
}

export const getTest = async (organizationId, id) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('tests')
    .select('*, batches(name), scores:test_scores(*, students(full_name))')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single()
  
  if (error) throw error
  return data
}

export const createTest = async (organizationId, test) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('tests')
    .insert({ ...test, organization_id: organizationId })
    .select()
    .single()
  
  return { data, error }
}

export const updateTest = async (organizationId, id, updates) => {
  const { data, error } = await supabase
    .from('tests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteTest = async (organizationId, id) => {
  const { error } = await supabase.from('tests').delete().eq('id', id)
  return { error }
}

// =====================================================
// TEST SCORES
// =====================================================

export const getTestScores = async (testId) => {
  const { data, error } = await supabase
    .from('test_scores')
    .select('*, students(full_name)')
    .eq('test_id', testId)
  
  return { data, error }
}

export const upsertTestScores = async (scores, organizationId) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const scoresWithOrg = scores.map(s => ({ ...s, organization_id: organizationId }))
  
  const { data, error } = await supabase
    .from('test_scores')
    .upsert(scoresWithOrg, { onConflict: 'test_id,student_id' })
    .select()
  
  // Update the test's scores_entered field to true
  if (!error && scores.length > 0) {
    const testId = scores[0].test_id
    await supabase
      .from('tests')
      .update({ scores_entered: true })
      .eq('id', testId)
  }
  
  return { data, error }
}

// =====================================================
// FEE PAYMENTS
// =====================================================

export const getFeePayments = async (organizationId, studentId = null) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  let query = supabase
    .from('fee_payments')
    .select('*, students(id, full_name, batch_id, batches(name, monthly_fee))')
    .eq('organization_id', organizationId)
  
  if (studentId) query = query.eq('student_id', studentId)
  
  const { data, error } = await query.order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

export const createFeePayment = async (organizationId, payment) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('fee_payments')
    .insert({ ...payment, organization_id: organizationId })
    .select()
    .single()
  
  return { data, error }
}

export const updateFeePayment = async (id, updates) => {
  const { data, error } = await supabase
    .from('fee_payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteFeePayment = async (id) => {
  const { error } = await supabase.from('fee_payments').delete().eq('id', id)
  return { error }
}

// =====================================================
// ATTENDANCE
// =====================================================

export const getAttendance = async (organizationId, batchId = null, date = null) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  let query = supabase
    .from('attendance')
    .select('*, students(full_name)')
    .eq('organization_id', organizationId)
  
  if (batchId) query = query.eq('batch_id', batchId)
  if (date) query = query.eq('date', date)
  
  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data
}

export const upsertAttendance = async (records, organizationId) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const recordsWithOrg = records.map(r => ({ ...r, organization_id: organizationId }))
  
  const { data, error } = await supabase
    .from('attendance')
    .upsert(recordsWithOrg)
    .select()
  
  return { data, error }
}

// =====================================================
// EXPENSES
// =====================================================

export const getExpenses = async (organizationId, startDate = null, endDate = null) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('organization_id', organizationId)
  
  if (startDate) query = query.gte('date', startDate)
  if (endDate) query = query.lte('date', endDate)
  
  const { data, error } = await query.order('date', { ascending: false })
  if (error) throw error
  return data
}

export const createExpense = async (organizationId, expense) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expense, organization_id: organizationId })
    .select()
    .single()
  
  return { data, error }
}

export const updateExpense = async (id, updates) => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteExpense = async (id) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  return { error }
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export const getDashboardStats = async (organizationId) => {
  if (!organizationId) throw new Error('Organization ID required')
  
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  
  const [students, batches, todayAttendance, monthPayments, pendingFees] = await Promise.all([
    supabase.from('students').select('id', { count: 'exact' }).eq('organization_id', organizationId),
    supabase.from('batches').select('id', { count: 'exact' }).eq('status', 'Active').eq('organization_id', organizationId),
    supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today).eq('status', 'present').eq('organization_id', organizationId),
    supabase.from('fee_payments').select('amount').gte('payment_date', firstDayOfMonth).eq('organization_id', organizationId),
    supabase.from('students').select('id, due_amount').gt('due_amount', 0).eq('organization_id', organizationId)
  ])

  const monthCollection = monthPayments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const totalPending = pendingFees.data?.reduce((sum, s) => sum + (s.due_amount || 0), 0) || 0

  return {
    totalStudents: students.count || 0,
    activeBatches: batches.count || 0,
    todayAttendance: todayAttendance.count || 0,
    monthCollection,
    pendingFees: totalPending,
    pendingStudents: pendingFees.data?.length || 0
  }
}
