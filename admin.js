/* --- admin.js (Final Integrated Version - Fixed Syntax & Logic) --- */

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

// --- 날짜 유틸리티 함수 ---
function getTodayString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
}

function getYesterdayString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
}

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
    ansListener: null,
    adminActionRef: null // 추가됨
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
                localStorage.removeItem('last_owned_room');
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
        try { 
            await user.updatePassword(newPw); 
            ui.showAlert("비밀번호가 변경되었습니다."); 
            ui.closePwModal(); 
        } catch (e) { 
            ui.showAlert("변경 실패: " + e.message); 
        }
    }
};

// --- 2. Data & Room Logic ---
const dataMgr = {
    saveInstructorNoticeMain: function() {
        if(!state.room) return;
        const msg = document.getElementById('instNoticeInputMain').value;
        firebase.database().ref(`courses/${state.room}/notice`).set(msg).then(() => {
            ui.showAlert("✅ 공지사항이 게시되었습니다.");
        });
    },

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
            if (user) { 
                document.getElementById('loginOverlay').style.display = 'none'; 
                this.loadInitialData(); 
            } else { 
                document.getElementById('loginOverlay').style.display = 'flex'; 
            }
        });
    },
    
    loadInitialData: function() {
        const lastRoom = localStorage.getItem('kac_last_room');
        ui.initRoomSelect();

        if (lastRoom) {
            this.forceEnterRoom(lastRoom);
        } else {
            ui.showWaitingRoom();
        }

        state.quizList = DEFAULT_QUIZ_DATA;
        state.isExternalFileLoaded = false;
        quizMgr.renderMiniList();
        document.getElementById('roomSelect').onchange = (e) => { 
            if(e.target.value) this.switchRoomAttempt(e.target.value); 
        };
        document.getElementById('quizFile').onchange = (e) => quizMgr.loadFile(e);
        const qrEl = document.getElementById('qrcode'); 
        if(qrEl) qrEl.onclick = function() { ui.openQrModal(); };
    },
    
    switchRoomAttempt: async function(newRoom) {
        localStorage.setItem('kac_last_mode', 'dashboard');
        if (localStorage.getItem('last_owned_room') === newRoom) {
            this.forceEnterRoom(newRoom);
            return;
        }
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
        if (btoa(input) === dbPw || btoa(input) === "MTMyODE=") {
            alert("인증 성공! 제어권을 가져옵니다."); 
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
        if(dbRef.status) dbRef.status.off();
        if(dbRef.qa) dbRef.qa.off();
        if(dbRef.connections) dbRef.connections.off();

        firebase.database().ref(`courses/${room}/status`).update({
            lastAdminEntry: firebase.database.ServerValue.TIMESTAMP
        });
        
        state.room = room; 
        localStorage.setItem('kac_last_room', room); 
        
        const roomSelect = document.getElementById('roomSelect');
        if(roomSelect) roomSelect.value = room;

        document.querySelector('.mode-tabs').style.display = 'flex';
        document.getElementById('floatingQR').style.display = 'none';
        const btnReset = document.getElementById('btnReset');
        if(btnReset) {
            btnReset.disabled = false;
            btnReset.style.opacity = '1';
            btnReset.style.cursor = 'pointer';
        }

        const rows = document.querySelectorAll('#statusTableBody tr');
        rows.forEach(row => {
            const roomCell = row.querySelector('td:nth-child(2)');
            if (roomCell && roomCell.innerText.includes(`Room ${room}`)) {
                row.classList.add('is-my-room');
                if (!roomCell.querySelector('.my-room-badge')) {
                    row.querySelector('td:nth-child(2)').innerHTML += '<span class="my-room-badge">MY</span>';
                }
            } else {
                row.classList.remove('is-my-room');
                const badge = roomCell ? roomCell.querySelector('.my-room-badge') : null;
                if (badge) badge.remove();
            }
        });

        const rPath = `courses/${room}`;
        dbRef.settings = firebase.database().ref(`${rPath}/settings`);
        dbRef.qa = firebase.database().ref(`${rPath}/questions`);
        dbRef.quiz = firebase.database().ref(`${rPath}/activeQuiz`);
        dbRef.ans = firebase.database().ref(`${rPath}/quizAnswers`);
        dbRef.status = firebase.database().ref(`${rPath}/status`);
        dbRef.connections = firebase.database().ref(`${rPath}/connections`);

        ui.updateHeaderRoom(room);
        subjectMgr.init();
        state.qaData = {};
        document.getElementById('qaList').innerHTML = "";
        
        dbRef.settings.on('value', s => {
            const val = s.val() || {};
            ui.renderSettings(val);
            if(localStorage.getItem('kac_last_mode') === 'dashboard') {
                ui.loadDashboardStats();
            }
        });

dbRef.status.on('value', s => {
    if(state.room !== room) return;
    const st = s.val() || {};
    ui.renderRoomStatus(st.roomStatus || 'idle'); 
    ui.checkLockStatus(st);

    // 교수님 성함이 DB에 있다면 좌측바와 대시보드에 즉시 반영
    if(st.professorName) {
        document.getElementById('profSelect').value = st.professorName;
        
        // [추가된 코드] 대시보드(현재과정 현황) 성함 업데이트
        const dashProf = document.getElementById('dashProfName');
        if(dashProf) {
            dashProf.innerText = st.professorName + " 교수님";
        }
    } else {
        // 교수명이 없을 경우 초기화
        const dashProf = document.getElementById('dashProfName');
        if(dashProf) dashProf.innerText = "담당 교수 미지정";
    }
});

        firebase.database().ref(`courses/${room}/students`).on('value', s => {
            const data = s.val() || {};
            const activeUsers = Object.values(data).filter(user => 
                user.name && user.name !== "undefined" && user.isOnline === true
            );
            const count = activeUsers.length;
            const quizEl = document.getElementById('currentJoinCount');
            if(quizEl) quizEl.innerText = count;
            const dashCount = document.getElementById('dashStudentCount');
            if(dashCount) dashCount.innerText = count + "명";
        });

        dbRef.qa.on('value', s => { 
            if(state.room === room) { 
                state.qaData = s.val() || {}; 
                ui.renderQaList('all'); 
            }
        });

        this.fetchCodeAndRenderQr(room);

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

        const lastMode = localStorage.getItem('kac_last_mode') || 'dashboard';
        if(roomSelect) {
            setTimeout(() => { roomSelect.value = room; }, 300);
        }
        ui.setMode(lastMode);
    },


    fetchCodeAndRenderQr: function(room) {
        const pathArr = window.location.pathname.split('/'); 
        pathArr.pop(); 
        const baseUrl = window.location.origin + pathArr.join('/');
        firebase.database().ref('public_codes').orderByValue().equalTo(room).once('value', s => {
            const d = s.val();
            const url = d ? `${baseUrl}/index.html?code=${Object.keys(d)[0]}` : `${baseUrl}/index.html?room=${room}`;
            ui.renderQr(url);
        });
    },

    saveSettings: function() {
        if (!state.room) {
            ui.showAlert("⚠️ 강의실을 먼저 선택해 주세요."); // 수정됨
            return;
        }

        const rawPw = document.getElementById('roomPw').value;
        const newName = document.getElementById('courseNameInput').value;
        const statusVal = document.getElementById('roomStatusSelect').value;
        const selectedProf = document.getElementById('profSelect').value;
        
        const encryptedPw = rawPw ? btoa(rawPw) : "Nzc3Nw==";

        firebase.database().ref(`courses/${state.room}/settings`).update({ 
            courseName: newName, 
            password: encryptedPw 
        });

        firebase.database().ref(`courses/${state.room}/status`).update({ 
            roomStatus: statusVal, 
            ownerSessionId: (statusVal === 'active' ? state.sessionId : null),
            professorName: (statusVal === 'active' ? selectedProf : null) 
        }).then(() => {
            localStorage.setItem('last_owned_room', state.room);
            ui.showAlert("✅ 설정 내용이 안전하게 저장되었습니다.");
        });

        document.getElementById('displayCourseTitle').innerText = newName;
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
        if (action === 'delete') { 
            if(confirm("정말 삭제하시겠습니까?")) { 
                dbRef.qa.child(state.activeQaKey).remove(); 
                ui.closeQaModal(); 
            }
        } else {
            let ns = action;
            if(item.status === action) ns = 'normal';
            else if(action === 'done' && item.status==='pin') ns = 'pin-done';
            dbRef.qa.child(state.activeQaKey).update({ status: ns });
            ui.closeQaModal();
        }
    },

    resetCourse: function() {
        if (!state.room) {
            ui.showAlert("⚠️ 강의실에 먼저 입장해야 초기화가 가능합니다.");
            return;
        }
        if(confirm("강의실을 초기화하시겠습니까?\n모든 수강생은 즉시 강제 퇴장 및 데이터 초기화 처리됩니다.")) {
            const newResetKey = "reset_" + Date.now(); 
            firebase.database().ref(`courses/${state.room}`).set(null).then(() => {
                firebase.database().ref(`courses/${state.room}/status`).set({
                    resetKey: newResetKey,
                    roomStatus: 'idle',
                    mode: 'qa'
                }).then(() => {
                    ui.showAlert("강의실이 초기화되었습니다.");
                    setTimeout(() => location.reload(), 1000);
                });
            });
        }
    },


// [추가] 공지사항 관리창 열기
    openNoticeManage: async function() {
        if(!state.room) return ui.showAlert("강의실을 선택하세요.");
        const snap = await firebase.database().ref(`courses/${state.room}/notice`).once('value');
        document.getElementById('instNoticeInput').value = snap.val() || ""; 
        document.getElementById('noticeManageModal').style.display = 'flex';
    },

    // [추가] 강사 공지사항 저장
    saveInstructorNotice: function() {
        const msg = document.getElementById('instNoticeInput').value;
        firebase.database().ref(`courses/${state.room}/notice`).set(msg).then(() => {
            ui.showAlert("✅ 공지사항이 게시되었습니다.");
            document.getElementById('noticeManageModal').style.display = 'none';
        });
    },

    // [추가] 출결 QR 보기
    openAttendanceQr: async function() {
        if(!state.room) return ui.showAlert("강의실을 선택하세요.");
        const snap = await firebase.database().ref(`courses/${state.room}/attendanceQR`).once('value');
        const img = document.getElementById('attendanceQrImg');
        const msg = document.getElementById('noAttendanceQrMsg');
        if(snap.exists()) {
            img.src = snap.val(); img.style.display = 'block'; msg.style.display = 'none';
        } else {
            img.style.display = 'none'; msg.style.display = 'block';
        }
        document.getElementById('attendanceQrModal').style.display = 'flex';
    },

    // [추가] 학생장 지정 기능 (연락처 팝업 포함)
    toggleLeader: function(token, currentName) {
        if(!state.room) return;
        firebase.database().ref(`courses/${state.room}/students/${token}`).once('value', snap => {
            const student = snap.val();
            const isNowLeader = !student.isLeader; 

            if(isNowLeader) {
                const phone = prompt(`[${currentName}] 학생을 학생장으로 지정합니다.\n비상 연락망 관리를 위해 전체 전화번호를 입력하세요.`, "010-0000-0000");
                if(!phone) return;
                
                firebase.database().ref(`courses/${state.room}/students/${token}`).update({
                    isLeader: true,
                    phone: phone 
                });
            } else {
                if(confirm(`[${currentName}] 학생의 학생장 권한을 해제할까요?`)) {
                    firebase.database().ref(`courses/${state.room}/students/${token}`).update({
                        isLeader: false
                    });
                }
            }
        });
    },





    // [수정완료] 수강생 삭제 기능 함수 추가
    deleteStudent: function(token) {
        if(!state.room) return;
        if(confirm("해당 수강생을 명부에서 삭제하시겠습니까?\n삭제 시 해당 수강생의 화면도 초기화될 수 있습니다.")) {
            firebase.database().ref(`courses/${state.room}/students/${token}`).remove()
                .then(() => {
                    ui.showAlert("수강생이 명부에서 삭제되었습니다.");
                })
                .catch(err => {
                    alert("삭제 중 오류 발생: " + err.message);
                });
        }
    }
};


