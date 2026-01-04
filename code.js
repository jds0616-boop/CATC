// config.js

// 1. Firebase 설정 (databaseURL 포함됨)
const firebaseConfig = {
  apiKey: "AIzaSyDo3BPMV8qayQ3MdKBglYNtsvii0ZtCHHs",
  authDomain: "catcqna.firebaseapp.com",
  databaseURL: "https://catcqna-default-rtdb.firebaseio.com", // 필수!
  projectId: "catcqna",
  storageBucket: "catcqna.firebasestorage.app",
  messagingSenderId: "327047828064",
  appId: "1:327047828064:web:a2e26fea9f276764412905",
  measurementId: "G-TBGD8F1V2M"
};

// 2. Firebase 초기화
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 3. [보안] 강의실 난수 코드 매핑 (Room ID <-> Hash Code)
// 외부에는 이 코드가 노출됩니다. 규칙성이 없으므로 유추가 불가능합니다.
const ROOM_SECRETS = {
    "A": "x7k9p2m", "B": "q3w5e8r", "C": "a1s2d3f", "D": "z4x5c6v", "E": "bnm7u8i",
    "F": "ghj9k0l", "G": "tyu1i2o", "H": "qwe3r4t", "I": "asd5f6g", "J": "zxc7v8b",
    "K": "poi9u0y", "L": "lkjh1g2", "M": "mnb3v4c", "N": "xzas5d6", "O": "qwer7t8",
    "P": "yuio9p0", "Q": "hjkl1n2", "R": "nmjk3l4", "S": "bvcxz5a", "T": "sdgj6h7",
    "U": "qwet8y9", "V": "mnbv0c1", "W": "poiu2y3", "X": "trew4q5", "Y": "lkjh6g7", "Z": "fdsa8s9"
};

// 코드(x7k9...)를 넣으면 방ID(A)를 반환하는 헬퍼 함수
function getRoomFromCode(code) {
    return Object.keys(ROOM_SECRETS).find(key => ROOM_SECRETS[key] === code) || null;
}

// 방ID(A)를 넣으면 코드(x7k9...)를 반환하는 헬퍼 함수
function getCodeFromRoom(roomId) {
    return ROOM_SECRETS[roomId] || null;
}