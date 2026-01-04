// --- 전역 상태 관리 ---
const state = {
    room: 'A',
    isTestMode: false,
    quizList: [],
    currentQuizIdx: 0,
    activeQaKey: null,
    qaData: {},
    timerInterval: null
};

// --- Firebase Refs (초기화 시 설정) ---
let dbRef = { qa: null, quiz: null, ans: null, settings: null };

// --- 1. 보안/인증 관리 (Auth Manager) ---
const authMgr = {
    MASTER_KEY: "3126",
    DEFAULT_PW: "9999",
    
    // 로그인 확인 (세션 스토리지 사용 - 브라우저 끄면 로그아웃됨)
    checkMasterAuth: function() {
        if (sessionStorage.getItem('isMasterAdmin') === 'true') return true;
        const input = prompt("Enter Master Key to access critical functions:");
        if (input === this.MASTER_KEY) {
            sessionStorage.setItem('isMasterAdmin', 'true');
            alert("Master Access Granted for this session.");
            return true;
        }
        alert("Access Denied.");
        return false;
    },

    // 강의실 비밀번호 확인 (삭제/관리용)
    verifyRoomPw: function(callback) {
        if (sessionStorage.getItem('isMasterAdmin') === 'true') {
            callback(true); // 마스터는 프리패스
            return;
        }
        const input = prompt("Enter Room Password:");
        dbRef.settings.child('password').once('value', s => {
            if (String(s.val()) === String(input)) callback(true);
            else { alert("Incorrect Password."); callback(false); }
        });
    },

    logout: function() {
        sessionStorage.removeItem('isMasterAdmin');
        if(confirm("Exit to Login Page?")) location.replace('login.html'); // login.html이 있다고 가정
        else location.reload();
    }
};

// --- 2. 데이터 관리 (Data Manager) ---
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

        // Firebase Ref 갱신
        if(dbRef.qa) dbRef.qa.off();
        if(dbRef.quiz) dbRef.quiz.off();
        
        const rPath = `courses/${room}`;
        dbRef.settings = db.ref(`${rPath}/settings`);
        dbRef.qa = db.ref(`${rPath}/questions`);
        dbRef.quiz = db.ref(`${rPath}/activeQuiz`);
        dbRef.ans = db.ref(`${rPath}/quizAnswers`);

        // 설정 불러오기
        dbRef.settings.once('value', s => ui.renderSettings(s.val() || {}));
        
        // 링크/QR 생성
        const code = this.getRoomCode(room);
        // [수정필요] 실제 학생용 URL로 변경하세요
        const studentUrl = `${window.location.origin}/index.html?code=${code}`; 
        ui.renderQr(studentUrl);

        // 데이터 리스너
        dbRef.qa.on('value', s => {
            state.qaData = s.val() || {};
            ui.renderQaList('all');
        });
    },

    getRoomCode: function(r) {
        // 간단한 예시 로직 (필요시 config.js의 로직 사용)
        return `KAC-${r}-2026`; 
    },

    saveSettings: function() {
        const pw = document.getElementById('roomPw').value;
        const updates = {
            courseName: document.getElementById('courseNameInput').value,
            courseDate: document.getElementById('courseDateInput').value,
            courseCoord: document.getElementById('courseCoordInput').value,
            courseProf: document.getElementById('courseProfInput').value
        };
        if(pw && pw.length >= 4) updates.password = pw;
        
        dbRef.settings.update(updates, (err) => {
            if(err) alert("Save Failed.");
            else { alert("Saved Successfully!"); ui.renderSettings(updates); }
        });
    },

    updateQa: function(action) {
        if(!state.activeQaKey) return;
        
        if (action === 'delete') {
            authMgr.verifyRoomPw((valid) => {
                if(valid) {
                    dbRef.qa.child(state.activeQaKey).remove();
                    ui.closeQaModal();
                }
            });
        } else {
            let status = action;
            // 토글 로직
            if (state.qaData[state.activeQaKey].status === action) status = 'normal';
            dbRef.qa.child(state.activeQaKey).update({ status: status });
            ui.closeQaModal();
        }
    },

    resetCourse: function() {
        if (!authMgr.checkMasterAuth()) return;
        
        if (confirm("⚠️ WARNING: ALL DATA (Questions, Quiz logs) will be DELETED permanently.\nContinue?")) {
            db.ref(`courses/${state.room}`).set(null).then(() => {
                db.ref(`courses/${state.room}/settings/password`).set(authMgr.DEFAULT_PW);
                alert("Reset Complete.");
                location.reload();
            });
        }
    }
};