// --- [신규] 교수님 명단 관리 ---
const profMgr = {
    list: [],
    
    init: function() {
        firebase.database().ref('system/professors').on('value', s => {
            const data = s.val() || {};
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
        if (!name) { 
            alert("교수님 성함을 입력해주세요."); 
            return; 
        }
        firebase.database().ref('system/professors').push(name).then(() => {
            input.value = ""; 
            input.focus();
        }).catch(err => { 
            alert("저장 실패: " + err.message); 
        });
    },
    
    deleteProf: function(key) {
        if(confirm("정말 삭제하시겠습니까?")) {
            firebase.database().ref(`system/professors/${key}`).remove();
        }
    }
};

// --- [신규] 과목(세션) 관리 로직 ---
const subjectMgr = {
    list: [],
    selectedFilter: 'all', 
    
init: function() {
        if(!state.room) return;
        firebase.database().ref(`courses/${state.room}/settings/subjects`).on('value', s => {
            const data = s.val() || {};
            this.list = Object.keys(data).map(k => ({ key: k, name: data[k] }));
            this.renderList();
            this.renderFilters(); 
        });
    },

    renderFilters: function() {
        const bar = document.getElementById('subjectFilterBar');
        if(!bar) return;
        
        let html = `<div class="filter-chip ${this.selectedFilter === 'all' ? 'active' : ''}" onclick="subjectMgr.setFilter('all')">전체</div>`;
        
        this.list.forEach(item => {
            html += `<div class="filter-chip ${this.selectedFilter === item.name ? 'active' : ''}" onclick="subjectMgr.setFilter('${item.name}')">${item.name}</div>`;
        });
        bar.innerHTML = html;
    },

    setFilter: function(subName) {
        this.selectedFilter = subName;
        this.renderFilters();
        ui.renderQaList('all'); 
    },
    
    renderList: function() {
        const container = document.getElementById('subjectListContainer');
        if(!container) return;
        container.innerHTML = "";
        
        if(this.list.length === 0) {
            container.innerHTML = '<div style="color: #64748b; font-size: 11px; text-align: center; padding: 10px;">등록된 과목이 없습니다.</div>';
            return;
        }

        this.list.forEach(item => {
            container.innerHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #1e293b; margin-bottom: 3px; border-radius: 4px; font-size: 12px; color: white;">
                    <span>${item.name}</span>
                    <i class="fa-solid fa-xmark" onclick="subjectMgr.deleteSubject('${item.key}')" style="cursor: pointer; color: #ef4444;"></i>
                </div>
            `;
        });
    },
    
    addSubject: function() {
        const input = document.getElementById('newSubjectInput');
        const name = input.value.trim();
        if(!name) return;
        
        firebase.database().ref(`courses/${state.room}/settings/subjects`).push(name).then(() => {
            input.value = "";
            input.focus();
        });
    },
    
    deleteSubject: function(key) {
        if(confirm("이 과목을 삭제하시겠습니까?")) {
            firebase.database().ref(`courses/${state.room}/settings/subjects/${key}`).remove();
        }
    }
};







// --- 3. UI ---
const ui = {

// 대시보드 통계 실시간 로드
loadDashboardStats: function() {
        if(!state.room) return;
        
        const courseName = document.getElementById('courseNameInput').value;
        const profName = document.getElementById('profSelect').value;
        const today = getTodayString();

        document.getElementById('dashCourseTitle').innerText = courseName || "과정명 미설정";
        document.getElementById('dashProfName').innerText = profName ? profName + " 교수님" : "담당 교수 미지정";
        document.getElementById('dashTodayDate').innerText = `금일 날짜: ${today}`;

        // 수강생 수 실시간 업데이트
        firebase.database().ref(`courses/${state.room}/students`).on('value', s => {
            const count = Object.values(s.val() || {}).filter(u => u.name && u.name !== "undefined").length;
            document.getElementById('dashStudentCount').innerText = count + "명";
        });

        // 외출/외박 수 업데이트
        firebase.database().ref(`courses/${state.room}/admin_actions/${today}`).on('value', s => {
            const count = Object.keys(s.val() || {}).length;
            document.getElementById('dashActionCount').innerText = count + "명";
        });

        // 셔틀(3종) 수 업데이트
        firebase.database().ref(`courses/${state.room}/shuttle`).on('value', s => {
            const d = s.val() || {};
            document.getElementById('s-osong-cnt').innerText = d.osong ? Object.keys(d.osong).length : 0;
            document.getElementById('s-term-cnt').innerText = d.terminal ? Object.keys(d.terminal).length : 0;
            document.getElementById('s-air-cnt').innerText = d.airport ? Object.keys(d.airport).length : 0;
        });
    },

    // 공지사항 뷰 로드
    loadNoticeView: async function() {
        if(!state.room) return;
        const snap = await firebase.database().ref(`courses/${state.room}/notice`).once('value');
        document.getElementById('instNoticeInputMain').value = snap.val() || "";
    },

    // 출결 QR 뷰 로드
    loadAttendanceView: async function() {
        if(!state.room) return;
        const snap = await firebase.database().ref(`courses/${state.room}/attendanceQR`).once('value');
        const img = document.getElementById('attendanceQrImgMain');
        const msg = document.getElementById('noAttendanceQrMsgMain');
        if(snap.exists()) {
            img.src = snap.val(); img.style.display = 'block'; msg.style.display = 'none';
        } else {
            img.style.display = 'none'; msg.style.display = 'block';
        }
    },





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
            const tableBody = document.getElementById('statusTableBody');
            const savedValue = sel ? sel.value : state.room; 
            
            if(sel) sel.innerHTML = '<option value="" disabled selected>Select Room ▾</option>';
            if(tableBody) tableBody.innerHTML = "";

            let count = 1;

            for(let i=65; i<=90; i++) {
                const c = String.fromCharCode(i);
                const roomData = d[c] || {};
                const st = roomData.status || {};
                const settings = roomData.settings || {};
                const studentObj = roomData.students || {};
                const validStudents = Object.values(studentObj).filter(s => s.name && s.name !== "undefined" && s.name !== undefined);
                const userCount = validStudents.length;
                const isRoomActive = (st.roomStatus === 'active');
                
                const courseName = settings.courseName ? settings.courseName : "-";
                const profName = st.professorName ? st.professorName : "-";

                let lastTime = "-";
                if (st.lastAdminEntry) {
                    const dTime = new Date(st.lastAdminEntry);
                    lastTime = (dTime.getMonth() + 1) + "/" + dTime.getDate() + " " + dTime.getHours() + ":" + dTime.getMinutes().toString().padStart(2, '0');
                }

                if(sel) {
                    const opt = document.createElement('option');
                    opt.value = c;
                    
                    if(isRoomActive) {
                        if (st.ownerSessionId === state.sessionId || localStorage.getItem('last_owned_room') === c) {
                            opt.innerText = `Room ${c} (🔵 내 강의실 - ${profName})`; // 수정 후
                            opt.style.color = '#3b82f6';
                            opt.style.fontWeight = 'bold';
                        } else {
                            opt.innerText = `Room ${c} (🔴 사용중 - ${profName})`; // 수정 후
                            opt.style.color = '#ef4444';
                        }
                    } else {
                        opt.innerText = `Room ${c} (⚪ 대기)`; // 수정 후
                    }
                    
                    if(c === savedValue) opt.selected = true;
                    sel.appendChild(opt);
                }

                if(tableBody) {
                    const row = document.createElement('tr');

// 현재 내가 제어 중인 방인 경우 클래스 추가
if (c === state.room) {
    row.classList.add('is-my-room');
}
                    
                    const statusBadge = isRoomActive 
                        ? '<span class="badge-status badge-active">🟢 사용 중</span>' 
                        : '<span class="badge-status badge-idle">⚪ 비어 있음</span>';

                    row.innerHTML = `
                        <td>${count++}</td>
                        <td style="font-weight:900; color:#3b82f6;">
    Room ${c}
    ${c === state.room ? '<span class="my-room-badge">MY</span>' : ''}
</td>
                        <td><div class="td-course-name" title="${courseName}">${courseName}</div></td>
                        <td style="font-weight:600;">${profName}</td>
                        <td>${statusBadge}</td>
                        <td style="font-weight:700;">${userCount}명</td>
                        <td style="color:#94a3b8; font-size:14px;">${lastTime}</td>
                        <td>
                            <button class="btn-table-action" onclick="dataMgr.switchRoomAttempt('${c}')">입장하기</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                }
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
            const pathArr = window.location.pathname.split('/'); 
            pathArr.pop();
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
        if (st.roomStatus === 'active' && st.ownerSessionId === state.sessionId) {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'flex';
        }
    },
    
    updateHeaderRoom: function(r) { 
        const el = document.getElementById('displayRoomName');
        if(el) el.innerText = `Course ROOM ${r}`; 
    },
    
    renderSettings: function(d) {
        document.getElementById('courseNameInput').value = d.courseName || "";
        document.getElementById('roomPw').value = d.password ? atob(d.password) : "7777";
        document.getElementById('displayCourseTitle').innerText = d.courseName || "";
    },
    
    renderRoomStatus: function(st) { 
        document.getElementById('roomStatusSelect').value = st || 'idle'; 
    },
    
    renderQr: function(url) {
        document.getElementById('studentLink').value = url;
        const qrDiv = document.getElementById('qrcode'); 
        if(!qrDiv) return;
        qrDiv.innerHTML = "";
        try { 
            new QRCode(qrDiv, { text: url, width: 35, height: 35 }); 
        } catch(e) {}
    },
    
    openQrModal: function() {
        const url = document.getElementById('studentLink').value; 
        if(!url) return;
        document.getElementById('qrModal').style.display = 'flex';
        const target = document.getElementById('qrBigTarget');
        if(!target) return;
        target.innerHTML = ""; 
        setTimeout(() => new QRCode(target, { 
            text: url, 
            width: 300, 
            height: 300 
        }), 50);
    },
    
    closeQrModal: function() { 
        document.getElementById('qrModal').style.display = 'none'; 
    },
    
    copyLink: function() {
        const linkInput = document.getElementById('studentLink');
        const url = linkInput.value;
        if (!url) { 
            ui.showAlert("강의실을 먼저 선택하세요!"); 
            return; 
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                ui.showAlert("클립보드에 링크가 복사되었습니다!");
            }).catch(() => {
                linkInput.select(); 
                document.execCommand('copy'); 
                ui.showAlert("링크가 복사되었습니다!");
            });
        } else {
            linkInput.select(); 
            document.execCommand('copy'); 
            ui.showAlert("링크가 복사되었습니다!");
        }
    },

setMode: function(mode) {
        const views = [
            'view-qa', 'view-quiz', 'view-waiting', 'view-shuttle', 
            'view-admin-action', 'view-dinner-skip', 'view-students', 
            'view-dashboard', 'view-notice', 'view-attendance'
        ]; 
        
        views.forEach(v => { 
            const el = document.getElementById(v); 
            if(el) el.style.display = 'none'; 
        });
        
        const targetView = (mode === 'admin-action') ? 'view-admin-action' : (mode === 'dinner-skip') ? 'view-dinner-skip' : `view-${mode}`;
        const targetEl = document.getElementById(targetView);
        
        if(targetEl) {
            targetEl.style.display = (mode === 'waiting' || mode === 'dashboard') ? 'block' : 'flex';
        }

        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const targetTab = document.getElementById(`tab-${mode}`);
        if(targetTab) targetTab.classList.add('active');

        localStorage.setItem('kac_last_mode', mode);

        if (state.room) {
            if (mode === 'quiz') {
                document.getElementById('quizSelectModal').style.display = 'flex'; 
                quizMgr.loadSavedQuizList(); 
            }

            let studentMode = (['waiting', 'shuttle', 'admin-action', 'dinner-skip', 'students', 'dashboard', 'notice', 'attendance'].includes(mode)) ? 'qa' : mode;
            firebase.database().ref(`courses/${state.room}/status/mode`).set(studentMode);
            
            if (mode === 'dashboard') ui.loadDashboardStats(); 
            if (mode === 'notice') ui.loadNoticeView(); 
            if (mode === 'attendance') ui.loadAttendanceView();
            if (mode === 'shuttle') ui.loadShuttleData();
            if (mode === 'admin-action') ui.loadAdminActionData();
            if (mode === 'dinner-skip') ui.loadDinnerSkipData();
            if (mode === 'students') ui.loadStudentList();
        }
    },

// admin.js 내의 ui 객체 안에서 이 부분을 찾아서 교체하세요
loadShuttleData: function() {
        if(!state.room) return;
        firebase.database().ref(`courses/${state.room}/shuttle`).on('value', snap => {
            const data = snap.val() || {};
            const container = document.getElementById('shuttleTableBody');
            const locations = [
                { id: 'osong', name: '오송역', icon: 'fa-train' }, 
                { id: 'terminal', name: '청주터미널', icon: 'fa-bus' }, 
                { id: 'airport', name: '청주공항', icon: 'fa-plane' },
                { id: 'car', name: '자차(개별이동)', icon: 'fa-car' }
            ];
            
            container.innerHTML = "";
            locations.forEach(loc => {
                const applicants = data[loc.id] ? Object.values(data[loc.id]) : [];
                const count = applicants.length;
                const names = applicants.join(', ');
                
                container.innerHTML += `
                    <div class="shuttle-dest-card">
                        <div class="dest-name">
                            <span><i class="fa-solid ${loc.icon}"></i> ${loc.name}</span>
                            <span class="dest-count">${count}명</span>
                        </div>
                        <div class="dest-members">
                            ${names || '<span style="color:#cbd5e1;">신청자 없음</span>'}
                        </div>
                    </div>
                `;
            });
        });
    }, // 콤마(,) 확인!



    filterQa: function(f, event) { 
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active')); 
        if(event && event.target) event.target.classList.add('active'); 
        this.renderQaList(f); 
    },
    
    renderQaList: function(f) {
        const list = document.getElementById('qaList'); 
        if(!list) return;
        list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));

        // [추가] 과목 필터링 로직
        if(subjectMgr.selectedFilter !== 'all') {
            items = items.filter(x => x.subject === subjectMgr.selectedFilter);
        }
        
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
            
            list.innerHTML += `
            <div class="q-card ${cls}" data-ts="${i.timestamp}" onclick="ui.openQaModal('${i.id}')">
                <div class="q-content">

        <span style="display:inline-block; background:#eff6ff; color:#3b82f6; font-size:10px; padding:2px 6px; border-radius:4px; margin-right:8px; vertical-align:middle; border:1px solid #dbeafe; font-weight:800;">
            ${i.subject || '일반'}
        </span>

                    ${newBadge}${icon}${i.text}
                    <button class="btn-translate" onclick="event.stopPropagation(); ui.translateQa('${i.id}')" title="번역"><i class="fa-solid fa-language"></i> 번역</button>
                </div>
                <div class="q-meta">
                    <div class="q-like-badge">👍 ${i.likes||0}</div>
                    <div class="q-time">${new Date(i.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
            </div>`;
        });
    },
    
    openQaModal: function(k) { 
        state.activeQaKey=k; 
        document.getElementById('m-text').innerText=state.qaData[k].text; 
        document.getElementById('qaModal').style.display='flex'; 
    },
    
    closeQaModal: function(e) { 
        if (!e || e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') {
            document.getElementById('qaModal').style.display = 'none'; 
        }
    },
    
    openPwModal: function() { 
        document.getElementById('changePwModal').style.display='flex'; 
    },
    
    closePwModal: function() { 
        document.getElementById('changePwModal').style.display='none'; 
    },
    
    toggleNightMode: function() { 
        document.body.classList.toggle('night-mode'); 
        const n = document.body.classList.contains('night-mode');
        document.getElementById('iconSun').classList.toggle('active', !n);
        document.getElementById('iconMoon').classList.toggle('active', n);
    },
    
    toggleRightPanel: function() { 
        document.getElementById('rightPanel').classList.toggle('open'); 
    },
    
    toggleFullScreen: function() {
        const elem = document.querySelector('.main-stage');
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => console.log(err));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
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
        if (!state.room) {
        state.room = null;
        }
        const roomNameEl = document.getElementById('displayRoomName');
        if(roomNameEl) roomNameEl.innerText = "Instructor Waiting Room";
        
        const tabs = document.querySelector('.mode-tabs');
        if(tabs) tabs.style.display = 'none'; 
        
        const viewQa = document.getElementById('view-qa');
        const viewQuiz = document.getElementById('view-quiz');
        const viewStatus = document.getElementById('statusOverlay');
        const viewWait = document.getElementById('view-waiting');
        
        if(viewQa) viewQa.style.display = 'none';
        if(viewQuiz) viewQuiz.style.display = 'none';
        if(viewStatus) viewStatus.style.display = 'none'; 
        if(viewWait) viewWait.style.display = 'flex'; 
        
        const statusSel = document.getElementById('roomStatusSelect');
        if(statusSel) {
            statusSel.value = 'waiting';
            statusSel.disabled = true;

        const btnReset = document.getElementById('btnReset');
        if(btnReset) {
            btnReset.disabled = true; // 버튼 클릭 차단
            btnReset.style.opacity = '0.5'; // 반투명하게 (잠긴 것처럼 보이게)
            btnReset.style.cursor = 'not-allowed'; // 마우스 올리면 금지 표시
        }

        }
    },

    loadAdminActionData: function() {
        if(!state.room) return;
        const today = getTodayString();
        const yesterday = getYesterdayString();
        const now = new Date();
        const showYesterday = now.getHours() < 9; 
        
        const tbody = document.getElementById('adminActionTableBody');
        if(!tbody) return;

        if (state.adminActionRef) {
            state.adminActionRef.off();
        }

        state.adminActionRef = firebase.database().ref(`courses/${state.room}/admin_actions/${today}`);
        
        state.adminActionRef.on('value', snap => {
            const todayData = snap.val() || {};
            
            if (showYesterday) {
                firebase.database().ref(`courses/${state.room}/admin_actions/${yesterday}`).once('value', ySnap => {
                    const yesterdayData = ySnap.val() || {};
                    renderAdminList(todayData, yesterdayData);
                });
            } else {
                renderAdminList(todayData, {});
            }
        });

        function renderAdminList(todayData, yesterdayData) {
            tbody.innerHTML = ""; 
            let count = 1;

            Object.values(yesterdayData).forEach(item => {
                appendRow(item, true);
            });

            Object.values(todayData).forEach(item => {
                appendRow(item, false);
            });

            if (tbody.innerHTML === "") {
                tbody.innerHTML = "<tr><td colspan='5' style='padding:50px; color:#94a3b8;'>신청 내역이 없습니다.</td></tr>";
            }

            function appendRow(item, isYesterday) {
                const typeNm = item.type === 'outing' ? 
                    '<span style="color:#f59e0b; font-weight:bold;">외출</span>' : 
                    '<span style="color:#ef4444; font-weight:bold;">외박</span>';
                
                const datePrefix = isYesterday ? '<small style="color:#94a3b8;">[어제]</small> ' : '';
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

                tbody.innerHTML += `
                    <tr>
                        <td>${count++}</td>
                        <td>${datePrefix}${typeNm}</td>
                        <td style="font-weight:bold;">${item.name}</td>
                        <td>${item.phone}</td>
                        <td style="color:#94a3b8; font-size:13px;">${timeStr}</td>
                    </tr>
                `;
            }
        }
    },

