// --- 전역 상태 ---
const state = {
    room: 'A',
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
    MASTER_KEY: "3126",
    DEFAULT_PW: "9999",
    checkMasterAuth: function() {
        if (sessionStorage.getItem('isMasterAdmin') === 'true') return true;
        const input = prompt("Enter Master Key:");
        if (input === this.MASTER_KEY) {
            sessionStorage.setItem('isMasterAdmin', 'true');
            return true;
        }
        alert("Access Denied."); return false;
    },
    verifyRoomPw: function(callback) {
        if (sessionStorage.getItem('isMasterAdmin') === 'true') { callback(true); return; }
        const input = prompt("Enter Room Password:");
        dbRef.settings.child('password').once('value', s => {
            if (String(s.val()) === String(input)) callback(true);
            else { alert("Incorrect."); callback(false); }
        });
    },
    logout: function() {
        sessionStorage.removeItem('isMasterAdmin');
        location.reload(); 
    }
};

// --- 2. Data ---
const dataMgr = {
    init: function() {
        this.changeRoom('A');
        ui.initRoomSelect();
        
        document.getElementById('roomSelect').addEventListener('change', (e) => this.changeRoom(e.target.value));
        document.getElementById('btnSaveInfo').addEventListener('click', () => this.saveSettings());
        document.getElementById('btnCopyLink').addEventListener('click', () => ui.copyLink());
        document.getElementById('quizFile').addEventListener('change', (e) => quizMgr.loadFile(e));
    },

    changeRoom: function(room) {
        state.room = room;
        ui.updateHeaderRoom(room);
        if(dbRef.qa) dbRef.qa.off();
        if(dbRef.quiz) dbRef.quiz.off();
        
        const rPath = `courses/${room}`;
        dbRef.settings = db.ref(`${rPath}/settings`);
        dbRef.qa = db.ref(`${rPath}/questions`);
        dbRef.quiz = db.ref(`${rPath}/activeQuiz`);
        dbRef.ans = db.ref(`${rPath}/quizAnswers`);
        dbRef.status = db.ref(`${rPath}/status`);

        // 설정(이름, 상태) 불러오기
        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        dbRef.status.child('roomStatus').once('value', s => ui.renderRoomStatus(s.val()));

        const code = this.getRoomCode(room);
        const studentUrl = `${window.location.origin}/index.html?code=${code}`; 
        ui.renderQr(studentUrl);

        dbRef.qa.on('value', s => {
            state.qaData = s.val() || {};
            ui.renderQaList('all');
        });
    },

    getRoomCode: function(r) {
        if (typeof getCodeFromRoom === 'function') {
            return getCodeFromRoom(r);
        }
        return `KAC-${r}-TEMP`; 
    },

    saveSettings: function() {
        const pw = document.getElementById('roomPw').value;
        const newName = document.getElementById('courseNameInput').value;
        const updates = { courseName: newName };
        
        document.getElementById('displayCourseTitle').innerText = newName;

        const statusVal = document.getElementById('roomStatusSelect').value;
        dbRef.status.child('roomStatus').set(statusVal).then(() => {
            ui.initRoomSelect(); 
        });

        if(pw && pw.length >= 4) updates.password = pw;
        dbRef.settings.update(updates, (err) => {
            if(err) alert("Error."); else { alert("Saved."); }
        });
    },

    updateQa: function(action) {
        if(!state.activeQaKey) return;
        if (action === 'delete') {
            authMgr.verifyRoomPw((valid) => {
                if(valid) { dbRef.qa.child(state.activeQaKey).remove(); ui.closeQaModal(); }
            });
        } else {
            let status = action;
            if (state.qaData[state.activeQaKey].status === action) status = 'normal';
            dbRef.qa.child(state.activeQaKey).update({ status: status });
            ui.closeQaModal();
        }
    },

    resetCourse: function() {
        if (!authMgr.checkMasterAuth()) return;
        if (confirm("Reset Course Data?")) {
            db.ref(`courses/${state.room}`).set(null).then(() => {
                db.ref(`courses/${state.room}/settings/password`).set(authMgr.DEFAULT_PW);
                alert("Reset Complete."); location.reload();
            });
        }
    }
};

// --- 3. UI ---
const ui = {
    initRoomSelect: function() {
        db.ref('courses').once('value', snapshot => {
            const allData = snapshot.val() || {};
            const sel = document.getElementById('roomSelect');
            const currentSelection = sel.value || state.room; 
            
            sel.innerHTML = "";
            for(let i=65; i<=90; i++) {
                const char = String.fromCharCode(i);
                const roomData = allData[char] || {};
                const status = roomData.status ? roomData.status.roomStatus : 'idle';
                
                const opt = document.createElement('option');
                opt.value = char;
                if(status === 'active') {
                    opt.innerText = `Room ${char} (🟢 사용중)`;
                    opt.style.fontWeight = 'bold';
                    opt.style.color = '#fbbf24'; 
                } else {
                    opt.innerText = `Room ${char}`;
                }
                
                if(char === currentSelection) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    },
    updateHeaderRoom: function(r) { document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`; },
    renderSettings: function(data) {
        document.getElementById('courseNameInput').value = data.courseName || "";
        document.getElementById('displayCourseTitle').innerText = data.courseName || "";
    },
    renderRoomStatus: function(st) {
        document.getElementById('roomStatusSelect').value = st || 'idle';
    },
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: url, width: 50, height: 50 });
        const big = document.getElementById('qrBigTarget'); big.innerHTML = "";
        new QRCode(big, { text: url, width: 300, height: 300 });
    },
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

        // [수정] 퀴즈 모드로 다시 들어왔을 때, 기존 문제 유지 및 표시
        if(mode === 'quiz' && state.quizList.length > 0) {
            quizMgr.showQuiz(); 
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
    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },
    
    // [수정] Day/Night Toggle 로직
    toggleNightMode: function() { 
        document.body.classList.toggle('night-mode'); 
        const isNight = document.body.classList.contains('night-mode');
        // 아이콘 활성화 상태 변경
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
                
                const crownHtml = isCorrect 
                    ? `<div class="crown-icon" style="bottom: ${height > 0 ? height + '%' : '40px'};">👑</div>` 
                    : '';

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
    setGuide: function(txt) { document.getElementById('quizGuideArea').innerText = txt; }
    ,
    // [NEW] 퀴즈 모드 종료 (문제 상태 유지, 화면 전환)
    closeQuizMode: function() {
        ui.setMode('qa'); // Q&A 모드로 전환 (DB 업데이트 포함)
    }
};

// --- 5. Print (수정됨: 입력 모달 -> 미리보기) ---
const printMgr = {
    // 1. 입력 모달 열기
    openInputModal: function() {
        document.getElementById('printDateInput').value = "";
        document.getElementById('printProfInput').value = "";
        document.getElementById('printInputModal').style.display = 'flex';
    },
    
    // 2. 입력 확인/스킵
    confirmPrint: function(isSkip) {
        const date = isSkip ? "" : document.getElementById('printDateInput').value;
        const prof = isSkip ? "" : document.getElementById('printProfInput').value;
        this.closeInputModal();
        this.openPreview(date, prof);
    },

    closeInputModal: function() {
        document.getElementById('printInputModal').style.display = 'none';
    },

    // 3. 미리보기 열기 (데이터 주입)
    openPreview: function(date, prof) {
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value;
        document.getElementById('doc-date').innerText = date || ""; // 입력값 사용
        document.getElementById('doc-prof').innerText = prof || ""; // 입력값 사용
        
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

window.onload = function() { dataMgr.init(); };