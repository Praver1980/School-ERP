const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');

admin.initializeApp({
  projectId: config.projectId
});

const db = admin.firestore();
// IMPORTANT: Need to use the correct database ID if it's not the default one!
// firebase-admin doesn't easily support secondary databases in older versions,
// wait, firestoreDatabaseId is in the config! Let's check how to use it in admin SDK.
// It's `admin.firestore(admin.app(), config.firestoreDatabaseId)` if supported, else just default db if it's default.
// Let's print out the config.
console.log(config);
