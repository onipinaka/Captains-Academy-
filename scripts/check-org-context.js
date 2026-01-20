#!/usr/bin/env node
/**
 * Organization Context Fix Script
 * 
 * This script helps identify which admin pages are missing organization context.
 * Run this to see which files need to be fixed.
 */

const fs = require('fs');
const path = require('path');

const ADMIN_PAGES_DIR = path.join(__dirname, '../src/pages/admin');

const pagesToCheck = [
  'Students.jsx',
  'AddStudent.jsx',
  'Batches.jsx',
  'CreateBatch.jsx',
  'EditBatch.jsx',
  'BatchDetail.jsx',
  'BatchPerformance.jsx',
  'BatchPerformanceList.jsx',
  'Tests.jsx',
  'CreateTest.jsx',
  'AddScores.jsx',
  'Attendance.jsx',
  'Expenses.jsx',
  'AddExpense.jsx',
];

console.log('Checking Organization Context Implementation...\n');

pagesToCheck.forEach(filename => {
  const filepath = path.join(ADMIN_PAGES_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`❌ ${filename} - FILE NOT FOUND`);
    return;
  }
  
  const content = fs.readFileSync(filepath, 'utf8');
  
  const hasImport = content.includes("import { useOrganization }");
  const hasHook = content.includes("useOrganization()");
  const hasCurrentOrg = content.includes("currentOrganization");
  
  if (hasImport && hasHook && hasCurrentOrg) {
    console.log(`✅ ${filename} - Organization context implemented`);
  } else {
    console.log(`❌ ${filename} - MISSING organization context`);
    if (!hasImport) console.log(`   - Missing import`);
    if (!hasHook) console.log(`   - Missing hook call`);
    if (!hasCurrentOrg) console.log(`   - Missing currentOrganization usage`);
  }
});

console.log('\nDone!\n');
