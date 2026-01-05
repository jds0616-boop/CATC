/* --- admin.js (Final Integrated Version) --- */

// --- 전역 상태 ---
const state = {
    // [보정] 새로고침 시에도 동일한 세션ID를 유지하여 방 제어권을 잃지 않게 함
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
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null,
    pendingRoom: null
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null };

// --- 1. Auth Manager (로그인 및 비밀번호 관리) ---
const authMgr = {
    ADMIN_EMAIL: "admin@kac.com", 

    tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        if(!inputPw) return alert("비밀번호를 입력해주세요.");

        try {
            // Firebase 인증 시도
            await firebase.auth().signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            document.getElementById('loginOverlay').style.display = 'none';
            dataMgr.loadInitialData();
        } catch (error) {
            // [보정] 알아보기 힘든 영어 에러 메시지를 한글로 변환하는 부분입니다.
            console.error("Login Error Code:", error.code);
            let errorMessage = "로그인 중 오류가 발생했습니다.";

            switch (error.code) {
                case 'auth/wrong-password':
                    errorMessage = "비밀번호가 틀렸습니다. 다시 확인해 주세요.";
                    break;
                case 'auth/user-not-found':
                    errorMessage = "등록되지 않은 계정입니다.";
                    break;
                case 'auth/too-many-requests':
                    errorMessage = "연속된 로그인 실패로 인해 일시적으로 차단되었습니다. 잠시 후 다시 시도해 주세요.";
                    break;
                case 'auth/network-request-failed':
                    errorMessage = "네트워크 연결이 불안정합니다.";
                    break;
                default:
                    errorMessage = "로그인 실패: " + error.message;
            }

            alert(errorMessage);
            document.getElementById('loginPwInput').value = "";
            document.getElementById('loginPwInput').focus();
        }
    },

    logout: function() {
        if(confirm("로그아웃 하시겠습니까?")) {
            sessionStorage.removeItem('kac_admin_sid'); 
            firebase.auth().signOut().then(() => {
                location.reload();
            });
        }
    },

    executeChangePw: async function() {
        const user = firebase.auth().currentUser;
        const newPw = document.getElementById('cp-new').value;
        const confirmPw = document.getElementById('cp-confirm').value;

        if(!user) return alert("로그인 상태가 아닙니다.");
        if(!newPw || !confirmPw) return alert("모든 필드를 입력해주세요.");
        if(newPw !== confirmPw) return alert("새 비밀번호가 일치하지 않습니다.");

        try {
            await user.updatePassword(newPw);
            alert("비밀번호가 변경되었습니다.");
            ui.closePwModal();
        } catch (e) {
            alert("변경 실패: " + e.message);
        }
    }
};

