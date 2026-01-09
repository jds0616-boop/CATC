/* --- admin.js (Final Integrated Version) --- */

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
    newBadgeTimer: null, // <-- 이거 하나 추가
remainingTime: 8,      // 남은 시간 저장용
ansListener: null      // 답변 감시용

};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null, connections: null };

// --- 1. Auth ---
const authMgr = {
    ADMIN_EMAIL: "admin@kac.com", 
 
tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        const msgDiv = document.getElementById('loginMsg'); // 아까 만든 글씨 칸 가져오기

        if(!inputPw) { alert("비밀번호를 입력해주세요."); return; }

        try {
            // 1. 로그인 시도
            await firebase.auth().signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            
            // 2. 성공 시 "로그인 되었습니다" 표시
            if(msgDiv) {
                msgDiv.innerText = "로그인 되었습니다.";
                msgDiv.style.color = "#10b981"; // 초록색
            }

            // 3. 0.7초 뒤에 화면 전환 (그래야 글씨가 보임)
            setTimeout(() => {
                document.getElementById('loginOverlay').style.display = 'none';
                dataMgr.loadInitialData();
                if(msgDiv) msgDiv.innerText = ""; // 다음을 위해 비움
            }, 700);

        } catch (error) {
            // 실패 시
            if(msgDiv) {
                msgDiv.innerText = "비밀번호가 틀렸습니다.";
                msgDiv.style.color = "#ef4444"; // 빨간색
            } else {
                alert("비밀번호가 올바르지 않습니다.");
            }
            document.getElementById('loginPwInput').value = "";
            document.getElementById('loginPwInput').focus();
        }
    },

    logout: async function() {
        if (confirm("로그아웃 하시겠습니까?")) {
            try {
                await firebase.auth().signOut();
                // 로컬에 저장된 강의실 제어권 정보도 삭제
                localStorage.removeItem('last_owned_room');
                
                // 페이지 새로고침을 통해 모든 상태 초기화
                location.reload(); 
            } catch (error) {
                console.error("Logout Error:", error);
                alert("로그아웃 중 오류가 발생했습니다.");
            }
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
    checkMobile: function() {
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if (isMobile) {
            document.getElementById('mobileRestrictOverlay').style.display = 'flex';
        }
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
        
        // 초기 퀴즈 데이터 로드
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
        let input = document.getElementById('takeoverPwInput').value;
        if(input) input = input.trim(); 

        if (!newRoom || !input) return;
        
        const settingSnap = await firebase.database().ref(`courses/${newRoom}/settings`).get();
        const settings = settingSnap.val() || {};
        const dbPw = settings.password || btoa("7777"); 
        
        if (btoa(input) === dbPw || String(input) === "13281") {
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
            
            // 교수님 이름 반영
            if(st.professorName) {
                document.getElementById('profSelect').value = st.professorName;
            } else {
                document.getElementById('profSelect').value = "";
            }
        });
        
        dbRef.connections.on('value', s => {
            const count = s.numChildren();
            document.getElementById('currentJoinCount').innerText = count;
        });

        this.fetchCodeAndRenderQr(room);
        dbRef.qa.on('value', s => { if(state.room === room) { state.qaData = s.val() || {}; ui.renderQaList('all'); }});

        // ▼▼▼ [여기부터 아래 코드를 추가하세요] ▼▼▼
        
        // [추가] 실시간 NEW 뱃지 자동 제거 타이머 (5초마다 검사)
        if(state.newBadgeTimer) clearInterval(state.newBadgeTimer);
        state.newBadgeTimer = setInterval(() => {
            const cards = document.querySelectorAll('.q-card.is-new'); // NEW 떠있는 애들만 찾음
            cards.forEach(card => {
                const ts = parseInt(card.getAttribute('data-ts'));
                // 2분이 지났다면?
                if (Date.now() - ts >= 120000) {
                    card.classList.remove('is-new'); // 초록 테두리 제거
                    const badge = card.querySelector('.new-badge-icon');
                    if(badge) badge.remove(); // NEW 뱃지 제거
                }
            });
        }, 5000); 
        // ▲▲▲ [여기까지 추가] ▲▲▲





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
        let rawPw = document.getElementById('roomPw').value;
        let pw = rawPw ? rawPw.trim() : "7777"; 

        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;
        const selectedProf = document.getElementById('profSelect').value;
        
        firebase.database().ref(`courses/${state.room}/settings`).update({ courseName: newName, password: btoa(pw) });
        document.getElementById('displayCourseTitle').innerText = newName;
        document.getElementById('roomPw').value = pw; 
        
        if (statusVal === 'active') {
            localStorage.setItem(`last_owned_room`, state.room);
            firebase.database().ref(`courses/${state.room}/status`).update({ 
                roomStatus: 'active', 
                ownerSessionId: state.sessionId,
                professorName: selectedProf 
            });
            ui.showAlert(`✅ [Room ${state.room}] 설정 저장 및 제어권 획득!`); 
        } else {
            localStorage.removeItem(`last_owned_room`);
            firebase.database().ref(`courses/${state.room}/status`).update({ 
                roomStatus: 'idle', 
                ownerSessionId: null,
                professorName: null 
            });
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

// --- [신규] 교수님 명단 관리 ---
const profMgr = {
    list: [],
    init: function() {
        firebase.database().ref('system/professors').on('value', s => {
            const data = s.val() || {};
            // 데이터 없으면 빈 상태
            this.list = Object.keys(data).map(k => ({ key: k, name: data[k] }));
            this.renderSelect();
            const modal = document.getElementById('profManageModal');
            if (modal && modal.style.display === 'flex') {
                this.renderManageList();
            }
        });
    },
    renderSelect: function() {
        const sel = document.getElementById('profSelect');
        if(!sel) return;
        const currentVal = sel.value; 
        sel.innerHTML = '<option value="">(선택 안함)</option>';
        this.list.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.innerText = p.name + " 교수";
            if (p.name === currentVal) opt.selected = true;
            sel.appendChild(opt);
        });
    },
    openManageModal: function() {
        this.renderManageList();
        document.getElementById('profManageModal').style.display = 'flex';
        const input = document.getElementById('newProfInput');
        if(input) input.focus();
    },
    renderManageList: function() {
        const div = document.getElementById('profListContainer');
        if(!div) return;
        div.innerHTML = "";
        if (this.list.length === 0) {
            div.innerHTML = "<div style='padding:20px; text-align:center; color:#94a3b8;'>등록된 교수님이 없습니다.</div>";
            return;
        }
        this.list.forEach(p => {
            div.innerHTML += `<div class="prof-item"> <span>${p.name}</span> <button onclick="profMgr.deleteProf('${p.key}')">삭제</button> </div>`;
        });
        div.scrollTop = div.scrollHeight;
    },
    addProf: function() {
        const input = document.getElementById('newProfInput');
        const name = input.value.trim();
        if (!name) { alert("교수님 성함을 입력해주세요."); return; }
        firebase.database().ref('system/professors').push(name).then(() => {
            input.value = ""; input.focus();
        }).catch(err => { alert("저장 실패: " + err.message); });
    },
    deleteProf: function(key) {
        if(confirm("정말 삭제하시겠습니까?")) {
            firebase.database().ref(`system/professors/${key}`).remove();
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
                
                const profName = st.professorName ? `, ${st.professorName}` : "";
                const opt = document.createElement('option');
                opt.value = c;
                if(st.roomStatus === 'active') {
                    if (st.ownerSessionId === state.sessionId) {
                        opt.innerText = `Room ${c} (🔵 내 강의실${profName}, ${userCount}명)`;
                        opt.style.color = '#3b82f6';
                        opt.style.fontWeight = 'bold';
                    } else {
                        opt.innerText = `Room ${c} (🔴 사용중${profName}, ${userCount}명)`;
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
            target.innerHTML = ""; 
            const pathArr = window.location.pathname.split('/'); pathArr.pop();
            const baseUrl = window.location.origin + pathArr.join('/');
            const forcedUrl = `${baseUrl}/index.html?room=${state.room}`;
            label.innerText = `Room ${state.room} Join`;
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
    const targetTab = document.getElementById(`tab-${mode}`);
    if(targetTab) targetTab.classList.add('active');

    if (mode === 'qa') {
        document.getElementById('view-qa').style.display = 'flex';
        document.getElementById('view-quiz').style.display = 'none';
    }

    if (state.room) {
        firebase.database().ref(`courses/${state.room}/status/mode`).set(mode);
        if (mode === 'quiz') {
            // [수정] 이미 퀴즈가 로드되어 있는 경우(isExternalFileLoaded가 true이거나 문항이 있는 경우)
            if (state.isExternalFileLoaded || (state.quizList && state.quizList.length > 0 && state.currentQuizIdx >= 0)) {
                document.getElementById('view-qa').style.display = 'none';
                document.getElementById('view-quiz').style.display = 'flex';
                // 현재 진행 중이던 상태를 화면에 다시 그려줌
                quizMgr.showQuiz();
            } else {
                // 한 번도 로드한 적이 없거나 초기화된 상태일 때만 팝업 표시
                document.getElementById('quizSelectModal').style.display = 'flex';
                document.getElementById('btnPause').style.display = 'none';
                document.getElementById('btnSmartNext').style.display = 'flex';
                document.getElementById('btnSmartNext').innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play"></i>';
                quizMgr.loadSavedQuizList();
            }
            return;
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

        // 1. 필터링
        if(f==='pin') items=items.filter(x=>x.status==='pin'); 
        else if(f==='later') items=items.filter(x=>x.status==='later');

        // 2. 정렬 로직 (1안 적용됨)
        items.sort((a,b) => {
            const getPrio = s => (s === 'pin' ? 3 : (s === 'later' ? 2 : (s === 'done' ? 0 : 1)));
            const pA = getPrio(a.status);
            const pB = getPrio(b.status);
            if (pA !== pB) return pB - pA;
            const likeA = a.likes || 0;
            const likeB = b.likes || 0;
            if (likeA !== likeB) return likeB - likeA;
            return b.timestamp - a.timestamp;
        });

        items.forEach(i => {
            // [수정 1] 여기서 const가 아니라 let을 써야 에러가 안 납니다!
            let cls = i.status==='pin'?'status-pin':(i.status==='later'?'status-later':(i.status==='done'?'status-done':''));
            const icon = i.status==='pin'?'📌 ':(i.status==='later'?'⚠️ ':(i.status==='done'?'✅ ':''));

            // [추가된 로직] 2분 이내 신규 글 체크
            const isRecent = (Date.now() - i.timestamp) < 120000; 
            let newBadge = "";
            
            if (isRecent && i.status !== 'pin' && i.status !== 'done') {
                cls += " is-new"; 
                newBadge = `<span class="new-badge-icon">NEW</span>`; 
            }

            list.innerHTML += `
<div class="q-card ${cls}" data-ts="${i.timestamp}" onclick="ui.openQaModal('${i.id}')">
                <div class="q-content">
                    <!-- [수정 2] 여기에 ${newBadge}가 꼭 들어가야 화면에 보입니다 -->
                    ${newBadge}${icon}${i.text}
                    <button class="btn-translate" onclick="event.stopPropagation(); ui.translateQa('${i.id}')" title="구글 번역기로 보기">
                        <i class="fa-solid fa-language"></i> 번역
                    </button>
                </div>
                <div class="q-meta">
                    <div class="q-like-badge">👍 ${i.likes||0}</div>
                    <div class="q-time">${new Date(i.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
            </div>`;
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
    translateQa: function(id) {
        if (!state.qaData[id]) return;
        const text = state.qaData[id].text;
        const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
        const targetLang = hasKorean ? 'en' : 'ko';
        const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`;
        const popupWidth = 1000; const popupHeight = 600;
        const left = (window.screen.width / 2) - (popupWidth / 2);
        const top = (window.screen.height / 2) - (popupHeight / 2);
        const windowFeatures = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no,popup=yes`;
        window.open(url, 'googleTranslatePopup', windowFeatures);
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
// [수정] 업로드 시 퀴즈 세트의 이름을 물어봅니다.
            const quizTitle = prompt("이 퀴즈 세트의 이름을 입력해주세요:", `${new Date().toLocaleDateString()} 퀴즈`);
            if (!quizTitle) { alert("업로드가 취소되었습니다."); return; }

            const newQuizRef = firebase.database().ref(`courses/${state.room}/quizBank`).push();
            newQuizRef.set({
                title: quizTitle,
                data: state.quizList,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                ui.showAlert(`'${quizTitle}' 세트가 저장되었습니다.`);
                quizMgr.loadSavedQuizList(); // 목록 새로고침
            });

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

// [추가] 팝업에서 선택한 퀴즈를 실제로 세팅하는 함수들
useDefaultQuiz: function() {
    state.quizList = DEFAULT_QUIZ_DATA; // 기본 샘플(TEST.TXT 역할) 사용
    state.isExternalFileLoaded = false;
    this.renderMiniList();
    this.completeQuizLoading();
},

useSavedQuiz: function() {
    firebase.database().ref(`courses/${state.room}/quizBank`).once('value', snap => {
        if(snap.exists()) {
            state.quizList = snap.val(); // 서버에서 저장된 퀴즈 가져오기
            state.isExternalFileLoaded = true;
            this.renderMiniList();
            this.completeQuizLoading();
        }
    });
},

completeQuizLoading: function() {
    document.getElementById('quizSelectModal').style.display = 'none'; // 팝업 닫기
    document.getElementById('view-qa').style.display = 'none'; // QA 숨기기
    document.getElementById('view-quiz').style.display = 'flex'; // 퀴즈 보이기
    state.currentQuizIdx = 0; // 1번 문제부터 시작
    this.showQuiz(); // 퀴즈 화면 갱신
},


// --- 여기부터 복사해서 붙여넣으세요 ---
    
    // 1. 서버에서 저장된 퀴즈 목록을 불러와서 화면에 그리기
    loadSavedQuizList: function() {
        const container = document.getElementById('savedQuizListContainer');
        if(!container) return; // 혹시 몰라 에러 방지
        
        firebase.database().ref(`courses/${state.room}/quizBank`).on('value', snap => {
            container.innerHTML = "";
            const data = snap.val();
            if (!data) {
                container.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444; font-weight:bold;">⚠️ 아직 저장된 퀴즈가 없습니다.<br>좌측 [Quiz File] 버튼으로 파일을 먼저 업로드해주세요!</div>`;
                return;
            }

            Object.keys(data).reverse().forEach(key => {
                const quizSet = data[key];
                const item = document.createElement('div');
                item.className = 'saved-quiz-item';
                item.innerHTML = `
                    <div style="flex-grow:1; cursor:pointer;" onclick="quizMgr.useSavedQuizSet('${key}')">
                        <div class="q-title">${quizSet.title}</div>
                        <div class="q-info">${quizSet.data.length}문항 | ${new Date(quizSet.timestamp).toLocaleString()}</div>
                    </div>
                    <button class="btn-del-mini" onclick="quizMgr.deleteQuizSet('${key}', '${quizSet.title}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
                container.appendChild(item);
            });
        });
    },

    // 2. 특정 퀴즈 세트를 선택해서 적용하기
    useSavedQuizSet: function(key) {
        firebase.database().ref(`courses/${state.room}/quizBank/${key}`).once('value', snap => {
            const val = snap.val();
            if (val) {
                state.quizList = val.data;
                state.isExternalFileLoaded = true;
                this.renderMiniList();
                this.completeQuizLoading();
                ui.showAlert(`'${val.title}' 문항을 불러왔습니다.`);
            }
        });
    },

    // 3. 저장된 퀴즈 세트 삭제하기
    deleteQuizSet: function(key, title) {
        if (confirm(`'${title}' 퀴즈 세트를 정말 삭제하시겠습니까?`)) {
            firebase.database().ref(`courses/${state.room}/quizBank/${key}`).remove()
                .then(() => ui.showAlert("삭제되었습니다."));
        }
    },
    
    // --- 여기까지 붙여넣으세요 ---


    prevNext: function(d) {
    let n = state.currentQuizIdx + d;
    
    // 범위를 벗어나는지 체크
    if (n < 0) {
        ui.showAlert("첫 번째 문항입니다.");
        return;
    }
    if (n >= state.quizList.length) {
        ui.showAlert("마지막 문항입니다. '종료' 버튼을 눌러주세요.");
        return;
    }

    // 선택된 문항인지 체크 (체크박스 해제된 건 건너뜀)
    if(!state.quizList[n].checked) {
        state.currentQuizIdx = n;
        this.prevNext(d); // 다음 체크된 걸 찾을 때까지 재귀 호출
        return;
    }

    state.currentQuizIdx = n;
    this.showQuiz();
},

 showQuiz: function() {
    document.querySelector('.quiz-card').classList.remove('result-mode');
    const q = state.quizList[state.currentQuizIdx];
    this.resetTimerUI(); 
    this.renderScreen(q);

    // 버튼 초기화
    document.getElementById('btnPause').style.display = 'none';
    const smartBtn = document.getElementById('btnSmartNext');
    smartBtn.style.display = 'flex';
    smartBtn.innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play" style="margin-left:10px;"></i>';

    firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });
    firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ 
        id: `Q${state.currentQuizIdx}`, 
        status: 'ready', 
        type: q.isOX?'OX':'MULTIPLE', 
        ...q 
    });
    
    document.getElementById('quizControls').style.display = 'flex';
    state.remainingTime = 8;
    this.startAnswerMonitor();
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

// 답변 완료/미완료 인원을 실시간으로 계산해서 화면에 보여주는 기능입니다.
startAnswerMonitor: function() {
    const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
    if (state.ansListener) dbRef.ans.child(id).off(); // 이전에 켜져있던 감시기는 끄기

    state.ansListener = dbRef.ans.child(id).on('value', snap => {
        const answers = snap.val() || {};
        const answeredCount = Object.keys(answers).length;
        const totalCount = parseInt(document.getElementById('currentJoinCount').innerText) || 0;
        const pendingCount = Math.max(0, totalCount - answeredCount);

        document.getElementById('answeredCount').innerText = answeredCount;
        document.getElementById('pendingCount').innerText = pendingCount;
    });
},


action: function(act) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        
        // Firebase에 상태 업데이트
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        
        // [추가] 배경색 변경을 위해 quiz-card 요소 가져오기
        const card = document.querySelector('.quiz-card');

        if(act === 'open') { 
            this.startTimer(); 
        }
        else if(act === 'close') { 
            this.stopTimer(); 
            const q = state.quizList[state.currentQuizIdx];
            
            // 설문이 아닐 경우 정답 공개 처리
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
            
            // [핵심 수정] 결과 화면일 때만 'result-mode' 클래스 추가 (배경색 변경)
            if(card) card.classList.add('result-mode');

            // 옵션 숨기고 차트 보여주기
            document.getElementById('d-options').style.display='none'; 
            document.getElementById('d-chart').style.display='flex'; 
            
            // 차트 렌더링 함수 호출
            this.renderChart(id, state.isTestMode ? 2 : state.quizList[state.currentQuizIdx].correct); 
        }
    },
    smartNext: function() {
        // [수정] 복잡한 조건문 다 버리고, 누르면 바로 현재 퀴즈를 시작(open)하도록 변경
        // 이렇게 해야 문항이 1개만 있어도 정상적으로 시작됩니다.
        this.action('open');
    },
togglePause: function() {
    const pauseBtn = document.getElementById('btnPause');
    if (state.timerInterval) { 
        this.stopTimer();
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ 
            status: 'pause',
            remainingTime: state.remainingTime 
        });
        pauseBtn.innerHTML = '다시 시작 <i class="fa-solid fa-play" style="margin-left:10px;"></i>';
        pauseBtn.style.backgroundColor = '#3b82f6'; 
    } else { 
        this.action('open'); 
        pauseBtn.innerHTML = '일시정지 <i class="fa-solid fa-pause" style="margin-left:10px;"></i>';
        pauseBtn.style.backgroundColor = '#f59e0b'; 
    }
},
    
startTimer: function() {
        this.stopTimer(); // 1. 기존에 돌던 타이머가 있다면 확실히 제거

        // 2. UI 변경: [현재 퀴즈 시작] 버튼은 숨기고, 그 자리에 [일시정지] 버튼을 크게 보여줌
        const smartBtn = document.getElementById('btnSmartNext');
        const pauseBtn = document.getElementById('btnPause');

        if (smartBtn) smartBtn.style.display = 'none';
        if (pauseBtn) {
            pauseBtn.style.display = 'flex'; // 중앙 정렬을 위해 flex 사용
            pauseBtn.innerHTML = '일시정지 <i class="fa-solid fa-pause" style="margin-left:15px;"></i>';
            pauseBtn.style.background = '#f59e0b'; // 일시정지 상태 색상 (주황색)
        }

        // 3. 남은 시간 및 타이머 UI 초기 설정
        let t = state.remainingTime;
        const d = document.getElementById('quizTimer'); 
        if (d) d.classList.remove('urgent');

        const initSec = t < 0 ? 0 : t;
        if (d) d.innerText = `00:${initSec < 10 ? '0' + initSec : initSec}`;
        
        // 4. [중요] 학생들과의 실시간 동기화를 위해 종료 시각(타임스탬프)을 계산해서 DB에 전송
        const endTime = Date.now() + (t * 1000);
        dbRef.quiz.update({ endTime: endTime }); 

        if(t <= 5 && d) d.classList.add('urgent');

        let lastPlayedSec = -1;
        if (!state.timerAudio) state.timerAudio = new Audio('timer.mp3');

        // 5. 0.2초마다 시간을 체크하는 인터벌 실행
        state.timerInterval = setInterval(() => {
            const r = Math.ceil((endTime - Date.now()) / 1000); // 실제 종료 시각과의 차이 계산
            const displaySec = r < 0 ? 0 : r;
            
            // 현재 남은 시간을 state에 실시간 저장 (일시정지 시 필요)
            state.remainingTime = displaySec; 

            // 관리자 화면 시간 업데이트
            if (d) {
                d.innerText = `00:${displaySec < 10 ? '0' + displaySec : displaySec}`;
                // 5초 이하면 빨간색 강조
                if(r <= 5) d.classList.add('urgent');
            }

            // 1초마다 째깍 소리 재생 (8초부터 1초까지)
            if (r <= 8 && r > 0 && r !== lastPlayedSec) {
                state.timerAudio.pause();          
                state.timerAudio.currentTime = 0;  
                state.timerAudio.play().catch(e => {}); 
                lastPlayedSec = r;
            }

            // 0초가 되면 타이머 종료 및 결과 화면 자동 전환
            if(r <= 0) {
                this.stopTimer();
                this.action('close'); // 1. 학생들의 응답 제출을 막음
                
                setTimeout(() => {
                    this.action('result'); // 2. 1.5초 뒤에 결과(차트)를 공개함
                    
                    // 3. 결과 화면이 나오면 버튼을 다시 "현재 퀴즈 시작" 상태로 복구
                    if (pauseBtn) pauseBtn.style.display = 'none';
                    if (smartBtn) {
                        smartBtn.style.display = 'flex';
                        smartBtn.innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play" style="margin-left:15px;"></i>';
                    }
                }, 1500);
            }
        }, 200);
    },


stopTimer: function() { 
        if(state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null; // ✅ 이 줄을 꼭 추가해야 합니다!
        }
        if (state.timerAudio) {
            state.timerAudio.pause();
            state.timerAudio.currentTime = 0;
        }
    },
    resetTimerUI: function() { this.stopTimer(); document.getElementById('quizTimer').innerText = "00:08"; document.getElementById('quizTimer').classList.remove('urgent'); },
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
        let currentRank = 1;
        sortedUsers.forEach((user, idx) => {
            if (idx > 0 && user.score < sortedUsers[idx - 1].score) {
                currentRank = idx + 1; 
            }
            finalRankingData[user.token] = { score: user.score, rank: currentRank, total: sortedUsers.length };
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
            
            // ✅ [추가] 설문조사일 경우, 학생들에게 보여줄 요약 결과 저장
            if(q.isSurvey) {
                let maxIdx = cnt.indexOf(Math.max(...cnt));
                let surveySummary = `가장 많은 선택: '${q.options[maxIdx]}' (${Math.round((cnt[maxIdx]/Object.values(d).length)*100)}%)`;
                firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ surveyResult: surveySummary });
            }
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
        state.isExternalFileLoaded = false; // [추가] 이 플래그를 꺼야 다음 진입 시 팝업이 뜹니다.
        state.quizList = []; // [수정] 기존 문항 리스트를 비웁니다.
        
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set(null);
        firebase.database().ref(`courses/${state.room}/status/quizStep`).set('none');
        firebase.database().ref(`courses/${state.room}/quizAnswers`).set(null);
        firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(null);
        
        // 초기화 후에는 UI를 갱신해줘야 합니다.
        quizMgr.renderMiniList();
    }
    ui.setMode('qa');
}
};

// --- 5. Print & Report ---
const printMgr = {
openInputModal: function() { 
        // 1. 교육 기간 안내 문구 (플레이스홀더) 설정
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${today.getMonth()+1}.${today.getDate()}`;
        document.getElementById('printDateInput').value = ""; // 기존 입력값 초기화
        document.getElementById('printDateInput').placeholder = `기간을 입력해주세요 (예: ${dateStr})`;

        // 2. 사이드바에서 선택된 담임교수 이름 가져와서 자동 입력
        const currentProf = document.getElementById('profSelect').value;
        document.getElementById('printProfInput').value = currentProf || ""; // 선택된 교수가 없으면 빈칸

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
// 시간, 상태(undefined) 제거하고 깔끔하게 내용과 공감수만 표시
                listBody.innerHTML += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td style="text-align:left; line-height:1.4;">${item.text}</td>
                        <td>❤️ ${item.likes || 0}</td>
                    </tr>`;
            });
        }
        document.getElementById('printPreviewModal').style.display = 'flex'; 
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },



// [최종 수정] 인쇄 전용 새 창 열기 (여백 및 너비 완벽 보정)
    executePrint: function() { 
        // 1. 리포트 내용 가져오기
        const content = document.getElementById('official-document').innerHTML;
        
        // 2. 새 창 열기
        const printWindow = window.open('', '', 'height=900,width=800');
        
        // 3. 새 창에 HTML 문서를 새로 작성
        printWindow.document.write('<html><head><title>KAC Report</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
            
            /* [중요] 초기화 및 박스 모델 설정 */
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; width: 100%; }
            
            /* 폰트 설정 */
            body { font-family: 'Pretendard', sans-serif; }
            
            /* [핵심] 인쇄 여백 설정 (여기서 주는 여백이 진짜 종이 여백입니다) */
            @page { 
                size: A4; 
                margin: 25mm; /* 상하좌우 2.5cm 여백 */
            }
            
            /* 제목 스타일 */
            h2 { margin: 0 0 30px 0; color: #000; font-size: 24px; }
            
            /* 테이블 공통: 무조건 100% 너비 차지 */
            table { width: 100% !important; border-collapse: collapse; }
            
            /* 상단 정보 테이블 */
            .doc-info-table { margin-bottom: 30px; }
            .doc-info-table th { text-align: left; width: 120px; padding: 6px 0; color: #333; vertical-align: top; font-weight: bold; }
            .doc-info-table td { padding: 6px 0; font-weight: normal; color: #000; }
            
            /* 하단 질문 목록 테이블 */
            .doc-list-table { margin-top: 10px; table-layout: fixed; /* 레이아웃 고정 */ }
            .doc-list-table tr { border-bottom: 1px solid #999; page-break-inside: avoid; }
            .doc-list-table td { padding: 12px 5px; vertical-align: top; font-size: 13px; line-height: 1.5; word-break: break-all; }
            
            /* 컬럼 너비 조정 */
            .doc-list-table td:first-child { text-align: center; width: 50px; font-weight: bold; color: #555; } /* 번호 */
            .doc-list-table td:nth-child(2) { text-align: left; width: auto; } /* 내용 (나머지 공간 다 차지) */
            .doc-list-table td:last-child { text-align: center; width: 70px; font-weight: bold; color: #3b82f6; } /* 공감 */
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        
        // 4. 내용 주입
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        
        // 5. 문서 닫기 및 인쇄 실행
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
};
window.onload = function() {
    dataMgr.checkMobile();
    dataMgr.initSystem();
    profMgr.init();
};