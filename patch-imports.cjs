const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const nodemailer = require\('nodemailer'\);/g, "const nodemailer = (await import('nodemailer')).default;");
code = code.replace(/const \{ initializeApp: initClientApp \} = require\('firebase\/app'\);/g, "const { initializeApp: initClientApp } = await import('firebase/app');");
code = code.replace(/const \{ getFirestore, collection, getDocs, deleteDoc, collectionGroup \} = require\('firebase\/firestore'\);/g, "const { getFirestore, collection, getDocs, deleteDoc, collectionGroup } = await import('firebase/firestore');");
code = code.replace(/firebaseApp = require\('firebase\/app'\)\.getApp\(\);/g, "const { getApp: getClientApp } = await import('firebase/app'); firebaseApp = getClientApp();");
code = code.replace(/const \{ initializeApp: initAdminApp \} = require\('firebase-admin\/app'\);/g, "const { initializeApp: initAdminApp } = await import('firebase-admin/app');");
code = code.replace(/const \{ getAuth \} = require\('firebase-admin\/auth'\);/g, "const { getAuth } = await import('firebase-admin/auth');");
code = code.replace(/adminApp = require\('firebase-admin\/app'\)\.getApp\(\);/g, "const { getApp: getAdminApp } = await import('firebase-admin/app'); adminApp = getAdminApp();");

fs.writeFileSync('server.ts', code);
