# Remaining Pages to Update

## Pattern to Follow:

Every page that uses supabase helper functions needs to be updated to pass `organizationId`.

### ✅ Already Fixed:
- `Dashboard.jsx` - passes `currentOrganization.id` to all functions
- `CreateBatch.jsx` - passes `currentOrganization.id` to `createBatch`

---

### 🔧 Pages That Need Updates:

Update these pages following the same pattern as Dashboard and CreateBatch:

#### 1. **Students Pages**
- [ ] `Students.jsx` - getStudents, deleteStudent
- [ ] `AddStudent.jsx` - createStudent
- [ ] `StudentProfile.jsx` - getStudent, updateStudent

**Pattern:**
```javascript
import { useOrganization } from '../../context/OrganizationContext'

function Students() {
  const { currentOrganization } = useOrganization()
  
  useEffect(() => {
    if (currentOrganization?.id) {
      loadStudents()
    }
  }, [currentOrganization])
  
  const loadStudents = async () => {
    const data = await getStudents(currentOrganization.id)
  }
}
```

#### 2. **Batches Pages**
- [ ] `Batches.jsx` - getBatches, deleteBatch
- [ ] `BatchDetail.jsx` - getBatch, updateBatch

#### 3. **Tests Pages**
- [ ] `Tests.jsx` - getTests
- [ ] `CreateTest.jsx` - createTest
- [ ] `AddScores.jsx` - getTest, upsertTestScores

#### 4. **Fees Pages**
- [ ] `Fees.jsx` - getFeePayments
- [ ] `AddPayment.jsx` - createFeePayment
- [ ] `FeesHistory.jsx` - getFeePayments

#### 5. **Attendance Pages**
- [ ] `Attendance.jsx` - getAttendance, upsertAttendance
- [ ] `AttendanceReports.jsx` - getAttendance

#### 6. **Expenses Pages**
- [ ] `Expenses.jsx` - getExpenses
- [ ] `AddExpense.jsx` - createExpense

#### 7. **Analytics Pages**
- [ ] `Analytics.jsx` - getDashboardStats
- [ ] `StudentPerformance.jsx` - getStudent, getTestScores
- [ ] `BatchPerformance.jsx` - getBatch, getTests

---

## Quick Fix Template:

For any page, add these 3 things:

### 1. Import useOrganization:
```javascript
import { useOrganization } from '../../context/OrganizationContext'
```

### 2. Get currentOrganization:
```javascript
const { currentOrganization } = useOrganization()
```

### 3. Pass organizationId to functions:
```javascript
// Before
await getStudents()

// After  
await getStudents(currentOrganization.id)
```

### 4. Add safety check:
```javascript
if (!currentOrganization?.id) return // or show loading
```

---

## Testing Checklist:

After updating each page:
- [ ] Signup works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Can create/view/edit/delete items
- [ ] Data is isolated per organization
- [ ] No "Organization ID required" errors

---

## Priority Order:

1. **High Priority** (frequently used):
   - Students.jsx, AddStudent.jsx
   - Batches.jsx (already can create, need to view)
   - Fees.jsx, AddPayment.jsx

2. **Medium Priority**:
   - Tests pages
   - Attendance pages

3. **Low Priority**:
   - Analytics pages
   - Reports

---

Update pages one by one and test after each!
