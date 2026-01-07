/* --- admin.js (Final Integrated Version) --- */

// 1. 기본 퀴즈 데이터
const DEFAULT_QUIZ_DATA = [
    { text: "한국공항공사(KAC)의 본사는 김포공항 내에 위치하고 있다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "[테스트] 비행기 기내에는 휴대용 라이터를 1개도 반입할 수 없다.", options: ["O (반입 가능)", "X (반입 불가)"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "항공기 탑승 시 신분증 대신 생체정보(정맥)를 이용할 수 있는 서비스 이름은?", options: ["스마트패스", "원패스", "바이오패스", "하이패스"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "현재 교육생 여러분의 소속 본부는 어디이신가요?", options: ["본사", "서울지역본부", "제주지역본부", "남부지역본부", "기타/기본"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "김포국제공항의 IATA 공항 코드는 GMP이다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "국내 모든 공항의 주차장은 교육생에게 항상 무료로 개방된다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "제주국제공항은 우리나라에서 이용객이 가장 많은 공항이다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "오늘 진행되는 교육 내용의 전반적인 난이도는 어떠한가요?", options: ["매우 쉬움", "보통", "매우 어려움"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "항공기 내 반입 금지 물품 중 '보조배터리'는 위탁수하물로 보낼 수 있다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "우리나라의 국적 항공사는 총 몇 개인가요? (2024년 기준)", options: ["7개", "8개", "10개", "11개"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "오늘 교육 장소까지 이용하신 주된 교통수단은 무엇인가요?", options: ["자차", "지하철/버스", "택시", "도보/기타"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "공항 내 보안 검색대에서 노트북은 가방에서 꺼내지 않아도 된다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "KAC의 마스코트인 '포티(Porty)'는 무엇을 형상화한 것일까요?", options: ["비행기", "관제탑", "종이비행기", "구름"], correct: 2, isSurvey: false, isOX: false, checked: true },
    { text: "현재 본인의 직무 분야를 선택해주세요.", options: ["운영/관리", "보안/안전", "기술/정비", "사무/행정"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "한국공항공사가 관리하는 공항 중 국제공항은 총 몇 개입니까?", options: ["5개", "7개", "8개", "14개"], correct: 2, isSurvey: false, isOX: false, checked: true },
    { text: "항공기 이착륙 시 스마트폰은 반드시 '비행기 모드'로 설정해야 한다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "다음 중 이번 교육 과정에서 가장 유익했던 주제는 무엇인가요?", options: ["항공 산업 트렌드", "공항 운영 실무", "안전 관리 시스템", "고객 만족 전략"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "항공기 비상구 좌석 승객은 비상시 승무원의 대피 안내를 도울 의무가 있다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "추후 이와 유사한 심화 교육 과정이 개설된다면 참여할 의사가 있으십니까?", options: ["예 (참여 희망)", "아니오 (검토 필요)"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "오늘 교육에 대한 전반적인 만족도를 점수로 표현해주세요.", options: ["5점", "4점", "3점", "2점", "1점"], correct: 0, isSurvey: true, isOX: false, checked: true }
];

const state = {
    sessionId: (function() {
        let id = sessionStorage.getItem('kac_admin_sid');
        if (!id) {
            id = Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('kac_admin_sid', id);
        }
        return id;
    })(),
    room: null,
    isTestMode: false,
    quizList: [],
    isExternalFileLoaded: false, 
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null,
    pendingRoom: null,
    adminCallback: null 
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null, connections: null };

// --- 1. Auth ---
const authMgr = {
    ADMIN_EMAIL: "admin@kac.com", 
    tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        if(!inputPw) return ui.showAlert("비밀번호를 입력해주세요.");
        try {
            await firebase.auth().signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            document.getElementById('loginOverlay').style.display = 'none';
            dataMgr.loadInitialData();
        } catch (error) {
            ui.showAlert("⛔ 비밀번호가 올바르지 않습니다.");
        }
    },
    logout: function() {
        if(confirm("로그아웃 하시겠습니까?")) {
            sessionStorage.removeItem('kac_admin_sid');
            firebase.auth().signOut().then(() => location.reload());
        }
    },
    executeChangePw: async function() {
        const user = firebase.auth().currentUser;
        const newPw = document.getElementById('cp-new').value;
        const confirmPw = document.getElementById('cp-confirm').value;
        if(!newPw || newPw !== confirmPw) return ui.showAlert("비밀번호를 확인해주세요.");
        try { await user.updatePassword(newPw); ui.showAlert("변경 완료!"); ui.closePwModal(); } catch (e) { ui.showAlert(e.message); }
    }
};

// --- 2. Data Manager ---
const dataMgr = {
    checkAdminSecret: async function(input) {
        const snap = await firebase.database().ref('system/adminSecret').get();
        const dbSecret = snap.val() || btoa("kac123!@#"); 
        return btoa(input) === dbSecret;
    },
    updateAdminSecret: async function() {
        const curr = document.getElementById('secret-current').value;
        const next = document.getElementById('secret-new').value;
        if(!await this.checkAdminSecret(curr)) return ui.showAlert("현재 관리자 암호가 틀립니다.");
        await firebase.database().ref('system/adminSecret').set(btoa(next));
        ui.showAlert("시스템 관리자 암호 변경 완료."); ui.closeSecretModal();
    },
    initSystem: function() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) { document.getElementById('loginOverlay').style.display = 'none'; this.loadInitialData(); } 
            else { document.getElementById('loginOverlay').style.display = 'flex'; }
        });
    },
    loadInitialData: function() {
        ui.initRoomSelect();
        ui.showWaitingRoom();
        state.quizList = DEFAULT_QUIZ_DATA;
        quizMgr.renderMiniList();
        document.getElementById('roomSelect').onchange = (e) => this.switchRoomAttempt(e.target.value);
        document.getElementById('quizFile').onchange = (e) => quizMgr.loadFile(e);
    },
    switchRoomAttempt: async function(newRoom) {
        const snap = await firebase.database().ref(`courses/${newRoom}/status`).get();
        const st = snap.val() || {};
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            state.pendingRoom = newRoom;
            document.getElementById('takeoverModal').style.display = 'flex';
        } else { this.forceEnterRoom(newRoom); }
    },
    forceEnterRoom: async function(room) {
        document.getElementById('floatingQR').style.display = 'none';
        if (state.room) {
            const oldPath = `courses/${state.room}`;
            firebase.database().ref(`${oldPath}/questions`).off();
            firebase.database().ref(`${oldPath}/status`).off();
        }
        state.room = room;
        localStorage.setItem('kac_last_room', room);
        ui.updateHeaderRoom(room);
        ui.setMode('qa');
        
        const rPath = `courses/${room}`;
        dbRef.settings = firebase.database().ref(`${rPath}/settings`);
        dbRef.qa = firebase.database().ref(`${rPath}/questions`);
        dbRef.status = firebase.database().ref(`${rPath}/status`);
        dbRef.connections = firebase.database().ref(`${rPath}/connections`);

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        dbRef.status.on('value', s => ui.checkLockStatus(s.val() || {}));
        dbRef.connections.on('value', s => document.getElementById('currentJoinCount').innerText = s.numChildren());
        dbRef.qa.on('value', s => { state.qaData = s.val() || {}; ui.renderQaList(); });
        this.fetchCodeAndRenderQr(room);
    },
    fetchCodeAndRenderQr: function(room) {
        const pathArr = window.location.pathname.split('/'); pathArr.pop(); 
        const baseUrl = window.location.origin + pathArr.join('/') + '/index.html';
        ui.renderQr(`${baseUrl}?room=${room}`);
    },
    saveSettings: function() {
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;
        firebase.database().ref(`courses/${state.room}/settings`).update({ courseName: newName });
        firebase.database().ref(`courses/${state.room}/status`).update({ 
            roomStatus: statusVal, 
            ownerSessionId: statusVal === 'active' ? state.sessionId : null 
        });
        ui.showAlert("설정 저장 완료.");
    },
    resetCourse: function() {
        if(confirm("현재 강의실 데이터를 초기화하시겠습니까?")) {
            firebase.database().ref(`courses/${state.room}`).set(null).then(() => location.reload());
        }
    },
    deactivateAllRooms: async function() {
        if(!confirm("모든 강의실을 '비어있음'으로 변경하시겠습니까?")) return;
        const updates = {};
        for(let i=65; i<=90; i++) { updates[`courses/${String.fromCharCode(i)}/status/roomStatus`] = 'idle'; }
        await firebase.database().ref().update(updates);
        ui.showAlert("전체 비활성화 완료.");
    },
    updateQa: function(action) {
        if(!state.activeQaKey) return;
        if(action === 'delete') { dbRef.qa.child(state.activeQaKey).remove(); ui.closeQaModal(); }
        else { dbRef.qa.child(state.activeQaKey).update({ status: action }); ui.closeQaModal(); }
    }
};

