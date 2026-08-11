const fs = require('fs');

let base = fs.readFileSync('supabase_schema.sql', 'utf8');
let fixes = fs.readFileSync('02_security_audit_fixes.sql', 'utf8');

// Instead of creating then altering, let's just make the create statement correct.
base = base.replace(
    'uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,',
    'uid TEXT PRIMARY KEY,'
);

// We can remove the ALTER TABLE lines from fixes since we fixed the base
fixes = fixes.replace(/ALTER TABLE public\.users DROP CONSTRAINT IF EXISTS users_uid_fkey;\nALTER TABLE public\.users ALTER COLUMN uid TYPE TEXT;\n/g, '');

let complete = base + '\n\n-- =========================================\n-- SECURITY AUDIT FIXES APPLIED\n-- =========================================\n\n' + fixes;

fs.writeFileSync('03_complete_schema.sql', complete);
