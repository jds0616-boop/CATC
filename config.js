// config.js

const firebaseConfig = {
  // 기존 설정 그대로 유지
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

// 인증 및 DB 인스턴스
const auth = firebase.auth();
const db = firebase.database();

// [보안 수정] 클라이언트 코드에서 비밀키 매핑 로직 제거
// 룸 코드는 이제 DB의 'public_codes' 경로에서 조회합니다.

async function resolveRoomFromCode(code) {
    try {
        const snap = await db.ref(`public_codes/${code}`).get();
        return snap.exists() ? snap.val() : null;
    } catch (e) {
        console.error("Code resolution failed", e);
        return null;
    }
}