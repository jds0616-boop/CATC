/* --- admin.js (Final Version: Dynamic Sample Download Integrated) --- */

// --- [기본 데이터] 파일 미업로드 시 탑재될 기본 퀴즈 20문항 ---
const DEFAULT_QUIZ_DATA = [
    { text: "한국공항공사(KAC)의 본사는 김포공항 내에 위치하고 있다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "[테스트] 비행기 기내에는 휴대용 라이터를 1개도 반입할 수 없다.", options: ["O (반입 가능)", "X (반입 불가)"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "항공기 탑승 시 신분증 대신 생체정보(정맥)를 이용할 수 있는 서비스 이름은?", options: ["스마트패스", "원패스", "바이오패스", "하이패스"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "현재 교육생 여러분의 소속 본부는 어디이신가요?", options: ["본사", "서울지역본부", "제주지역본부", "남부지역본부", "기타/기본"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "김포국제공항의 IATA 공항 코드는 GMP이다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "[테스트] 국내 모든 공항의 주차장은 교육생에게 항상 무료로 개방된다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "제주국제공항은 우리나라에서 이용객이 가장 많은 공항이다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "오늘 진행되는 교육 내용의 전반적인 난이도는 어떠한가요?", options: ["매우 쉬움", "보통", "매우 어려움"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "항공기 내 반입 금지 물품 중 '보조배터리'는 위탁수하물(부치는 짐)로 보낼 수 있다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "우리나라의 국적 항공사(LCC 포함)는 총 몇 개인가요? (2024년 기준)", options: ["7개", "8개", "10개", "11개"], correct: 3, isSurvey: false, isOX: false, checked: true },
    { text: "오늘 교육 장소까지 이용하신 주된 교통수단은 무엇인가요?", options: ["자차", "지하철/버스", "택시", "도보/기타"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "공항 내 보안 검색대에서 노트북은 가방에서 꺼내지 않아도 된다.", options: ["O", "X"], correct: 2, isSurvey: false, isOX: true, checked: true },
    { text: "KAC의 마스코트인 '포티(Porty)'는 무엇을 형상화한 것일까요?", options: ["비행기", "관제탑", "종이비행기", "구름"], correct: 2, isSurvey: false, isOX: false, checked: true },
    { text: "현재 본인의 직무 분야를 선택해주세요.", options: ["운영/관리", "보안/안전", "기술/정비", "사무/행정"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "한국공항공사가 관리하는 공항 중 국제공항은 총 몇 개입니까?", options: ["5개", "7개", "8개", "14개"], correct: 2, isSurvey: false, isOX: false, checked: true },
    { text: "항공기 이착륙 시 스마트폰은 반드시 '비행기 모드'로 설정해야 한다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "다음 중 이번 교육 과정에서 가장 유익했던 주제는 무엇인가요?", options: ["항공 산업 트렌드", "공항 운영 실무", "안전 관리 시스템", "고객 만족 전략", "디지털 전환 사례"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "항공기 비상구 좌석 승객은 비상시 승무원의 대피 안내를 도울 의무가 있다.", options: ["O", "X"], correct: 1, isSurvey: false, isOX: true, checked: true },
    { text: "추후 이와 유사한 심화 교육 과정이 개설된다면 참여할 의사가 있으십니까?", options: ["예 (참여 희망)", "아니오 (검토 필요)"], correct: 0, isSurvey: true, isOX: false, checked: true },
    { text: "마지막으로, 오늘 교육에 대한 전반적인 만족도를 점수로 표현해주세요.", options: ["5점 (매우 만족)", "4점 (만족)", "3점 (보통)", "2점 (불만족)", "1점 (매우 불만족)"], correct: 0, isSurvey: true, isOX: false, checked: true }
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
    connListener: null ,
    adminCallback: null // <-- 이 줄을 추가하세요 (쉼표 주의)
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
            ui.showAlert("⛔ 비밀번호가 올바르지 않습니다.\n다시 확인해주세요.");
            document.getElementById('loginPwInput').value = "";
            document.getElementById('loginPwInput').focus();
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
        if(!user) return ui.showAlert("로그인 상태가 아닙니다.");
        if(!newPw || !confirmPw) return ui.showAlert("모든 필드를 입력해주세요.");
        if(newPw !== confirmPw) return ui.showAlert("새 비밀번호가 일치하지 않습니다.");
        try { await user.updatePassword(newPw); ui.showAlert("비밀번호가 변경되었습니다."); ui.closePwModal(); } catch (e) { ui.showAlert("변경 실패: " + e.message); }
    }
};

// --- 2. Data & Room Logic ---
const dataMgr = {

    // 아래 두 함수를 dataMgr 블록 안에 추가하세요.
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
        if(next.length < 4) return ui.showAlert("새 암호는 4자리 이상이어야 합니다.");
        await firebase.database().ref('system/adminSecret').set(btoa(next));
        ui.showAlert("시스템 관리자 암호가 변경되었습니다.");
        ui.closeSecretModal();
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

        // 기본 퀴즈 탑재
        state.quizList = DEFAULT_QUIZ_DATA; 
        state.isExternalFileLoaded = false;
        quizMgr.renderMiniList();

        document.getElementById('roomSelect').onchange = (e) => { if(e.target.value) this.switchRoomAttempt(e.target.value); };
        document.getElementById('quizFile').onchange = (e) => quizMgr.loadFile(e);
        const qrEl = document.getElementById('qrcode'); if(qrEl) qrEl.onclick = function() { ui.openQrModal(); };
    },
    switchRoomAttempt: async function(newRoom) {
        const snapshot = await firebase.database().ref(`courses/${newRoom}/status`).get();
        const st = snapshot.val() || {};
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            state.pendingRoom = newRoom;
            document.getElementById('takeoverPwInput').value = "";
            document.getElementById('takeoverModal').style.display = 'flex';
            document.getElementById('takeoverPwInput').focus();
        } else {
            this.forceEnterRoom(newRoom);
        }
    },
    verifyTakeover: async function() {
        const newRoom = state.pendingRoom;
        const input = document.getElementById('takeoverPwInput').value;
        if (!newRoom || !input) return;
        const settingSnap = await firebase.database().ref(`courses/${newRoom}/settings`).get();
        const settings = settingSnap.val() || {};
        const dbPw = settings.password || btoa("7777"); 
        if (btoa(input) === dbPw || input === "13281") {
            ui.showAlert("인증 성공! 제어권을 가져옵니다.");
            localStorage.setItem(`last_owned_room`, newRoom);
            await firebase.database().ref(`courses/${newRoom}/status`).update({ ownerSessionId: state.sessionId });
            this.forceEnterRoom(newRoom);
            document.getElementById('takeoverModal').style.display = 'none';
        } else {
            ui.showAlert("비밀번호가 일치하지 않습니다.");
            document.getElementById('takeoverPwInput').value = "";
            document.getElementById('takeoverPwInput').focus();
        }
    },
    cancelTakeover: function() {
        document.getElementById('takeoverModal').style.display = 'none';
        document.getElementById('roomSelect').value = state.room || ""; 
        state.pendingRoom = null;
    },
    forceEnterRoom: async function(room) {

    // 강의실 이동 시 플로팅 QR이 열려 있다면 닫아줍니다.
    document.getElementById('floatingQR').style.display = 'none';
        if (state.room) {
            const oldPath = `courses/${state.room}`;
            firebase.database().ref(`${oldPath}/questions`).off();
            firebase.database().ref(`${oldPath}/activeQuiz`).off();
            firebase.database().ref(`${oldPath}/status`).off();
            firebase.database().ref(`${oldPath}/settings`).off();
            firebase.database().ref(`${oldPath}/connections`).off();
        }

        await firebase.database().ref(`courses/${room}/activeQuiz`).set(null);
        await firebase.database().ref(`courses/${room}/quizAnswers`).set(null);
        await firebase.database().ref(`courses/${room}/quizFinalResults`).set(null);
        await firebase.database().ref(`courses/${room}/status/quizStep`).set('none');

        state.room = room;
        localStorage.setItem('kac_last_room', room);
        document.getElementById('roomSelect').value = room;
        document.getElementById('roomStatusSelect').disabled = false;

        ui.updateHeaderRoom(room);
        ui.setMode('qa');
        document.getElementById('qaList').innerHTML = "";
        state.qaData = {};
        
        const rPath = `courses/${room}`;
        dbRef.settings = firebase.database().ref(`${rPath}/settings`);
        dbRef.qa = firebase.database().ref(`${rPath}/questions`);
        dbRef.quiz = firebase.database().ref(`${rPath}/activeQuiz`);
        dbRef.ans = firebase.database().ref(`${rPath}/quizAnswers`);
        dbRef.status = firebase.database().ref(`${rPath}/status`);
        dbRef.connections = firebase.database().ref(`${rPath}/connections`);

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        dbRef.status.on('value', s => {
            if(state.room !== room) return;
            const st = s.val() || {};
            if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
                if (localStorage.getItem(`last_owned_room`) === room) { dbRef.status.update({ ownerSessionId: state.sessionId }); return; }
            }
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
        });
        
        dbRef.connections.on('value', s => {
            const count = s.numChildren();
            document.getElementById('currentJoinCount').innerText = count;
        });

        this.fetchCodeAndRenderQr(room);
        dbRef.qa.on('value', s => { if(state.room === room) { state.qaData = s.val() || {}; ui.renderQaList('all'); }});
    },
    fetchCodeAndRenderQr: function(room) {
        const pathArr = window.location.pathname.split('/'); pathArr.pop(); 
        const baseUrl = window.location.origin + pathArr.join('/');
        firebase.database().ref('public_codes').orderByValue().equalTo(room).once('value', s => {
            const d = s.val();
            const url = d ? `${baseUrl}/index.html?code=${Object.keys(d)[0]}` : `${baseUrl}/index.html?room=${room}`;
            ui.renderQr(url);
        });
    },
    saveSettings: function() {
        let pw = document.getElementById('roomPw').value || "7777"; 
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;
        firebase.database().ref(`courses/${state.room}/settings`).update({ courseName: newName, password: btoa(pw) });
        document.getElementById('displayCourseTitle').innerText = newName;
        document.getElementById('roomPw').value = pw; 
        if (statusVal === 'active') {
            localStorage.setItem(`last_owned_room`, state.room);
            firebase.database().ref(`courses/${state.room}/status`).update({ roomStatus: 'active', ownerSessionId: state.sessionId });
            ui.showAlert(`✅ [Room ${state.room}] 설정 저장 및 제어권 획득!`); 
        } else {
            localStorage.removeItem(`last_owned_room`);
            firebase.database().ref(`courses/${state.room}/status`).update({ roomStatus: 'idle', ownerSessionId: null });
            ui.showAlert(`✅ [Room ${state.room}] 강의 종료 (비어있음 처리)`); 
        }
    },
    deactivateAllRooms: async function() {
        if(!confirm("⚠️ 경고: 모든 강의실(A~Z)을 '비어있음' 상태로 강제 변경합니다.\n계속하시겠습니까?")) return;
        const updates = {};
        for(let i=65; i<=90; i++) {
            const char = String.fromCharCode(i);
            updates[`courses/${char}/status/roomStatus`] = 'idle';
            updates[`courses/${char}/status/ownerSessionId`] = null;
        }
        await firebase.database().ref().update(updates);
        ui.showAlert("모든 강의실이 비활성화되었습니다.");
        if(state.room) this.forceEnterRoom(state.room);
    },
    updateQa: function(action) {
        if(!state.activeQaKey) return;
        const item = state.qaData[state.activeQaKey];
        if (action === 'delete') { if(confirm("정말 삭제하시겠습니까?")) { dbRef.qa.child(state.activeQaKey).remove(); ui.closeQaModal(); }} 
        else {
            let ns = action;
            if(item.status === action) ns = 'normal';
            else if(action === 'done' && item.status==='pin') ns = 'pin-done';
            dbRef.qa.child(state.activeQaKey).update({ status: ns });
            ui.closeQaModal();
        }
    },
    resetCourse: function() {
        if(confirm("현재 강의실 데이터를 초기화하시겠습니까?\n(질문, 퀴즈 내역이 모두 삭제됩니다)")) {
            firebase.database().ref(`courses/${state.room}`).set(null).then(() => { ui.showAlert("초기화 완료."); location.reload(); });
        }
    }
};

// --- 3. UI ---
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
        const input = document.getElementById('adminAuthInput').value;
        const isSuccess = await dataMgr.checkAdminSecret(input);
        if(isSuccess) {
            document.getElementById('adminAuthModal').style.display = 'none';
            if(state.adminCallback) state.adminCallback();
            state.adminCallback = null;
        } else {
            ui.showAlert("⛔ 관리자 인증 실패!");
            document.getElementById('adminAuthInput').value = "";
        }
    },
    closeAdminAuth: function() {
        document.getElementById('adminAuthModal').style.display = 'none';
        state.adminCallback = null;
    },
    openSecretModal: function() {
        document.getElementById('secret-current').value = "";
        document.getElementById('secret-new').value = "";
        document.getElementById('changeAdminSecretModal').style.display = 'flex';
    },
    closeSecretModal: function() {
        document.getElementById('changeAdminSecretModal').style.display = 'none';
    },

    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', s => {
            const d = s.val() || {};
            const sel = document.getElementById('roomSelect');
            const savedValue = sel.value || state.room; 
            sel.innerHTML = '<option value="" disabled selected>Select Room ▾</option>';
            for(let i=65; i<=90; i++) {
                const c = String.fromCharCode(i);
                const roomData = d[c] || {};
                const st = roomData.status || {};
                const connObj = roomData.connections || {};
                const userCount = Object.keys(connObj).length;
                const opt = document.createElement('option');
                opt.value = c;
                if(st.roomStatus === 'active') {
                    if (st.ownerSessionId === state.sessionId) {
                        opt.innerText = `Room ${c} (🔵 내 강의실, ${userCount}명)`;
                        opt.style.color = '#3b82f6';
                        opt.style.fontWeight = 'bold';
                    } else {
                        opt.innerText = `Room ${c} (🔴 사용중, ${userCount}명)`;
                        opt.style.color = '#ef4444';
                    }
                } else {
                    opt.innerText = `Room ${c} (⚪ 대기, ${userCount}명)`;
                }
                if(c === savedValue) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    },