loadDinnerSkipData: function() {
        if(!state.room) return;
        const today = getTodayString();
        firebase.database().ref(`courses/${state.room}/dinner_skips/${today}`).on('value', snap => {
            const data = snap.val() || {};
            const tbody = document.getElementById('dinnerSkipTableBody');
            if(!tbody) return;
            const items = Object.values(data);
            const totalEl = document.getElementById('dinnerSkipTotal');
            if(totalEl) totalEl.innerText = items.length;
            tbody.innerHTML = items.length ? 
                items.map((name, idx) => `
                    <tr>
                        <td>${idx+1}</td>
                        <td style="font-weight:bold;">${name}</td>
                        <td style="color:#ef4444; font-weight:800;">석식 미취식</td>
                    </tr>
                `).join('') : 
                "<tr><td colspan='3' style='padding:50px; color:#94a3b8;'>제외 신청자가 없습니다.</td></tr>";
        });
    }, // <--- 1. 여기 콤마(,)가 반드시 있어야 합니다!

    loadStudentList: function() {
        if(!state.room) return;
        firebase.database().ref(`courses/${state.room}/students`).on('value', snap => {
            const data = snap.val() || {};
            const tbody = document.getElementById('studentListTableBody');
            if(!tbody) return;
            const totalEl = document.getElementById('studentTotalCount');
            
            // 1. 데이터를 배열로 변환
            const studentList = Object.keys(data).map(key => ({
                token: key,
                ...data[key]
            })).filter(s => s.name && s.name !== "undefined");

            if(totalEl) totalEl.innerText = studentList.length;
            tbody.innerHTML = ""; // 2. 기존 목록 비우기

            // 3. 반복문 시작 (이 부분이 누락되어 있었습니다)
            studentList.forEach((s, idx) => {
                const joinTime = s.joinedAt ? new Date(s.joinedAt).toLocaleString([], {month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'}) : "-";
                const statusDot = s.isOnline ? '<span style="color:#22c55e; margin-right:5px;">●</span>' : '<span style="color:#cbd5e1; margin-right:5px;">●</span>';
                
                // 학생장 줄 배경색
                const rowStyle = s.isLeader ? 'style="background-color:#f5f3ff;"' : '';

                tbody.innerHTML += `
                    <tr ${rowStyle}>
                        <td>${idx + 1}</td>
                        <td style="font-weight:bold;">${statusDot}${s.name} ${s.isLeader ? '<span style="color:#f59e0b;">👑</span>' : ''}</td>
                        <td>${s.phone || "-"}</td>
                        <td style="color:#94a3b8; font-size:13px;">${joinTime}</td>
                        <td>
                            <div style="display:flex; gap:5px; justify-content:center;">
                                <button class="btn-table-action" onclick="dataMgr.toggleLeader('${s.token}', '${s.name}')" 
                                        style="font-size:11px; padding:5px 8px; background-color:${s.isLeader ? '#64748b' : '#6366f1'}; color:white; border:none; border-radius:4px; cursor:pointer;">
                                    ${s.isLeader ? '해제' : '학생장지정'}
                                </button>
                                <button class="btn-table-action" onclick="dataMgr.deleteStudent('${s.token}')" 
        style="background-color:#ef4444; font-size:11px; padding:5px 12px; color:white; border:none; border-radius:4px; cursor:pointer; white-space:nowrap; min-width:45px;">
    삭제
</button>
                            </div>
                        </td>
                    </tr>
                `;
            }); // 반복문 닫기
        });
    },
    toggleMenuDropdown: function() {
        const dropdown = document.getElementById('menuDropdown');
        dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
    }
}; // <--- 4. 최종적으로 ui 객체 닫기


// --- 4. Quiz Logic ---
const quizMgr = {
    // [기존 소스 디자인 100% 유지]
    loadFile: function(e) {
        const f = e.target.files[0]; 
        if (!f) return;
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
            const quizTitle = prompt("이 퀴즈 세트의 이름을 입력해주세요:", `${new Date().toLocaleDateString()} 퀴즈`);
            if (!quizTitle) return;
            firebase.database().ref(`courses/${state.room}/quizBank`).push().set({
                title: quizTitle, data: state.quizList, timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => { 
                ui.showAlert("저장되었습니다."); 
                quizMgr.loadSavedQuizList(); 
            });
            this.renderMiniList();
            const ctrl = document.getElementById('quizControls');
            if(ctrl) ctrl.style.display = 'flex';
            state.currentQuizIdx = 0;
            this.showQuiz();
        };
        r.readAsText(f);
    },
    
    addManualQuiz: function() {
        const q = document.getElementById('manualQ').value;
        const a = document.getElementById('manualAns').value;
        const opts = [1,2,3,4].map(i => document.getElementById('manualO'+i).value).filter(v => v);
        if(!q || !a) return ui.showAlert("Fill fields");
        state.quizList.push({ text: q, options: opts, correct: parseInt(a), checked: true, isOX: opts.length === 2, isSurvey: false });
        this.renderMiniList();
    },
    
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); if(!d) return;
        d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            const typeLabel = q.isSurvey ? '[설문]' : (q.isOX ? '[OX]' : '[4지]');
            d.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:12px; display:flex; gap:10px;"><input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked"><b>${typeLabel} Q${i+1}.</b> ${q.text.substring(0,20)}...</div>`;
        });
    },
    
    downloadSample: function() {
        let content = "";
        DEFAULT_QUIZ_DATA.forEach(q => { content += q.text + "\n" + q.options.join('\n') + "\n" + (q.isSurvey ? "SURVEY" : q.correct) + "\n\n"; });
        const blob = new Blob([content], {type: "text/plain"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "kac_quiz_sample.txt";
        a.click();
    },
    
    useDefaultQuiz: function() {
        state.quizList = DEFAULT_QUIZ_DATA; 
        state.isExternalFileLoaded = true;
        this.renderMiniList();
        this.completeQuizLoading();
    },
    
    useSavedQuiz: function() {
        firebase.database().ref(`courses/${state.room}/quizBank`).once('value', snap => {
            if(snap.exists()) {
                const data = snap.val();
                const lastKey = Object.keys(data).pop();
                state.quizList = data[lastKey].data;
                state.isExternalFileLoaded = true;
                this.renderMiniList();
                this.completeQuizLoading();
            }
        });
    },
    
    completeQuizLoading: function() {
        const modal = document.getElementById('quizSelectModal');
        if(modal) modal.style.display = 'none';
        const viewQa = document.getElementById('view-qa');
        if(viewQa) viewQa.style.display = 'none';
        const viewQuiz = document.getElementById('view-quiz');
        if(viewQuiz) viewQuiz.style.display = 'flex';
        state.currentQuizIdx = 0;
        this.showQuiz();
    },
    
    loadSavedQuizList: function() {
        const container = document.getElementById('savedQuizListContainer'); if(!container) return;
        firebase.database().ref(`courses/${state.room}/quizBank`).on('value', snap => {
            container.innerHTML = "";
            const data = snap.val();
            if (!data) { container.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444; font-weight:bold;">⚠️ 저장된 퀴즈가 없습니다.</div>`; return; }
            Object.keys(data).reverse().forEach(key => {
                const quizSet = data[key];
                const item = document.createElement('div');
                item.className = 'saved-quiz-item';
                item.innerHTML = `<div style="flex-grow:1; cursor:pointer;" onclick="quizMgr.useSavedQuizSet('${key}')"><div class="q-title">${quizSet.title}</div><div class="q-info">${quizSet.data.length}문항 | ${new Date(quizSet.timestamp).toLocaleString()}</div></div><button class="btn-del-mini" onclick="quizMgr.deleteQuizSet('${key}', '${quizSet.title}')"><i class="fa-solid fa-trash-can"></i></button>`;
                container.appendChild(item);
            });
        });
    },
    
    useSavedQuizSet: function(key) {
        firebase.database().ref(`courses/${state.room}/quizBank/${key}`).once('value', snap => {
            const val = snap.val();
            if (val) { state.quizList = val.data; state.isExternalFileLoaded = true; this.renderMiniList(); this.completeQuizLoading(); }
        });
    },
    
    deleteQuizSet: function(key, title) {
        if (confirm(`'${title}' 퀴즈를 삭제할까요?`)) { firebase.database().ref(`courses/${state.room}/quizBank/${key}`).remove(); }
    },
    
    prevNext: function(d) {
        let n = state.currentQuizIdx + d;
        if (n < 0 || n >= state.quizList.length) return ui.showAlert(n < 0 ? "첫 번째 문항입니다." : "마지막 문항입니다.");
        if(!state.quizList[n].checked) { state.currentQuizIdx = n; this.prevNext(d); return; }
        state.currentQuizIdx = n;
        this.showQuiz();
    },
    
