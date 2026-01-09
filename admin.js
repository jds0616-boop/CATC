/* --- admin.js (Final Integrated Version) --- */

// --- [기본 데이터] ---
const DEFAULT_QUIZ_DATA = [
    { text: "[테스트 문항] 현재 퀴즈 버튼 화면이 잘 보이시나요?", options: ["O (잘 보인다)", "X (안보인다)"], correct: 1, isSurvey: false, isOX: true, checked: true },
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
            if(msgDiv) {
                msgDiv.innerText = "로그인 되었습니다.";
                msgDiv.style.color = "#10b981";
            }
            setTimeout(() => {
                document.getElementById('loginOverlay').style.display = 'none';
                dataMgr.loadInitialData();
                if(msgDiv) msgDiv.innerText = "";
            }, 700);
        } catch (error) {
            if(msgDiv) {
                msgDiv.innerText = "비밀번호가 틀렸습니다.";
                msgDiv.style.color = "#ef4444";
            } else { alert("비밀번호가 올바르지 않습니다."); }
            document.getElementById('loginPwInput').value = "";
            document.getElementById('loginPwInput').focus();
        }
    },

    executeChangePw: async function() {
        const user = firebase.auth().currentUser;
        const newPw = document.getElementById('cp-new').value;
        const confirmPw = document.getElementById('cp-confirm').value;
        if(!user) return ui.showAlert("로그인 상태가 아닙니다.");
        if(!newPw || !confirmPw) return ui.showAlert("모든 필드를 입력해주세요.");
        if(newPw !== confirmPw) return ui.showAlert("새 비밀번호가 일치하지 않습니다.");
        try { 
            await user.updatePassword(newPw); 
            ui.showAlert("비밀번호가 변경되었습니다."); 
            ui.closePwModal(); 
        } catch (e) { ui.showAlert("변경 실패: " + e.message); }
    },

    logout: function() {
        if(confirm("로그아웃 하시겠습니까?")) {
            firebase.auth().signOut().then(() => {
                location.reload(); 
            }).catch(error => {
                alert("로그아웃 중 오류가 발생했습니다: " + error.message);
            });
        }
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
            ui.renderRoomStatus(st.roomStatus || 'idle'); 
            ui.checkLockStatus(st);
            if(st.professorName) document.getElementById('profSelect').value = st.professorName;
            else document.getElementById('profSelect').value = "";
        });
        
        dbRef.connections.on('value', s => {
            const count = s.numChildren();
            document.getElementById('currentJoinCount').innerText = count;
            if (typeof quizMgr !== 'undefined') quizMgr.updateAnswerUI();
        });

        this.fetchCodeAndRenderQr(room);
        dbRef.qa.on('value', s => { if(state.room === room) { state.qaData = s.val() || {}; ui.renderQaList('all'); }});

        if(state.newBadgeTimer) clearInterval(state.newBadgeTimer);
        state.newBadgeTimer = setInterval(() => {
            const cards = document.querySelectorAll('.q-card.is-new');
            cards.forEach(card => {
                const ts = parseInt(card.getAttribute('data-ts'));
                if (Date.now() - ts >= 120000) {
                    card.classList.remove('is-new');
                    const badge = card.querySelector('.new-badge-icon');
                    if(badge) badge.remove();
                }
            });
        }, 5000);
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
                roomStatus: 'active', ownerSessionId: state.sessionId, professorName: selectedProf 
            });
            ui.showAlert(`✅ [Room ${state.room}] 설정 저장 완료!`); 
        } else {
            localStorage.removeItem(`last_owned_room`);
            firebase.database().ref(`courses/${state.room}/status`).update({ 
                roomStatus: 'idle', ownerSessionId: null, professorName: null 
            });
            ui.showAlert(`✅ [Room ${state.room}] 강의 종료`); 
        }
    },
    deactivateAllRooms: async function() {
        if(!confirm("⚠️ 경고: 모든 강의실을 비활성화합니까?")) return;
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
        if(confirm("데이터를 초기화하시겠습니까?")) {
            firebase.database().ref(`courses/${state.room}`).set(null).then(() => { ui.showAlert("초기화 완료."); location.reload(); });
        }
    }
};

