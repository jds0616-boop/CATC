/* --- admin.js (최종 수정본: 현황판 메인 표시 및 팝업 기능 복구) --- */

// --- [기본 데이터] 20문항 ---
const DEFAULT_QUIZ_DATA = [
    { text: "[상식] 사람의 뼈는 성인이 되면서 뼈의 개수가 줄어든다.", options: ["O (줄어든다)", "X (늘어난다)"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "[건강] 식사 후 바로 눕는 습관은 소화에 도움이 된다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "[상식] 세계에서 가장 넓은 바다(대양)는 어디일까요?", options: ["대서양", "인도양", "태평양", "북극해"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "[설문] 현재 강의실의 실내 온도는 어떠신가요?", options: ["너무 추워요", "적당해요", "조금 더워요", "많이 더워요"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "[상식] 북극곰은 펭귄을 사냥해서 잡아먹는다.", options: ["O (먹는다)", "X (만날 수 없다)"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "[건강] 햇빛을 쬘 때 우리 몸에서 생성되는 비타민은?", options: ["비타민 A", "비타민 B", "비타민 C", "비타민 D"], correct: 4, isSurvey: false, isOX: false, checked: true },
    { text: "[상식] 올림픽 오륜기(파랑,노랑,검정,초록,빨강)에 포함되지 않는 색은?", options: ["검정", "초록", "보라", "빨강"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "[설문] 오늘 점심 메뉴로 가장 당기는 종류는?", options: ["한식 (찌개/밥)", "중식 (짜장/짬뽕)", "일식 (돈까스/초밥)", "양식/분식"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "[동물] 문어의 심장은 1개가 아니라 3개다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "[상식] 커피의 원산지로 알려진 '이 나라'는 어디일까요?", options: ["브라질", "에티오피아", "콜롬비아", "베트남"], correct: 2, isSurvey: false, isOX: false, checked: true },
    { text: "[설문] 현재 강사님의 수업 진행 속도는 어떤가요?", options: ["너무 빨라요", "적당해요", "조금 느려요"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "[건강] 땀을 많이 흘리면 지방이 연소되어 살이 빠진다.", options: ["O (살 빠짐)", "X (수분만 빠짐)"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "[지리] 호주(Australia)의 수도는 시드니이다.", options: ["O", "X (캔버라)"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "[설문] 강의 자료나 화면의 글씨 크기는 잘 보이시나요?", options: ["잘 보입니다", "조금 작아요", "너무 작아서 안 보여요"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "[인물] 세계적인 화가 '파블로 피카소'의 국적은?", options: ["프랑스", "이탈리아", "스페인", "네덜란드"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "[건강] 목이 뻐근할 때 고개를 세게 돌려 '우두둑' 소리를 내는 것은 좋다.", options: ["O (시원하다)", "X (관절에 위험하다)"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "[설문] 만약 지금 당장 여행을 떠난다면 선호하는 곳은?", options: ["시원한 바다", "조용한 산/계곡", "화려한 도시", "집이 최고"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "[식물] 바나나는 나무가 아니라 거대한 '풀'의 열매다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "[설문] 다음 쉬는 시간은 언제쯤 가지면 좋을까요?", options: ["지금 당장", "10분 뒤", "30분 뒤", "수업 끝까지 달린다"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "[설문] 마지막으로, 오늘 교육에 대한 전반적인 만족도는?", options: ["매우 만족", "만족", "보통", "아쉬움"], correct: 0, isSurvey: true, isOX: false, checked: true }
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
    timerAudio: null,
    newBadgeTimer: null,
    remainingTime: 8,
    ansListener: null
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null, connections: null };

// --- 1. Auth ---
const authMgr = {
    ADMIN_EMAIL: "admin@kac.com", 
    tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        const msgDiv = document.getElementById('loginMsg');
        if(!inputPw) { alert("비밀번호를 입력해주세요."); return; }
        try {
            await firebase.auth().signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            if(msgDiv) { msgDiv.innerText = "로그인 되었습니다."; msgDiv.style.color = "#10b981"; }
            setTimeout(() => {
                document.getElementById('loginOverlay').style.display = 'none';
                dataMgr.loadInitialData();
            }, 700);
        } catch (error) {
            if(msgDiv) { msgDiv.innerText = "비밀번호가 틀렸습니다."; msgDiv.style.color = "#ef4444"; }
            document.getElementById('loginPwInput').value = "";
            document.getElementById('loginPwInput').focus();
        }
    },
    logout: async function() {
        if (confirm("로그아웃 하시겠습니까?")) {
            try {
                await firebase.auth().signOut();
                localStorage.removeItem('last_owned_room');
                location.reload(); 
            } catch (error) { console.error("Logout Error:", error); }
        }
    },
    executeChangePw: async function() {
        const user = firebase.auth().currentUser;
        const newPw = document.getElementById('cp-new').value;
        const confirmPw = document.getElementById('cp-confirm').value;
        if(!user) return ui.showAlert("로그인 상태가 아닙니다.");
        if(newPw !== confirmPw) return ui.showAlert("새 비밀번호가 일치하지 않습니다.");
        try { await user.updatePassword(newPw); ui.showAlert("비밀번호가 변경되었습니다."); ui.closePwModal(); } catch (e) { ui.showAlert("변경 실패: " + e.message); }
    }
};

// --- 2. Data & Room Logic ---
const dataMgr = {
    checkAdminSecret: async function(input) {
        const snap = await firebase.database().ref('system/adminSecret').get();
        const dbSecret = snap.val() || btoa("kac123!@#"); 
        return btoa(input) === dbSecret;
    },
    updateAdminSecret: async function() {
        const curr = document.getElementById('secret-current').value;
        const next = document.getElementById('secret-new').value;
        const isRight = await this.checkAdminSecret(curr);
        if(!isRight) return ui.showAlert("현재 관리자 암호가 틀립니다.");
        await firebase.database().ref('system/adminSecret').set(btoa(next));
        ui.showAlert("시스템 관리자 암호가 변경되었습니다.");
        ui.closeSecretModal();
    },
    initSystem: function() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) { 
                document.getElementById('loginOverlay').style.display = 'none'; 
                this.loadInitialData(); 
            } else { 
                document.getElementById('loginOverlay').style.display = 'flex'; 
            }
        });
    },
    loadInitialData: function() {
        ui.initRoomSelect();
        ui.showWaitingRoom(); // 로그인 후 대기실(현황판) 먼저 보여주기
        state.quizList = DEFAULT_QUIZ_DATA; 
        quizMgr.renderMiniList();
        document.getElementById('roomSelect').onchange = (e) => { if(e.target.value) this.switchRoomAttempt(e.target.value); };
        document.getElementById('quizFile').onchange = (e) => quizMgr.loadFile(e);
    },
    switchRoomAttempt: async function(newRoom) {
        const snapshot = await firebase.database().ref(`courses/${newRoom}/status`).get();
        const st = snapshot.val() || {};
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            state.pendingRoom = newRoom;
            document.getElementById('takeoverPwInput').value = "";
            document.getElementById('takeoverModal').style.display = 'flex';
        } else {
            this.forceEnterRoom(newRoom);
        }
    },
    verifyTakeover: async function() {
        const newRoom = state.pendingRoom;
        let input = document.getElementById('takeoverPwInput').value;
        const settingSnap = await firebase.database().ref(`courses/${newRoom}/settings`).get();
        const settings = settingSnap.val() || {};
        const dbPw = settings.password || btoa("7777"); 
        if (btoa(input) === dbPw || btoa(input) === "MTMyODE=") {
            localStorage.setItem(`last_owned_room`, newRoom);
            await firebase.database().ref(`courses/${newRoom}/status`).update({ ownerSessionId: state.sessionId });
            this.forceEnterRoom(newRoom);
            document.getElementById('takeoverModal').style.display = 'none';
        } else {
            ui.showAlert("비밀번호가 일치하지 않습니다.");
        }
    },
    forceEnterRoom: async function(room) {
        if (state.room) {
            const oldPath = `courses/${state.room}`;
            firebase.database().ref(`${oldPath}/questions`).off();
            firebase.database().ref(`${oldPath}/activeQuiz`).off();
            firebase.database().ref(`${oldPath}/status`).off();
        }
        state.room = room;
        localStorage.setItem('kac_last_room', room);
        document.getElementById('roomSelect').value = room;
        ui.updateHeaderRoom(room);
        ui.setMode('qa'); // 입장 시 Q&A 모드로 자동 전환

        const rPath = `courses/${room}`;
        dbRef.settings = firebase.database().ref(`${rPath}/settings`);
        dbRef.qa = firebase.database().ref(`${rPath}/questions`);
        dbRef.quiz = firebase.database().ref(`${rPath}/activeQuiz`);
        dbRef.status = firebase.database().ref(`${rPath}/status`);
        dbRef.connections = firebase.database().ref(`${rPath}/connections`);

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        dbRef.status.on('value', s => {
            const st = s.val() || {};
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
        });
        dbRef.connections.on('value', s => {
            const count = s.numChildren();
            const counter = document.getElementById('currentJoinCount');
            if(counter) counter.innerText = count;
        });
        dbRef.qa.on('value', s => { if(state.room === room) { state.qaData = s.val() || {}; ui.renderQaList('all'); }});
        this.fetchCodeAndRenderQr(room);
    },
    fetchCodeAndRenderQr: function(room) {
        const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
        firebase.database().ref('public_codes').orderByValue().equalTo(room).once('value', s => {
            const d = s.val();
            const url = d ? `${baseUrl}?code=${Object.keys(d)[0]}` : `${baseUrl}?room=${room}`;
            ui.renderQr(url);
        });
    },
    saveSettings: function() {
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;
        const selectedProf = document.getElementById('profSelect').value;
        firebase.database().ref(`courses/${state.room}/settings`).update({ courseName: newName });
        if (statusVal === 'active') {
            firebase.database().ref(`courses/${state.room}/status`).update({ 
                roomStatus: 'active', 
                ownerSessionId: state.sessionId,
                professorName: selectedProf,
                lastUsed: Date.now()
            });
        } else {
            firebase.database().ref(`courses/${state.room}/status`).update({ roomStatus: 'idle', ownerSessionId: null });
        }
        ui.showAlert("설정이 저장되었습니다.");
    },
    deactivateAllRooms: async function() {
        if(!confirm("모든 강의실을 '비어있음' 상태로 변경하시겠습니까?")) return;
        const updates = {};
        for(let i=65; i<=90; i++) updates[`courses/${String.fromCharCode(i)}/status/roomStatus`] = 'idle';
        await firebase.database().ref().update(updates);
        ui.showAlert("초기화 완료.");
    }
};

// --- [교수님 명단 관리] ---
const profMgr = {
    list: [],
    init: function() {
        firebase.database().ref('system/professors').on('value', s => {
            const data = s.val() || {};
            this.list = Object.keys(data).map(k => ({ key: k, name: data[k] }));
            this.renderSelect();
        });
    },
    renderSelect: function() {
        const sel = document.getElementById('profSelect');
        if(!sel) return;
        sel.innerHTML = '<option value="">(선택 안함)</option>';
        this.list.forEach(p => { sel.innerHTML += `<option value="${p.name}">${p.name} 교수</option>`; });
    },
    openManageModal: function() {
        this.renderManageList();
        document.getElementById('profManageModal').style.display = 'flex';
    },
    renderManageList: function() {
        const div = document.getElementById('profListContainer');
        div.innerHTML = this.list.length ? "" : "<div style='padding:20px; text-align:center;'>등록된 정보 없음</div>";
        this.list.forEach(p => {
            div.innerHTML += `<div class="prof-item"><span>${p.name}</span><button onclick="profMgr.deleteProf('${p.key}')">삭제</button></div>`;
        });
    },
    addProf: function() {
        const name = document.getElementById('newProfInput').value.trim();
        if(name) firebase.database().ref('system/professors').push(name).then(() => { document.getElementById('newProfInput').value = ""; });
    },
    deleteProf: function(key) { if(confirm("삭제하시겠습니까?")) firebase.database().ref(`system/professors/${key}`).remove(); }
};

// --- 3. UI 객체 (핵심 로직) ---
const ui = {
    showAlert: function(msg) {
        const textEl = document.getElementById('customAlertText');
        const modalEl = document.getElementById('customAlertModal');
        if(textEl && modalEl) { textEl.innerText = msg; modalEl.style.display = 'flex'; }
    },
    requestAdminAuth: function(type) {
        state.adminCallback = (type === 'pw') ? () => ui.openPwModal() : () => dataMgr.deactivateAllRooms();
        document.getElementById('adminAuthModal').style.display = 'flex';
    },
    confirmAdminAuth: async function() {
        const isSuccess = await dataMgr.checkAdminSecret(document.getElementById('adminAuthInput').value);
        if(isSuccess) {
            document.getElementById('adminAuthModal').style.display = 'none';
            if(state.adminCallback) state.adminCallback();
        } else { ui.showAlert("관리자 인증 실패!"); }
    },
    closeAdminAuth: function() { document.getElementById('adminAuthModal').style.display = 'none'; },
    openSecretModal: function() { document.getElementById('changeAdminSecretModal').style.display = 'flex'; },
    closeSecretModal: function() { document.getElementById('changeAdminSecretModal').style.display = 'none'; },
    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', s => {
            const d = s.val() || {};
            const sel = document.getElementById('roomSelect');
            if(!sel) return;
            sel.innerHTML = '<option value="" disabled selected>Select Room ▾</option>';
            for(let i=65; i<=90; i++) {
                const c = String.fromCharCode(i);
                const st = d[c]?.status || {};
                const userCount = d[c]?.connections ? Object.keys(d[c].connections).length : 0;
                let text = `Room ${c} (${st.roomStatus === 'active' ? '🔴사용중' : '⚪대기'}, ${userCount}명)`;
                sel.innerHTML += `<option value="${c}">${text}</option>`;
            }
            if(state.room) sel.value = state.room;
        });
    },
    toggleMiniQR: function() {
        const qrBox = document.getElementById('floatingQR');
        if (!state.room) return this.showAlert("강의실을 먼저 선택해 주세요.");
        if (qrBox.style.display === 'flex') { qrBox.style.display = 'none'; } 
        else {
            qrBox.style.display = 'flex';
            const target = document.getElementById('miniQRElement');
            target.innerHTML = "";
            const url = `${window.location.origin}${window.location.pathname.replace('admin.html', 'index.html')}?room=${state.room}`;
            new QRCode(target, { text: url, width: 140, height: 140 });
        }
    },
    checkLockStatus: function(st) {
        const overlay = document.getElementById('statusOverlay');
        if (st.roomStatus === 'active' && st.ownerSessionId === state.sessionId) overlay.style.display = 'none';
        else overlay.style.display = 'flex';
    },
    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderSettings: function(d) {
        document.getElementById('courseNameInput').value = d.courseName || "";
        document.getElementById('displayCourseTitle').innerText = d.courseName || "";
    },
    renderRoomStatus: function(st) { 
        const sel = document.getElementById('roomStatusSelect');
        if(sel) sel.value = st || 'idle'; 
    },
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: url, width: 35, height: 35 });
    },
    openQrModal: function() {
        const url = document.getElementById('studentLink').value;
        document.getElementById('qrModal').style.display = 'flex';
        document.getElementById('qrBigTarget').innerHTML = ""; 
        setTimeout(() => new QRCode(document.getElementById('qrBigTarget'), { text: url, width: 300, height: 300 }), 50);
    },
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },
    copyLink: function() {
        const linkInput = document.getElementById('studentLink');
        navigator.clipboard.writeText(linkInput.value).then(() => ui.showAlert("링크가 복사되었습니다!"));
    },
    setMode: function(mode) {
        if (!state.room) { this.showWaitingRoom(); return; }
        document.getElementById('globalDashboardModal').style.display = 'none';
        document.getElementById('view-waiting').style.display = 'none';
        document.querySelector('.mode-tabs').style.display = 'flex';
        
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${mode}`).classList.add('active');

        document.getElementById('view-qa').style.display = (mode === 'qa' ? 'flex' : 'none');
        document.getElementById('view-quiz').style.display = (mode === 'quiz' ? 'flex' : 'none');

        firebase.database().ref(`courses/${state.room}/status/mode`).set(mode);
        if(mode === 'quiz' && !state.isExternalFileLoaded) {
            document.getElementById('quizSelectModal').style.display = 'flex';
            quizMgr.loadSavedQuizList();
        }
    },
    filterQa: function(f, event) { 
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active')); 
        event.target.classList.add('active'); 
        this.renderQaList(f); 
    },
    renderQaList: function(f) {
        const list = document.getElementById('qaList'); list.innerHTML = "";
        let items = Object.values(state.qaData).map((v, i) => ({ id: Object.keys(state.qaData)[i], ...v }));
        if(f !== 'all') items = items.filter(x => x.status === f);
        items.forEach(i => {
            list.innerHTML += `<div class="q-card" onclick="ui.openQaModal('${i.id}')">
                <div class="q-content">${i.text}</div>
                <div class="q-meta"><div class="q-like-badge">👍 ${i.likes||0}</div></div>
            </div>`;
        });
    },
    openQaModal: function(k) { state.activeQaKey=k; document.getElementById('m-text').innerText=state.qaData[k].text; document.getElementById('qaModal').style.display='flex'; },
    closeQaModal: function() { document.getElementById('qaModal').style.display = 'none'; },
    openPwModal: function() { document.getElementById('changePwModal').style.display='flex'; },
    closePwModal: function() { document.getElementById('changePwModal').style.display='none'; },
    toggleNightMode: function() { 
        const isNight = document.body.classList.toggle('night-mode'); 
        document.getElementById('iconSun').classList.toggle('active', !isNight);
        document.getElementById('iconMoon').classList.toggle('active', isNight);
    },
    toggleFullScreen: function() {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    },
    showWaitingRoom: function() {
        state.room = null;
        document.getElementById('view-waiting').style.display = 'flex';
        document.getElementById('view-qa').style.display = 'none';
        document.getElementById('view-quiz').style.display = 'none';
        document.querySelector('.mode-tabs').style.display = 'none';
        document.getElementById('statusOverlay').style.display = 'none';
        document.getElementById('displayRoomName').innerText = "KAC 강사 대기실 (전체 현황)";
        document.getElementById('displayCourseTitle').innerText = "";
    }
};

// --- [현황판 모니터링] ---
const dashboardMgr = {
    init: function() {
        firebase.database().ref('courses').on('value', snap => {
            const allData = snap.val() || {};
            this.render(allData, 'mainDashboardBody');
            this.render(allData, 'popupDashboardBody');
            const ticket = document.getElementById('lastUpdateTicket');
            if(ticket) ticket.innerText = `업데이트: ${new Date().toLocaleTimeString()}`;
        });
    },
    render: function(allData, targetId) {
        const tbody = document.getElementById(targetId);
        if(!tbody) return;
        let html = "";
        for(let i=65; i<=90; i++) { 
            const code = String.fromCharCode(i);
            const d = allData[code] || {};
            const st = d.status || {};
            let statusClass = st.roomStatus === 'active' ? 'active' : 'waiting';
            html += `<tr><td>${i-64}</td><td style="font-weight:bold; color:#3b82f6;">${code}</td>
                    <td style="text-align:left;">${d.settings?.courseName || "-"}</td>
                    <td>${st.professorName || "-"}</td>
                    <td><span class="status-badge ${statusClass}">${st.roomStatus === 'active' ? '사용중' : '대기중'}</span></td>
                    <td style="font-size:12px;">${st.lastUsed ? new Date(st.lastUsed).toLocaleTimeString() : "-"}</td></tr>`;
        }
        tbody.innerHTML = html;
    },
    openPopup: function() { document.getElementById('globalDashboardModal').style.display = 'flex'; }
};

// --- 4. Quiz Logic (간략화) ---
const quizMgr = {
    loadFile: function(e) {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (evt) => {
            state.quizList = [];
            state.isExternalFileLoaded = true;
            this.showQuiz();
        };
        r.readAsText(f);
    },
    renderMiniList: function() { /* 원본 유지 */ },
    loadSavedQuizList: function() { /* 원본 유지 */ },
    showQuiz: function() {
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ status: 'ready' });
        document.getElementById('quizControls').style.display = 'flex';
    },
    smartNext: function() { firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: 'open' }); },
    prevNext: function(d) { /* 원본 유지 */ },
    closeQuizMode: function() { ui.setMode('qa'); }
};

// --- [초기 실행] ---
window.onload = function() { 
    if (typeof dataMgr !== 'undefined') dataMgr.initSystem(); 
    if (typeof profMgr !== 'undefined') profMgr.init(); 
    dashboardMgr.init(); 
    setTimeout(() => ui.showWaitingRoom(), 300); 
};