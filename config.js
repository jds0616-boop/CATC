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

/* --- config.js 추가분 (행정 로직용) --- */

// 석식 마감 시간 설정 (16시)
const DINNER_DEADLINE_HOUR = 16;

// 현재 날짜를 YYYY-MM-DD 형식으로 반환하는 함수 (서버/행정용)
function getTodayString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// 어제 날짜를 YYYY-MM-DD 형식으로 반환하는 함수 (복귀 확인용)
function getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// 오프라인 상태에서도 데이터를 임시로 저장하여 앱이 멈추지 않게 함
firebase.database().goOnline();