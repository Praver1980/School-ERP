const fs = require('fs');
let code = fs.readFileSync('pages/MonitoringDashboard.tsx', 'utf8');

code = code.replace(
  "const response = await fetch('/api/monitoring');\n        const json = await response.json();\n        setData(json);\n        setLoading(false);",
  "const response = await fetch('/api/monitoring');\n        if (!response.ok) {\n          const text = await response.text();\n          console.error('Monitoring fetch failed:', text);\n          return;\n        }\n        const json = await response.json();\n        setData(json);\n        setLoading(false);"
);

code = code.replace("const interval = setInterval(fetchData, 5000);", "const interval = setInterval(fetchData, 15000);");

fs.writeFileSync('pages/MonitoringDashboard.tsx', code);
