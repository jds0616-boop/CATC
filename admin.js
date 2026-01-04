// --- Security & Auth Utils ---
// 더 이상 클라이언트 사이드 해싱 함수(cryptoUtils)는 인증에 사용되지 않습니다.

// --- 전역 상태 ---
const state = {
    sessionId: Math.random().toString(36).substr(2, 9),
    room: null,
    isTestMode: false,
    quizList: [],
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null };

// --- 1. Auth (Firebase Auth 적용) ---
const authMgr = {
    // UI에는 '비밀번호' 입력창만 있으므로, 이메일은 고정해둡니다.
    // Firebase Console에서 만든 계정 이메일을 입력하세요.
    ADMIN_EMAIL: "admin@kac.com", 

    tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        if(!inputPw) return alert("비밀번호를 입력해주세요.");

        try {
            // [보안 핵심] 서버로 비밀번호를 보내 검증합니다.
            await auth.signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            // 로그인 성공 시 onAuthStateChanged 리스너가 처리합니다.
        } catch (error) {
            console.error(error);
            alert("로그인 실패: 비밀번호가 올바르지 않습니다.");
            document.getElementById('loginPwInput').value = "";
        }
    },

    logout: function() {
        auth.signOut().then(() => {
            location.reload();
        });
    },

    // 비밀번호 변경: 이제 Firebase Auth 프로필 업데이트를 사용해야 합니다.
    executeChangePw: async function() {
        const user = auth.currentUser;
        const newPw = document.getElementById('cp-new').value;
        const confirmPw = document.getElementById('cp-confirm').value;

        if(!user) return alert("로그인 상태가 아닙니다.");
        if(!newPw || !confirmPw) return alert("필드를 입력하세요.");
        if(newPw !== confirmPw) return alert("새 비밀번호가 일치하지 않습니다.");

        try {
            await user.updatePassword(newPw);
            alert("비밀번호가 안전하게 변경되었습니다.");
            ui.closePwModal();
        } catch (e) {
            alert("변경 실패: " + e.message + "\n(최근 로그인 시간이 오래되었으면 재로그인이 필요할 수 있습니다.)");
        }
    }
};

