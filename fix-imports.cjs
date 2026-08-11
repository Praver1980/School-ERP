const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

if (!code.includes("import { db } from '../services/firebase'")) {
    const importFirebase = "import { collection, getDocs, deleteDoc, collectionGroup } from 'firebase/firestore';\nimport { db } from '../services/firebase';\n";
    code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + importFirebase);
}

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Fixed imports in AdminDashboard");