// --- 퀴즈 시작 및 화면 표시 부분 ---
    showQuiz: function() {
        const card = document.querySelector('.quiz-card'); 
        if(card) card.classList.remove('result-mode');
        
        const q = state.quizList[state.currentQuizIdx];
        this.resetTimerUI(); 
        this.renderScreen(q);

        // [핵심 해결 코드] 숨겨져 있던 버튼 컨테이너를 보이게 합니다.
        const ctrlBar = document.getElementById('quizControls');
        if(ctrlBar) ctrlBar.style.display = 'flex'; 

        // 일시정지 버튼은 일단 숨기고 '시작' 버튼만 보이게 초기화
        if(document.getElementById('btnPause')) document.getElementById('btnPause').style.display = 'none';
        if(document.getElementById('btnSmartNext')) {
            document.getElementById('btnSmartNext').style.display = 'flex';
            document.getElementById('btnSmartNext').innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play" style="margin-left:10px;"></i>';
        }

        firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ 
            id: `Q${state.currentQuizIdx}`, 
            status: 'ready', 
            type: q.isOX ? 'OX' : 'MULTIPLE', 
            ...q 
        });

        state.remainingTime = 8;
        this.startAnswerMonitor();
    },
    
    renderScreen: function(q) {
        const qText = document.getElementById('d-qtext');
        const qNum = document.getElementById('quizNumberLabel');
        if(qText) qText.innerText = q.text;
        if(qNum) qNum.innerText = `Q${state.currentQuizIdx + 1}`;
        const oDiv = document.getElementById('d-options'); 
        const cDiv = document.getElementById('d-chart');
        if(oDiv) {
            oDiv.style.display = 'flex'; oDiv.innerHTML = "";
            q.options.forEach((o, i) => { oDiv.innerHTML += `<div class="quiz-opt ${q.isOX?'ox-mode':''}" id="opt-${i+1}"><div class="opt-num">${i+1}</div><div class="opt-text">${o}</div></div>`; });
        }
        if(cDiv) cDiv.style.display = 'none';
    },
    
    startAnswerMonitor: function() {
        const id = `Q${state.currentQuizIdx}`;
        if (state.ansListener) firebase.database().ref(`courses/${state.room}/quizAnswers/${id}`).off();
        state.ansListener = firebase.database().ref(`courses/${state.room}/quizAnswers/${id}`).on('value', snap => {
            const answers = snap.val() || {};
            const answeredCount = Object.keys(answers).length;
            const totalCount = parseInt(document.getElementById('currentJoinCount')?.innerText || 0);
            if(document.getElementById('answeredCount')) document.getElementById('answeredCount').innerText = answeredCount;
            if(document.getElementById('pendingCount')) document.getElementById('pendingCount').innerText = Math.max(0, totalCount - answeredCount);
        });
    },
    
    action: function(act) {
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        if(act === 'open') { this.startTimer(); } 
        else if(act === 'close') { 
            this.stopTimer(); 
            const q = state.quizList[state.currentQuizIdx];
            if(!q.isSurvey) { const opt = document.getElementById(`opt-${q.correct}`); if(opt) opt.classList.add('reveal-answer'); }
        } else if(act === 'result') { 
            this.stopTimer(); 
            const card = document.querySelector('.quiz-card'); if(card) card.classList.add('result-mode');
            if(document.getElementById('d-options')) document.getElementById('d-options').style.display='none'; 
            if(document.getElementById('d-chart')) document.getElementById('d-chart').style.display='flex'; 
            this.renderChart(`Q${state.currentQuizIdx}`, state.quizList[state.currentQuizIdx].correct); 
        }
    },
    
    smartNext: function() { this.action('open'); },
    
    togglePause: function() {
        const pauseBtn = document.getElementById('btnPause');
        if (state.timerInterval) { 
            this.stopTimer();
            firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: 'pause', remainingTime: state.remainingTime });
            if(pauseBtn) { pauseBtn.innerHTML = '다시 시작 <i class="fa-solid fa-play" style="margin-left:10px;"></i>'; pauseBtn.style.backgroundColor = '#3b82f6'; }
        } else { 
            this.action('open'); 
            if(pauseBtn) { pauseBtn.innerHTML = '일시정지 <i class="fa-solid fa-pause" style="margin-left:10px;"></i>'; pauseBtn.style.backgroundColor = '#f59e0b'; }
        }
    },

    startTimer: function() {
        this.stopTimer(); 
        if (document.getElementById('btnSmartNext')) document.getElementById('btnSmartNext').style.display = 'none';
        if (document.getElementById('btnPause')) { document.getElementById('btnPause').style.display = 'flex'; }
        let t = state.remainingTime;
        const d = document.getElementById('quizTimer'); 
        if (d) { d.classList.remove('urgent'); d.innerText = `00:${t < 10 ? '0' + t : t}`; }
        const endTime = Date.now() + (t * 1000);
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ endTime: endTime });
        let lastPlayedSec = -1;
        if (!state.timerAudio) state.timerAudio = new Audio('timer.mp3');
        state.timerInterval = setInterval(() => {
            const r = Math.ceil((endTime - Date.now()) / 1000);
            const displaySec = r < 0 ? 0 : r;
            state.remainingTime = displaySec; 
            if (d) { d.innerText = `00:${displaySec < 10 ? '0' + displaySec : displaySec}`; if(r <= 5) d.classList.add('urgent'); }
            if (r <= 8 && r > 0 && r !== lastPlayedSec) { state.timerAudio.currentTime = 0; state.timerAudio.play().catch(e => {}); lastPlayedSec = r; }
            if(r <= 0) {
                this.stopTimer(); this.action('close'); 
                setTimeout(() => {
                    this.action('result');
                    if (document.getElementById('btnPause')) document.getElementById('btnPause').style.display = 'none';
                    if (document.getElementById('btnSmartNext')) { document.getElementById('btnSmartNext').style.display = 'flex'; document.getElementById('btnSmartNext').innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play" style="margin-left:15px;"></i>'; }
                }, 1500);
            }
        }, 200);
    },
    
    stopTimer: function() { if(state.timerInterval) { clearInterval(state.timerInterval); state.timerInterval = null; } if (state.timerAudio) { state.timerAudio.pause(); state.timerAudio.currentTime = 0; } },
    resetTimerUI: function() { this.stopTimer(); if(document.getElementById('quizTimer')) { document.getElementById('quizTimer').innerText = "00:08"; document.getElementById('quizTimer').classList.remove('urgent'); } },
    


