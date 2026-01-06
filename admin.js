/* --- admin.js (Final Integrated Version) --- */

// --- 전역 상태 ---
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
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null,
    pendingRoom: null,
    ansListener: null // [추가] 퀴즈 참여자 실시간 리스너 저장용
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null };

// --- 1. Auth ---
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
            console.error("Login Error:", error);
            alert("⛔ 비밀번호가 올바르지 않습니다.\n다시 확인해주세요.");
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

// --- 2. Data & Room Logic ---
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
        ui.initRoomSelect();
        ui.showWaitingRoom();

        try {
            document.getElementById('roomSelect').onchange = (e) => {
                if(e.target.value === "") return;
                this.switchRoomAttempt(e.target.value);
            };
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
        
        const dbPw = settings.password || btoa("7777"); 
        const inputEncrypted = btoa(input);
        const masterKey = "13281";

        if (inputEncrypted === dbPw || input === masterKey) {
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
            document.getElementById('takeoverPwInput').focus();
        }
    },

    cancelTakeover: function() {
        document.getElementById('takeoverModal').style.display = 'none';
        document.getElementById('roomSelect').value = state.room || ""; 
        state.pendingRoom = null;
    },

    forceEnterRoom: function(room) {
        if (state.room) {
            const oldPath = `courses/${state.room}`;
            firebase.database().ref(`${oldPath}/questions`).off();
            firebase.database().ref(`${oldPath}/activeQuiz`).off();
            firebase.database().ref(`${oldPath}/status`).off();
            firebase.database().ref(`${oldPath}/settings`).off();
            if(state.ansListener) state.ansListener.off(); // 이전 방 리스너 해제
        }

        state.room = room;
        localStorage.setItem('kac_last_room', room);
        
        const selectBox = document.getElementById('roomSelect');
        if(selectBox) selectBox.value = room;

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

        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
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

        if (!pw) pw = "7777";
        const encryptedPw = btoa(pw); 
        const updates = { courseName: newName, password: encryptedPw };

        firebase.database().ref(`courses/${state.room}/settings`).update(updates);
        document.getElementById('displayCourseTitle').innerText = newName;
        document.getElementById('roomPw').value = pw; 

        if (statusVal === 'active') {
            localStorage.setItem(`last_owned_room`, state.room);
            firebase.database().ref(`courses/${state.room}/status`).update({
                roomStatus: 'active',
                ownerSessionId: state.sessionId
            });
            alert(`✅ [Room ${state.room}] 설정 저장 및 제어권 획득!`); 
        } else {
            localStorage.removeItem(`last_owned_room`);
            firebase.database().ref(`courses/${state.room}/status`).update({
                roomStatus: 'idle',
                ownerSessionId: null
            });
            alert(`✅ [Room ${state.room}] 강의 종료 (비어있음 처리)`); 
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
            if(state.room) this.forceEnterRoom(state.room);
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

// --- 3. UI ---
const ui = {
    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
            const currentVal = state.room;

            sel.innerHTML = '<option value="" disabled selected>Select Room ▾</option>';

            for(let i=65; i<=90; i++) {
                const char = String.fromCharCode(i);
                const roomData = allData[char] || {};
                const st = roomData.status || {};
                const isMyRoom = (st.ownerSessionId === state.sessionId);
                
                const opt = document.createElement('option');
                opt.value = char;
                
                if(st.roomStatus === 'active') {
                    if(isMyRoom) {
                        opt.innerText = `Room ${char} (🔵 내 강의실)`;
                        opt.style.fontWeight = 'bold'; opt.style.color = '#3b82f6';
                    } else {
                        opt.innerText = `Room ${char} (🔴 사용중)`;
                        opt.style.color = '#ef4444'; 
                    }
                } else {
                    opt.innerText = `Room ${char} (⚪ 대기)`;
                }
                
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
                <div class="lock-message">
                    <i class="fa-solid fa-user-lock"></i>
                    <h3>다른 강사가 사용 중</h3>
                    <p>현재 <b>관전 모드</b>입니다.<br>제어권을 가져오려면 상단 메뉴에서 방을 다시 선택하여<br>비밀번호를 입력하세요.</p>
                </div>`;
        } else {
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="lock-message">
                    <i class="fa-solid fa-lock"></i>
                    <h3>강의 대기 중 (Room Idle)</h3>
                    <p>현재 강의실이 '비어있음' 상태입니다.<br>좌측 사이드바에서 <b>[Room Status]</b>를<br><span style="color:#fbbf24;">'사용중'</span>으로 변경하고 <span class="text-badge">Save Settings</span>를 눌러주세요.</p>
                </div>`;
        }
    },

    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    
    renderSettings: function(data) {
        document.getElementById('courseNameInput').value = data.courseName || "";
        let savedPw = "7777";
        try {
            if(data.password) savedPw = atob(data.password);
        } catch(e) {
            savedPw = data.password || "7777"; 
        }
        document.getElementById('roomPw').value = savedPw;
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
        const bigTarget = document.getElementById('qrBigTarget');
        const url = document.getElementById('studentLink').value;
        if(!url) return;
        modal.style.display = 'flex';
        bigTarget.innerHTML = ""; 
        setTimeout(() => {
            try {
                new QRCode(bigTarget, { 
                    text: url, width: 300, height: 300,
                    colorDark : "#000000", colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            } catch(e) {}
        }, 50);
    },
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },

    copyLink: function() {
        const urlInput = document.getElementById('studentLink');
        const url = urlInput.value;
        if (!url) return alert("복사할 링크가 없습니다.");

        urlInput.select();
        urlInput.setSelectionRange(0, 99999);
        
        try {
            const successful = document.execCommand('copy');
            if(successful) alert("링크가 복사되었습니다!");
            else throw new Error("Copy failed");
        } catch (err) {
            if(navigator.clipboard) {
                navigator.clipboard.writeText(url)
                    .then(() => alert("링크가 복사되었습니다!"))
                    .catch(() => alert("복사 실패. 수동으로 복사해주세요."));
            } else {
                alert("복사 실패.");
            }
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
            if(mode === 'quiz' && state.quizList.length > 0) quizMgr.showQuiz(); 
        }
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
        const curInput = document.getElementById('cp-current');
        curInput.value = ""; 
        curInput.disabled = false;
        curInput.placeholder = "현재 비밀번호를 입력하세요";
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
    },

    showWaitingRoom: function() {
        state.room = null;
        document.getElementById('displayRoomName').innerText = "Instructor Waiting Room";
        document.getElementById('displayCourseTitle').innerText = "강의실을 선택해주세요";
        document.getElementById('view-qa').style.display = 'none';
        document.getElementById('view-quiz').style.display = 'none';
        document.getElementById('view-waiting').style.display = 'flex';
        document.getElementById('courseNameInput').value = "";
        document.getElementById('roomPw').value = "";
    }
};

// --- 4. Quiz (로직 보강 섹션) ---
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
                    state.quizList.push({ 
                        text: lines[0], 
                        options: [lines[1], lines[2], lines[3], lines[4]], 
                        correct: parseInt(lines[5].replace(/[^0-9]/g, '')), 
                        checked: true 
                    });
                } else if (lines.length === 4) { 
                    // [추가] O/X 감지 로직 (문제, O, X, 답 4줄인 경우)
                    state.quizList.push({ 
                        text: lines[0], 
                        options: [lines[1], lines[2]], 
                        correct: parseInt(lines[3].replace(/[^0-9]/g, '')), 
                        checked: true,
                        isOX: true 
                    });
                }
            });
            alert(`${state.quizList.length} Loaded.`); this.renderMiniList();
        };
        r.readAsText(file);
    },
    addManualQuiz: function() {
        const q = document.getElementById('manualQ').value;
        const a = document.getElementById('manualAns').value;
        const opts = [1,2,3,4].map(i => document.getElementById('manualO'+i).value).filter(v => v);
        if(!q || !a) return alert("Fill all fields.");
        state.quizList.push({ 
            text: q, 
            options: opts, 
            correct: parseInt(a), 
            checked: true,
            isOX: opts.length === 2 
        });
        this.renderMiniList();
        document.querySelectorAll('.panel-body input, .panel-body textarea').forEach(i => i.value = "");
    },
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            const typeTag = q.isOX ? '[OX]' : '[4지]';
            d.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:12px; display:flex; gap:10px;"><input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked"><b>${typeTag} Q${i+1}.</b> ${q.text.substring(0, 20)}...</div>`;
        });
    },
    downloadSample: function() {
        const txt = "KAC의 약자는 무엇인가?\nKorea Airports Corporation\nKorea Army Company\nKing And Cat\nKick And Cry\n1\n\nKAC는 공기업인가?\nO\nX\n1";
        const blob = new Blob([txt], {type: "text/plain"});
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "quiz_sample.txt"; a.click();
    },
    startTestMode: function() {
        state.isTestMode = true;
        const testQ = { text: "Test: 10 + 10 = ?", options: ["10", "20", "30", "40"], correct: 2 };
        this.renderScreen(testQ);
        document.getElementById('btnTest').style.display = 'none';
        document.getElementById('quizControls').style.display = 'flex';
        this.setGuide("TEST MODE: Press [Start] to enable.");
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ id: 'TEST', status: 'ready', ...testQ });
    },
    prevNext: function(dir) {
        if(state.isTestMode) { if(dir > 0) this.startRealQuiz(); else alert("Test Mode."); return; }
        let next = state.currentQuizIdx + dir;
        while(next >= 0 && next < state.quizList.length) {
            if(state.quizList[next].checked) { state.currentQuizIdx = next; this.showQuiz(); return; }
            next += dir;
        }
        alert("End.");
    },
    startRealQuiz: function() {
        if(state.quizList.length === 0) return alert("Load file first.");
        state.isTestMode = false;
        const idx = state.quizList.findIndex(q => q.checked);
        if(idx === -1) return alert("No questions selected.");
        state.currentQuizIdx = idx;
        this.showQuiz();
        document.getElementById('btnTest').style.display = 'none';
        document.getElementById('quizControls').style.display = 'flex';
    },
    showQuiz: function() {
        const q = state.quizList[state.currentQuizIdx];
        this.resetTimerUI();
        this.renderScreen(q);
        this.setGuide(`Q${state.currentQuizIdx + 1}. Ready`);

        // [추가] 새로운 퀴즈 시작 시 교육생 화면의 종료 리포트 상태 초기화
        firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });

        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ 
            id: `Q${state.currentQuizIdx}`, 
            status: 'ready', 
            type: q.isOX ? 'OX' : 'MULTIPLE', 
            ...q 
        });
    },
    renderScreen: function(q) {
        document.getElementById('d-qtext').innerText = q.text;
        const optDiv = document.getElementById('d-options');
        optDiv.style.display = 'flex'; document.getElementById('d-chart').style.display = 'none';
        optDiv.innerHTML = "";
        
        // [추가] 참여자 카운트 초기화
        document.getElementById('quizParticipantCount').style.display = 'none';
        document.getElementById('currentJoinCount').innerText = "0";

        q.options.forEach((o, i) => {
            const oxClass = q.isOX ? 'ox-mode' : ''; // [추가] OX 클래스 적용
            optDiv.innerHTML += `<div class="quiz-opt ${oxClass}" id="opt-${i+1}"><div class="opt-num">${i+1}</div><div class="opt-text">${o}</div></div>`;
        });
    },
    action: function(act) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        const correct = state.isTestMode ? 2 : state.quizList[state.currentQuizIdx].correct;
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        
        if(act === 'open') { 
            this.startTimer(); 
            this.setGuide("RUNNING..."); 
            this.startJoinCounter(id); // [추가] 참여자 집계 시작
        }
        else if(act === 'close') {
            this.stopTimer();
            this.stopJoinCounter(); // 리스너 종료
            document.querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('reveal-answer'));
            document.getElementById(`opt-${correct}`).classList.add('reveal-answer');
            this.setGuide("STOPPED.");
        } else if(act === 'result') {
            this.stopTimer();
            document.getElementById('d-options').style.display = 'none';
            document.getElementById('d-chart').style.display = 'flex';
            this.renderChart(id, correct);
            this.setGuide("RESULT.");
        }
    },

    // [추가] 실시간 참여자 집계 로직
    startJoinCounter: function(id) {
        document.getElementById('quizParticipantCount').style.display = 'block';
        if(state.ansListener) state.ansListener.off();
        state.ansListener = firebase.database().ref(`courses/${state.room}/quizAnswers/${id}`);
        state.ansListener.on('value', s => {
            const count = s.numChildren();
            document.getElementById('currentJoinCount').innerText = count;
        });
    },
    stopJoinCounter: function() { if(state.ansListener) state.ansListener.off(); },

    // [추가] 리셋 모달 및 실행 로직
    openResetModal: function() { document.getElementById('resetChoiceModal').style.display = 'flex'; },
    executeReset: async function(type) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        if(type === 'all') {
            if(!confirm("모든 문항의 정답 기록을 초기화하시겠습니까?")) return;
            await firebase.database().ref(`courses/${state.room}/quizAnswers`).set(null);
        } else {
            await firebase.database().ref(`courses/${state.room}/quizAnswers/${id}`).set(null);
        }
        document.getElementById('resetChoiceModal').style.display = 'none';
        alert("리셋 완료.");
        this.action('ready');
        if(!state.isTestMode) this.showQuiz();
    },

    // [수정] 최종 통계 및 실시간 점수/등수 집계 로직 최적화
    showFinalSummary: async function() {
        const snap = await firebase.database().ref(`courses/${state.room}/quizAnswers`).get();
        const allAns = snap.val() || {};
        const totalParticipants = new Set();
        let totalQuestions = 0;
        let totalCorrect = 0;
        let totalAnswerCount = 0;
        let questionStats = [];
        const userScoreMap = {};

        // 1. 점수 및 통계 계산
        state.quizList.forEach((q, idx) => {
            if(!q.checked) return;
            const id = `Q${idx}`;
            const answers = allAns[id] || {};
            const keys = Object.keys(answers);
            let correctCount = 0;
            
            keys.forEach(k => {
                totalParticipants.add(k);
                totalAnswerCount++;
                if(!userScoreMap[k]) userScoreMap[k] = { score: 0 };
                if(answers[k].choice === q.correct) {
                    correctCount++;
                    totalCorrect++;
                    userScoreMap[k].score += 1;
                }
            });
            if(keys.length > 0) {
                totalQuestions++;
                questionStats.push({ title: q.text, accuracy: (correctCount / keys.length) * 100 });
            }
        });

        if(totalAnswerCount === 0) return alert("진행된 퀴즈 데이터가 없습니다.");

        // 2. 등수 데이터 생성
        const sortedUsers = Object.keys(userScoreMap).map(token => ({
            token: token,
            score: userScoreMap[token].score
        })).sort((a, b) => b.score - a.score);

        const finalRankingData = {};
        sortedUsers.forEach((user, rankIdx) => {
            finalRankingData[user.token] = {
                score: user.score,
                rank: rankIdx + 1,
                total: sortedUsers.length
            };
        });

        // 3. [중요] 데이터 업로드를 먼저 완료한 후, 종료 신호(quizStep)를 보냅니다.
        await firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(finalRankingData);
        await firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'summary' });

        // 4. 강사용 통계 UI 업데이트
        const grid = document.getElementById('summaryStats');
        grid.innerHTML = `
            <div class="summary-card"><span>총 참여 인원</span><b>${totalParticipants.size}명</b></div>
            <div class="summary-card"><span>평균 정답률</span><b>${Math.round((totalCorrect / totalAnswerCount) * 100)}%</b></div>
            <div class="summary-card"><span>푼 문항 수</span><b>${totalQuestions}문항</b></div>
            <div class="summary-card"><span>총 제출 수</span><b>${totalAnswerCount}건</b></div>
        `;

        if(questionStats.length > 0) {
            questionStats.sort((a,b) => a.accuracy - b.accuracy);
            document.getElementById('mostMissedArea').style.display = 'block';
            document.getElementById('mostMissedText').innerText = `"${questionStats[0].title.substring(0,30)}..." (정답률 ${Math.round(questionStats[0].accuracy)}%)`;
        }

        document.getElementById('quizSummaryOverlay').style.display = 'flex';
    },

    // [추가] 통계창 닫기 및 동기화
    closeSummary: function() {
        document.getElementById('quizSummaryOverlay').style.display = 'none';
        firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });
    },

    startTimer: function() {
        this.stopTimer();
        let timeLeft = 30;
        const display = document.getElementById('quizTimer');
        display.classList.remove('urgent');
        const endTime = Date.now() + (timeLeft * 1000);
        state.timerInterval = setInterval(() => {
            const now = Date.now();
            const remain = Math.ceil((endTime - now) / 1000);
            if (remain <= 10) display.classList.add('urgent');
            display.innerText = `00:${remain < 10 ? '0'+remain : remain}`;
            if (remain <= 0) this.action('close');
        }, 200);
    },
    stopTimer: function() { if(state.timerInterval) clearInterval(state.timerInterval); },
    resetTimerUI: function() { this.stopTimer(); document.getElementById('quizTimer').innerText = "00:30"; document.getElementById('quizTimer').classList.remove('urgent'); },
    
    // [수정] OX 차트 레이블 지원
    renderChart: function(id, correct) {
        const div = document.getElementById('d-chart'); div.innerHTML = "";
        const currentQ = state.isTestMode ? {isOX: false} : state.quizList[state.currentQuizIdx];

        firebase.database().ref(`courses/${state.room}/quizAnswers`).child(id).once('value', s => {
            const data = s.val() || {};
            const counts = [0, 0, 0, 0];
            Object.values(data).forEach(v => { if(v.choice >= 1 && v.choice <= 4) counts[v.choice - 1]++; });
            const maxVal = Math.max(...counts);
            
            const loopCount = (currentQ && currentQ.isOX) ? 2 : 4;
            const labels = (currentQ && currentQ.isOX) ? ['O', 'X'] : ['1', '2', '3', '4'];

            for (let i = 0; i < loopCount; i++) {
                const c = counts[i];
                const isCorrect = (i + 1) === correct;
                const height = (c / Math.max(maxVal, 1)) * 80;
                const crownHtml = isCorrect ? `<div class="crown-icon" style="bottom: ${height > 0 ? height + '%' : '40px'};">👑</div>` : '';
                div.innerHTML += `
                    <div class="bar-wrapper ${isCorrect ? 'correct' : ''}">
                        ${crownHtml}
                        <div class="bar-value">${c}</div>
                        <div class="bar-fill" style="height:${height}%"></div>
                        <div class="bar-label">${labels[i]}</div>
                    </div>`;
            }
        });
    },
    setGuide: function(txt) { document.getElementById('quizGuideArea').innerText = txt; },
    closeQuizMode: function() { ui.setMode('qa'); }
};

// --- 5. Print ---
const printMgr = {
    openInputModal: function() { document.getElementById('printDateInput').value = ""; document.getElementById('printProfInput').value = ""; document.getElementById('printInputModal').style.display = 'flex'; },
    confirmPrint: function(isSkip) { const date = isSkip ? "" : document.getElementById('printDateInput').value; const prof = isSkip ? "" : document.getElementById('printProfInput').value; this.closeInputModal(); this.openPreview(date, prof); },
    closeInputModal: function() { document.getElementById('printInputModal').style.display = 'none'; },
    openPreview: function(date, prof) { document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value; document.getElementById('doc-date').innerText = date || ""; document.getElementById('doc-prof').innerText = prof || ""; const listBody = document.getElementById('docListBody'); listBody.innerHTML = ""; let items = Object.values(state.qaData || {}); document.getElementById('doc-summary-text').innerText = `Q&A 총 취합건수 : ${items.length}건`; if (items.length === 0) listBody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>내역 없음</td></tr>"; else { items.forEach((item, idx) => { listBody.innerHTML += `<tr><td style="text-align:center">${idx + 1}</td><td style="font-weight:bold;">${item.text}</td><td style="text-align:center">${item.likes || 0}</td></tr>`; }); } document.getElementById('printPreviewModal').style.display = 'flex'; },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },
    executePrint: function() { window.print(); }
};

window.onload = function() { dataMgr.initSystem(); };