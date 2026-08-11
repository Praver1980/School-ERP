const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add import for AnonymousPreview
code = code.replace("import Login from './pages/Login';", "import Login from './pages/Login';\nimport AnonymousPreview from './pages/AnonymousPreview';");

// Add showPreview state to App
const stateToAdd = "  const [showPreview, setShowPreview] = useState(false);";
code = code.replace("const [user, setUser] = useState<User | null>(null);", "const [user, setUser] = useState<User | null>(null);\n" + stateToAdd);

// Add the preview condition in App component
const loginCheck = "  if (!user) {\n    return <Login onLoginSuccess={handleLogin} />;\n  }";
const replacement = "  if (showPreview) {\n    return <AnonymousPreview onBack={() => setShowPreview(false)} />;\n  }\n\n  if (!user) {\n    return <Login onLoginSuccess={handleLogin} onShowPreview={() => setShowPreview(true)} />;\n  }";
code = code.replace(loginCheck, replacement);

fs.writeFileSync('App.tsx', code);
console.log("Patched App.tsx");