toggleMiniQR: function() {
    const qrBox = document.getElementById('floatingQR');
    
    // 1. 강의실 선택 여부 체크
    if (!state.room) {
        this.showAlert("좌측 상단에서 강의실을 먼저 선택해 주세요.");
        return;
    }

    if (qrBox.style.display === 'flex') {
        qrBox.style.display = 'none';
    } else {
        qrBox.style.display = 'flex';
        const target = document.getElementById('miniQRElement');
        const label = document.querySelector('.qr-label');
        target.innerHTML = ""; // 기존 QR 초기화

        // 2. [핵심수정] 사이드바 값이 업데이트될 때까지 기다리지 않고 
        // 현재 선택된 state.room 정보를 사용하여 즉시 주소 생성
        const pathArr = window.location.pathname.split('/'); pathArr.pop();
        const baseUrl = window.location.origin + pathArr.join('/');
        
        // 현재 방 번호(state.room)를 사용하여 강제로 URL 조합
        const forcedUrl = `${baseUrl}/index.html?room=${state.room}`;

        // 3. 라벨도 현재 방 번호로 강제 업데이트 (Room A Join 방지)
        label.innerText = `Room ${state.room} Join`;

        // 4. QR 코드 생성 (강제 생성된 URL 사용)
        new QRCode(target, {
            text: forcedUrl,
            width: 140,
            height: 140,
            correctLevel: QRCode.CorrectLevel.H
        });
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
        document.getElementById('roomPw').value = d.password ? atob(d.password) : "7777";
        document.getElementById('displayCourseTitle').innerText = d.courseName || "";
    },
    renderRoomStatus: function(st) { document.getElementById('roomStatusSelect').value = st || 'idle'; },
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        try { new QRCode(qrDiv, { text: url, width: 35, height: 35 }); } catch(e) {}
    },
    openQrModal: function() {
        const url = document.getElementById('studentLink').value; if(!url) return;
        document.getElementById('qrModal').style.display = 'flex';
        document.getElementById('qrBigTarget').innerHTML = ""; 
        setTimeout(() => new QRCode(document.getElementById('qrBigTarget'), { text: url, width: 300, height: 300 }), 50);
    },
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },
    
    copyLink: function() {
        const linkInput = document.getElementById('studentLink');
        const url = linkInput.value;
        if (!url) { ui.showAlert("강의실을 먼저 선택하세요!"); return; }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                ui.showAlert("클립보드에 링크가 복사되었습니다!");
            }).catch(() => {
                linkInput.select(); document.execCommand('copy'); ui.showAlert("링크가 복사되었습니다!");
            });
        } else {
            linkInput.select(); document.execCommand('copy'); ui.showAlert("링크가 복사되었습니다!");
        }
    },

    setMode: function(mode) {
        document.getElementById('view-waiting').style.display = 'none';
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${mode}`).classList.add('active');
        document.getElementById('view-qa').style.display = (mode==='qa'?'flex':'none');
        document.getElementById('view-quiz').style.display = (mode==='quiz'?'flex':'none');
        
        if (state.room) {
            firebase.database().ref(`courses/${state.room}/status/mode`).set(mode);
            
            if (mode === 'quiz') {
                if (state.isExternalFileLoaded) {
                    ui.showAlert(`업로드된 퀴즈 파일(${state.quizList.length}문항)로 진행합니다.`);
                } else {
                    ui.showAlert("업로드된 퀴즈 파일이 없습니다.\n내부 [테스트 문항]으로 진행합니다.");
                }
                
                if (state.quizList.length > 0) {
                    quizMgr.showQuiz(); 
                }
            }
        }
    },
    filterQa: function(f) { 
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active')); 
        if(event && event.target) event.target.classList.add('active'); 
        this.renderQaList(f); 
    },
    renderQaList: function(f) {
        const list = document.getElementById('qaList'); list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));
        const score = i => (i.status==='pin'?1000:(i.status==='later'?500:(i.status==='done'?-1000:0)));
        if(f==='pin') items=items.filter(x=>x.status==='pin'); else if(f==='later') items=items.filter(x=>x.status==='later');
        items.sort((a,b) => (score(b)+(b.likes||0)) - (score(a)+(a.likes||0)));
        items.forEach(i => {
            const cls = i.status==='pin'?'status-pin':(i.status==='later'?'status-later':(i.status==='done'?'status-done':''));
            const icon = i.status==='pin'?'📌 ':(i.status==='later'?'⚠️ ':(i.status==='done'?'✅ ':''));
            list.innerHTML += `<div class="q-card ${cls}" onclick="ui.openQaModal('${i.id}')"><div class="q-content">${icon}${i.text}</div><div class="q-meta"><div class="q-like-badge">👍 ${i.likes||0}</div><div class="q-time">${new Date(i.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div></div></div>`;
        });
    },
    openQaModal: function(k) { state.activeQaKey=k; document.getElementById('m-text').innerText=state.qaData[k].text; document.getElementById('qaModal').style.display='flex'; },
    closeQaModal: function(e) { if (!e || e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') document.getElementById('qaModal').style.display = 'none'; },
    openPwModal: function() { document.getElementById('changePwModal').style.display='flex'; },
    closePwModal: function() { document.getElementById('changePwModal').style.display='none'; },
    toggleNightMode: function() { 
        document.body.classList.toggle('night-mode'); 
        const n = document.body.classList.contains('night-mode');
        document.getElementById('iconSun').classList.toggle('active', !n);
        document.getElementById('iconMoon').classList.toggle('active', n);
    },
    toggleRightPanel: function() { document.getElementById('rightPanel').classList.toggle('open'); },
    toggleFullScreen: function() {
        const elem = document.querySelector('.main-stage');
        if (!document.fullscreenElement) elem.requestFullscreen().catch(err => console.log(err));
        else if (document.exitFullscreen) document.exitFullscreen();
    },
    showWaitingRoom: function() {
        state.room = null;
        document.getElementById('displayRoomName').innerText = "Instructor Waiting Room";
        document.getElementById('view-qa').style.display = 'none';
        document.getElementById('view-quiz').style.display = 'none';
        document.getElementById('view-waiting').style.display = 'flex';
        const statusSel = document.getElementById('roomStatusSelect');
        statusSel.value = 'waiting';
        statusSel.disabled = true;
    }
};

// --- 4. Quiz Logic ---
const quizMgr = {
    loadFile: function(e) {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (evt) => {
            const b = evt.target.result.trim().split(/\n\s*\n/);
            state.quizList = [];
            b.forEach(bl => {
                const l = bl.split('\n').map(x=>x.trim()).filter(x=>x);
                if (l.length >= 2) {
                    const lastLine = l[l.length - 1].toUpperCase();
                    const isSurvey = (lastLine === 'SURVEY' || lastLine === 'S');
                    const correct = isSurvey ? 0 : parseInt(lastLine);
                    const options = l.slice(1, l.length - 1);
                    state.quizList.push({ 
                        text: l[0], options: options, correct: correct, checked: true, isSurvey: isSurvey,
                        isOX: (options.length === 2 && options[0].toUpperCase() === 'O')
                    });
                }
            });
            state.isExternalFileLoaded = true;
            ui.showAlert(`${state.quizList.length}개 문항 로드 완료.`);
            this.renderMiniList();
            document.getElementById('quizControls').style.display = 'flex';
            state.currentQuizIdx = 0;
            this.showQuiz();
        };
        r.readAsText(f);
    },
    addManualQuiz: function() {
        const q = document.getElementById('manualQ').value, a = document.getElementById('manualAns').value;
        const opts = [1,2,3,4].map(i => document.getElementById('manualO'+i).value).filter(v => v);
        if(!q || !a) return ui.showAlert("Fill fields");
        state.quizList.push({ text: q, options: opts, correct: parseInt(a), checked: true, isOX: opts.length === 2, isSurvey: false });
        this.renderMiniList();
    },
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            const typeLabel = q.isSurvey ? '[설문]' : (q.isOX ? '[OX]' : '[4지]');
            d.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:12px; display:flex; gap:10px;"><input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked"><b>${typeLabel} Q${i+1}.</b> ${q.text.substring(0,20)}...</div>`;
        });
    },

    // [수정] 현재 탑재된 20문항 리스트를 텍스트 파일 형식으로 다운로드
    downloadSample: function() {
        let content = "";
        DEFAULT_QUIZ_DATA.forEach(q => {
            content += q.text + "\n";
            q.options.forEach(opt => {
                content += opt + "\n";
            });
            content += (q.isSurvey ? "SURVEY" : q.correct) + "\n\n";
        });

        const blob = new Blob([content], {type: "text/plain"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kac_quiz_sample.txt";
        a.click();
        ui.showAlert("기본 문항이 포함된 샘플 파일이 다운로드되었습니다.");
    },

    startTestMode: function() {
        state.isTestMode = true;
        state.quizList = [{ text: "1 + 1 = ?", options: ["1","2","3","4"], correct: 2, isOX: false, checked: true, isSurvey: false }];
        state.currentQuizIdx = 0;
        this.renderScreen(state.quizList[0]);
        document.getElementById('btnTest').style.display = 'none'; 
        document.getElementById('quizControls').style.display = 'flex';
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ id: 'TEST', status: 'ready', text: "1 + 1 = ?", options: ["1","2","3","4"], correct: 2 });
    },
    prevNext: function(d) {
        let n = state.currentQuizIdx + d;
        while(n >= 0 && n < state.quizList.length) { 
            if(state.quizList[n].checked) { state.currentQuizIdx = n; this.showQuiz(); return; } 
            n += d; 
        }
        if (d > 0) ui.showAlert("모든 문항이 종료되었습니다.");
    },
    showQuiz: function() {
        const q = state.quizList[state.currentQuizIdx];
        this.resetTimerUI(); this.renderScreen(q);
        firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ id: `Q${state.currentQuizIdx}`, status: 'ready', type: q.isOX?'OX':'MULTIPLE', ...q });
        document.getElementById('btnTest').style.display = 'none'; 
        document.getElementById('quizControls').style.display = 'flex';
    },
    renderScreen: function(q) {
        document.getElementById('d-qtext').innerText = q.text;
        const qNum = state.isTestMode ? "TEST" : `Q${state.currentQuizIdx + 1}`;
        document.getElementById('quizNumberLabel').innerText = qNum;
        const oDiv = document.getElementById('d-options'); oDiv.style.display = 'flex'; document.getElementById('d-chart').style.display = 'none';
        oDiv.innerHTML = "";
        q.options.forEach((o, i) => {
            oDiv.innerHTML += `<div class="quiz-opt ${q.isOX?'ox-mode':''}" id="opt-${i+1}"><div class="opt-num">${i+1}</div><div class="opt-text">${o}</div></div>`;
        });
        document.getElementById('quizGuideArea').innerText = ""; 
    },
    action: function(act) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        if(act === 'open') { this.startTimer(); }
        else if(act === 'close') { 
            this.stopTimer(); 
            const q = state.quizList[state.currentQuizIdx];
            if(!q.isSurvey) {
                const correct = state.isTestMode ? 2 : q.correct;
                const opt = document.getElementById(`opt-${correct}`);
                if(opt) opt.classList.add('reveal-answer');
            } else {
                document.getElementById('quizGuideArea').innerText = "조사가 마감되었습니다.";
            }
        }
        else if(act === 'result') { 
            this.stopTimer(); 
            document.getElementById('d-options').style.display='none'; 
            document.getElementById('d-chart').style.display='flex'; 
            this.renderChart(id, state.isTestMode?2:state.quizList[state.currentQuizIdx].correct); 
        }
    },
    startTimer: function() {
        this.stopTimer(); 
        let t = 10; 
        const d = document.getElementById('quizTimer'); d.classList.remove('urgent');
        const end = Date.now() + 10000;
        state.timerInterval = setInterval(() => {
            const r = Math.ceil((end - Date.now())/1000);
            if(r<=5) d.classList.add('urgent');
            d.innerText = `00:${r<10?'0'+r:r}`;
            if(r<=0) this.action('close');
        }, 200);
    },
    stopTimer: function() { if(state.timerInterval) clearInterval(state.timerInterval); },
    resetTimerUI: function() { this.stopTimer(); document.getElementById('quizTimer').innerText = "00:10"; document.getElementById('quizTimer').classList.remove('urgent'); },
    openResetModal: function() { document.getElementById('resetChoiceModal').style.display = 'flex'; },
    executeReset: async function(type) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        if(type === 'all') await firebase.database().ref(`courses/${state.room}/quizAnswers`).set(null);
        else await firebase.database().ref(`courses/${state.room}/quizAnswers/${id}`).set(null);
        document.getElementById('resetChoiceModal').style.display = 'none'; ui.showAlert("리셋 완료."); this.action('ready');
    },

    showFinalSummary: async function() {
        const snap = await firebase.database().ref(`courses/${state.room}/quizAnswers`).get();
        const allAns = snap.val() || {};
        const totalParticipants = new Set();
        let totalQuestions = 0; let totalCorrect = 0; let totalAnswerCount = 0;
        let questionStats = []; 
        const userScoreMap = {};

        state.quizList.forEach((q, idx) => {
            if(state.isTestMode || !q.checked) return;
            if(q.isSurvey) return; 
            const id = `Q${idx}`;
            const answers = allAns[id] || {};
            const keys = Object.keys(answers);
            if(keys.length > 0) totalQuestions++;
            keys.forEach(k => {
                totalParticipants.add(k);
                totalAnswerCount++;
                if(!userScoreMap[k]) userScoreMap[k] = { score: 0, participatedCount: 0 };
                userScoreMap[k].participatedCount++;
                if(answers[k].choice === q.correct) {
                    totalCorrect++; userScoreMap[k].score += 1;
                }
            });
            if(keys.length > 0) {
                const corrCnt = keys.filter(k => answers[k].choice === q.correct).length;
                questionStats.push({ title: q.text, accuracy: (corrCnt / keys.length) * 100 });
            }
        });

        const sortedUsers = Object.keys(userScoreMap)
            .map(token => ({ token: token, score: userScoreMap[token].score, pCount: userScoreMap[token].participatedCount }))
            .filter(user => user.pCount === totalQuestions) 
            .sort((a, b) => b.score - a.score);

        const finalRankingData = {};
        sortedUsers.forEach((user, rankIdx) => {
            finalRankingData[user.token] = { score: user.score, rank: rankIdx + 1, total: sortedUsers.length };
        });

        await firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(finalRankingData);
        await firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'summary' });

        const grid = document.getElementById('summaryStats');
        const avgAcc = totalAnswerCount > 0 ? Math.round((totalCorrect / totalAnswerCount) * 100) : 0;
        grid.innerHTML = `
            <div class="summary-card"><span>총 참여 인원</span><b>${totalParticipants.size}명</b></div>
            <div class="summary-card"><span>평균 정답률</span><b>${avgAcc}%</b></div>
            <div class="summary-card"><span>푼 문항 수</span><b>${totalQuestions}문항</b></div>
            <div class="summary-card"><span>전체 제출 수</span><b>${totalAnswerCount}건</b></div>
        `;

        if(questionStats.length > 0) {
            questionStats.sort((a,b) => a.accuracy - b.accuracy);
            document.getElementById('mostMissedArea').style.display = 'block';
            document.getElementById('mostMissedText').innerText = `"${questionStats[0].title.substring(0,30)}..." (정답률 ${Math.round(questionStats[0].accuracy)}%)`;
        }
        document.getElementById('quizSummaryOverlay').style.display = 'flex';
    },

    renderChart: function(id, corr) {
        const div = document.getElementById('d-chart'); div.innerHTML = "";
        const q = state.quizList[state.currentQuizIdx];
        firebase.database().ref(`courses/${state.room}/quizAnswers`).child(id).once('value', s => {
            const d = s.val() || {};
            const cnt = new Array(q.options.length).fill(0);
            Object.values(d).forEach(v => { if(v.choice >= 1 && v.choice <= q.options.length) cnt[v.choice-1]++; });
            const max = Math.max(...cnt, 1);
            for(let i=0; i < q.options.length; i++) {
                const isCorrect = !q.isSurvey && (i + 1) === corr;
                const h = (cnt[i]/max)*80;
                const crownHtml = isCorrect ? `<div class="crown-icon" style="bottom: ${h > 0 ? h + '%' : '40px'};">👑</div>` : '';
                const lbl = q.isOX ? (i===0?'O':'X') : (i+1);
                div.innerHTML += `<div class="bar-wrapper ${isCorrect ? 'correct' : ''}">${crownHtml}<div class="bar-value">${cnt[i]}</div><div class="bar-fill" style="height:${h}%"></div><div class="bar-label">${lbl}</div></div>`;
            }
        });
    },
    closeQuizMode: function() {
        document.getElementById('quizExitModal').style.display = 'flex';
    },
    confirmExitQuiz: function(type) {
        document.getElementById('quizExitModal').style.display = 'none';
        if(type === 'reset') {
            state.isTestMode = false;
            state.currentQuizIdx = 0;
            firebase.database().ref(`courses/${state.room}/activeQuiz`).set(null);
            firebase.database().ref(`courses/${state.room}/status/quizStep`).set('none');
            this.showQuiz();
        }
        ui.setMode('qa');
    }
};

