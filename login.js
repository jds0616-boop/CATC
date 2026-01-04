    // login.html 파일 안의 <script> 태그 내부
    // 기존 tryLogin 함수를 지우고 아래 걸로 붙여넣으세요.

    async function tryLogin() {
        const input = document.getElementById('pwInput').value;
        const msgBox = document.getElementById('msg');
        
        // 입력값이 없으면 경고
        if(!input) { 
            msgBox.textContent = "비밀번호를 입력하세요."; 
            return; 
        }

        // [개발용 수정] 암호화 없이 1234 입력하면 강사로 바로 통과!
        if(input === "1234") {
            msgBox.style.color = "#4ade80";
            msgBox.textContent = "강사 접속 성공!";
            
            const sessionData = {
                token: 'granted',
                role: 'instructor',
                expiry: Date.now() + (5 * 60 * 60 * 1000) // 5시간
            };
            localStorage.setItem('kac_admin_session', JSON.stringify(sessionData));
            
            // 0.5초 뒤 관리자 페이지로 이동
            setTimeout(() => location.replace('admin.html'), 500);
            return;
        }

        // 관리자용 (9999)
        if(input === "9999") {
             msgBox.style.color = "#4ade80";
             msgBox.textContent = "관리자 접속 성공!";
             const sessionData = { token: 'granted', role: 'super_admin', expiry: Date.now() + 5*60*60*1000 };
             localStorage.setItem('kac_admin_session', JSON.stringify(sessionData));
             setTimeout(() => location.replace('admin.html'), 500);
             return;
        }

        // 틀렸을 때
        msgBox.style.color = "#ef4444";
        msgBox.textContent = "비밀번호 오류 (테스트: 1234)";
    }