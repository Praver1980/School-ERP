import fs from 'fs';
let content = fs.readFileSync('types.ts', 'utf8');

// Fix User
content = content.replace(
  "  schoolName?: string;\n  loginId?: string; // New: Assigned School\n}",
  "  schoolName?: string;\n  schoolID?: string;\n}"
);

// Fix StudentRecord
content = content.replace(
  "  schoolName?: string;\n  loginId?: string; // New: Assigned School\n}",
  "  schoolName?: string;\n  schoolID?: string;\n}"
);

// Fix Announcement
content = content.replace(
  "  schoolName?: string;\n  loginId?: string; // New: If undefined/null, it is visible to ALL schools (Global)\n}",
  "  schoolName?: string;\n  schoolID?: string;\n}"
);

// Fix AssignmentSubmission
content = content.replace(
  "  loginId?: string;\n  studentId: string;",
  "  schoolID?: string;\n  studentId: string;"
);

// Fix Assignment
content = content.replace(
  "  schoolName: string;\n  loginId?: string;",
  "  schoolName: string;\n  schoolID?: string;"
);

// Fix PaymentRecord
content = content.replace(
  "  schoolName: string;\n  loginId?: string;",
  "  schoolName: string;\n  schoolID?: string;"
);

fs.writeFileSync('types.ts', content);
