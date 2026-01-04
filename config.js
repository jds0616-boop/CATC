// config.js

const firebaseConfig = {
  apiKey: "AIzaSyDo3BPMV8qayQ3MdKBglYNtsvii0ZtCHHs",
  authDomain: "catcqna.firebaseapp.com",
  databaseURL: "https://catcqna-default-rtdb.firebaseio.com",
  projectId: "catcqna",
  storageBucket: "catcqna.firebasestorage.app",
  messagingSenderId: "327047828064",
  appId: "1:327047828064:web:a2e26fea9f276764412905",
  measurementId: "G-TBGD8F1V2M"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// [중요] 비동기 코드 조회 함수
async function resolveRoomFromCode(code) {
    try {
        const db = firebase.database();
        const snap = await db.ref(`public_codes/${code}`).get();
        if (snap.exists()) {
            return snap.val(); // "A", "B" 등 방 ID 반환
        } else {
            console.error("Code not found in DB:", code);
            return null;
        }
    } catch (e) {
        console.error("Code resolution failed", e);
        return null;
    }
}