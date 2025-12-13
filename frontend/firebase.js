const firebaseConfig = {
  apiKey: "AIzaSyD38NBRL3nZQWcCfwh5_6XgDmUBTmBUInk",
  authDomain: "yara-2436.firebaseapp.com",
  projectId: "yara-2436",
  storageBucket: "yara-2436.firebasestorage.app",
  messagingSenderId: "979309612474",
  appId: "1:979309612474:web:339830735d2602a5876183",
  measurementId: "G-PNXY8WDS99"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Anonymous sign-in
function signInAnon() {
  return auth.signInAnonymously().then((cred) => cred.user);
}

// Save logs array for this user
function saveLogsToFirestore(userId, logs) {
  return db
    .collection("period_logs")
    .doc(userId)
    .set({ logs: logs }, { merge: true });
}

// Load logs array for this user
function loadLogsFromFirestore(userId) {
  return db
    .collection("period_logs")
    .doc(userId)
    .get()
    .then((doc) => {
      if (doc.exists && Array.isArray(doc.data().logs)) {
        return doc.data().logs;
      }
      return [];
    });
}