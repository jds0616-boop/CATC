/* --- admin.js (Full Updated Version) --- */

// --- Firebase Instances ---
const auth = firebase.auth();
const db = firebase.database();

// --- 전역 상태 ---
const state = {
    sessionId: Math.random().toString(36).substr(2, 9), // 브라우저 탭 고유값
    room: null,
    isTestMode: false,
    quizList: [],
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null };

// --- 1. Auth (Firebase Authentication) ---
const authMgr = {
    // 관리자 이메일 (Firebase Console에서 생성한 계정)
    ADMIN_EMAIL: "admin@kac.com", 

    tryLogin: async function() {
        const inputPw = document.getElementById('loginPwInput').value;
        if(!inputPw) return alert("비밀번호를 입력해주세요.");

        try {
            // [보안] 클라이언트 해시 비교가 아닌 서버 인증 사용
            await auth.signInWithEmailAndPassword(this.ADMIN_EMAIL, inputPw);
            // 성공 시 onAuthStateChanged에서 처리됨
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

    executeChangePw: async function() {
        const user = auth.currentUser;
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
            alert("변경 실패: " + e.message + "\n(로그인한지 오래된 경우 재로그인이 필요할 수 있습니다)");
        }
    }
};

// --- 2. Data & Room Logic ---
const dataMgr = {
    initSystem: function() {
        // 인증 상태 감지
        auth.onAuthStateChanged(user => {
            if (user) {
                document.getElementById('loginOverlay').style.display = 'none';
                this.loadInitialData();
            } else {
                document.getElementById('loginOverlay').style.display = 'flex';
            }
        });
    },

    loadInitialData: function() {
        // 마지막 접속 방 기억 (없으면 A)
        const lastRoom = localStorage.getItem('kac_last_room') || 'A';
        this.forceEnterRoom(lastRoom); 

        ui.initRoomSelect(); 
        
        // 이벤트 리스너 연결
        document.getElementById('roomSelect').addEventListener('change', (e) => this.switchRoomAttempt(e.target.value));
        document.getElementById('btnSaveInfo').addEventListener('click', () => this.saveSettings());
        document.getElementById('btnCopyLink').addEventListener('click', () => ui.copyLink());
        document.getElementById('quizFile').addEventListener('change', (e) => quizMgr.loadFile(e));
        
        const qrEl = document.getElementById('qrcode');
        if(qrEl) qrEl.onclick = function() { ui.openQrModal(); };
    },

    // 방 변경 시도
    switchRoomAttempt: async function(newRoom) {
        const snapshot = await db.ref(`courses/${newRoom}/status`).get();
        const st = snapshot.val() || {};
        
        // 이미 사용중이고 내가 주인이 아닌 경우 경고
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            const confirmMsg = `[Room ${newRoom}] 현재 다른 강사가 사용 중입니다.\n강제 진입하시겠습니까?`;
            if (!confirm(confirmMsg)) {
                // 취소 시 원래 방 선택 유지
                document.getElementById('roomSelect').value = state.room;
                return;
            }
        }
        
        // 관리자 권한으로 강제 점유
        await db.ref(`courses/${newRoom}/status`).update({
            ownerSessionId: state.sessionId
        });
        this.forceEnterRoom(newRoom);
    },

    // [중요] 실제 방 입장 로직 (Ghost Listener 수정 적용)
    forceEnterRoom: function(room) {
        // 1. 이전 방의 리스너를 확실하게 제거
        if (state.room) {
            const oldPath = `courses/${state.room}`;
            db.ref(`${oldPath}/questions`).off();
            db.ref(`${oldPath}/activeQuiz`).off();
            db.ref(`${oldPath}/status`).off();
            db.ref(`${oldPath}/settings`).off();
        }

        state.room = room;
        localStorage.setItem('kac_last_room', room);
        ui.updateHeaderRoom(room);

        // UI 초기화 (이전 데이터 잔상 제거)
        document.getElementById('qaList').innerHTML = "";
        state.qaData = {};
        
        const rPath = `courses/${room}`;
        dbRef.settings = db.ref(`${rPath}/settings`);
        dbRef.qa = db.ref(`${rPath}/questions`);
        dbRef.quiz = db.ref(`${rPath}/activeQuiz`);
        dbRef.ans = db.ref(`${rPath}/quizAnswers`);
        dbRef.status = db.ref(`${rPath}/status`);

        // 설정값 로드
        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
        // 상태 실시간 감지 (Ghost Check 적용)
        dbRef.status.on('value', s => {
            // 현재 내가 보고 있는 방이 아니면 무시
            if(state.room !== room) return;

            const st = s.val() || {};
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
        });

        // QR 생성
        this.renderQrForRoom(room);

        // Q&A 로드 (Ghost Check 적용)
        dbRef.qa.on('value', s => {
            if(state.room !== room) return;

            state.qaData = s.val() || {};
            ui.renderQaList('all');
        });
    },

    // QR코드 링크 생성 (직접 링크 방식)
    renderQrForRoom: function(room) {
        // index.html 수정사항에 맞춰 room 파라미터 직접 사용
        const studentUrl = `${window.location.origin}/index.html?room=${room}`;
        ui.renderQr(studentUrl);
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

    // [신규 기능] 모든 방 강제 초기화
    deactivateAllRooms: async function() {
        if(!confirm("⚠️ 경고: 모든 강의실(A~Z)을 '비어있음' 상태로 강제 변경합니다.\n계속하시겠습니까?")) return;
        
        const updates = {};
        for(let i=65; i<=90; i++) {
            const char = String.fromCharCode(i);
            updates[`courses/${char}/status/roomStatus`] = 'idle';
            updates[`courses/${char}/status/ownerSessionId`] = null;
        }

        try {
            await db.ref().update(updates);
            alert("모든 강의실이 비활성화되었습니다.");
            // 현재 화면 상태 반영을 위해 재진입
            this.forceEnterRoom(state.room);
        } catch(e) {
            alert("오류 발생: " + e.message);
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
        if(confirm("현재 강의실 데이터를 초기화하시겠습니까?\n(질문, 퀴즈 내역이 모두 삭제됩니다)")) {
            db.ref(`courses/${state.room}`).set(null).then(() => {
                alert("초기화 완료."); location.reload();
            });
        }
    }
};

// --- 3. UI ---
const ui = {
    initRoomSelect: function() {
        db.ref('courses').on('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
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
                    if(isMyRoom) {
                        opt.innerText = `Room ${char} (🔵 내 강의실)`;
                        opt.style.fontWeight = 'bold'; opt.style.color = '#3b82f6';
                    } else {
                        opt.innerText = `Room ${char} (🔴 사용중)`;
                        opt.style.color = '#ef4444'; 
                    }
                } else {
                    opt.innerText = `Room ${char}`;
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
            // 내가 주인 -> 정상 화면
            overlay.style.display = 'none';
        } else if (isActive && !isOwner) {
            // 남이 사용중 -> 관전 모드
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="lock-message">
                    <i class="fa-solid fa-user-lock"></i>
                    <h3>다른 강사가 사용 중</h3>
                    <p>현재 <b>관전 모드</b>입니다.<br>제어권을 가져오려면 상단 메뉴에서 방을 다시 선택하거나<br>강제 진입하세요.</p>
                </div>`;
        } else {
            // 비어있음 -> 대기 화면
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="lock-message">
                    <i class="fa-solid fa-lock"></i>
                    <h3>강의 대기 중 (Room Idle)</h3>
                    <p>현재 강의실이 '비어있음' 상태입니다.<br>좌측 사이드바에서 <b>[Room Status]</b>를<br><span style="color:#fbbf24;">'사용중'</span>으로 변경하고 저장해주세요.</p>
                </div>`;
        }
    },

    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderSettings: function(data) {
        document.getElementById('courseNameInput').value = data.courseName || "";
        document.getElementById('roomPw').value = data.password || "";
        document.getElementById('displayCourseTitle').innerText = data.courseName || "";
    },
    renderRoomStatus: function(st) { document.getElementById('roomStatusSelect').value = st || 'idle'; },
    
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
        document.getElementById('cp-current').value = "Protected"; // 보안상 현재 비번 숨김
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

// --- 4. Quiz ---
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
        document.querySelectorAll('.panel-body input, .panel-body textarea').forEach(i => i.value = "");
    },
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            d.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:12px; display:flex; gap:10px;"><input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked"><b>Q${i+1}.</b> ${q.text.substring(0, 20)}...</div>`;
        });
    },
    downloadSample: function() {
        const txt = "KAC의 약자는 무엇인가?\nKorea Airports Corporation\nKorea Army Company\nKing And Cat\nKick And Cry\n1\n\n다음 중 수도는?\n부산\n서울\n대구\n광주\n2";
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
        dbRef.quiz.set({ id: 'TEST', status: 'ready', ...testQ });
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
        dbRef.quiz.set({ id: `Q${state.currentQuizIdx}`, status: 'ready', ...q });
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
        dbRef.quiz.update({ status: act });
        if(act === 'open') { this.startTimer(); this.setGuide("RUNNING..."); }
        else if(act === 'close') {
            this.stopTimer();
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
    
    renderChart: function(id, correct) {
        const div = document.getElementById('d-chart'); div.innerHTML = "";
        dbRef.ans.child(id).once('value', s => {
            const data = s.val() || {};
            const counts = [0, 0, 0, 0];
            Object.values(data).forEach(v => { if(v.choice >= 1 && v.choice <= 4) counts[v.choice - 1]++; });
            const maxVal = Math.max(...counts);
            
            counts.forEach((c, i) => {
                const isCorrect = (i + 1) === correct;
                const height = (c / Math.max(maxVal, 1)) * 80;
                const crownHtml = isCorrect ? `<div class="crown-icon" style="bottom: ${height > 0 ? height + '%' : '40px'};">👑</div>` : '';
                div.innerHTML += `
                    <div class="bar-wrapper ${isCorrect ? 'correct' : ''}">
                        ${crownHtml}
                        <div class="bar-value">${c}</div>
                        <div class="bar-fill" style="height:${height}%"></div>
                        <div class="bar-label">${i+1}</div>
                    </div>`;
            });
        });
    },
    setGuide: function(txt) { document.getElementById('quizGuideArea').innerText = txt; },
    closeQuizMode: function() { ui.setMode('qa'); }
};

// --- 5. Print ---
const printMgr = {
    openInputModal: function() {
        document.getElementById('printDateInput').value = "";
        document.getElementById('printProfInput').value = "";
        document.getElementById('printInputModal').style.display = 'flex';
    },
    confirmPrint: function(isSkip) {
        const date = isSkip ? "" : document.getElementById('printDateInput').value;
        const prof = isSkip ? "" : document.getElementById('printProfInput').value;
        this.closeInputModal();
        this.openPreview(date, prof);
    },
    closeInputModal: function() { document.getElementById('printInputModal').style.display = 'none'; },
    openPreview: function(date, prof) {
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value;
        document.getElementById('doc-date').innerText = date || "";
        document.getElementById('doc-prof').innerText = prof || "";
        const listBody = document.getElementById('docListBody'); listBody.innerHTML = "";
        let items = Object.values(state.qaData || {});
        document.getElementById('doc-summary-text').innerText = `Q&A 총 취합건수 : ${items.length}건`;
        if (items.length === 0) listBody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>내역 없음</td></tr>";
        else {
            items.forEach((item, idx) => {
                listBody.innerHTML += `<tr><td style="text-align:center">${idx + 1}</td><td style="font-weight:bold;">${item.text}</td><td style="text-align:center">${item.likes || 0}</td></tr>`;
            });
        }
        document.getElementById('printPreviewModal').style.display = 'flex';
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; },
    executePrint: function() { window.print(); }
};

// --- Initialization ---
window.onload = function() {
    dataMgr.initSystem();
};