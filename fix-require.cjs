const fs = require('fs');
let code = fs.readFileSync('pages/AdminDashboard.tsx', 'utf8');

if (!code.includes("import { db } from '../services/firebase'")) {
    code = code.replace("import { Trash2 } from 'lucide-react';", "import { Trash2 } from 'lucide-react';\nimport { collection, getDocs, deleteDoc, collectionGroup } from 'firebase/firestore';\nimport { db } from '../services/firebase';");
}

code = code.replace("const { collection, getDocs, deleteDoc, collectionGroup } = require('firebase/firestore');", "");
code = code.replace("const { db } = require('../services/firebase');", "");

fs.writeFileSync('pages/AdminDashboard.tsx', code);
console.log("Fixed require in AdminDashboard");
