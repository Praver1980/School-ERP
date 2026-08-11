const fs = require('fs');
let code = fs.readFileSync('services/authService.ts', 'utf8');

const targetStr = `                  console.warn("Local password valid, but out of sync with Firebase. Bypassing Firebase Auth for now.");
                  // Do not throw, just allow local login to proceed
               }
               console.error("Failed to create Firebase Auth user:", createError);
               throw new Error("Authentication failed: " + createError.message);`;

const replacementStr = `                  console.warn("Local password valid, but out of sync with Firebase. Bypassing Firebase Auth for now.");
                  return { ...userRecord, email: loginEmail };
               } else {
                   console.error("Failed to create Firebase Auth user:", createError);
                   throw new Error("Authentication failed: " + createError.message);
               }`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('services/authService.ts', code);
console.log("Patched authService sync error correctly");
