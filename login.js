    // login.html 파일 안의 <script> 태그 내부
    // 기존 tryLogin 함수를 지우고 아래 걸로 붙여넣으세요.

// [보안 수정완료] 하드코딩된 비번(1234) 삭제 및 에러메시지 개선
    async function tryLogin() {
        const input = document.getElementById('pwInput').value;
        const msgBox = document.getElementById('msg');
        
        // 1. 입력 확인
        if(!input) { 
            msgBox.textContent = "비밀번호를 입력하세요."; 
            msgBox.style.color = "#ef4444";
            return; 
        }

        try {
            msgBox.textContent = "확인 중...";
            msgBox.style.color = "#fbbf24"; // 노란색(대기)

            // 2. Firebase 서버 인증 (소스코드에 비번 없음)
            // 관리자 이메일은 admin@kac.com 으로 고정
            await firebase.auth().signInWithEmailAndPassword("admin@kac.com", input);
            
            // 3. 성공 시 메시지 및 이동
            msgBox.style.color = "#4ade80"; // 녹색
            msgBox.textContent = "접속 성공! 이동합니다.";
            
            // 세션 저장 (선택사항)
            const sessionData = { 
                token: 'granted', 
                role: 'instructor', 
                expiry: Date.now() + (12 * 60 * 60 * 1000) 
            };
            localStorage.setItem('kac_admin_session', JSON.stringify(sessionData));
            
            setTimeout(() => location.replace('admin.html'), 500);

        } catch (e) {
            // 4. 실패 시 명확한 메시지 처리
            console.error(e);
            msgBox.style.color = "#ef4444"; // 빨간색
            msgBox.textContent = "⛔ 비밀번호가 올바르지 않습니다.";
        }
    }