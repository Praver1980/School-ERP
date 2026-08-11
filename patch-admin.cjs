const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');
code = code.replace(
  "useEffect(() => {\n    refreshData();\n  }, []);",
  "useEffect(() => {\n    refreshData();\n    window.addEventListener('nexus_data_changed', refreshData);\n    return () => window.removeEventListener('nexus_data_changed', refreshData);\n  }, []);"
);
fs.writeFileSync('pages/AdminDashboard.tsx', code);