// --- 3. UI 처리 (UI Manager) ---
const ui = {
    initRoomSelect: function() {
        const sel = document.getElementById('roomSelect');
        for(let i=65; i<=90; i++) {
            const c = String.fromCharCode(i);
            sel.innerHTML += `<option value="${c}">Room ${c}</option>`;
        }
    },

    updateHeaderRoom: function(r) {
        document.getElementById('displayRoomName').innerText = `Course ROOM ${r}`;
    },

    renderSettings: function(data) {
        document.getElementById('courseNameInput').value = data.courseName || "";
        document.getElementById('displayCourseTitle').innerText = data.courseName || "";
        document.getElementById('courseDateInput').value = data.courseDate || "";
        document.getElementById('courseCoordInput').value = data.courseCoord || "";
        document.getElementById('courseProfInput').value = data.courseProf || "";
    },

    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode');
        qrDiv.innerHTML = "";
        new QRCode(qrDiv, { text: url, width: 60, height: 60 });
        
        // 모달용 QR
        const big = document.getElementById('qrBigTarget');
        big.innerHTML = "";
        new QRCode(big, { text: url, width: 300, height: 300 });
    },

    copyLink: function() {
        const input = document.getElementById('studentLink');
        input.select();
        document.execCommand('copy');
        alert("Link Copied!");
    },

    setMode: function(mode) {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${mode}`).classList.add('active');
        document.getElementById('view-qa').style.display = (mode==='qa'?'flex':'none');
        document.getElementById('view-quiz').style.display = (mode==='quiz'?'flex':'none');
        
        // DB에 현재 모드 알림 (학생 화면 전환용)
        db.ref(`courses/${state.room}/status/mode`).set(mode);
    },

    filterQa: function(filter) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        event.target.classList.add('active');
        this.renderQaList(filter);
    },

    renderQaList: function(filter) {
        const list = document.getElementById('qaList');
        list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));

        // 정렬: Pin -> Later -> Normal -> Done, 그리고 좋아요 순
        const getScore = (i) => { 
            if(i.status==='pin') return 1000; 
            if(i.status==='later') return 500; 
            if(i.status==='done') return -1000; 
            return 0; 
        };

        if(filter === 'pin') items = items.filter(x => x.status === 'pin');
        else if(filter === 'later') items = items.filter(x => x.status === 'later');

        items.sort((a,b) => (getScore(b) + (b.likes||0)) - (getScore(a) + (a.likes||0)));

        items.forEach(i => {
            const cls = i.status === 'pin' ? 'status-pin' : (i.status === 'later' ? 'status-later' : (i.status === 'done' ? 'status-done' : ''));
            const icon = i.status === 'pin' ? '📌 ' : (i.status === 'later' ? '⚠️ ' : (i.status === 'done' ? '✅ ' : ''));
            
            const html = `
                <div class="q-card ${cls}" onclick="ui.openQaModal('${i.id}')">
                    <div class="q-content">${icon}${i.text}</div>
                    <div class="q-meta">
                        <div class="q-like-badge">👍 ${i.likes||0}</div>
                        <div class="q-time">${new Date(i.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>`;
            list.innerHTML += html;
        });
    },

    openQaModal: function(key) {
        state.activeQaKey = key;
        document.getElementById('m-text').innerText = state.qaData[key].text;
        document.getElementById('qaModal').style.display = 'flex';
    },

    closeQaModal: function(e) {
        if (!e || e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') {
            document.getElementById('qaModal').style.display = 'none';
        }
    },

    closeQrModal: function() { document.getElementById('qrModal').style.display = 'none'; },
    
    toggleNightMode: function() { document.body.classList.toggle('night-mode'); },
    
    toggleRightPanel: function() {
        const p = document.getElementById('rightPanel');
        p.classList.toggle('open');
        document.getElementById('panelIcon').className = p.classList.contains('open') ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    }
};

// --- 4. 퀴즈 관리 (Quiz Manager) ---
const quizMgr = {
    loadFile: function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = (evt) => {
            // 빈 줄을 기준으로 블록 나누기 (정규식 개선)
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
                }
            });
            alert(`${state.quizList.length} Quizzes Loaded.`);
            this.renderMiniList();
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
        // 입력창 초기화
        document.querySelectorAll('.panel-body input, .panel-body textarea').forEach(i => i.value = "");
    },

    renderMiniList: function() {
        const d = document.getElementById('miniQuizList');
        d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            d.innerHTML += `
                <div style="padding:10px; border-bottom:1px solid #eee; font-size:12px; display:flex; gap:10px;">
                    <input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked">
                    <b>Q${i+1}.</b> ${q.text.substring(0, 20)}...
                </div>`;
        });
    },

    downloadSample: function() {
        const txt = "KAC의 약자는 무엇인가?\nKorea Airports Corporation\nKorea Army Company\nKing And Cat\nKick And Cry\n1\n\n다음 중 수도는?\n부산\n서울\n대구\n광주\n2";
        const blob = new Blob([txt], {type: "text/plain"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "quiz_sample.txt";
        a.click();
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
        if(state.isTestMode) {
            if(dir > 0) this.startRealQuiz(); // 테스트 끝내고 실전으로
            else alert("This is Test Mode.");
            return;
        }
        let next = state.currentQuizIdx + dir;
        // 체크된 문제 찾을 때까지 반복
        while(next >= 0 && next < state.quizList.length) {
            if(state.quizList[next].checked) {
                state.currentQuizIdx = next;
                this.showQuiz();
                return;
            }
            next += dir;
        }
        alert("End of List.");
    },

    startRealQuiz: function() {
        if(state.quizList.length === 0) return alert("Please load quiz file first.");
        state.isTestMode = false;
        // 첫 번째 체크된 문제 찾기
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
        optDiv.style.display = 'flex';
        document.getElementById('d-chart').style.display = 'none';
        
        optDiv.innerHTML = "";
        q.options.forEach((o, i) => {
            optDiv.innerHTML += `
                <div class="quiz-opt" id="opt-${i+1}">
                    <div class="opt-num">${i+1}</div>
                    <div class="opt-text">${o}</div>
                </div>`;
        });
    },

    action: function(act) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        const correct = state.isTestMode ? 2 : state.quizList[state.currentQuizIdx].correct;
        
        dbRef.quiz.update({ status: act });

        if(act === 'open') {
            this.startTimer();
            this.setGuide("RUNNING...");
        } else if(act === 'close') {
            this.stopTimer();
            document.querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('reveal-answer'));
            document.getElementById(`opt-${correct}`).classList.add('reveal-answer');
            this.setGuide("STOPPED. Answer Revealed.");
        } else if(act === 'result') {
            this.stopTimer();
            document.getElementById('d-options').style.display = 'none';
            document.getElementById('d-chart').style.display = 'flex';
            this.renderChart(id, correct);
            this.setGuide("RESULT: Statistics.");
        }
    },

    // 타이머 (Date.now 기반 보정)
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
            
            if (remain <= 0) {
                this.action('close');
            }
        }, 200); // 자주 업데이트해도 계산은 정확함
    },

    stopTimer: function() {
        if(state.timerInterval) clearInterval(state.timerInterval);
    },
    
    resetTimerUI: function() {
        this.stopTimer();
        document.getElementById('quizTimer').innerText = "00:30";
        document.getElementById('quizTimer').classList.remove('urgent');
    },

    renderChart: function(id, correct) {
        const div = document.getElementById('d-chart');
        div.innerHTML = ""; // 초기화
        
        dbRef.ans.child(id).once('value', s => {
            const data = s.val() || {};
            const counts = [0, 0, 0, 0];
            Object.values(data).forEach(v => {
                if(v.choice >= 1 && v.choice <= 4) counts[v.choice - 1]++;
            });
            
            // 최대값 찾기 (Winner 표시용)
            const maxVal = Math.max(...counts);
            // 전체 응답자 (비율 계산용, 0이면 1로 방어)
            const total = counts.reduce((a,b) => a+b, 0) || 1; 

            counts.forEach((c, i) => {
                const isCorrect = (i + 1) === correct;
                // 최대값이면서 정답인 경우에만 Winner? 아니면 그냥 정답만 Winner? 
                // 보통 정답바에 표시하므로 correct class만 줌
                const height = (c / Math.max(maxVal, 1)) * 80; // 최대 높이 80%

                div.innerHTML += `
                    <div class="bar-wrapper ${isCorrect ? 'correct' : ''}">
                        <div class="bar-value">${c}</div>
                        <div class="bar-fill" style="height:${height}%"></div>
                        <div class="bar-label">${i+1}</div>
                    </div>`;
            });
        });
    },
    
    setGuide: function(txt) {
        document.getElementById('quizGuideArea').innerText = txt;
    }
};

// --- 5. 프린트 관리 (Print Manager) ---
const printMgr = {
    openPreview: function() {
        // 데이터 채우기
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value;
        document.getElementById('doc-date').innerText = document.getElementById('courseDateInput').value;
        document.getElementById('doc-prof').innerText = document.getElementById('courseProfInput').value;
        
        const listBody = document.getElementById('docListBody');
        listBody.innerHTML = "";
        
        let items = Object.values(state.qaData || {});
        document.getElementById('doc-summary-text').innerText = `Q&A 총 취합건수 : ${items.length}건`;
        
        if (items.length === 0) {
            listBody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>질문 내역이 없습니다.</td></tr>";
        } else {
            items.forEach((item, idx) => {
                listBody.innerHTML += `
                    <tr>
                        <td style="text-align:center">${idx + 1}</td>
                        <td style="font-weight:bold;">${item.text}</td>
                        <td style="text-align:center">${item.likes || 0}</td>
                    </tr>`;
            });
        }

        // 모달 열기
        document.getElementById('printPreviewModal').style.display = 'flex';
    },

    closePreview: function() {
        document.getElementById('printPreviewModal').style.display = 'none';
    },

    executePrint: function() {
        window.print();
    }
};

// --- App Start ---
window.onload = function() {
    dataMgr.init();
};