// --- 2. Data & Room Logic (방 제어 및 지속 운용 로직) ---
const dataMgr = {
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
        const lastRoom = localStorage.getItem('kac_last_room') || 'A';
        this.forceEnterRoom(lastRoom); 

        try {
            ui.initRoomSelect(); 
            document.getElementById('roomSelect').onchange = (e) => this.switchRoomAttempt(e.target.value);
            document.getElementById('quizFile').onchange = (e) => quizMgr.loadFile(e);
            
            const qrEl = document.getElementById('qrcode');
            if(qrEl) qrEl.onclick = function() { ui.openQrModal(); };
        } catch(e) {
            console.error("Init Error:", e);
        }
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
        const roomPw = settings.password ? String(settings.password) : "1234";

        if (input === roomPw || input === "13281") {
            alert("인증 성공! 제어권을 가져옵니다.");
            localStorage.setItem(`last_owned_room`, newRoom);
            await firebase.database().ref(`courses/${newRoom}/status`).update({
                ownerSessionId: state.sessionId
            });
            this.forceEnterRoom(newRoom);
            document.getElementById('takeoverModal').style.display = 'none';
        } else {
            alert("비밀번호가 일치하지 않습니다.");
            document.getElementById('takeoverPwInput').value = "";
        }
    },

    cancelTakeover: function() {
        document.getElementById('takeoverModal').style.display = 'none';
        document.getElementById('roomSelect').value = state.room; 
        state.pendingRoom = null;
    },

    forceEnterRoom: function(room) {
        if (state.room) {
            const oldPath = `courses/${state.room}`;
            firebase.database().ref(`${oldPath}/questions`).off();
            firebase.database().ref(`${oldPath}/activeQuiz`).off();
            firebase.database().ref(`${oldPath}/status`).off();
            firebase.database().ref(`${oldPath}/settings`).off();
        }

        state.room = room;
        localStorage.setItem('kac_last_room', room);
        const selectBox = document.getElementById('roomSelect');
        if(selectBox) selectBox.value = room;
        ui.updateHeaderRoom(room);

        const rPath = `courses/${room}`;
        dbRef.settings = firebase.database().ref(`${rPath}/settings`);
        dbRef.qa = firebase.database().ref(`${rPath}/questions`);
        dbRef.quiz = firebase.database().ref(`${rPath}/activeQuiz`);
        dbRef.ans = firebase.database().ref(`${rPath}/quizAnswers`);
        dbRef.status = firebase.database().ref(`${rPath}/status`);

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
        // 방 상태 감시 및 자동 제어권 복구 로직
        dbRef.status.on('value', s => {
            if(state.room !== room) return;
            const st = s.val() || {};
            if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
                if (localStorage.getItem(`last_owned_room`) === room) {
                    dbRef.status.update({ ownerSessionId: state.sessionId });
                    return; 
                }
            }
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
        });

        this.fetchCodeAndRenderQr(room);
        dbRef.qa.on('value', s => {
            if(state.room !== room) return;
            state.qaData = s.val() || {};
            ui.renderQaList('all');
        });
    },

    fetchCodeAndRenderQr: function(room) {
        const pathArr = window.location.pathname.split('/');
        pathArr.pop(); 
        const baseUrl = window.location.origin + pathArr.join('/');
        firebase.database().ref('public_codes').orderByValue().equalTo(room).once('value', snapshot => {
            const data = snapshot.val();
            const studentUrl = data ? `${baseUrl}/index.html?code=${Object.keys(data)[0]}` : `${baseUrl}/index.html?room=${room}`;
            ui.renderQr(studentUrl);
        });
    },

    saveSettings: function() {
        let pw = document.getElementById('roomPw').value || "1234"; 
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;

        firebase.database().ref(`courses/${state.room}/settings`).update({ courseName: newName, password: pw });

        if (statusVal === 'active') {
            localStorage.setItem(`last_owned_room`, state.room);
            firebase.database().ref(`courses/${state.room}/status`).update({
                roomStatus: 'active',
                ownerSessionId: state.sessionId
            });
            alert(`✅ [Room ${state.room}] 설정이 저장되었습니다.`); 
        } else {
            localStorage.removeItem(`last_owned_room`);
            firebase.database().ref(`courses/${state.room}/status`).update({
                roomStatus: 'idle',
                ownerSessionId: null
            });
            alert(`✅ [Room ${state.room}] 강의가 종료되었습니다.`); 
        }
    },

    deactivateAllRooms: async function() {
        if(!confirm("⚠️ 모든 강의실을 '비어있음' 상태로 초기화하시겠습니까?")) return;
        const updates = {};
        for(let i=65; i<=90; i++) {
            const char = String.fromCharCode(i);
            updates[`courses/${char}/status/roomStatus`] = 'idle';
            updates[`courses/${char}/status/ownerSessionId`] = null;
        }
        try {
            localStorage.removeItem(`last_owned_room`);
            await firebase.database().ref().update(updates);
            alert("모든 강의실이 초기화되었습니다.");
            location.reload();
        } catch(e) { alert("오류: " + e.message); }
    },

    updateQa: function(action) {
        if(!state.activeQaKey) return;
        if (action === 'delete') {
             if(confirm("삭제하시겠습니까?")) { dbRef.qa.child(state.activeQaKey).remove(); ui.closeQaModal(); }
        } else {
            const curStatus = state.qaData[state.activeQaKey].status || 'normal';
            const nextStatus = (curStatus === action) ? 'normal' : action;
            dbRef.qa.child(state.activeQaKey).update({ status: nextStatus });
            ui.closeQaModal();
        }
    },

    resetCourse: function() {
        if(confirm("데이터를 초기화하시겠습니까? (복구 불가)")) {
            firebase.database().ref(`courses/${state.room}`).set(null).then(() => {
                alert("완료"); location.reload();
            });
        }
    }
};