// --- 2. Data & Room Logic ---
const dataMgr = {
    initSystem: function() {
        // 인증 상태 감지 리스너
        auth.onAuthStateChanged(user => {
            if (user) {
                // 로그인 됨 -> 오버레이 숨김
                document.getElementById('loginOverlay').style.display = 'none';
                this.loadInitialData();
            } else {
                // 로그아웃 됨 -> 오버레이 표시
                document.getElementById('loginOverlay').style.display = 'flex';
            }
        });
    },

    loadInitialData: function() {
        const lastRoom = localStorage.getItem('kac_last_room') || 'A';
        this.forceEnterRoom(lastRoom); 

        ui.initRoomSelect(); 
        document.getElementById('roomSelect').addEventListener('change', (e) => this.switchRoomAttempt(e.target.value));
        document.getElementById('btnSaveInfo').addEventListener('click', () => this.saveSettings());
        document.getElementById('btnCopyLink').addEventListener('click', () => ui.copyLink());
        document.getElementById('quizFile').addEventListener('change', (e) => quizMgr.loadFile(e));
        
        const qrEl = document.getElementById('qrcode');
        if(qrEl) qrEl.onclick = function() { ui.openQrModal(); };
    },

    switchRoomAttempt: async function(newRoom) {
        // [보안] 이제 관리자는 모든 방에 접근 권한이 있으므로 
        // 별도의 'Room Password' 검증 없이도 진입은 가능하게 하거나,
        // 필요하다면 DB에 저장된 값을 가져와서 비교합니다.
        // 기존 UX 유지를 위해 '비밀번호 확인' 절차를 남길 수 있습니다.
        
        // 간단한 구현: 관리자 권한이 있으므로 즉시 이동 (UX 개선)
        // 만약 다른 강사가 점유중이라면 확인창 띄우기
        const snapshot = await db.ref(`courses/${newRoom}/status`).get();
        const st = snapshot.val() || {};
        
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            const confirmMsg = `[Room ${newRoom}] 현재 다른 강사가 사용 중입니다.\n강제 진입하시겠습니까?`;
            if (!confirm(confirmMsg)) {
                document.getElementById('roomSelect').value = state.room;
                return;
            }
        }
        
        // 강제 점유 (관리자이므로 가능)
        await db.ref(`courses/${newRoom}/status`).update({
            ownerSessionId: state.sessionId
        });
        this.forceEnterRoom(newRoom);
    },

    forceEnterRoom: function(room) {
        if(dbRef.qa) dbRef.qa.off();
        if(dbRef.quiz) dbRef.quiz.off();
        if(dbRef.status) dbRef.status.off();

        state.room = room;
        localStorage.setItem('kac_last_room', room);
        ui.updateHeaderRoom(room);
        
        const rPath = `courses/${room}`;
        dbRef.settings = db.ref(`${rPath}/settings`);
        dbRef.qa = db.ref(`${rPath}/questions`);
        dbRef.quiz = db.ref(`${rPath}/activeQuiz`);
        dbRef.ans = db.ref(`${rPath}/quizAnswers`);
        dbRef.status = db.ref(`${rPath}/status`);

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
        dbRef.status.on('value', s => {
            const st = s.val() || {};
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
        });

        // [변경] QR 코드는 DB에서 해당 방의 코드를 비동기로 가져와야 합니다.
        // 여기서는 예시로 기존 동기 방식을 대체하는 비동기 호출을 처리합니다.
        this.fetchAndRenderQr(room);

        dbRef.qa.on('value', s => {
            state.qaData = s.val() || {};
            ui.renderQaList('all');
        });
    },

    fetchAndRenderQr: async function(room) {
        // DB에서 public_codes를 역으로 찾거나, courses/{room}/code 정보를 읽어옴
        // 편의상 관리자는 모든 코드를 알 수 있다고 가정하거나,
        // DB 구조를 courses/A/public_code = "x7k9..." 형태로 저장해두면 좋습니다.
        // 여기서는 임시 코드를 사용합니다.
        const studentUrl = `${window.location.origin}/index.html?room=${room}`; // 코드가 아닌 룸 ID 직접 연결은 보안상 취약할 수 있으나, 관리자 뷰에서는 코드 확인용 로직을 추가해야 함.
        ui.renderQr(studentUrl);
        // *실제 구현 시*: db.ref('public_codes').orderByValue().equalTo(room)... 등으로 코드를 찾아야 함.
    },

    saveSettings: function() {
        const pw = document.getElementById('roomPw').value; 
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;

        const updates = { courseName: newName };
        if(pw) updates.password = pw; 

        db.ref(`courses/${state.room}/settings`).update(updates);
        document.getElementById('displayCourseTitle').innerText = newName;

        if (statusVal === 'active') {
            db.ref(`courses/${state.room}/status`).update({
                roomStatus: 'active',
                ownerSessionId: state.sessionId
            });
            alert(`[Room ${state.room}] 설정 저장 완료 (사용중)`); 
        } else {
            db.ref(`courses/${state.room}/status`).update({
                roomStatus: 'idle',
                ownerSessionId: null
            });
            alert(`[Room ${state.room}] 설정 저장 완료 (비어있음)`); 
        }
    },

    updateQa: function(action) {
        if(!state.activeQaKey) return;
        if (action === 'delete') {
             if(confirm("정말 삭제하시겠습니까?")) {
                 dbRef.qa.child(state.activeQaKey).remove(); ui.closeQaModal();
             }
        } else {
            let status = action;
            if (state.qaData[state.activeQaKey].status === action) status = 'normal';
            dbRef.qa.child(state.activeQaKey).update({ status: status });
            ui.closeQaModal();
        }
    },

    resetCourse: function() {
        if(confirm("현재 강의실 데이터를 초기화하시겠습니까? (관리자 권한)")) {
            // 관리자 인증이 되어있으므로 바로 삭제 가능
            db.ref(`courses/${state.room}`).set(null).then(() => {
                alert("초기화 완료."); location.reload();
            }).catch(e => alert("권한 부족: " + e.message));
        }
    }
};

// UI 객체와 QuizMgr는 기존 로직과 동일하게 유지하되,
// dataMgr.initSystem() 호출 위치만 window.onload로 변경