// --- 3. UI Manager ---
const ui = {
    showAlert: function(msg) {
        document.getElementById('customAlertText').innerText = msg;
        document.getElementById('customAlertModal').style.display = 'flex';
    },
    requestAdminAuth: function(type) {
        if(type === 'pw') state.adminCallback = () => ui.openPwModal();
        else if(type === 'idle') state.adminCallback = () => dataMgr.deactivateAllRooms();
        document.getElementById('adminAuthInput').value = "";
        document.getElementById('adminAuthModal').style.display = 'flex';
        document.getElementById('adminAuthInput').focus();
    },
    confirmAdminAuth: async function() {
        if(await dataMgr.checkAdminSecret(document.getElementById('adminAuthInput').value)) {
            document.getElementById('adminAuthModal').style.display = 'none';
            if(state.adminCallback) state.adminCallback();
        } else { ui.showAlert("인증 실패!"); }
    },
    closeAdminAuth: function() { document.getElementById('adminAuthModal').style.display = 'none'; },
    openSecretModal: function() { document.getElementById('changeAdminSecretModal').style.display = 'flex'; },
    closeSecretModal: function() { document.getElementById('changeAdminSecretModal').style.display = 'none'; },
    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', s => {
            const d = s.val() || {}; const sel = document.getElementById('roomSelect');
            const savedValue = sel.value || state.room; sel.innerHTML = '<option value="" disabled selected>Select Room ▾</option>';
            for(let i=65; i<=90; i++) {
                const c = String.fromCharCode(i); const st = (d[c] || {}).status || {};
                const userCount = d[c] && d[c].connections ? Object.keys(d[c].connections).length : 0;
                const opt = document.createElement('option'); opt.value = c;
                opt.innerText = `Room ${c} (${st.roomStatus === 'active' ? '🔴사용중' : '⚪대기'}, ${userCount}명)`;
                if(c === savedValue) opt.selected = true; sel.appendChild(opt);
            }
        });
    },
    toggleMiniQR: function() {
        const qrBox = document.getElementById('floatingQR');
        if (!state.room) return ui.showAlert("강의실을 선택하세요.");
        if (qrBox.style.display === 'flex') { qrBox.style.display = 'none'; } 
        else {
            qrBox.style.display = 'flex';
            const target = document.getElementById('miniQRElement'); target.innerHTML = "";
            const pathArr = window.location.pathname.split('/'); pathArr.pop();
            const baseUrl = window.location.origin + pathArr.join('/') + '/index.html';
            const forcedUrl = `${baseUrl}?room=${state.room}`;
            document.querySelector('.qr-label').innerText = `Room ${state.room} Join`;
            new QRCode(target, { text: forcedUrl, width: 140, height: 140, correctLevel: QRCode.CorrectLevel.H });
        }
    },
    checkLockStatus: function(st) {
        document.getElementById('statusOverlay').style.display = (st.roomStatus === 'active' && st.ownerSessionId === state.sessionId) ? 'none' : 'flex';
    },
    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderSettings: function(d) {
        document.getElementById('courseNameInput').value = d.courseName || "";
        document.getElementById('displayCourseTitle').innerText = d.courseName || "";
    },
    renderRoomStatus: function(st) { document.getElementById('roomStatusSelect').value = st || 'idle'; },
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: url, width: 35, height: 35 });
    },
    setMode: function(mode) {
        document.getElementById('view-waiting').style.display = 'none';
        document.getElementById('view-qa').style.display = (mode==='qa'?'flex':'none');
        document.getElementById('view-quiz').style.display = (mode==='quiz'?'flex':'none');
        if (state.room) firebase.database().ref(`courses/${state.room}/status/mode`).set(mode);
    },
    renderQaList: function() {
        const list = document.getElementById('qaList'); list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));
        items.sort((a,b) => b.timestamp - a.timestamp);
        items.forEach(i => {
            const cls = i.status==='pin'?'status-pin':(i.status==='later'?'status-later':(i.status==='done'?'status-done':''));
            list.innerHTML += `<div class="q-card ${cls}" onclick="ui.openQaModal('${i.id}')"><div class="q-content">${i.text}</div><div class="q-meta"><div class="q-like-badge">👍 ${i.likes||0}</div></div></div>`;
        });
    },
    openQaModal: function(k) { state.activeQaKey=k; document.getElementById('m-text').innerText=state.qaData[k].text; document.getElementById('qaModal').style.display='flex'; },
    closeQaModal: function() { document.getElementById('qaModal').style.display = 'none'; },
    openPwModal: function() { document.getElementById('changePwModal').style.display='flex'; },
    closePwModal: function() { document.getElementById('changePwModal').style.display='none'; },
    toggleNightMode: function() { document.body.classList.toggle('night-mode'); },
    toggleRightPanel: function() { document.getElementById('rightPanel').classList.toggle('open'); },
    toggleFullScreen: function() {
        const elem = document.querySelector('.main-stage');
        if (!document.fullscreenElement) elem.requestFullscreen(); else document.exitFullscreen();
    },
    showWaitingRoom: function() {
        state.room = null; document.getElementById('view-waiting').style.display = 'flex';
    }
};