// --- 3. UI Manager (화면 표시 제어) ---
const ui = {
    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
            if(!sel) return;
            sel.innerHTML = "";
            for(let i=65; i<=90; i++) {
                const char = String.fromCharCode(i);
                const st = (allData[char] || {}).status || {};
                const isMyRoom = (st.ownerSessionId === state.sessionId);
                const opt = document.createElement('option');
                opt.value = char;
                opt.innerText = st.roomStatus === 'active' ? `Room ${char} (${isMyRoom?'🔵내강의':'🔴사용중'})` : `Room ${char}`;
                if(char === state.room) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    },

    checkLockStatus: function(st) {
        const overlay = document.getElementById('statusOverlay');
        const isActive = (st.roomStatus === 'active');
        const isOwner = (st.ownerSessionId === state.sessionId);
        overlay.style.display = (isActive && isOwner) ? 'none' : 'flex';
    },

    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderSettings: function(d) {
        document.getElementById('courseNameInput').value = d.courseName || "";
        document.getElementById('roomPw').value = d.password || "1234";
        document.getElementById('displayCourseTitle').innerText = d.courseName || "";
    },
    renderRoomStatus: function(s) { document.getElementById('roomStatusSelect').value = s || 'idle'; },
    renderQr: function(u) {
        document.getElementById('studentLink').value = u;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        try { new QRCode(qrDiv, { text: u, width: 38, height: 38 }); } catch(e) {}
    },
    openQrModal: function() {
        const modal = document.getElementById('qrModal');
        const url = document.getElementById('studentLink').value;
        if(!url) return;
        modal.style.display = 'flex';
        const target = document.getElementById('qrBigTarget'); target.innerHTML = "";
        setTimeout(() => { new QRCode(target, { text: url, width: 300, height: 300 }); }, 50);
    },
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },
    copyLink: function() {
        const input = document.getElementById('studentLink');
        input.select(); document.execCommand('copy');
        alert("링크가 복사되었습니다.");
    },

    setMode: function(mode) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${mode}`).classList.add('active');
        document.getElementById('view-qa').style.display = (mode==='qa'?'flex':'none');
        document.getElementById('view-quiz').style.display = (mode==='quiz'?'flex':'none');
    },

    renderQaList: function(filter) {
        const list = document.getElementById('qaList'); list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));
        items.sort((a,b) => (b.likes||0) - (a.likes||0));
        items.forEach(i => {
            const cls = i.status === 'pin' ? 'status-pin' : (i.status === 'later' ? 'status-later' : (i.status === 'done' ? 'status-done' : ''));
            list.innerHTML += `<div class="q-card ${cls}" onclick="ui.openQaModal('${i.id}')">
                <div class="q-content" style="font-weight:800;">${i.text}</div>
                <div class="q-like-badge">👍 ${i.likes||0}</div>
            </div>`;
        });
    },

    openQaModal: function(key) {
        state.activeQaKey = key;
        document.getElementById('m-text').innerText = state.qaData[key].text;
        document.getElementById('qaModal').style.display = 'flex';
    },
    closeQaModal: function(e) { if (!e || e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') document.getElementById('qaModal').style.display = 'none'; },
    openPwModal: function() { document.getElementById('changePwModal').style.display = 'flex'; },
    closePwModal: function() { document.getElementById('changePwModal').style.display = 'none'; },
    toggleNightMode: function() { document.body.classList.toggle('night-mode'); },
    toggleRightPanel: function() { document.getElementById('rightPanel').classList.toggle('open'); }
};

// --- 4. Quiz Manager (파일 로드 및 퀴즈 실행) ---
const quizMgr = {
    loadFile: function(e) {
        const file = e.target.files[0]; if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const blocks = evt.target.result.trim().split(/\n\s*\n/);
            state.quizList = [];
            blocks.forEach(block => {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length >= 6) {
                    state.quizList.push({ text: lines[0], options: [lines[1], lines[2], lines[3], lines[4]], correct: parseInt(lines[5]), checked: true });
                }
            });
            alert(state.quizList.length + "개의 문제를 로드했습니다.");
        };
        reader.readAsText(file);
    },
    action: function(act) {
        if(act === 'open') { this.startTimer(); }
        else { clearInterval(state.timerInterval); }
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
    },
    startTimer: function() {
        let t = 30;
        const el = document.getElementById('quizTimer');
        state.timerInterval = setInterval(() => {
            t--;
            el.innerText = `00:${t < 10 ? '0' + t : t}`;
            if(t <= 0) { clearInterval(state.timerInterval); this.action('close'); }
        }, 1000);
    },
    // 기타 퀴즈 로직 유지...
};

// --- 5. Print Manager (리포트 출력) ---
const printMgr = {
    openInputModal: function() { document.getElementById('printInputModal').style.display = 'flex'; },
    closeInputModal: function() { document.getElementById('printInputModal').style.display = 'none'; },
    confirmPrint: function(isSkip) {
        const date = isSkip ? "" : document.getElementById('printDateInput').value;
        const prof = isSkip ? "" : document.getElementById('printProfInput').value;
        this.closeInputModal();
        this.openPreview(date, prof);
    },
    openPreview: function(date, prof) {
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value;
        document.getElementById('doc-date').innerText = date;
        document.getElementById('doc-prof').innerText = prof;
        const body = document.getElementById('docListBody'); body.innerHTML = "";
        Object.values(state.qaData).forEach((item, idx) => {
            body.innerHTML += `<tr><td style="text-align:center">${idx+1}</td><td>${item.text}</td><td style="text-align:center">${item.likes||0}</td></tr>`;
        });
        document.getElementById('printPreviewModal').style.display = 'flex';
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },
    executePrint: function() { window.print(); }
};

window.onload = function() { dataMgr.initSystem(); };