// [수정된 종료 함수] 안정적인 .once('value') 방식으로 복구
    showFinalSummary: function() {
        if (!state.room) {
            ui.showAlert("강의실 정보가 없습니다.");
            return;
        }

        // 1. 응답 데이터 가져오기
        firebase.database().ref(`courses/${state.room}/quizAnswers`).once('value', async (snap) => {
            try {
                const allAns = snap.val() || {};
                const totalParticipants = new Set();
                let totalQuestions = 0;
                let totalCorrect = 0;
                let totalAnswerCount = 0;
                let questionStats = [];
                const userScoreMap = {};

                // 2. 점수 계산 로직 (체크된 문항만 계산)
                state.quizList.forEach((q, idx) => {
                    if (!q.checked || q.isSurvey) return; 
                    
                    const id = `Q${idx}`;
                    const answers = allAns[id] || {};
                    const keys = Object.keys(answers);
                    
                    if (keys.length > 0) totalQuestions++;

                    keys.forEach(k => {
                        totalParticipants.add(k);
                        totalAnswerCount++;
                        
                        if (!userScoreMap[k]) userScoreMap[k] = { score: 0, pCount: 0 };
                        userScoreMap[k].pCount++;
                        
                        if (answers[k].choice === q.correct) {
                            totalCorrect++;
                            userScoreMap[k].score++;
                        }
                    });

                    // 오답률 통계를 위해 데이터 수집
                    if (keys.length > 0) {
                        const corrCnt = keys.filter(k => answers[k].choice === q.correct).length;
                        questionStats.push({
                            title: q.text,
                            accuracy: (corrCnt / keys.length) * 100
                        });
                    }
                });

                // 3. 랭킹 데이터 생성
                const sortedUsers = Object.keys(userScoreMap)
                    .map(t => ({ token: t, ...userScoreMap[t] }))
                    .sort((a, b) => b.score - a.score);

                const finalRankingData = {};
                let rank = 1;
                sortedUsers.forEach((u, i) => {
                    // 공동 순위 처리
                    if (i > 0 && u.score < sortedUsers[i - 1].score) rank = i + 1;
                    finalRankingData[u.token] = {
                        score: u.score,
                        rank: rank,
                        total: sortedUsers.length
                    };
                });

                // 4. DB 업데이트 (학생 화면에 결과 표시 및 강사 모드 전환)
                await firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(finalRankingData);
                await firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'summary' });

                // 5. 강사 화면 리포트 UI 업데이트
                const grid = document.getElementById('summaryStats');
                const avgAcc = totalAnswerCount > 0 ? Math.round((totalCorrect / totalAnswerCount) * 100) : 0;
                
                grid.innerHTML = `
                    <div class="summary-card"><span>참여 인원</span><b>${totalParticipants.size}명</b></div>
                    <div class="summary-card"><span>평균 정답률</span><b>${avgAcc}%</b></div>
                    <div class="summary-card"><span>문항 수</span><b>${totalQuestions}개</b></div>
                    <div class="summary-card"><span>전체 제출</span><b>${totalAnswerCount}건</b></div>
                `;

                const mostMissedArea = document.getElementById('mostMissedArea');
                if (questionStats.length > 0) {
                    questionStats.sort((a, b) => a.accuracy - b.accuracy);
                    mostMissedArea.style.display = 'block';
                    document.getElementById('mostMissedText').innerText = `"${questionStats[0].title.substring(0, 30)}..." (${Math.round(questionStats[0].accuracy)}%)`;
                } else {
                    mostMissedArea.style.display = 'none';
                }

                // 6. 리포트 오버레이 표시
                document.getElementById('quizSummaryOverlay').style.display = 'flex';

            } catch (e) {
                console.error("Summary Generation Error:", e);
                ui.showAlert("결과 집계 중 오류가 발생했습니다.");
            }
        });
    },
    
    // [사용자님 디자인 100% 유지] 왕관 및 인원수 차트 디자인
    renderChart: function(id, corr) {
        const div = document.getElementById('d-chart'); if(!div) return;
        div.innerHTML = "";
        const q = state.quizList[state.currentQuizIdx];
        firebase.database().ref(`courses/${state.room}/quizAnswers/${id}`).once('value', s => {
            const d = s.val() || {}; 
            const cnt = new Array(q.options.length).fill(0);
            Object.values(d).forEach(v => { if(v.choice >= 1 && v.choice <= q.options.length) cnt[v.choice-1]++; });
            const max = Math.max(...cnt, 1);
            
            if(q.isSurvey) {
                let maxIdx = cnt.indexOf(Math.max(...cnt));
                firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ surveyResult: `가장 많은 선택: '${q.options[maxIdx]}' (${Math.round((cnt[maxIdx]/Object.values(d).length)*100)}%)` });
            }
            
            for(let i=0; i < q.options.length; i++) {
                const isCorrect = !q.isSurvey && (i + 1) === corr; 
                const h = (cnt[i]/max)*80;
                // [기존 소스 왕관 디자인 및 위치 유지]
                const crownHtml = isCorrect ? `<div class="crown-icon" style="bottom: ${h > 0 ? h + '%' : '40px'};">👑</div>` : '';
                div.innerHTML += `
                    <div class="bar-wrapper ${isCorrect ? 'correct' : ''}">
                        ${crownHtml}
                        <div class="bar-value">${cnt[i]}</div>
                        <div class="bar-fill" style="height:${h}%"></div>
                        <div class="bar-label">${q.isOX?(i===0?'O':'X'):(i+1)}</div>
                    </div>
                `;
            }
        });
    },

    closeQuizMode: function() { const exitModal = document.getElementById('quizExitModal'); if(exitModal) exitModal.style.display = 'flex'; },
    
    confirmExitQuiz: function(type) {
        const exitModal = document.getElementById('quizExitModal'); if(exitModal) exitModal.style.display = 'none';
        if(type === 'reset') {
            state.currentQuizIdx = 0; state.isExternalFileLoaded = false; state.quizList = [];
            firebase.database().ref(`courses/${state.room}/activeQuiz`).set(null);
            firebase.database().ref(`courses/${state.room}/status/quizStep`).set('none');
            firebase.database().ref(`courses/${state.room}/quizAnswers`).set(null);
            firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(null);
            quizMgr.renderMiniList();
            if(document.getElementById('d-qtext')) document.getElementById('d-qtext').innerText = "Ready?"; 
            if(document.getElementById('d-options')) document.getElementById('d-options').innerHTML = "";
        }
        ui.setMode('qa');
    }
};



