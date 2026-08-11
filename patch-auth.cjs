const fs = require('fs');
let code = fs.readFileSync('services/authService.ts', 'utf8');

const replacement = `
                   try {
                       await fetch(\`/api/auth/users?email=\${encodeURIComponent(loginEmail)}\`, { method: 'DELETE' });
                       await createUserWithEmailAndPassword(auth, loginEmail, firebasePassword);
                       return { ...userRecord, email: loginEmail };
                   } catch (e) {
                       console.warn("Local password valid, but out of sync with Firebase. Bypassing Firebase Auth for now.");
                       return { ...userRecord, email: loginEmail };
                   }
`;

code = code.replace(
  /console\.warn\("Local password valid, but out of sync with Firebase\. Bypassing Firebase Auth for now\."\);\s*return \{ \.\.\.userRecord, email: loginEmail \};/,
  replacement
);

fs.writeFileSync('services/authService.ts', code);
