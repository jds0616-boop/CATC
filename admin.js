/* --- admin.js (Final Integrated Version: Persistence & Full Logic) --- */

// --- 전역 상태 ---
const state = {
    // [보정] 세션 스토리지를 사용하여 탭 유지 중 새로고침 시 동일 세션ID 유지
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

// --- 1. Auth Manager ---
const authMgr = {
    ADMIN_EMAIL: "admin@kac.com", 

    tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        if(!inputPw) return alert("비밀번호를 입력해주세요.");

        try {
            await firebase.auth().signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            document.getElementById('loginOverlay').style.display = 'none';
            dataMgr.loadInitialData();
        } catch (error) {
            console.error(error);
            alert("로그인 실패: " + error.message);
            document.getElementById('loginPwInput').value = "";
        }
    },

    logout: function() {
        if(confirm("로그아웃 하시겠습니까?")) {
            sessionStorage.removeItem('kac_admin_sid'); // 세션 삭제
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

// --- 2. Data & Room Logic (Persistence 핵심) ---
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
            // 중복 리스너 방지를 위해 .onchange 직접 할당
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
        
        // 방이 사용 중인데 세션 ID가 다르면 인증창 호출
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
        const masterKey = "13281"; 

        if (input === roomPw || input === masterKey) {
            alert("인증 성공! 제어권을 가져옵니다.");
            localStorage.setItem(`last_owned_room`, newRoom); // 제어권 획득 기록
            await firebase.database().ref(`courses/${newRoom}/status`).update({
                ownerSessionId: state.sessionId
            });
            this.forceEnterRoom(newRoom);
            document.getElementById('takeoverModal').style.display = 'none';
        } else {
            alert("비밀번호가 일치하지 않습니다.");
            document.getElementById('takeoverPwInput').value = "";
            document.getElementById('takeoverPwInput').focus();
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

        document.getElementById('qaList').innerHTML = "";
        state.qaData = {};
        
        const rPath = `courses/${room}`;
        dbRef.settings = firebase.database().ref(`${rPath}/settings`);
        dbRef.qa = firebase.database().ref(`${rPath}/questions`);
        dbRef.quiz = firebase.database().ref(`${rPath}/activeQuiz`);
        dbRef.ans = firebase.database().ref(`${rPath}/quizAnswers`);
        dbRef.status = firebase.database().ref(`${rPath}/status`);

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
        // [보정] 방 상태 감시: 새로고침 후 자동 제어권 탈환
        dbRef.status.on('value', s => {
            if(state.room !== room) return;
            const st = s.val() || {};

            if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
                // 내가 마지막으로 주인이라고 선언했던 방이면 자동으로 주인으로 등록
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
        
        firebase.database().ref('public_codes')
            .orderByValue().equalTo(room)
            .once('value', snapshot => {
                const data = snapshot.val();
                if (data) {
                    const code = Object.keys(data)[0]; 
                    const studentUrl = `${baseUrl}/index.html?code=${code}`;
                    ui.renderQr(studentUrl);
                } else {
                    const studentUrl = `${baseUrl}/index.html?room=${room}`;
                    ui.renderQr(studentUrl);
                }
            });
    },

    saveSettings: function() {
        let pw = document.getElementById('roomPw').value; 
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;

        if (!pw) pw = "1234";
        const updates = { courseName: newName, password: pw };

        firebase.database().ref(`courses/${state.room}/settings`).update(updates);
        document.getElementById('displayCourseTitle').innerText = newName;
        document.getElementById('roomPw').value = pw;

        if (statusVal === 'active') {
            localStorage.setItem(`last_owned_room`, state.room); // 주인 기록
            firebase.database().ref(`courses/${state.room}/status`).update({
                roomStatus: 'active',
                ownerSessionId: state.sessionId
            });
            alert(`✅ [Room ${state.room}] 설정이 저장되었습니다.`); 
        } else {
            localStorage.removeItem(`last_owned_room`); // 강의 종료 시 주인 기록 삭제
            firebase.database().ref(`courses/${state.room}/status`).update({
                roomStatus: 'idle',
                ownerSessionId: null
            });
            alert(`✅ [Room ${state.room}] 설정이 저장되었습니다.\n- 상태: 비어있음`); 
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

        try {
            localStorage.removeItem(`last_owned_room`);
            await firebase.database().ref().update(updates);
            alert("모든 강의실이 비활성화되었습니다.");
            this.forceEnterRoom(state.room);
        } catch(e) {
            alert("오류 발생: " + e.message);
        }
    },

    updateQa: function(action) {
        if(!state.activeQaKey) return;
        const currentItem = state.qaData[state.activeQaKey];
        const currentStatus = currentItem.status || 'normal';

        if (action === 'delete') {
             if(confirm("정말 삭제하시겠습니까?")) {
                 dbRef.qa.child(state.activeQaKey).remove(); ui.closeQaModal();
             }
        } else if (action === 'done') {
            let newStatus = 'done';
            if (currentStatus === 'pin') newStatus = 'pin-done';
            else if (currentStatus === 'pin-done') newStatus = 'pin'; 
            else if (currentStatus === 'later') newStatus = 'later-done';
            else if (currentStatus === 'later-done') newStatus = 'later'; 
            else if (currentStatus === 'normal') newStatus = 'done';
            else if (currentStatus === 'done') newStatus = 'normal'; 
            
            dbRef.qa.child(state.activeQaKey).update({ status: newStatus });
            ui.closeQaModal();
        } else {
            let newStatus = action;
            if (currentStatus === action) newStatus = 'normal'; 
            dbRef.qa.child(state.activeQaKey).update({ status: newStatus });
            ui.closeQaModal();
        }
    },

    resetCourse: function() {
        if(confirm("현재 강의실 데이터를 초기화하시겠습니까?\n(질문, 퀴즈 내역이 모두 삭제됩니다)")) {
            firebase.database().ref(`courses/${state.room}`).set(null).then(() => {
                alert("초기화 완료."); location.reload();
            });
        }
    }
};

// --- 3. UI Manager (통합 렌더링) ---
const ui = {
    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
            if(!sel) return;
            const currentVal = state.room;

            sel.innerHTML = "";
            for(let i=65; i<=90; i++) {
                const char = String.fromCharCode(i);
                const roomData = allData[char] || {};
                const st = roomData.status || {};
                const isMyRoom = (st.ownerSessionId === state.sessionId);
                
                const opt = document.createElement('option');
                opt.value = char;
                if(st.roomStatus === 'active') {
                    opt.innerText = isMyRoom ? `Room ${char} (🔵 내 강의실)` : `Room ${char} (🔴 사용중)`;
                    if(isMyRoom) opt.style.fontWeight = '800';
                } else { opt.innerText = `Room ${char}`; }
                
                if(char === currentVal) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    },

    checkLockStatus: function(statusObj) {
        const overlay = document.getElementById('statusOverlay');
        const isActive = (statusObj.roomStatus === 'active');
        const isOwner = (statusObj.ownerSessionId === state.sessionId);

        if (isActive && isOwner) {
            overlay.style.display = 'none';
        } else if (isActive && !isOwner) {
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="lock-message"><i class="fa-solid fa-user-lock"></i>
                    <h3>다른 강사가 사용 중</h3><p>현재 <b>관전 모드</b>입니다.<br>제어권을 가져오려면 상단 메뉴에서 방을 다시 선택하세요.</p>
                </div>`;
        } else {
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="lock-message"><i class="fa-solid fa-lock"></i>
                    <h3>강의 대기 중 (Room Idle)</h3><p>좌측에서 <b>[사용중]</b>으로 변경하고 저장하세요.</p>
                </div>`;
        }
    },

    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderSettings: function(data) {
        document.getElementById('courseNameInput').value = data.courseName || "";
        document.getElementById('roomPw').value = data.password || "1234";
        document.getElementById('displayCourseTitle').innerText = data.courseName || "";
    },
    renderRoomStatus: function(st) { document.getElementById('roomStatusSelect').value = st || 'idle'; },
    
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        try { new QRCode(qrDiv, { text: url, width: 35, height: 35 }); } catch(e) {}
    },
    
    openQrModal: function() {
        const modal = document.getElementById('qrModal');
        const url = document.getElementById('studentLink').value;
        if(!url) return;
        modal.style.display = 'flex';
        const target = document.getElementById('qrBigTarget');
        target.innerHTML = ""; 
        setTimeout(() => { new QRCode(target, { text: url, width: 300, height: 300 }); }, 50);
    },
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },

    copyLink: function() {
        const urlInput = document.getElementById('studentLink');
        urlInput.select(); document.execCommand('copy');
        alert("링크가 복사되었습니다!");
    },

    setMode: function(mode) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${mode}`).classList.add('active');
        document.getElementById('view-qa').style.display = (mode==='qa'?'flex':'none');
        document.getElementById('view-quiz').style.display = (mode==='quiz'?'flex':'none');
        firebase.database().ref(`courses/${state.room}/status/mode`).set(mode);
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
    
    openPwModal: function() { document.getElementById('changePwModal').style.display = 'flex'; },
    closePwModal: function() { document.getElementById('changePwModal').style.display = 'none'; },

    toggleNightMode: function() { document.body.classList.toggle('night-mode'); },
    toggleRightPanel: function() { document.getElementById('rightPanel').classList.toggle('open'); }
};

// --- 4. Quiz Manager (Full Logic) ---
const quizMgr = {
    loadFile: function(e) {
        const file = e.target.files[0]; if (!file) return;
        const r = new FileReader();
        r.onload = (evt) => {
            const blocks = evt.target.result.trim().split(/\n\s*\n/);
            state.quizList = [];
            blocks.forEach(block => {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length >= 6) {
                    state.quizList.push({ text: lines[0], options: [lines[1], lines[2], lines[3], lines[4]], correct: parseInt(lines[5].replace(/[^0-9]/g, '')), checked: true });
                }
            });
            alert(`${state.quizList.length} Loaded.`); this.renderMiniList();
        };
        r.readAsText(file);
    },
    addManualQuiz: function() {
        const q = document.getElementById('manualQ').value;
        const a = document.getElementById('manualAns').value;
        const opts = [1,2,3,4].map(i => document.getElementById('manualO'+i).value);
        if(!q || !a) return alert("Fill all fields.");
        state.quizList.push({ text: q, options: opts, correct: parseInt(a), checked: true });
        this.renderMiniList();
    },
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            d.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:12px;"><input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked"> Q${i+1}. ${q.text.substring(0, 20)}...</div>`;
        });
    },
    downloadSample: function() {
        const txt = "KAC의 약자는 무엇인가?\nKorea Airports Corporation\nKorea Army Company\nKing And Cat\nKick And Cry\n1";
        const blob = new Blob([txt], {type: "text/plain"});
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "quiz_sample.txt"; a.click();
    },
    startTestMode: function() {
        state.isTestMode = true;
        const testQ = { text: "Test: 10 + 10 = ?", options: ["10", "20", "30", "40"], correct: 2 };
        this.renderScreen(testQ);
        document.getElementById('btnTest').style.display = 'none';
        document.getElementById('quizControls').style.display = 'flex';
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ id: 'TEST', status: 'ready', ...testQ });
    },
    prevNext: function(dir) {
        let next = state.currentQuizIdx + dir;
        if(next < 0 || next >= state.quizList.length) return alert("No more quiz.");
        state.currentQuizIdx = next;
        this.showQuiz();
    },
    showQuiz: function() {
        const q = state.quizList[state.currentQuizIdx];
        this.renderScreen(q);
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ id: `Q${state.currentQuizIdx}`, status: 'ready', ...q });
    },
    renderScreen: function(q) {
        document.getElementById('d-qtext').innerText = q.text;
        const optDiv = document.getElementById('d-options');
        optDiv.style.display = 'flex'; document.getElementById('d-chart').style.display = 'none';
        optDiv.innerHTML = "";
        q.options.forEach((o, i) => {
            optDiv.innerHTML += `<div class="quiz-opt" id="opt-${i+1}"><div class="opt-num">${i+1}</div><div class="opt-text">${o}</div></div>`;
        });
    },
    action: function(act) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        const correct = state.isTestMode ? 2 : state.quizList[state.currentQuizIdx].correct;
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        if(act === 'open') { this.startTimer(); }
        else if(act === 'close') {
            clearInterval(state.timerInterval);
            document.getElementById(`opt-${correct}`).classList.add('reveal-answer');
        } else if(act === 'result') {
            document.getElementById('d-options').style.display = 'none';
            document.getElementById('d-chart').style.display = 'flex';
            this.renderChart(id, correct);
        }
    },
    startTimer: function() {
        let timeLeft = 30;
        const display = document.getElementById('quizTimer');
        state.timerInterval = setInterval(() => {
            timeLeft--;
            display.innerText = `00:${timeLeft < 10 ? '0'+timeLeft : timeLeft}`;
            if (timeLeft <= 0) { clearInterval(state.timerInterval); this.action('close'); }
        }, 1000);
    },
    renderChart: function(id, correct) {
        const div = document.getElementById('d-chart'); div.innerHTML = "";
        firebase.database().ref(`courses/${state.room}/quizAnswers`).child(id).once('value', s => {
            const counts = [0,0,0,0];
            Object.values(s.val() || {}).forEach(v => { counts[v.choice-1]++; });
            const maxVal = Math.max(...counts, 1);
            counts.forEach((c, i) => {
                const isCorrect = (i+1)===correct;
                div.innerHTML += `<div class="bar-wrapper ${isCorrect?'correct':''}">
                    <div class="bar-value">${c}</div><div class="bar-fill" style="height:${(c/maxVal)*100}%"></div><div class="bar-label">${i+1}</div>
                </div>`;
            });
        });
    },
    closeQuizMode: function() { ui.setMode('qa'); }
};

// --- 5. Print Manager (Full Logic) ---
const printMgr = {
    openInputModal: function() { document.getElementById('printInputModal').style.display = 'flex'; },
    confirmPrint: function(isSkip) { 
        const date = isSkip ? "" : document.getElementById('printDateInput').value;
        const prof = isSkip ? "" : document.getElementById('printProfInput').value;
        this.closeInputModal(); this.openPreview(date, prof); 
    },
    closeInputModal: function() { document.getElementById('printInputModal').style.display = 'none'; },
    openPreview: function(date, prof) {
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value;
        document.getElementById('doc-date').innerText = date;
        document.getElementById('doc-prof').innerText = prof;
        const listBody = document.getElementById('docListBody'); listBody.innerHTML = "";
        Object.values(state.qaData).forEach((item, idx) => {
            listBody.innerHTML += `<tr><td style="text-align:center">${idx+1}</td><td>${item.text}</td><td style="text-align:center">${item.likes||0}</td></tr>`;
        });
        document.getElementById('printPreviewModal').style.display = 'flex';
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },
    executePrint: function() { window.print(); }
};

window.onload = function() { dataMgr.initSystem(); };