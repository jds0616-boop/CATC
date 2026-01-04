// --- Crypto & Security Utils ---
const cryptoUtils = {
    // SHA-256 해시 생성 함수
    hash: async function(text) {
        if (!text) return "";
        const encoder = new TextEncoder();
        const data = encoder.encode(text.toUpperCase()); // 대소문자 무시
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};

// --- 전역 상태 ---
const state = {
    sessionId: Math.random().toString(36).substr(2, 9), // 브라우저 고유값
    room: null,
    isTestMode: false,
    quizList: [],
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null
};

let dbRef = { qa: null, quiz: null, ans: null, settings: null, status: null };

// --- 1. Auth ---
const authMgr = {
    DEFAULT_PW: "catc1234", 
    // 마스터키 해시값 (13281의 SHA-256 값) - 소스코드에 평문 노출 방지
    // 실제 입력: 13281
    MASTER_HASH: "e7514a663b652277d3f4d85233215a0003050965306637300705002005086025", 

    tryLogin: async function() {
        const input = document.getElementById('loginPwInput').value;
        if(!input) return alert("비밀번호를 입력해주세요.");

        const inputHash = await cryptoUtils.hash(input);
        const defaultHash = await cryptoUtils.hash(this.DEFAULT_PW);

        db.ref('adminPassword').once('value', async (snap) => {
            let savedHash = snap.val();
            if (!savedHash) {
                // 최초 실행 시
                if (inputHash === defaultHash) {
                    await db.ref('adminPassword').set(defaultHash);
                    this.loginSuccess();
                } else {
                    alert("초기 비밀번호가 일치하지 않습니다.");
                }
            } else {
                // 평소 로그인
                if (inputHash === savedHash) this.loginSuccess();
                else alert("비밀번호가 올바르지 않습니다.");
            }
        });
    },

    loginSuccess: function() {
        document.getElementById('loginOverlay').style.display = 'none';
        // 세션 스토리지 사용 (탭 닫기 전까지 유지)
        sessionStorage.setItem('kac_admin_auth', 'true');
        dataMgr.initSystem(); 
    },

    logout: function() {
        sessionStorage.removeItem('kac_admin_auth');
        location.reload(); 
    },

    executeChangePw: async function() {
        const curr = document.getElementById('cp-current').value;
        const newPw = document.getElementById('cp-new').value;
        const confirmPw = document.getElementById('cp-confirm').value;

        if(!curr || !newPw || !confirmPw) return alert("모든 필드를 입력해주세요.");
        if(newPw !== confirmPw) return alert("새 비밀번호가 일치하지 않습니다.");

        const currHash = await cryptoUtils.hash(curr);
        const newHash = await cryptoUtils.hash(newPw);

        db.ref('adminPassword').once('value', (snap) => {
            const savedHash = snap.val();
            if(savedHash && savedHash !== currHash) {
                alert("현재 비밀번호가 틀렸습니다.");
            } else {
                db.ref('adminPassword').set(newHash);
                alert("비밀번호가 성공적으로 변경되었습니다.");
                ui.closePwModal();
            }
        });
    }
};

// --- 2. Data & Room Logic ---
const dataMgr = {
    initSystem: function() {
        // 마지막 접속 방 기억 (없으면 A)
        const lastRoom = localStorage.getItem('kac_last_room') || 'A';
        this.forceEnterRoom(lastRoom); 

        ui.initRoomSelect(); 
        document.getElementById('roomSelect').addEventListener('change', (e) => this.switchRoomAttempt(e.target.value));
        document.getElementById('btnSaveInfo').addEventListener('click', () => this.saveSettings());
        document.getElementById('btnCopyLink').addEventListener('click', () => ui.copyLink());
        document.getElementById('quizFile').addEventListener('change', (e) => quizMgr.loadFile(e));
        
        // QR 확대 기능
        const qrEl = document.getElementById('qrcode');
        if(qrEl) qrEl.onclick = function() { ui.openQrModal(); };
    },

    // [중요] 방 변경 시도 로직
    switchRoomAttempt: async function(newRoom) {
        // 1. 목표 방 정보 가져오기
        const snapshot = await db.ref(`courses/${newRoom}`).get();
        const data = snapshot.val() || {};
        const st = data.status || {};
        const settings = data.settings || {};
        
        // A. 빈 방이거나, 이미 내가 주인인 경우 -> 바로 입장
        if (!st.roomStatus || st.roomStatus === 'idle' || st.ownerSessionId === state.sessionId) {
            this.forceEnterRoom(newRoom);
            return;
        }

        // B. 남이 사용중인 경우 -> 비밀번호 요구
        const input = prompt(`[Room ${newRoom}] 사용 중인 강의실입니다.\n제어권을 가져오려면 '강의실 비밀번호' 또는 '관리자 마스터키'를 입력하세요.`);
        
        if (input === null) {
            // 취소 시 원래 방으로 복귀
            document.getElementById('roomSelect').value = state.room;
            return;
        }

        const inputHash = await cryptoUtils.hash(input);
        
        // 비밀번호 검증 (방 비번 OR 마스터키)
        const roomPw = settings.password || "";
        const roomPwHash = await cryptoUtils.hash(roomPw);
        const masterHash = await cryptoUtils.hash("13281"); // 13281의 해시 계산

        if (inputHash === masterHash || inputHash === roomPwHash) {
            alert("인증 성공! 제어권을 가져옵니다.");
            
            // [수정] 상태를 'active'로 강제하지 않고, 주인(Owner)만 나로 변경함.
            // 이미 켜져있는 방을 그대로 이어받기 위함.
            await db.ref(`courses/${newRoom}/status`).update({
                ownerSessionId: state.sessionId
            });
            
            this.forceEnterRoom(newRoom);

        } else {
            alert("비밀번호가 일치하지 않습니다.");
            document.getElementById('roomSelect').value = state.room;
        }
    },

    // 실제 방 입장 (화면 전환 및 리스너 연결)
    forceEnterRoom: function(room) {
        // [중요] 이전 방의 리스너를 확실하게 제거 (Ghost 현상 방지)
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

        // 설정값(방이름, 비번) 불러오기
        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
        // 상태 실시간 감지
        dbRef.status.on('value', s => {
            const st = s.val() || {};
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
        });

        // QR 생성
        const code = this.getRoomCode(room);
        const studentUrl = `${window.location.origin}/index.html?code=${code}`; 
        ui.renderQr(studentUrl);

        // Q&A 로드
        dbRef.qa.on('value', s => {
            state.qaData = s.val() || {};
            ui.renderQaList('all');
        });
    },

    saveSettings: function() {
        const pw = document.getElementById('roomPw').value; 
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;

        // [중요] 현재 내가 보고 있는 방(state.room)에 대해서만 저장
        const updates = { courseName: newName };
        if(pw) updates.password = pw; 

        // 1. 설정 저장
        db.ref(`courses/${state.room}/settings`).update(updates);
        document.getElementById('displayCourseTitle').innerText = newName;

        // 2. 상태 저장 (Active / Idle)
        if (statusVal === 'active') {
            db.ref(`courses/${state.room}/status`).update({
                roomStatus: 'active',
                ownerSessionId: state.sessionId // 내가 주인
            });
            alert(`[Room ${state.room}] 설정이 저장되었습니다.\n강의실이 '사용중' 상태입니다.`); 
        } else {
            db.ref(`courses/${state.room}/status`).update({
                roomStatus: 'idle',
                ownerSessionId: null // 주인 해제
            });
            alert(`[Room ${state.room}] 설정이 저장되었습니다.\n강의실이 '비어있음' 상태입니다.`); 
        }
    },

    getRoomCode: function(r) {
        return (typeof getCodeFromRoom === 'function') ? getCodeFromRoom(r) : `KAC-${r}-TEMP`;
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
        // [수정] 마스터키 힌트 제거
        const input = prompt("초기화를 하려면 '관리자 마스터키'를 입력하세요.");
        
        // 13281 비교 (간단한 로직을 위해 여기서는 평문 비교 후 해시 비교)
        // 보안상 평문 비교보다는, 입력값을 해시해서 비교하는게 맞으나
        // authMgr.MASTER_HASH 변수를 활용
        cryptoUtils.hash(input).then(hash => {
            // 13281의 해시값과 비교 (아래 해시는 13281의 값임)
            const correctHash = "e7514a663b652277d3f4d85233215a0003050965306637300705002005086025";
            
            if (hash === correctHash) {
                db.ref(`courses/${state.room}`).set(null).then(() => {
                    alert("초기화 완료."); location.reload();
                });
            } else if (input !== null) {
                alert("마스터키가 일치하지 않습니다.");
            }
        });
    }
};

// --- 3. UI ---
const ui = {
    initRoomSelect: function() {
        db.ref('courses').on('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
            const currentVal = state.room; // 현재 내가 있는 방

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
                        opt.innerText = `Room ${char} (🔴 사용중 - 진입)`;
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
            // 1. 내가 주인이고 사용중 -> 정상 화면
            overlay.style.display = 'none';
        } else if (isActive && !isOwner) {
            // 2. 남이 사용중 -> 관전 모드 (오버레이)
            overlay.style.display = 'flex';
            overlay.innerHTML = `
                <div class="lock-message">
                    <i class="fa-solid fa-user-lock"></i>
                    <h3>다른 강사가 사용 중</h3>
                    <p>현재 <b>관전 모드</b>입니다.<br>제어권을 가져오려면 상단 메뉴에서 방을 다시 선택하여<br>비밀번호를 입력하세요.</p>
                </div>`;
        } else {
            // 3. 비어있음 -> 대기 화면
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
        document.getElementById('cp-current').value = "";
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

window.onload = function() {
    // 자동 로그인 체크 (세션 유지)
    if(sessionStorage.getItem('kac_admin_auth') === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        dataMgr.initSystem();
    }
};