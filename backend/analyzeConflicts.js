// Analyzing conflicts in the team merge list
const teamMerges = [
  { id: 1, students: ['43120012', '43120047'], guide: 'Dr. K. Sundara Velrani' },
  { id: 2, students: ['43120201', '43120019'], guide: 'Dr. Sathyaraj A' },
  { id: 3, students: ['43120185', '43120108'], guide: 'Ms. T G Ruby Angel' },
  { id: 4, students: ['43120178', '43120144'], guide: 'Ms. T G Ruby Angel' },
  { id: 5, students: ['43120017', '43120019'], guide: 'Dr. Urmela S' },
  { id: 6, students: ['43120195', '43120226'], guide: 'Ms. Samundiswary' },
  { id: 7, students: ['43120031', '43120023'], guide: 'Dr. L. Mary Gladence' },
  { id: 8, students: ['43120003', '43120057'], guide: 'J. Merlin Mary Jenitha' },
  { id: 9, students: ['43120176', '43120164'], guide: 'K. Arunkumar' },
  { id: 10, students: ['43120174', '43120308'], guide: 'K. Arunkumar' },
  { id: 11, students: ['43120055', '43120009'], guide: 'Ms. D. Ramalakshmi' },
  { id: 12, students: ['43120220', '43120196'], guide: 'Dr. Sathyaraj A' },
  { id: 13, students: ['43120059', '43120037'], guide: 'Dr. Urmela S' },
  { id: 14, students: ['43120279', '43120262'], guide: 'Ms. Samundiswary' },
  { id: 15, students: ['43120228', '43120212'], guide: 'Ms. Samundiswary' },
  { id: 16, students: ['43120168', '43120142'], guide: 'S. Philomina' },
  { id: 17, students: ['43120018', '43120136'], guide: 'Dr. L. Mary Gladence' },
  { id: 18, students: ['43120161', '43120140'], guide: 'Ms. D. Ramalakshmi' },
  { id: 19, students: ['43120282', '43120295'], guide: 'Ms. Gopika P' },
  { id: 20, students: ['43120262', '43120272'], guide: 'Ms. Sweadha M' },
  { id: 21, students: ['43120266', '43120258'], guide: 'Oormila L' },
  { id: 22, students: ['43120157', '43120143'], guide: 'Tina Victoria A' },
  { id: 23, students: ['43120043', '43120050'], guide: 'Ms. D. Ramalakshmi' },
];

// Find duplicate students
const studentMap = {};
const conflicts = [];

teamMerges.forEach(merge => {
  merge.students.forEach(student => {
    if (!studentMap[student]) {
      studentMap[student] = [];
    }
    studentMap[student].push(merge.id);
  });
});

Object.entries(studentMap).forEach(([student, mergeIds]) => {
  if (mergeIds.length > 1) {
    conflicts.push({ student, mergeIds });
  }
});

if (conflicts.length > 0) {
  console.log('⚠️  CONFLICTS FOUND:\n');
  conflicts.forEach(conflict => {
    console.log(`Student ${conflict.student} appears in merge(s): ${conflict.mergeIds.join(', ')}`);
    conflict.mergeIds.forEach(mergeId => {
      const merge = teamMerges.find(m => m.id === mergeId);
      console.log(`  Merge #${mergeId}: ${merge.students.join(' & ')} → ${merge.guide}`);
    });
    console.log();
  });
} else {
  console.log('✅ No conflicts found!');
}
