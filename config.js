
// config.js

// 1. 아까 복사한 키 값들을 이 괄호 안에 채워주세요.
const firebaseConfig = {
  apiKey: "AIzaSyDo3BPMV8qayQ3MdKBglYNtsvii0ZtCHHs",
  authDomain: "catcqna.firebaseapp.com",
  projectId: "catcqna",
  storageBucket: "catcqna.firebasestorage.app",
  messagingSenderId: "327047828064",
  appId: "1:327047828064:web:a2e26fea9f276764412905",
  measurementId: "G-TBGD8F1V2M"
};

// 2. 중요! 아래 코드는 건드리지 말고 그대로 두세요. 
// (Firebase 화면에 있는 import 나 const app = ... 이런거 다 지우고 아래껄로 써야 합니다)

// Firebase 초기화 (이미 실행됐으면 건너뜀)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 데이터베이스 기능 활성화
const db = firebase.database();