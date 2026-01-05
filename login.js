/* --- login.js (최종 수정본) --- */

// [보안 수정완료] 하드코딩된 비번(1234) 삭제 및 에러메시지 개선
async function tryLogin() {
    const input = document.getElementById('pwInput').value;
    const msgBox = document.getElementById('msg');
    
    // 1. 입력 확인
    if(!input) { 
        alert("비밀번호를 입력하세요."); 
        return; 
    }

    try {
        if(msgBox) {
            msgBox.textContent = "확인 중...";
            msgBox.style.color = "#fbbf24"; // 노란색(대기)
        }

        // 2. Firebase 서버 인증 (소스코드에 비번 없음)
        // 관리자 이메일은 admin@kac.com 으로 고정
        await firebase.auth().signInWithEmailAndPassword("admin@kac.com", input);
        
        // 3. 성공 시 메시지 및 이동
        if(msgBox) {
            msgBox.style.color = "#4ade80"; // 녹색
            msgBox.textContent = "접속 성공! 이동합니다.";
        }
        
        // 세션 저장 (선택사항)
        const sessionData = { 
            token: 'granted', 
            role: 'instructor', 
            expiry: Date.now() + (12 * 60 * 60 * 1000) 
        };
        localStorage.setItem('kac_admin_session', JSON.stringify(sessionData));
        
        // 로그인 성공 시 admin.html로 이동
        setTimeout(() => location.replace('admin.html'), 500);

    } catch (e) {
        // 4. 실패 시 명확한 메시지 처리 (이 부분이 핵심!)
        console.error("로그인 실패:", e); // 개발자용 로그는 남김
        
        if(msgBox) {
            msgBox.style.color = "#ef4444"; // 빨간색
            msgBox.textContent = "⛔ 비밀번호가 올바르지 않습니다.";
        }
        
        // [중요] 지저분한 영어 팝업 대신 깔끔한 한글 경고창 띄우기
        alert("⛔ 비밀번호가 올바르지 않습니다.\n다시 확인해주세요.");
        
        // 입력창 비우기
        document.getElementById('pwInput').value = "";
        document.getElementById('pwInput').focus();
    }
}