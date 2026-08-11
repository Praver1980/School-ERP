const fs = require('fs');

['pages/AdminDashboard.tsx', 'pages/TeacherDashboard.tsx', 'pages/StudentDashboard.tsx', 'pages/PrincipalDashboard.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  // Just in case, replace key={c}, key={g}, key={s}, key={h}, key={i} with key={... || Math.random().toString()} for option tags
  code = code.replace(/<option key=\{([a-zA-Z])\}/g, "<option key={$1 || Math.random().toString()}");
  fs.writeFileSync(file, code);
});