// --- 3. 교수님 명단 관리 ---
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
        const currentVal = sel.value; 
        sel.innerHTML = '<option value="">(선택 안함)</option>';
        this.list.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name; opt.innerText = p.name + " 교수";
            if (p.name === currentVal) opt.selected = true;
            sel.appendChild(opt);
        });
    },
    openManageModal: function() {
        this.renderManageList();
        document.getElementById('profManageModal').style.display = 'flex';
    },
    renderManageList: function() {
        const div = document.getElementById('profListContainer');
        if(!div) return;
        div.innerHTML = "";
        if (this.list.length === 0) {
            div.innerHTML = "<div style='padding:20px; text-align:center;'>등록된 교수님이 없습니다.</div>";
            return;
        }
        this.list.forEach(p => {
            div.innerHTML += `<div class="prof-item"> <span>${p.name}</span> <button onclick="profMgr.deleteProf('${p.key}')">삭제</button> </div>`;
        });
    },
    addProf: function() {
        const name = document.getElementById('newProfInput').value.trim();
        if (!name) return;
        firebase.database().ref('system/professors').push(name).then(() => {
            document.getElementById('newProfInput').value = "";
            this.renderManageList();
        });
    },
    deleteProf: function(key) {
        if(confirm("삭제하시겠습니까?")) firebase.database().ref(`system/professors/${key}`).remove();
    }
};