// --- 4. Quiz Logic ---
const quizMgr = {
    loadFile: function(e) {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (evt) => {
            const b = evt.target.result.trim().split(/\n\s*\n/);
            state.quizList = b.map(bl => {
                const l = bl.split('\n').map(x=>x.trim()).filter(x=>x);
                return { text: l[0], options: l.slice(1, l.length - 1), correct: parseInt(l[l.length-1]) || 0 };
            });
            ui.showAlert(`${state.quizList.length}개 로드 완료.`); this.showQuiz();
        };
        r.readAsText(f);
    },
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); d.innerHTML = state.quizList.map((q, i) => `<div style="padding:5px; border-bottom:1px solid #eee;">Q${i+1}. ${q.text.substring(0,15)}...</div>`).join('');
    },
    showQuiz: function() {
        const q = state.quizList[state.currentQuizIdx];
        if(!q) return;
        document.getElementById('d-qtext').innerText = q.text;
        document.getElementById('d-options').innerHTML = q.options.map((o, i) => `<div class="quiz-opt">${i+1}. ${o}</div>`).join('');
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ ...q, status: 'ready' });
        document.getElementById('quizControls').style.display = 'flex';
    },
    action: function(act) { firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act }); },
    prevNext: function(d) { 
        let nextIdx = state.currentQuizIdx + d;
        if(nextIdx >= 0 && nextIdx < state.quizList.length) {
            state.currentQuizIdx = nextIdx;
            this.showQuiz();
        }
    },
    downloadSample: function() {
        const guideAndSamples = 
`[KAC 퀴즈 파일 작성 규칙 가이드]
1. 첫 줄은 질문 내용을 적습니다.
2. 다음 줄부터는 선택지를 한 줄에 하나씩 적습니다.
3. 마지막 줄에는 정답 번호(숫자)를 적습니다.
4. 성적에 포함되지 않는 '설문'은 숫자 대신 SURVEY 라고 적습니다.
5. 문제와 문제 사이는 반드시 '한 줄 공백'을 둡니다.

--------------------------------------------------
[샘플 20문항 시작]

한국공항공사(KAC)의 본사는 김포공항 내에 위치하고 있다.
O
X
1

비행기 기내에는 휴대용 라이터를 1개도 반입할 수 없다.
O (반입 가능)
X (반입 불가)
2

항공기 탑승 시 신분증 대신 생체정보(정맥)를 이용할 수 있는 서비스 이름은?
스마트패스
원패스
바이오패스
하이패스
3

현재 교육생 여러분의 소속 본부는 어디이신가요?
본사
서울지역본부
제주지역본부
남부지역본부
SURVEY

김포국제공항의 IATA 공항 코드는 GMP이다.
O
X
1

국내 모든 공항의 주차장은 교육생에게 항상 무료로 개방된다.
O
X
2

제주국제공항은 우리나라에서 이용객이 가장 많은 공항이다.
O
X
2

오늘 진행되는 교육 내용의 전반적인 난이도는 어떠한가요?
매우 쉬움
보통
매우 어려움
SURVEY

항공기 내 반입 금지 물품 중 '보조배터리'는 위탁수하물로 보낼 수 있다.
O
X
2

우리나라의 국적 항공사는 총 몇 개인가요? (2024년 기준)
7개
8개
10개
11개
3

오늘 교육 장소까지 이용하신 주된 교통수단은 무엇인가요?
자차
지하철/버스
택시
도보/기타
SURVEY

공항 내 보안 검색대에서 노트북은 가방에서 꺼내지 않아도 된다.
O
X
2

KAC의 마스코트인 '포티(Porty)'는 무엇을 형상화한 것일까요?
비행기
관제탑
종이비행기
구름
2

현재 본인의 직무 분야를 선택해주세요.
운영/관리
보안/안전
기술/정비
사무/행정
SURVEY

한국공항공사가 관리하는 공항 중 국제공항은 총 몇 개입니까?
5개
7개
8개
14개
2

항공기 이착륙 시 스마트폰은 반드시 '비행기 모드'로 설정해야 한다.
O
X
1

이번 교육 과정에서 가장 유익했던 주제는 무엇인가요?
항공 산업 트렌드
공항 운영 실무
안전 관리 시스템
고객 만족 전략
SURVEY

항공기 비상구 좌석 승객은 비상시 승무원의 대피 안내를 도울 의무가 있다.
O
X
1

추후 이와 유사한 심화 교육 과정이 개설된다면 참여할 의사가 있으십니까?
예 (참여 희망)
아니오 (검토 필요)
SURVEY

오늘 교육에 대한 전반적인 만족도를 점수로 표현해주세요.
5점 (매우 만족)
4점 (만족)
3점 (보통)
2점 (불만족)
1점 (매우 불만족)
SURVEY`;
        const blob = new Blob([guideAndSamples], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = "KAC_Quiz_Sample.txt"; a.click();
        ui.showAlert("가이드와 샘플 문항이 포함된 파일이 다운로드되었습니다.");
    }
};