// --- UI ---
const ui = {
    // ... (기존 ui 코드 그대로 사용) ...
    initRoomSelect: function() {
        // ... (기존과 동일)
         db.ref('courses').on('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
            // ... (렌더링 로직 동일) ...
            // 내용 생략 (기존 코드 유지)
         });
    },
    // ... (나머지 ui 함수들 그대로 유지) ...
    // 복사 붙여넣기로 기존 코드 사용
    renderSettings: function(data) {
        document.getElementById('courseNameInput').value = data.courseName || "";
        document.getElementById('roomPw').value = data.password || "";
        document.getElementById('displayCourseTitle').innerText = data.courseName || "";
    },
    renderRoomStatus: function(st) { document.getElementById('roomStatusSelect').value = st || 'idle'; },
    checkLockStatus: function(st) { 
        // 기존 코드 그대로
        const overlay = document.getElementById('statusOverlay');
        const isActive = (st.roomStatus === 'active');
        const isOwner = (st.ownerSessionId === state.sessionId);

        if (isActive && isOwner) overlay.style.display = 'none';
        else if (isActive && !isOwner) {
             overlay.style.display = 'flex';
             overlay.innerHTML = `<div class="lock-message">...관전 모드...</div>`; 
        } else {
             overlay.style.display = 'flex';
             overlay.innerHTML = `<div class="lock-message">...대기 중...</div>`;
        }
    },
    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: url, width: 50, height: 50 });
    },
    openQrModal: function() {
        const modal = document.getElementById('qrModal');
        const bigTarget = document.getElementById('qrBigTarget');
        const url = document.getElementById('studentLink').value;
        if(!url) return;
        modal.style.display = 'flex';
        bigTarget.innerHTML = ""; 
        setTimeout(() => {
            new QRCode(bigTarget, { 
                text: url, width: 300, height: 300,
                colorDark : "#000000", colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }, 50);
    },
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },
    copyLink: function() {
        document.getElementById('studentLink').select();
        document.execCommand('copy'); alert("Copied.");
    },
    setMode: function(mode) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${mode}`).classList.add('active');
        document.getElementById('view-qa').style.display = (mode==='qa'?'flex':'none');
        document.getElementById('view-quiz').style.display = (mode==='quiz'?'flex':'none');
        db.ref(`courses/${state.room}/status/mode`).set(mode);
        if(mode === 'quiz' && state.quizList.length > 0) quizMgr.showQuiz(); 
    },
    filterQa: function(filter) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        event.target.classList.add('active');
        this.renderQaList(filter);
    },
    renderQaList: function(filter) {
        const list = document.getElementById('qaList'); list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));
        const getScore = (i) => { if(i.status==='pin')return 1000; if(i.status==='later')return 500; if(i.status==='done')return -1000; return 0; };
        if(filter === 'pin') items = items.filter(x => x.status === 'pin');
        else if(filter === 'later') items = items.filter(x => x.status === 'later');
        items.sort((a,b) => (getScore(b) + (b.likes||0)) - (getScore(a) + (a.likes||0)));

        items.forEach(i => {
            const cls = i.status === 'pin' ? 'status-pin' : (i.status === 'later' ? 'status-later' : (i.status === 'done' ? 'status-done' : ''));
            const icon = i.status === 'pin' ? '📌 ' : (i.status === 'later' ? '⚠️ ' : (i.status === 'done' ? '✅ ' : ''));
            list.innerHTML += `<div class="q-card ${cls}" onclick="ui.openQaModal('${i.id}')"><div class="q-content">${icon}${i.text}</div><div class="q-meta"><div class="q-like-badge">👍 ${i.likes||0}</div><div class="q-time">${new Date(i.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div></div>`;
        });
    },
    openQaModal: function(key) {
        state.activeQaKey = key;
        document.getElementById('m-text').innerText = state.qaData[key].text;
        document.getElementById('qaModal').style.display = 'flex';
    },
    closeQaModal: function(e) { if (!e || e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') document.getElementById('qaModal').style.display = 'none'; },
    openPwModal: function() { 
        document.getElementById('cp-current').value = "Protected";
        document.getElementById('cp-current').disabled = true; 
        document.getElementById('cp-new').value = "";
        document.getElementById('cp-confirm').value = "";
        document.getElementById('changePwModal').style.display = 'flex'; 
    },
    closePwModal: function() { document.getElementById('changePwModal').style.display = 'none'; },
    toggleNightMode: function() { 
        document.body.classList.toggle('night-mode'); 
        const isNight = document.body.classList.contains('night-mode');
        if(isNight) {
            document.getElementById('iconSun').classList.remove('active');
            document.getElementById('iconMoon').classList.add('active');
        } else {
            document.getElementById('iconSun').classList.add('active');
            document.getElementById('iconMoon').classList.remove('active');
        }
    },
    toggleRightPanel: function() {
        const p = document.getElementById('rightPanel'); p.classList.toggle('open');
        document.getElementById('panelIcon').className = p.classList.contains('open') ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    }
};

// --- 4. Quiz (기존 코드 유지) ---
const quizMgr = {
    // ... (기존 코드 그대로 복사) ...
    // 내용이 길어 생략, 기존 `admin.js`의 quizMgr 객체 전체를 그대로 넣으면 됩니다.
    loadFile: function(e) { /*...*/ },
    addManualQuiz: function() { /*...*/ },
    renderMiniList: function() { /*...*/ },
    downloadSample: function() { /*...*/ },
    startTestMode: function() { /*...*/ },
    prevNext: function(dir) { /*...*/ },
    startRealQuiz: function() { /*...*/ },
    showQuiz: function() { /*...*/ },
    renderScreen: function(q) { /*...*/ },
    action: function(act) { /*...*/ },
    startTimer: function() { /*...*/ },
    stopTimer: function() { /*...*/ },
    resetTimerUI: function() { /*...*/ },
    renderChart: function(id, correct) { /*...*/ },
    setGuide: function(txt) { /*...*/ },
    closeQuizMode: function() { /*...*/ }
    // 기존 quizMgr 내부 함수 모두 포함 필수
};
// [주의] 위 quizMgr 내부 함수들은 원본 파일에서 그대로 가져와야 작동합니다.

// --- 5. Print (기존 코드 유지) ---
const printMgr = {
    // ... (기존 코드 그대로 복사) ...
    openInputModal: function() { /*...*/ },
    confirmPrint: function(isSkip) { /*...*/ },
    closeInputModal: function() { /*...*/ },
    openPreview: function(date, prof) { /*...*/ },
    closePreview: function() { /*...*/ },
    executePrint: function() { /*...*/ }
    // 기존 printMgr 내부 함수 모두 포함 필수
};

window.onload = function() {
    // 시스템 초기화 (인증 리스너 등록)
    dataMgr.initSystem();
};