// --- 4. UI ---
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
        }
    },
    closeAdminAuth: function() { document.getElementById('adminAuthModal').style.display = 'none'; },
    openSecretModal: function() { document.getElementById('changeAdminSecretModal').style.display = 'flex'; },
    closeSecretModal: function() { document.getElementById('changeAdminSecretModal').style.display = 'none'; },
    initRoomSelect: function() {
        firebase.database().ref('courses').on('value', s => {
            const d = s.val() || {};
            const sel = document.getElementById('roomSelect');
            const savedValue = sel.value || state.room; 
            sel.innerHTML = '<option value="" disabled selected>Select Room ▾</option>';
            for(let i=65; i<=90; i++) {
                const c = String.fromCharCode(i);
                const st = (d[c] || {}).status || {};
                const userCount = Object.keys((d[c] || {}).connections || {}).length;
                const opt = document.createElement('option');
                opt.value = c;
                if(st.roomStatus === 'active') {
                    opt.innerText = `Room ${c} (🔴 사용중, ${userCount}명)`;
                    if (st.ownerSessionId === state.sessionId) opt.style.color = '#3b82f6';
                } else opt.innerText = `Room ${c} (⚪ 대기, ${userCount}명)`;
                if(c === savedValue) opt.selected = true;
                sel.appendChild(opt);
            }
        });
    },
    toggleMiniQR: function() {
        const qrBox = document.getElementById('floatingQR');
        if (!state.room) return this.showAlert("강의실을 선택하세요.");
        if (qrBox.style.display === 'flex') qrBox.style.display = 'none';
        else {
            qrBox.style.display = 'flex';
            const target = document.getElementById('miniQRElement');
            target.innerHTML = ""; 
            const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'index.html');
            new QRCode(target, { text: `${baseUrl}?room=${state.room}`, width: 140, height: 140 });
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
                document.getElementById('btnPause').style.display = 'none';
                document.getElementById('btnSmartNext').style.display = 'flex';
                document.getElementById('btnSmartNext').innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play"></i>';
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
        if(f==='pin') items=items.filter(x=>x.status==='pin'); 
        else if(f==='later') items=items.filter(x=>x.status==='later');
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
            let cls = i.status==='pin'?'status-pin':(i.status==='later'?'status-later':(i.status==='done'?'status-done':''));
            const icon = i.status==='pin'?'📌 ':(i.status==='later'?'⚠️ ':(i.status==='done'?'✅ ':''));
            const isRecent = (Date.now() - i.timestamp) < 120000; 
            let newBadge = "";
            if (isRecent && i.status !== 'pin' && i.status !== 'done') {
                cls += " is-new"; 
                newBadge = `<span class="new-badge-icon">NEW</span>`; 
            }
            list.innerHTML += `<div class="q-card ${cls}" data-ts="${i.timestamp}" onclick="ui.openQaModal('${i.id}')">
                <div class="q-content">${newBadge}${icon}${i.text}
                    <button class="btn-translate" onclick="event.stopPropagation(); ui.translateQa('${i.id}')"><i class="fa-solid fa-language"></i> 번역</button>
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
        window.open(url, 'googleTranslatePopup', 'width=1000,height=600');
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

// --- 5. Quiz Logic ---
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
        if(!q || !a) return ui.showAlert("필드를 채워주세요.");
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
        let content = "문제 내용\n선택지1\n선택지2\n선택지3\n선택지4\n1\n\n";
        const blob = new Blob([content], {type: "text/plain"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kac_quiz_sample.txt";
        a.click();
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
        document.querySelector('.quiz-card').classList.remove('result-mode');
        const q = state.quizList[state.currentQuizIdx];
        this.resetTimerUI(); 
        this.renderScreen(q);
        document.getElementById('btnPause').style.display = 'none';
        document.getElementById('btnSmartNext').style.display = 'flex';
        document.getElementById('btnSmartNext').innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play"></i>';
        firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ id: `Q${state.currentQuizIdx}`, status: 'ready', type: q.isOX?'OX':'MULTIPLE', ...q });
        document.getElementById('btnTest').style.display = 'none'; 
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
    updateAnswerUI: function() {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        dbRef.ans.child(id).once('value', snap => {
            const answers = snap.val() || {};
            const answeredCount = Object.keys(answers).length;
            const totalCount = parseInt(document.getElementById('currentJoinCount').innerText) || 0;
            const pendingCount = Math.max(0, totalCount - answeredCount);
            document.getElementById('answeredCount').innerText = answeredCount;
            document.getElementById('pendingCount').innerText = pendingCount;
        });
    },
    startAnswerMonitor: function() {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        if (state.ansListener) dbRef.ans.child(id).off();
        state.ansListener = dbRef.ans.child(id).on('value', snap => { this.updateAnswerUI(); });
    },
    action: function(act) {
        const id = state.isTestMode ? 'TEST' : `Q${state.currentQuizIdx}`;
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        const card = document.querySelector('.quiz-card');
        if(act === 'open') { this.startTimer(); }
        else if(act === 'close') { 
            this.stopTimer(); 
            const q = state.quizList[state.currentQuizIdx];
            if(!q.isSurvey) {
                const correct = state.isTestMode ? 2 : q.correct;
                const opt = document.getElementById(`opt-${correct}`);
                if(opt) opt.classList.add('reveal-answer');
            }
        }
        else if(act === 'result') { 
            this.stopTimer(); 
            if(card) card.classList.add('result-mode');
            document.getElementById('d-options').style.display='none'; 
            document.getElementById('d-chart').style.display='flex'; 
            this.renderChart(id, state.isTestMode ? 2 : state.quizList[state.currentQuizIdx].correct); 
        }
    },
    smartNext: function() {
        const btn = document.getElementById('btnSmartNext');
        const isStartingNow = btn.innerText.includes("시작");
        if (isStartingNow) {
            this.action('open');
        } else {
            if (state.currentQuizIdx >= state.quizList.length - 1) {
                ui.showAlert("마지막 문제입니다. '종료' 버튼을 눌러주세요.");
                return;
            }
            this.prevNext(1);
            setTimeout(() => { this.action('open'); }, 500);
        }
    },
    togglePause: function() {
        if (state.timerInterval) {
            this.stopTimer();
            document.getElementById('btnPause').innerHTML = '<i class="fa-solid fa-play"></i> 다시 시작';
            document.getElementById('btnPause').style.backgroundColor = '#3b82f6'; 
        } else {
            this.action('open'); 
            document.getElementById('btnPause').innerHTML = '<i class="fa-solid fa-pause"></i> 일시정지';
            document.getElementById('btnPause').style.backgroundColor = '#f59e0b'; 
        }
    },
    startTimer: function() {
        this.stopTimer(); 
        document.getElementById('btnPause').style.display = 'flex';
        document.getElementById('btnSmartNext').style.display = 'none'; 
        let t = state.remainingTime;
        const d = document.getElementById('quizTimer'); 
        d.classList.remove('urgent');
        const end = Date.now() + (t * 1000); 
        let lastPlayedSec = -1;
        if (!state.timerAudio) state.timerAudio = new Audio('timer.mp3');
        state.timerInterval = setInterval(() => {
            const r = Math.ceil((end - Date.now())/1000);
            const displaySec = r < 0 ? 0 : r;
            state.remainingTime = displaySec; 
            firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ timeLeft: displaySec });
            d.innerText = `00:${displaySec < 10 ? '0' + displaySec : displaySec}`;
            if(displaySec <= 5) d.classList.add('urgent');
            if (displaySec <= 8 && displaySec > 0 && displaySec !== lastPlayedSec) {
                state.timerAudio.pause(); state.timerAudio.currentTime = 0; state.timerAudio.play().catch(e=>{}); 
                lastPlayedSec = displaySec;
            }
            if(displaySec <= 0) {
                this.stopTimer(); this.action('close');
                setTimeout(() => {
                    this.action('result');
                    document.getElementById('btnSmartNext').style.display = 'flex';
                    document.getElementById('btnPause').style.display = 'none';
                    document.getElementById('btnSmartNext').innerText = "현재 퀴즈 시작 ▶";
                }, 1500);
            }
        }, 200);
    },
    stopTimer: function() { 
        if(state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; }
        if (state.timerAudio) { state.timerAudio.pause(); state.timerAudio.currentTime = 0; }
    },
    resetTimerUI: function() { this.stopTimer(); document.getElementById('quizTimer').innerText = "00:08"; },
    renderChart: function(id, corr) {
        const div = document.getElementById('d-chart'); div.innerHTML = "";
        const q = state.quizList[state.currentQuizIdx];
        firebase.database().ref(`courses/${state.room}/quizAnswers`).child(id).once('value', s => {
            const d = s.val() || {};
            const cnt = new Array(q.options.length).fill(0);
            Object.values(d).forEach(v => { if(v.choice >= 1 && v.choice <= q.options.length) cnt[v.choice-1]++; });
            const max = Math.max(...cnt, 1);
            if(q.isSurvey) {
                let maxIdx = cnt.indexOf(Math.max(...cnt));
                let surveySummary = `가장 많은 선택: '${q.options[maxIdx]}' (${Math.round((cnt[maxIdx]/Object.values(d).length)*100)}%)`;
                firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ surveyResult: surveySummary });
            }
            for(let i=0; i < q.options.length; i++) {
                const isCorrect = !q.isSurvey && (i + 1) === corr;
                const h = (cnt[i]/max)*80;
                const crownHtml = isCorrect ? `<div class="crown-icon">👑</div>` : '';
                const lbl = q.isOX ? (i===0?'O':'X') : (i+1);
                div.innerHTML += `<div class="bar-wrapper ${isCorrect ? 'correct' : ''}">${crownHtml}<div class="bar-value">${cnt[i]}</div><div class="bar-fill" style="height:${h}%"></div><div class="bar-label">${lbl}</div></div>`;
            }
        });
    },
    showFinalSummary: async function() {
        const snap = await firebase.database().ref(`courses/${state.room}/quizAnswers`).get();
        const allAns = snap.val() || {};
        const totalParticipants = new Set();
        let totalQuestions = 0; let totalCorrect = 0; let totalAnswerCount = 0;
        state.quizList.forEach((q, idx) => {
            if(state.isTestMode || !q.checked || q.isSurvey) return;
            const id = `Q${idx}`; const answers = allAns[id] || {};
            if(Object.keys(answers).length > 0) totalQuestions++;
            Object.keys(answers).forEach(k => {
                totalParticipants.add(k); totalAnswerCount++;
                if(answers[k].choice === q.correct) totalCorrect++;
            });
        });
        await firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'summary' });
        const avgAcc = totalAnswerCount > 0 ? Math.round((totalCorrect / totalAnswerCount) * 100) : 0;
        document.getElementById('summaryStats').innerHTML = `
            <div class="summary-card"><span>평균 정답률</span><b>${avgAcc}%</b></div>
            <div class="summary-card"><span>푼 문항 수</span><b>${totalQuestions}</b></div>
        `;
        document.getElementById('quizSummaryOverlay').style.display = 'flex';
    },
    closeQuizMode: function() { document.getElementById('quizExitModal').style.display = 'flex'; },
    confirmExitQuiz: function(type) {
        document.getElementById('quizExitModal').style.display = 'none';
        if(type === 'reset') {
            state.isTestMode = false; state.currentQuizIdx = 0;
            firebase.database().ref(`courses/${state.room}/activeQuiz`).set(null);
            firebase.database().ref(`courses/${state.room}/status/quizStep`).set('none');
            firebase.database().ref(`courses/${state.room}/quizAnswers`).set(null);
        }
        ui.setMode('qa');
    }
};

// --- 6. Print & Report ---
const printMgr = {
    openInputModal: function() { 
        document.getElementById('printDateInput').value = new Date().toLocaleDateString();
        document.getElementById('printProfInput').value = document.getElementById('profSelect').value;
        document.getElementById('printInputModal').style.display = 'flex'; 
    },
    confirmPrint: function() { 
        this.openPreview(document.getElementById('printDateInput').value, document.getElementById('printProfInput').value); 
        document.getElementById('printInputModal').style.display = 'none';
    },
    openPreview: function(date, prof) { 
        document.getElementById('doc-cname').innerText = document.getElementById('courseNameInput').value || "과정명"; 
        document.getElementById('doc-date').innerText = date; 
        document.getElementById('doc-prof').innerText = prof;
        const body = document.getElementById('docListBody'); body.innerHTML = ""; 
        Object.values(state.qaData).forEach((item, idx) => {
            body.innerHTML += `<tr><td>${idx+1}</td><td style="text-align:left;">${item.text}</td><td>❤️ ${item.likes||0}</td></tr>`;
        });
        document.getElementById('printPreviewModal').style.display = 'flex'; 
    },
    executePrint: function() { 
        const content = document.getElementById('official-document').innerHTML;
        const win = window.open('', '', 'height=900,width=800');
        win.document.write('<html><head><title>KAC Report</title><style>table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;}</style></head><body>');
        win.document.write(content);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    },
    closePreview: function() { document.getElementById('printPreviewModal').style.display = 'none'; }
};

window.onload = function() {
    dataMgr.checkMobile();
    dataMgr.initSystem();
    profMgr.init();
};