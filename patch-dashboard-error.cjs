const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "const res = await fetch('/api/factory-reset/request-telegram', { method: 'POST' });\n                       const data = await res.json();\n                       if (data.message) alert(data.message);\n                       setResetModal(prev => ({...prev, loading: false, step: 2}));",
  "const res = await fetch('/api/factory-reset/request-telegram', { method: 'POST' });\n                       const data = await res.json();\n                       if (!res.ok) { alert(data.error || 'Request failed'); return setResetModal(prev => ({...prev, loading: false})); }\n                       if (data.message) alert(data.message);\n                       setResetModal(prev => ({...prev, loading: false, step: 2}));"
);

code = code.replace(
  "const res = await fetch('/api/factory-reset/request-email', { method: 'POST' });\n                       const data = await res.json();\n                       if (data.message) alert(data.message);\n                       setResetModal(prev => ({...prev, loading: false, step: 3}));",
  "const res = await fetch('/api/factory-reset/request-email', { method: 'POST' });\n                       const data = await res.json();\n                       if (!res.ok) { alert(data.error || 'Request failed'); return setResetModal(prev => ({...prev, loading: false})); }\n                       if (data.message) alert(data.message);\n                       setResetModal(prev => ({...prev, loading: false, step: 3}));"
);

fs.writeFileSync('pages/AdminDashboard.tsx', code);
