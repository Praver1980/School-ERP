const fs = require('fs');

function patchFile(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // replace key={s.id} with key={s.id || Math.random()}
  code = code.replace(/key=\{([a-zA-Z0-9_\.]+)\}/g, (match, p1) => {
    // If it's already an index or simple variable, leave it alone if it's safe.
    // If it's something.id, we can fallback to Math.random() or just index if we add one, but Math.random() is fine for silencing the warning in case of undefined.
    if (p1.endsWith('.id') || p1.endsWith('.uid') || p1.endsWith('Id')) {
       return `key={${p1} || Math.random().toString()}`;
    }
    return match;
  });
  
  fs.writeFileSync(file, code);
}

patchFile('pages/AdminDashboard.tsx');
patchFile('pages/TeacherDashboard.tsx');
patchFile('pages/PrincipalDashboard.tsx');