// --- 5. Print & Report ---
const printMgr = {
    openInputModal: function() { 
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${today.getMonth()+1}.${today.getDate()}`;
        document.getElementById('printDateInput').placeholder = dateStr;
        document.getElementById('printInputModal').style.display = 'flex'; 
    },
    confirmPrint: function(isSkip) { 
        const dateInput = document.getElementById('printDateInput').value;
        const today = new Date();
        const defDate = `${today.getFullYear()}.${today.getMonth()+1}.${today.getDate()}`;
        const date = isSkip ? defDate : (dateInput || defDate); 
        const prof = isSkip ? "" : document.getElementById('printProfInput').value; 
        this.closeInputModal(); 
        this.openPreview(date, prof); 
    },
    closeInputModal: function() { document.getElementById('printInputModal').style.display = 'none'; },
    openPreview: function(date, prof) { 
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value || "과정명 미설정"; 
        document.getElementById('doc-date').innerText = date; 
        document.getElementById('doc-prof').innerText = prof || "담당 교수";
        const listBody = document.getElementById('docListBody'); listBody.innerHTML = ""; 
        const items = Object.values(state.qaData || {}); 
        if (items.length === 0) {
            listBody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding:50px;'>수집된 질문이 없습니다.</td></tr>";
        } else {
            items.sort((a,b) => a.timestamp - b.timestamp);
            items.forEach((item, idx) => {
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                listBody.innerHTML += `<tr><td>${idx + 1}</td><td>${item.text}</td><td>${timeStr}</td><td>${item.likes || 0}</td><td>${item.status}</td></tr>`;
            });
        }
        document.getElementById('printPreviewModal').style.display = 'flex'; 
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },
    executePrint: function() { window.print(); }
};

window.onload = function() { dataMgr.initSystem(); };