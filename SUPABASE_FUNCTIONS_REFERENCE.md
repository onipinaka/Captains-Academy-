# Supabase.js Function Reference - Correct Parameter Order

**ALL functions now follow this consistent pattern:**
`(organizationId, ...otherParams)`

## ✅ STUDENTS

```javascript
getStudents(organizationId, batchId = null)
getStudent(organizationId, id)
createStudent(organizationId, student)
updateStudent(organizationId, id, updates)
deleteStudent(organizationId, id)
```

## ✅ BATCHES

```javascript
getBatches(organizationId)
getBatch(organizationId, id)
createBatch(organizationId, batch)
updateBatch(organizationId, id, updates)
deleteBatch(organizationId, id)
```

## ✅ TESTS

```javascript
getTests(organizationId, batchId = null)
getTest(organizationId, id)
createTest(organizationId, test)
updateTest(organizationId, id, updates)
deleteTest(organizationId, id)
```

## ✅ TEST SCORES

```javascript
getTestScores(testId)  // Note: No orgId needed, scoped by testId
upsertTestScores(scores)  // Note: Takes array of scores
```

## ✅ FEE PAYMENTS

```javascript
getFeePayments(organizationId, studentId = null)
createFeePayment(organizationId, payment)
updateFeePayment(id, updates)  // Note: These don't need orgId
deleteFeePayment(id)
```

## ✅ ATTENDANCE

```javascript
getAttendance(organizationId, batchId = null, date = null)
upsertAttendance(attendance)  // Note: Takes array
```

## ✅ EXPENSES

```javascript
getExpenses(organizationId, startDate = null, endDate = null)
createExpense(organizationId, expense)
updateExpense(id, updates)  // Note: These don't need orgId
deleteExpense(id)
```

## ✅ DASHBOARD

```javascript
getDashboardStats(organizationId)
```

## ✅ ORGANIZATIONS

```javascript
getUserOrganizations()  // Gets orgs for current user
```

---

## Usage Pattern in Components

```javascript
import { useOrganization } from '../context/OrganizationContext'

function MyComponent() {
  const { currentOrganization } = useOrganization()
  
  // ✅ Correct usage:
  const students = await getStudents(currentOrganization.id)
  const student = await getStudent(currentOrganization.id, studentId)
  await createStudent(currentOrganization.id, formData)
  await updateStudent(currentOrganization.id, studentId, updates)
  await deleteStudent(currentOrganization.id, studentId)
}
```

---

## 🎯 Key Points

1. **organizationId is ALWAYS first** (except for legacy functions like getTestScores and upsertAttendance)
2. **ID comes second** for get/update/delete individual items  
3. **Data object comes last** for create/update
4. Always pass `currentOrganization.id` from `useOrganization()` hook
5. Always check `if (!currentOrganization?.id) return` before calling functions

---

## ⚠️ Functions That DON'T Need organizationId

These are legacy or special cases:
- `getTestScores(testId)` - scoped by test
- `upsertTestScores(scores)` - takes array
- `upsertAttendance(attendance)` - takes array
- `updateFeePayment(id, updates)` - scoped by ID
- `deleteFeePayment(id)` - scoped by ID
- `updateExpense(id, updates)` - scoped by ID
- `deleteExpense(id)` - scoped by ID

These might need updating in the future for consistency, but work for now due to RLS.