// --- 5. Print Manager (최종 레이아웃 수정본) ---
const printMgr = {
    openInputModal: function() { document.getElementById('printInputModal').style.display = 'flex'; },
    closeInputModal: function() { document.getElementById('printInputModal').style.display = 'none'; },
    confirmPrint: function() { 
        this.closeInputModal();
        const date = document.getElementById('printDateInput').value || new Date().toLocaleDateString();
        const prof = document.getElementById('printProfInput').value || "담당 교수";
        this.openPreview(date, prof);
    },
    openPreview: function(date, prof) { 
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value || "과정명 미설정"; 
        document.getElementById('doc-date').innerText = date; 
        document.getElementById('doc-prof').innerText = prof || "담당 교수";
        
        const listBody = document.getElementById('docListBody');
        const items = Object.values(state.qaData || {}).sort((a,b) => a.timestamp - b.timestamp);
        
        if (items.length === 0) {
            listBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:30px;'>질문 내역이 없습니다.</td></tr>";
        } else {
            listBody.innerHTML = items.map((item, idx) => {
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                let stLabel = (item.status === 'pin') ? "중요📌" : (item.status === 'done' ? "완료" : "일반");
                return `<tr><td style="text-align:center;">${idx+1}</td><td>${item.text}</td><td style="text-align:center;">${timeStr}</td><td style="text-align:center;">${item.likes||0}</td><td style="text-align:center;">${stLabel}</td></tr>`;
            }).join('');
        }
        document.getElementById('printPreviewModal').style.display = 'flex'; 
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },
    executePrint: function() { window.print(); }
};

window.onload = function() { dataMgr.initSystem(); };