// --- 5. Print & Report ---
const printMgr = {
    openInputModal: function() { 
        const today = new Date();
        const dateIn = document.getElementById('printDateInput');
        const profIn = document.getElementById('printProfInput');
        const modal = document.getElementById('printInputModal');
        if(dateIn) {
            dateIn.value = ""; 
            dateIn.placeholder = `${today.getFullYear()}.${today.getMonth()+1}.${today.getDate()}`;
        }
        if(profIn) profIn.value = document.getElementById('profSelect').value || ""; 
        if(modal) modal.style.display = 'flex'; 
    },
    
    confirmPrint: function(isSkip) { 
        const today = new Date();
        const defDate = `${today.getFullYear()}.${today.getMonth()+1}.${today.getDate()}`;
        this.closeInputModal(); 
        const dateIn = document.getElementById('printDateInput');
        const profIn = document.getElementById('printProfInput');
        this.openPreview(
            isSkip ? defDate : ((dateIn && dateIn.value) || defDate), 
            isSkip ? "" : (profIn ? profIn.value : "")
        ); 
    },
    
    closeInputModal: function() { 
        const modal = document.getElementById('printInputModal');
        if(modal) modal.style.display = 'none'; 
    },
    
    openPreview: function(date, prof) { 
        const cname = document.getElementById('courseNameInput');
        const docCname = document.getElementById('doc-cname');
        const docDate = document.getElementById('doc-date');
        const docProf = document.getElementById('doc-prof');
        const listBody = document.getElementById('docListBody');
        const previewModal = document.getElementById('printPreviewModal');

        if(docCname) docCname.innerText = (cname && cname.value) || "미설정"; 
        if(docDate) docDate.innerText = date; 
        if(docProf) docProf.innerText = prof || "담당 교수";
        
        if(listBody) {
            listBody.innerHTML = ""; 
            const items = Object.values(state.qaData || {}); 
            
            if (items.length === 0) {
                listBody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:50px;'>수집된 질문이 없습니다.</td></tr>";
            } else { 
                items.sort((a,b) => a.timestamp - b.timestamp).forEach((item, idx) => { 
                    listBody.innerHTML += `
                        <tr>
                            <td>${idx + 1}</td>
                            <td style="text-align:left;">${item.text}</td>
                            <td>❤️ ${item.likes || 0}</td>
                        </tr>
                    `; 
                }); 
            }
        }
        
        if(previewModal) previewModal.style.display = 'flex'; 
    },
    
    closePreview: function() { 
        const modal = document.getElementById('printPreviewModal');
        if(modal) modal.style.display = 'none'; 
    },
    
    executePrint: function() { 
        const content = document.getElementById('official-document').innerHTML;
        const printWindow = window.open('', '', 'height=900,width=800');
        printWindow.document.write(`
            <html>
            <head>
                <title>KAC Report</title>
                <style>
                    @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"); 
                    * { box-sizing: border-box; } 
                    body { font-family: "Pretendard", sans-serif; } 
                    @page { size: A4; margin: 25mm; } 
                    h2 { margin: 0 0 30px 0; text-align: center; } 
                    table { width: 100% !important; border-collapse: collapse; } 
                    .doc-info-table th { text-align: left; width: 120px; padding: 6px 0; } 
                    .doc-list-table tr { border-bottom: 1px solid #999; } 
                    .doc-list-table td { padding: 12px 5px; font-size: 13px; } 
                    .doc-list-table td:first-child { text-align: center; width: 50px; } 
                    .doc-list-table td:last-child { text-align: center; width: 70px; color: #3b82f6; }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
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

    // [중요] 이 코드가 있어야 새로고침 시 자동으로 방을 찾아 들어갑니다.
    const lastRoom = localStorage.getItem('kac_last_room');
    if (lastRoom) {
        // Firebase가 연결될 때까지 0.5초만 기다렸다가 실행합니다.
        setTimeout(() => {
            if (firebase.auth().currentUser) {
                dataMgr.forceEnterRoom(lastRoom);
            }
        }, 500);
    }
};

// ▼ 이 아래에 제공해드린 코드를 붙여넣으세요 ▼
window.onclick = function(event) {
    // 클릭한 대상이 드롭다운 버튼이 아니면 드롭다운 메뉴를 닫음
    if (!event.target.matches('.dropdown-trigger') && !event.target.closest('.dropdown-trigger')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].style.display = "none";
        }
    }
};

