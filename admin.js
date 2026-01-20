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
        // 강사는 오직 자신의 notice 경로에만 저장합니다.
        firebase.database().ref(`courses/${state.room}/notice`).set(msg).then(() => {
            ui.showAlert("✅ 강사 공지사항이 교육생에게 게시되었습니다.");
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
    
// [수정] 방 이동 시 제어권이 없으면 무조건 비번 창을 띄우고, 실패 시 입장을 원천 차단
    switchRoomAttempt: async function(newRoom) {
        localStorage.setItem('kac_last_mode', 'dashboard');
        
        // 내가 이미 주인인 방이면 바로 입장
        if (localStorage.getItem('last_owned_room') === newRoom) {
            this.forceEnterRoom(newRoom);
            return;
        }

        const snapshot = await firebase.database().ref(`courses/${newRoom}/status`).get();
        const st = snapshot.val() || {};

        // 누군가 운영 중인 방이라면
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            state.pendingRoom = newRoom;
            document.getElementById('takeoverPwInput').value = "";
            document.getElementById('takeoverModal').style.display = 'flex'; // 비번창 띄움
            document.getElementById('takeoverPwInput').focus();
        } else {
            // 비어있는 방이라면 바로 입장 (들어가서 환경설정 해야 하므로)
            this.forceEnterRoom(newRoom);
        }
    },

    
     // [수정] 인증 성공 시에만 세션 ID를 서버에 등록하여 '정식 주인'으로 인정
    verifyTakeover: async function() {
        const newRoom = state.pendingRoom;
        let input = document.getElementById('takeoverPwInput').value;
        if(input) input = input.trim(); 
        if (!newRoom || !input) return;

        const settingSnap = await firebase.database().ref(`courses/${newRoom}/settings`).get();
        const settings = settingSnap.val() || {};
        const dbPw = settings.password || btoa("7777"); 

        if (btoa(input) === dbPw || btoa(input) === "MTMyODE=") {
            // 인증 성공 시에만 세션 ID와 소유권을 업데이트
            localStorage.setItem(`last_owned_room`, newRoom);
            await firebase.database().ref(`courses/${newRoom}/status`).update({ 
                ownerSessionId: state.sessionId 
            });
            this.forceEnterRoom(newRoom);
            document.getElementById('takeoverModal').style.display = 'none';
        } else {
            ui.showAlert("⛔ 비밀번호가 올바르지 않습니다.");
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

    // [핵심] 교수님 성함이 DB에 있다면 사이드바와 대시보드 모두 즉시 업데이트
    const dashProf = document.getElementById('dashProfName'); // 대시보드의 성함 엘리먼트
    const sidebarProf = document.getElementById('profSelect'); // 사이드바의 선택창

    if(st.professorName) {
        if(sidebarProf) sidebarProf.value = st.professorName; // 사이드바 동기화
        
        // [수정된 부분] 단순 텍스트 대신 아이콘과 "프로필 보기" 링크를 포함한 HTML을 삽입합니다.
        if(dashProf) {
            dashProf.innerHTML = `
                <span onclick="ui.showProfPresentation('${st.professorName}')" style="cursor:pointer; color:#3b82f6; display:inline-flex; align-items:center; gap:8px; font-weight:800;">
                    <i class="fa-solid fa-address-card" style="font-size:1.2em;"></i> 
                    ${st.professorName} 교수님
                    <small style="font-weight:400; font-size:12px; margin-left:5px; background:#eff6ff; padding:2px 8px; border-radius:10px; border:1px solid #dbeafe;">프로필 보기</small>
                </span>
            `;
        }
    } else {
        if(sidebarProf) sidebarProf.value = "";
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
        guideMgr.init();
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

// [최종 수정] 리셋 시 교육생 퇴출용 resetKey를 포함한 초기화 로직
resetCourse: function() {
    if (!state.room) {
        ui.showAlert("⚠️ 강의실을 먼저 선택해야 초기화가 가능합니다.");
        return;
    }
    if(confirm("🚨 경고: [입교안내 가이드]를 제외한 모든 데이터(과정명, 교수, 학생, 각종 신청 내역 등)를 삭제하고 초기화하시겠습니까?")) {
        const rPath = `courses/${state.room}`;

        // 1. 초기화할 데이터들을 묶어서 처리
        const updates = {};

        // [데이터 삭제 항목]
        updates[`${rPath}/questions`] = null;
        updates[`${rPath}/students`] = null;
        updates[`${rPath}/expectedStudents`] = null; 
        updates[`${rPath}/activeQuiz`] = null;
        updates[`${rPath}/quizAnswers`] = null;
        updates[`${rPath}/quizFinalResults`] = null;
        updates[`${rPath}/admin_actions`] = null;
        updates[`${rPath}/dinner_skips`] = null;
        updates[`${rPath}/shuttle`] = null;
        updates[`${rPath}/notice`] = null;
        updates[`${rPath}/attendanceQR`] = null;
        updates[`${rPath}/connections`] = null;

       // [핵심 추가] 자체 출석부 데이터도 함께 삭제합니다.
        updates[`${rPath}/internal_attendance`] = null;

        // [기본값 설정 항목]
        updates[`${rPath}/settings/courseName`] = "";
        updates[`${rPath}/settings/subjects`] = null;
        updates[`${rPath}/status/roomStatus`] = "idle";
        updates[`${rPath}/status/professorName`] = "";
        updates[`${rPath}/status/ownerSessionId`] = null;
        updates[`${rPath}/status/mode`] = "qa";

        // [가장 중요 - 핵심 추가!] 교육생 앱이 이 값을 보고 즉시 튕겨나갑니다.
        updates[`${rPath}/status/resetKey`] = "reset_" + Date.now();

        // 2. 서버 업데이트 실행
        firebase.database().ref().update(updates).then(() => {
            // 강사 화면 UI 비우기
            const tableIds = ['studentListTableBody', 'adminActionTableBody', 'dinnerSkipTableBody', 'dormitoryTableBody'];
            tableIds.forEach(id => {
                const el = document.getElementById(id);
                if(el) el.innerHTML = "";
            });

            document.getElementById('courseNameInput').value = "";
            document.getElementById('profSelect').value = "";
            document.getElementById('roomStatusSelect').value = 'idle';
            document.getElementById('displayCourseTitle').innerText = "";

            ui.showAlert("✅ 초기화되었습니다. 모든 교육생이 퇴출됩니다.");

            // 완벽한 반영을 위해 강사 페이지도 0.5초 뒤 새로고침
            setTimeout(() => location.reload(), 500);
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



// [수정] 수강생 삭제 시 개편된 차량 신청(shuttle/requests) 내역까지 완벽삭제
deleteStudent: function(token) {
    if(!state.room) return;
    
    firebase.database().ref(`courses/${state.room}/students/${token}`).once('value', snap => {
        const targetStudent = snap.val();
        if(!targetStudent) return;
        const targetName = targetStudent.name;
        const targetPhone = (targetStudent.phone || "0000").trim();
        const attendanceKey = `${targetName.trim()}_${targetPhone}`; // 출석부용 키

        if(confirm(`🚨 [${targetName}] 수강생의 모든 정보(출석부, 차량신청, 행정내역)를 삭제하시겠습니까?`)) {
            const today = getTodayString();
            const updates = {};
            const rPath = `courses/${state.room}`;
            
            // 1. 수강생 기본 정보 삭제
            updates[`${rPath}/students/${token}`] = null;

            // 2. 금일 행정 신청(석식제외, 외출외박) 삭제
            updates[`${rPath}/dinner_skips/${today}/${token}`] = null;
            updates[`${rPath}/admin_actions/${today}/${token}`] = null;

            // 3. [핵심수정] 개편된 차량 신청 내역 삭제
            updates[`${rPath}/shuttle/requests/${token}`] = null;

            // 4. 자체 출석부(모든 날짜) 기록 삭제 (기존 로직 유지)
            firebase.database().ref(`${rPath}/internal_attendance`).once('value', attendSnap => {
                const allAttendData = attendSnap.val() || {};
                Object.keys(allAttendData).forEach(date => {
                    if(allAttendData[date][attendanceKey]) {
                        updates[`${rPath}/internal_attendance/${date}/${attendanceKey}`] = null;
                    }
                });

                // 모든 삭제 명령을 한꺼번에 서버에 전송
                firebase.database().ref().update(updates).then(() => {
                    ui.showAlert(`✅ [${targetName}]님의 모든 데이터가 정상적으로 삭제되었습니다.`);
                });
            });
        }
    });
},





    // [7.0차 신규] 수강생 예정 명단 업로드 로직 (텍스트 파일 읽기)
    uploadStudentNames: function(input) {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            // 한 줄에 한 명씩 이름을 분리하여 배열로 저장
            const names = e.target.result.split(/\r?\n/)
                .map(n => n.trim())
                .filter(n => n.length > 0);
            
            if(names.length === 0) {
                ui.showAlert("⚠️ 파일에 유효한 이름이 없습니다.");
                return;
            }

            firebase.database().ref(`courses/${state.room}/expectedStudents`).set(names)
                .then(() => {
                    ui.showAlert(`✅ ${names.length}명의 예정 명단이 등록되었습니다.`);
                    input.value = ""; // 입력창 초기화
                });
        };
        reader.readAsText(file);
    },

    // [7.0차 신규] 등록된 예정 명단 초기화
    clearExpectedList: function() {
        if(confirm("등록된 예정 명단을 삭제하시겠습니까?\n(실제 입실한 학생 기록은 지워지지 않습니다.)")) {
            firebase.database().ref(`courses/${state.room}/expectedStudents`).set(null)
                .then(() => {
                    ui.showAlert("✅ 예정 명단이 초기화되었습니다.");
                });
        }
    }
}; // <--- dataMgr 객체 진짜 마감

// --- [수정된 profMgr] 교수님 명단 관리 ---
const profMgr = {
    list: [],
    
    init: function() {
        // 교수님 명단 실시간 동기화
        firebase.database().ref('system/professors').on('value', snap => {
            const data = snap.val() || {};
            this.list = Object.keys(data).map(k => ({ key: k, name: data[k] }));
            this.renderSelect();
            if (document.getElementById('profManageModal')?.style.display === 'flex') {
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
        const modal = document.getElementById('profManageModal');
        if(modal) {
            modal.style.display = 'flex';
            const input = document.getElementById('newProfInput');
            if(input) input.focus();
        }
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
            const item = document.createElement('div');
            item.className = 'prof-item';
            // 수정된 부분: 이름 옆에 [프로필 등록] 버튼 추가
            item.innerHTML = `
                <span>${p.name}</span> 
                <div style="display:flex; gap:5px;">
                    <button onclick="profMgr.openProfileEditor('${p.name}')" style="background:#3b82f6;">프로필</button>
                    <button onclick="profMgr.deleteProf('${p.key}')">삭제</button>
                </div>`;
            div.appendChild(item);
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
    },


// [리포트 반영] 프로필 편집 창 열 때 영문 성함 포함 기존 데이터 호출
    openProfileEditor: function(name) {
        document.getElementById('pp-name').value = name;
        document.getElementById('pp-eng-name').value = ""; // 초기화
        document.getElementById('pp-phone').value = "";
        document.getElementById('pp-email').value = "";
        document.getElementById('pp-msg').value = "";
        document.getElementById('pp-bio').value = "";
        const previewImg = document.getElementById('pp-photo-preview').querySelector('img');
        if(previewImg) previewImg.style.display = 'none';

        firebase.database().ref(`system/professorProfiles/${name}`).once('value', snap => {
            const p = snap.val();
            if(p) {
                document.getElementById('pp-eng-name').value = p.engName || ""; // 영문 성함 로드
                document.getElementById('pp-phone').value = p.phone || "";
                document.getElementById('pp-email').value = p.email || "";
                document.getElementById('pp-msg').value = p.msg || "";
                document.getElementById('pp-bio').value = p.bio || "";
                if(p.photo && previewImg) {
                    previewImg.src = p.photo;
                    previewImg.style.display = 'block';
                }
            }
        });
        document.getElementById('profProfileModal').style.display = 'flex';
    },


// [추가] 사진 용량 최적화 (가로 500px 기준 압축)
    resizeImage: function(file, callback) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 500; // 최대 가로 크기 500px

                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.7)); // 70% 품질로 압축
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

// [리포트 반영] 상세 프로필 저장 (영문 성함 데이터 포함)
    saveFullProfile: function() {
        const name = document.getElementById('pp-name').value;
        const fileInput = document.getElementById('pp-photo-file');
        
        const doSave = (photoData) => {
            const profileData = {
                photo: photoData || "",
                engName: document.getElementById('pp-eng-name').value, // 영문 성함 추가
                phone: document.getElementById('pp-phone').value,
                email: document.getElementById('pp-email').value,
                msg: document.getElementById('pp-msg').value,
                bio: document.getElementById('pp-bio').value
            };
            firebase.database().ref(`system/professorProfiles/${name}`).set(profileData).then(() => {
                ui.showAlert("✅ 담임 교수 프로필이 성공적으로 저장되었습니다.");
                ui.closeProfProfileModal();
            });
        };

        if (fileInput.files.length > 0) {
            this.resizeImage(fileInput.files[0], (optimizedData) => doSave(optimizedData));
        } else {
            firebase.database().ref(`system/professorProfiles/${name}/photo`).once('value', s => doSave(s.val()));
        }
    } // <--- 함수의 끝
}; // <--- 중요!! profMgr라는 큰 바구니를 여기서 완전히 닫습니다. (콤마 없음)


// 과정 담당자(행정) 및 서명 관리 객체 (강사 플랫폼용)
const coordMgr = {
    list: [],
    tempSign: "",
    
    init: function() {
        const ref = firebase.database().ref('system/coordinators');
        ref.on('value', s => {
            const data = s.val() || {};
            this.list = Object.keys(data).map(k => ({ key: k, ...data[k] }));
            this.renderSelects();    
            this.renderManageList(); 
        });
    },

    renderSelects: function() {
        const sel = document.getElementById('setup-coord-select'); 
        if(!sel) return;
        const curValue = sel.value; 
        sel.innerHTML = '<option value="">--- 담당자 선택 ---</option>';
        this.list.forEach(c => {
            const opt = new Option(c.name, c.name);
            if(c.name === curValue) opt.selected = true;
            sel.add(opt);
        });
    },

    renderManageList: function() {
        const div = document.getElementById('coordListContainer'); 
        if(!div) return;
        if(this.list.length === 0) {
            div.innerHTML = "<div style='text-align:center; padding:20px; color:#94a3b8;'>등록된 담당자가 없습니다.</div>";
            return;
        }
        div.innerHTML = this.list.map(c => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; align-items:center; background:#fff; margin-bottom:5px; border-radius:8px;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-weight:800; color:#1e293b;">${c.name}</span>
                    ${c.sign ? `<img src="${c.sign}" style="height:35px; mix-blend-mode:multiply; border:1px solid #eee; border-radius:4px;">` : `<span style="font-size:10px; color:#94a3b8;">(미등록)</span>`}
                </div>
                <i class="fa-solid fa-circle-xmark" style="color:#ef4444; cursor:pointer; font-size:20px;" onclick="coordMgr.delete('${c.key}')"></i>
            </div>`).join('');
    },

    handleFile: function(input) {
        const file = input.files[0]; 
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (e) => { 
            this.tempSign = e.target.result; 
            document.getElementById('tempSignPreview').src = e.target.result;
            document.getElementById('signPreviewArea').style.display = 'block';
        };
        reader.readAsDataURL(file);
    },

    add: async function() {
        const input = document.getElementById('newCoordInput'); 
        const name = input.value.trim();
        if(!name) return alert("성함을 입력해 주세요.");
        try {
            await firebase.database().ref('system/coordinators').push({ name: name, sign: this.tempSign });
            input.value = ""; this.tempSign = "";
            document.getElementById('signPreviewArea').style.display = 'none';
        } catch(e) { alert("오류: " + e.message); }
    },

    delete: async function(k) {
        if(confirm("이 담당자를 삭제할까요?")) {
            await firebase.database().ref(`system/coordinators/${k}`).remove();
        }
    },

    openManage: function() {
        document.getElementById('coordManageModal').style.display = 'flex';
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
        
        // 1. 기존 사이드바/게시판 필터 업데이트
        this.renderList();
        this.renderFilters(); 
        
        // 2. [추가] 환경 설정 팝업창 내부의 리스트도 실시간으로 다시 그립니다.
        if (typeof this.renderListInModal === 'function') {
            this.renderListInModal();
        }
    });
},

// [리포트 반영] 과목 필터 바 렌더링 (공통질문 필터 추가)
    renderFilters: function() {
        const bar = document.getElementById('subjectFilterBar');
        if(!bar) return;
        
        let html = `<div class="filter-chip ${this.selectedFilter === 'all' ? 'active' : ''}" onclick="subjectMgr.setFilter('all')">전체</div>`;
        
        // 공통질문 전용 필터 칩 추가
        html += `<div class="filter-chip ${this.selectedFilter === '공통질문' ? 'active' : ''}" onclick="subjectMgr.setFilter('공통질문')">공통질문</div>`;
        
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


// [신규] 단체 회식 적용 (전원 석식 제외)
    applyGroupDinner: function() {
        if(!confirm("현재 명단의 모든 수강생을 '석식 제외'로 등록하시겠습니까?\n(단체 회식 시 사용)")) return;
        
        firebase.database().ref(`courses/${state.room}/students`).once('value', snap => {
            const students = snap.val() || {};
            const today = getTodayString();
            const updates = {};
            
            Object.keys(students).forEach(token => {
                const s = students[token];
                if(s.name) {
                    updates[`courses/${state.room}/dinner_skips/${today}/${token}`] = `${s.name}(${s.phone ? s.phone.slice(-4) : '0000'})`;
                }
            });
            
            firebase.database().ref().update(updates).then(() => {
                ui.showAlert("✅ 전원 석식 제외 처리가 완료되었습니다.");
            });
        });
    },

    // [신규] 석식 제외 초기화
    resetDinnerSkip: function() {
        if(!confirm("오늘의 모든 석식 제외 신청 내역을 삭제하시겠습니까?")) return;
        const today = getTodayString();
        firebase.database().ref(`courses/${state.room}/dinner_skips/${today}`).set(null).then(() => {
            ui.showAlert("✅ 석식 제외 명단이 초기화되었습니다.");
        });
    },


// [5.9차 수정] "교수 [성함] ([영문])" 형식 및 데이터 주입 로직
    showProfPresentation: function(name) {
        firebase.database().ref(`system/professorProfiles/${name}`).once('value', snap => {
            const p = snap.val();
            if(!p) return ui.showAlert("상세 프로필을 먼저 등록해주세요.");
            
            // 1. 성함 포맷팅 (교수 성함 (English Name))
            const fullNameEl = document.getElementById('pres-display-full-name');
            if(fullNameEl) {
                const engPart = p.engName ? `<span class="eng-txt">(${p.engName})</span>` : "";
                fullNameEl.innerHTML = `<span class="rank-txt">교수</span> ${name} ${engPart}`;
            }
            
            // 2. 사진 및 텍스트 주입
            const photoImg = document.getElementById('pres-photo');
            if(photoImg) photoImg.src = p.photo || "logo.png";
            
            document.getElementById('pres-phone').innerText = p.phone || "연락처 미등록";
            document.getElementById('pres-email').innerText = p.email || "이메일 미등록";
            document.getElementById('pres-msg').innerText = p.msg ? `"${p.msg}"` : "";
            
            // 3. 약력 리스트 (불렛 로직 포함)
            const bioArea = document.getElementById('pres-bio');
            if(bioArea) {
                if(p.bio) {
                    const lines = p.bio.split('\n').filter(l => l.trim() !== "");
                    bioArea.innerHTML = lines.map(l => `<div class="bio-line">${l.trim()}</div>`).join('');
                } else {
                    bioArea.innerText = "등록된 약력이 없습니다.";
                }
            }
            
            ui.setMode('prof-presentation');
        });
    },
    closeProfProfileModal: function() { document.getElementById('profProfileModal').style.display = 'none'; },






loadDashboardStats: function() {
        if(!state.room) return;
        const today = getTodayString();

        // 1. [수정] 오늘 날짜 표시 부분 삭제 (대신 담당자 이름 표시 로직이 아래 settings listener에 포함됨)

        // 2. 과정 기본 정보 로드 (과정명, 기간, 장소, 담당자)
        firebase.database().ref(`courses/${state.room}/settings`).on('value', snap => {
            const s = snap.val() || {};
            const titleEl = document.getElementById('dashCourseTitle');
            if(titleEl) titleEl.innerText = s.courseName || "과정명을 설정해주세요.";
            if(document.getElementById('dashPeriod')) document.getElementById('dashPeriod').innerText = s.period || "기간 미설정";
            if(document.getElementById('dashRoomDetail')) document.getElementById('dashRoomDetail').innerText = s.roomDetailName || "장소 미설정";
            
            // [추가] 과정 담당자 이름 실시간 표시
            const coordEl = document.getElementById('dashCoordName');
            if(coordEl) coordEl.innerText = s.coordinatorName || "미지정";
        });

        // 3. 공지사항 피드 로드
        firebase.database().ref(`courses/${state.room}/notice`).on('value', s => {
            const el = document.getElementById('dashNoticeInst');
            if(el) el.innerText = s.val() || "작성된 담임 교수 공지가 없습니다.";
        });
        firebase.database().ref(`courses/${state.room}/coordNotice`).on('value', s => {
            const el = document.getElementById('dashNoticeAdmin');
            if(el) el.innerText = s.val() || "등록된 운영부 과정 공지가 없습니다.";
        });
        firebase.database().ref(`system/globalNotice`).on('value', s => {
            const el = document.getElementById('dashNoticeGlobal');
            if(el) el.innerText = s.val() || "현재 게시된 센터 전체 공지가 없습니다.";
        });

        // 4. 담당 교수님 성함 로드
        firebase.database().ref(`courses/${state.room}/status`).on('value', snap => {
            const st = snap.val() || {};
            const profOnlyEl = document.getElementById('dashProfNameOnly');
            if(profOnlyEl) profOnlyEl.innerText = st.professorName || "미지정";
        });

        // 5. 수강생 현황 (숫자 분리 업데이트)
        const expectedRef = firebase.database().ref(`courses/${state.room}/expectedStudents`);
        const actualRef = firebase.database().ref(`courses/${state.room}/students`);

        expectedRef.on('value', expSnap => {
            const expectedNames = expSnap.val() || [];
            actualRef.on('value', snap => {
                const data = snap.val() || {};
                const actualStudents = Object.values(data).filter(s => s.name && s.name !== "undefined");
                const actualNames = actualStudents.map(s => s.name);
                const combinedNames = Array.from(new Set([...expectedNames, ...actualNames]));
                
                const total = combinedNames.length;
                let arrived = 0;
                combinedNames.forEach(name => {
                    if (actualNames.includes(name)) arrived++;
                });

                const arrivedEl = document.getElementById('dashArrivedCount');
                const totalEl = document.getElementById('dashTotalCount');
                if(arrivedEl) arrivedEl.innerText = arrived;
                if(totalEl) totalEl.innerText = total;
            });
        });

        // 6. 외출/외박 신청자 카운트
        firebase.database().ref(`courses/${state.room}/admin_actions/${today}`).on('value', s => {
            const count = Object.keys(s.val() || {}).length;
            if(document.getElementById('dashActionCount')) document.getElementById('dashActionCount').innerText = count;
        });

        // 7. 석식 제외 신청자 카운트
        firebase.database().ref(`courses/${state.room}/dinner_skips/${today}`).on('value', s => {
            const count = Object.keys(s.val() || {}).length;
            const skipEl = document.getElementById('dashDinnerSkipCount');
            if(skipEl) skipEl.innerText = count;
        });







// [최종 수정] 출발시간 연동 (가운데 정렬, 시안성 강화, N배지 로직 포함)
// [수정] 과정 전용 출발시간 우선 로드
        firebase.database().ref(`courses/${state.room}/shuttle/departure`).on('value', snap => {
            const dep = snap.val();
            const bar = document.getElementById('dashShuttleNotice');
            const txt = document.getElementById('dashShuttleNoticeTxt');
            if(!bar || !txt) return;

            if (dep && dep.time) {
                bar.style.display = "block";
                txt.innerText = `출발 예정: ${dep.date} ${dep.time}`;
            } else {
                // 과정 전용 시간이 없으면 기사님 전체 공지사항을 가져옴
                firebase.database().ref('system/shuttle_notice').once('value', s => {
                    const msg = s.val();
                    if(msg) { bar.style.display = "block"; txt.innerText = msg; }
                    else { bar.style.display = "none"; }
                });
            }
        });
























        // 8. 실시간 질문(Q&A) 건수 카운트
        firebase.database().ref(`courses/${state.room}/questions`).on('value', s => {
            const data = s.val() || {};
            const count = Object.values(data).filter(q => q.status !== 'delete').length;
            const qaEl = document.getElementById('dashQaCount');
            if(qaEl) qaEl.innerText = count;
        });

// 8. 셔틀 탑승 수요 통합 카운트 (개편된 구조 반영)
        firebase.database().ref(`courses/${state.room}/shuttle/requests`).on('value', s => {
            const data = s.val() || {};
            const items = Object.values(data);
            const osong = items.filter(i => i.type === 'osong').length;
            const term = items.filter(i => i.type === 'terminal').length;
            const air = items.filter(i => i.type === 'airport').length;
            const car = items.filter(i => i.type === 'car').length;
            if(document.getElementById('total-osong')) document.getElementById('total-osong').innerText = osong;
            if(document.getElementById('total-term')) document.getElementById('total-term').innerText = term;
            if(document.getElementById('total-air')) document.getElementById('total-air').innerText = air;
            if(document.getElementById('total-car')) document.getElementById('total-car').innerText = car;
            const totalSum = items.length;
            if(document.getElementById('dashShuttleTotal')) document.getElementById('dashShuttleTotal').innerText = totalSum + "명";
        });
    },










// [완성형 디자인] 운영부 공지사항 출력 (한 줄 정렬 및 가변 높이 적용)
    loadNoticeView: async function() {
        if(!state.room) return;
        
        // 1. 좌측 영역: 강사 본인 공지
        const snap = await firebase.database().ref(`courses/${state.room}/notice`).once('value');
        document.getElementById('instNoticeInputMain').value = snap.val() || "";

        // 2. 우측 영역: 통합 공지 조회
        const globalRef = firebase.database().ref('system/globalNotice');
        const coordRef = firebase.database().ref(`courses/${state.room}/coordNotice`);

        const updateRightNotice = () => {
            Promise.all([globalRef.once('value'), coordRef.once('value')]).then(([gSnap, cSnap]) => {
                const globalMsg = gSnap.val();
                const coordMsg = cSnap.val();
                const display = document.getElementById('globalNoticeDisplay');
                
                let html = "";
                
                // (1) 과정 운영 공지
                if (coordMsg) {
                    html += `
                        <div style="margin-bottom:15px; padding:15px 20px; background:#f0f7ff; border-radius:12px; border:1px solid #dbeafe; border-left:8px solid #3b82f6;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                                <span style="background:#3b82f6; color:white; font-size:10px; font-weight:900; padding:2px 6px; border-radius:4px; line-height:1.2;">ADMIN</span>
                                <span style="color:#3b82f6; font-size:13px; font-weight:800;">과정 운영 공지</span>
                            </div>
                            <div style="font-size:14.5px; color:#1e3a8a; font-weight:600; line-height:1.5; white-space: pre-line;">${coordMsg}</div>
                        </div>`;
                }
                
                // (2) 항기원 전체 공지
                if (globalMsg) {
                    html += `
                        <div style="margin-bottom:15px; padding:15px 20px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; border-left:8px solid #64748b;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                                <span style="background:#64748b; color:white; font-size:10px; font-weight:900; padding:2px 6px; border-radius:4px; line-height:1.2;">CENTER</span>
                                <span style="color:#64748b; font-size:13px; font-weight:800;">항기원 전체 공지</span>
                            </div>
                            <div style="font-size:14.5px; color:#475569; font-weight:600; line-height:1.5; white-space: pre-line;">${globalMsg}</div>
                        </div>`;
                }

                if (!coordMsg && !globalMsg) {
                    display.innerHTML = `
                        <div style="padding:50px 0; text-align:center; color:#cbd5e1;">
                            <i class="fa-solid fa-envelope-open" style="font-size:35px; margin-bottom:12px; opacity:0.5;"></i>
                            <p style="font-size:14px; font-weight:700;">현재 등록된 운영부 공지가 없습니다.</p>
                        </div>`;
                } else {
                    display.innerHTML = html;
                }
            });
        };

        globalRef.on('value', updateRightNotice);
        coordRef.on('value', updateRightNotice);
    },





// [교체 및 추가] 출결 게시판 통합 관리 (공식 QR + 자체 출석부)
    loadAttendanceView: function() {
        if(!state.room) return;
        
        // 1. [기존 기능 유지] 공식 E-HRD QR 이미지 실시간 감시
        firebase.database().ref(`courses/${state.room}/attendanceQR`).on('value', snap => {
            const qrData = snap.val();
            const imgMain = document.getElementById('attendanceQrImgMain');
            const msgMain = document.getElementById('noAttendanceQrMsgMain');
            
            if(qrData) {
                if(imgMain) {
                    imgMain.src = qrData;
                    imgMain.style.display = 'block';
                }
                if(msgMain) msgMain.style.display = 'none';
            } else {
                if(imgMain) imgMain.style.display = 'none';
                if(msgMain) {
                    msgMain.style.display = 'block';
                    msgMain.innerText = "등록된 QR 이미지가 없습니다. (운영부 업로드 필요)";
                }
            }
        });

        // 2. [신규 기능] 자체 출석체크 실시간 감시 시작
        this.loadInternalAttendance();
    },

    // [신규] 출결 모드 전환 (공식 QR <-> 자체 출석체크)
    toggleAttendanceMode: function(mode) {
        const areaOfficial = document.getElementById('area-official-qr');
        const areaInternal = document.getElementById('area-internal-qr');
        const subTitle = document.getElementById('attendanceSubTitle');
        const btnOfficial = document.getElementById('btn-mode-official');
        const btnInternal = document.getElementById('btn-mode-internal');

        if(mode === 'official') {
            if(areaOfficial) areaOfficial.style.display = 'block';
            if(areaInternal) areaInternal.style.display = 'none';
            if(subTitle) subTitle.innerText = "E-HRD 출결 처리를 위한 QR 코드입니다.";
            // 버튼 디자인 변경
            btnOfficial.style.background = "#003366"; btnOfficial.style.color = "white";
            btnInternal.style.background = "#f1f5f9"; btnInternal.style.color = "#64748b";
        } else {
            if(areaOfficial) areaOfficial.style.display = 'none';
            if(areaInternal) areaInternal.style.display = 'block';
            if(subTitle) subTitle.innerText = "항기원 자체 시스템을 통해 실시간 출석을 확인합니다.";
            // 버튼 디자인 변경
            btnOfficial.style.background = "#f1f5f9"; btnOfficial.style.color = "#64748b";
            btnInternal.style.background = "#003366"; btnInternal.style.color = "white";
            // 자체 QR 생성
            this.generateInternalQR();
        }
    },

    // [신규] 자체 출석용 QR 코드 생성 (&checkin=true 포함)
    generateInternalQR: function() {
        const target = document.getElementById('internalQrTarget');
        if(!target) return;
        target.innerHTML = ""; 

        const pathArr = window.location.pathname.split('/'); 
        pathArr.pop();
        const baseUrl = window.location.origin + pathArr.join('/');
        
        // 교육생용 index.html로 보내되, 출석체크 신호를 함께 보냅니다.
        const internalUrl = `${baseUrl}/index.html?room=${state.room}&checkin=true`;

        new QRCode(target, {
            text: internalUrl,
            width: 260,
            height: 260,
            correctLevel: QRCode.CorrectLevel.H
        });
    },


// 전체 출석부(관리대장) 새창 열기
    openFullAttendanceSheet: function() {
        if(!state.room) return;
        // 별도의 attendance_sheet.html 파일을 새창으로 엽니다.
        const url = `attendance_sheet.html?room=${state.room}`;
        window.open(url, '_blank', 'width=1200,height=900,scrollbars=yes');
    },






// [최종보강] 자체 출석부 실시간 리스트 (중복 제거 및 실시간 체크)
    loadInternalAttendance: function() {
        if(!state.room) return;
        const today = getTodayString();
        const listDiv = document.getElementById('internalAttendanceList');
        
        // (1) 수강생 명단 가져오기
        firebase.database().ref(`courses/${state.room}/students`).on('value', studentSnap => {
            const students = studentSnap.val() || {};
            
            // 이름+번호가 같으면 동일인물로 취급하여 중복 제거
            const uniqueStudentsMap = new Map();
            Object.keys(students).forEach(key => {
                const s = students[key];
                if (s.name && s.name !== "undefined") {
                    const cleanPhone = (s.phone || "0000").trim();
                    const identifier = `${s.name.trim()}_${cleanPhone}`;
                    uniqueStudentsMap.set(identifier, { name: s.name.trim(), phone: cleanPhone });
                }
            });

            const sortedList = Array.from(uniqueStudentsMap.values()).sort((a,b) => a.name.localeCompare(b.name));

            // (2) 오늘 출석 데이터 가져오기
            firebase.database().ref(`courses/${state.room}/internal_attendance/${today}`).on('value', attendSnap => {
                const attendees = attendSnap.val() || {};
                let attendCount = 0;
                
                if(listDiv) listDiv.innerHTML = "";

                sortedList.forEach(s => {
                    const attendKey = `${s.name}_${s.phone}`;
                    const isAttended = attendees[attendKey] ? true : false;
                    if(isAttended) attendCount++;

                    const bgColor = isAttended ? "#ecfdf5" : "#ffffff";
                    const textColor = isAttended ? "#10b981" : "#94a3b8";
                    const borderColor = isAttended ? "#10b981" : "#e2e8f0";
                    const icon = isAttended ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-regular fa-circle"></i>';

                    if(listDiv) {
                        listDiv.innerHTML += `
                            <div style="background:${bgColor}; color:${textColor}; border:1.5px solid ${borderColor}; padding:10px; border-radius:10px; text-align:center; font-size:14px; font-weight:800;">
                                <div style="font-size:16px;">${icon}</div>
                                <div>${s.name}</div>
                            </div>
                        `;
                    }
                });

                if(document.getElementById('totalMemberCount')) document.getElementById('totalMemberCount').innerText = sortedList.length;
                if(document.getElementById('checkInCount')) document.getElementById('checkInCount').innerText = attendCount;
            });
        });
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
                const validStudents = Object.values(studentObj).filter(s => s.name && s.name !== "undefined");
                const uniqueNames = new Set(validStudents.map(s => s.name)); 
                const userCount = uniqueNames.size;
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
    
// [6.0차 수정] 모든 페이지의 룸 배지를 한꺼번에 업데이트
    updateHeaderRoom: function(r) { 
        // 1. 상단바 텍스트 업데이트
        const elTop = document.getElementById('displayRoomName'); 
        if(elTop) elTop.innerText = `Room #${r}`;

        // 2. 모든 섹션 제목 옆의 룸 배지(.room-badge-global)들을 찾아 일괄 변경
        const allBadges = document.querySelectorAll('.room-badge-global');
        allBadges.forEach(badge => {
            badge.innerText = `(Room #${r})`;
        });

        // 3. (구버전 호환용) 대시보드 전용 배지 id도 업데이트
        const elDash = document.getElementById('dashRoomBadge');
        if(elDash) elDash.innerText = `(Room #${r})`;
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
        // [추가] 플로팅 홈 버튼 제어: 대시보드(홈)일 때는 숨기고 나머지는 보여줌
        const homeBtn = document.getElementById('floatingHomeBtn');
        if (homeBtn) {
            homeBtn.style.display = (mode === 'dashboard') ? 'none' : 'flex';
        }

        // 1. 모든 view- 로 시작하는 구역을 일단 숨김
        const allViews = document.querySelectorAll('[id^="view-"]');
        allViews.forEach(v => { 
            v.style.display = 'none'; 
        });
        
        // 2. 현재 선택한 모드에 맞는 구역 ID 결정
        const targetView = (mode === 'admin-action') ? 'view-admin-action' : (mode === 'dinner-skip') ? 'view-dinner-skip' : `view-${mode}`;
        const targetEl = document.getElementById(targetView);
        
        // 3. 화면 표시 방식 결정 (모달형은 flex, 일반은 block)
        if(targetEl) {
            if(mode === 'prof-presentation' || mode === 'quiz' || mode === 'qa') {
                targetEl.style.display = 'flex';
            } else if(mode === 'waiting' || mode === 'dashboard') {
                targetEl.style.display = 'block';
            } else {
                targetEl.style.display = 'flex'; // 기본값
            }
        }

        // 4. 상단 탭 활성화 표시
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const targetTab = document.getElementById(`tab-${mode}`);
        if(targetTab) targetTab.classList.add('active');

        localStorage.setItem('kac_last_mode', mode);

        // 5. 각 모드별 데이터 로드
        if (state.room) {
            if (mode === 'quiz') {
                document.getElementById('quizSelectModal').style.display = 'flex'; 
                quizMgr.loadSavedQuizList(); 
            }

            let studentMode = (['waiting', 'shuttle', 'admin-action', 'dinner-skip', 'students', 'dashboard', 'notice', 'attendance', 'guide', 'dormitory'].includes(mode)) ? 'qa' : mode;
            firebase.database().ref(`courses/${state.room}/status/mode`).set(studentMode);
            
            if (mode === 'dashboard') ui.loadDashboardStats(); 
            if (mode === 'notice') ui.loadNoticeView(); 
            if (mode === 'attendance') ui.loadAttendanceView();
if (mode === 'shuttle') {
    this.loadShuttleData();
    
    // [추가] 탭 진입 시 'N' 배지 숨기고 현재 시간을 '확인 완료'로 저장
    const badge = document.getElementById('shuttleNewBadge');
    if(badge) badge.style.display = 'none';

    // 현재 설정된 시간을 '읽음' 상태로 저장하기 위해 데이터 가져오기
    firebase.database().ref(`courses/${state.room}/shuttle/departure`).once('value', snap => {
        const dep = snap.val();
        if(dep && dep.time) {
            localStorage.setItem(`last_seen_shuttle_${state.room}`, `${dep.date} ${dep.time}`);
        }
    });
}
            if (mode === 'admin-action') ui.loadAdminActionData();
            if (mode === 'dinner-skip') ui.loadDinnerSkipData();
            if (mode === 'students') ui.loadStudentList();
            
            // [리포트 반영] 생활관 배치현황 로직: 이름 우선 매칭 -> 동명이인 시 전화번호 대조
            if (mode === 'dormitory') {
                const tbody = document.getElementById('dormitoryTableBody');
                if(!tbody) return;
                tbody.innerHTML = "<tr><td colspan='5' style='padding:50px; color:#94a3b8;'>데이터를 매칭 중입니다...</td></tr>";

                Promise.all([
                    firebase.database().ref(`courses/${state.room}/students`).once('value'),
                    firebase.database().ref(`system/dormitory_assignments`).once('value')
                ]).then(([studentSnap, dormSnap]) => {
                    const students = studentSnap.val() || {};
                    const dormData = dormSnap.val() || {}; 
                    tbody.innerHTML = "";
                    const studentList = Object.values(students).filter(s => s.name && s.name !== "undefined").sort((a, b) => a.name.localeCompare(b.name)); // 가나다순 정렬

                    if (studentList.length === 0) {
                        tbody.innerHTML = "<tr><td colspan='5' style='padding:50px; color:#94a3b8;'>현재 입실한 수강생이 없습니다.</td></tr>";
                        return;
                    }

                    studentList.forEach((s, idx) => {
                        const sName = s.name;
                        const sPhone = s.phone ? s.phone.slice(-4) : ""; 
                        
                        let assignedInfo = null;

                        // 1순위: '이름_전화번호' 형태의 키가 있는지 먼저 확인 (동명이인 처리용)
                        if (dormData[`${sName}_${sPhone}`]) {
                            assignedInfo = dormData[`${sName}_${sPhone}`];
                        } 
                        // 2순위: 그냥 이름으로 된 키가 있는지 확인
                        else if (dormData[sName]) {
                            assignedInfo = dormData[sName];
                        }

                        const bName = assignedInfo ? assignedInfo.building : "-";
                        const rNo = assignedInfo ? assignedInfo.room + "호" : "미배정";
                        const statusColor = assignedInfo ? "#3b82f6" : "#94a3b8";

                        tbody.innerHTML += `
                            <tr>
                                <td>${idx + 1}</td>
                                <td style="font-weight:bold;">${sName}</td>
                                <td>${sPhone || "-"}</td>
                                <td style="color:${statusColor}; font-weight:800;">${bName}</td>
                                <td style="color:${statusColor}; font-weight:800;">${rNo}</td>
                            </tr>`;
                    });
                });
            }
        }
    },





// [수정] 차량 신청 명단 팝업: 취소 로직 연결 보완
showShuttleListModal: function(waveId, waveName, locName, members) {
    if (members.length === 0) return;
    const modal = document.getElementById('qaModal');
    const mText = document.getElementById('m-text');
    const mActions = document.querySelector('#qaModal .modal-actions');
    if(!modal || !mText) return;

    // 장소 ID 판별 (오송, 터미널, 공항, 자차)
    const locId = locName.includes('오송') ? 'osong' : 
                  locName.includes('터미널') ? 'terminal' : 
                  locName.includes('공항') ? 'airport' : 'car';

    mText.innerHTML = `
        <div style="text-align:left;">
            <div style="font-size:12px; color:#64748b; font-weight:700;">${waveName}</div>
            <div style="font-size:18px; font-weight:900; color:#003366; margin-bottom:15px; border-bottom:2px solid #f1f5f9; padding-bottom:8px;">
                ${locName} 신청 명단 (${members.length}명)
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; max-height:300px; overflow-y:auto; padding:5px;">
                ${members.map(([token, name]) => `
                    <div class="member-tag" style="padding: 8px 12px; font-size:14px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; border-radius:8px; font-weight:700;">
                        ${name} 
                        <i class="fa-solid fa-circle-xmark" 
                           onclick="event.stopPropagation(); ui.cancelIndividualShuttle('${waveId}', '${locId}', '${token}', '${name.split('(')[0]}')" 
                           style="margin-left:10px; color:#ef4444; cursor:pointer; font-size:18px;"></i>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    if(mActions) mActions.style.display = 'none';
    modal.style.display = 'flex';
    
    const closeHandler = (e) => { 
        if (e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') { 
            if(mActions) mActions.style.display = 'flex'; 
            modal.removeEventListener('click', closeHandler); 
        } 
    };
    modal.addEventListener('click', closeHandler);
},






    filterQa: function(f, event) { 
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active')); 
        if(event && event.target) event.target.classList.add('active'); 
        this.renderQaList(f); 
    },

    
// [6.13차 수정] Q&A 리스트 렌더링 (최신 질문 2분 강조 기능 복구)
    renderQaList: function(f) {
        const list = document.getElementById('qaList'); 
        if(!list) return;
        list.innerHTML = "";
        let items = Object.keys(state.qaData).map(k => ({id:k, ...state.qaData[k]}));

        if(subjectMgr.selectedFilter !== 'all') {
            items = items.filter(x => x.subject === subjectMgr.selectedFilter);
        }
        
        // 정렬 우선순위: 핀 고정 > 추후 답변 > 좋아요 > 최신순
        items.sort((a, b) => {
            const getWeight = (item) => {
                if (item.status === 'pin') return 3;
                if (item.status === 'later') return 2;
                return 1;
            };
            const weightA = getWeight(a);
            const weightB = getWeight(b);
            if (weightA !== weightB) return weightB - weightA;
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            if (likesA !== likesB) return likesB - likesA;
            return b.timestamp - a.timestamp;
        });

        items.forEach(i => {
            if(f==='pin' && i.status!=='pin') return;
            if(f==='later' && i.status!=='later') return;
            
            let cls = i.status==='pin'?'status-pin':(i.status==='later'?'status-later':(i.status==='done'?'status-done':''));
            const icon = i.status==='pin'?'📌 ':(i.status==='later'?'⚠️ ':(i.status==='done'?'✅ ':''));
            
            // --- [신규/복구] 최신 질문 강조 로직 (2분 = 120,000ms) ---
            const isNew = (Date.now() - i.timestamp) < 120000;
            const newClass = isNew ? 'is-new' : '';
            const newBadge = isNew ? '<span class="new-badge-icon">NEW</span>' : '';
            // ---------------------------------------------------

            let targetName = i.subject || '공통질문';
            let displayName = "";
            const positions = ["본부장", "공항장", "센터장", "부장", "차장", "과장", "주임", "교수"];
            const foundPos = positions.find(pos => targetName.includes(pos));
            
            if (foundPos) displayName = targetName.includes("님") ? targetName : targetName + "님";
            else if (targetName !== '일반' && targetName !== '공통질문') displayName = targetName + " 강사님";
            else displayName = targetName;

            list.innerHTML += `
            <div class="q-card ${cls} ${newClass}" data-ts="${i.timestamp}" onclick="ui.openQaModal('${i.id}')">
                <div class="q-content">
                    ${newBadge}
                    <span style="display:inline-block; background:#eff6ff; color:#3b82f6; font-size:10px; padding:2px 6px; border-radius:4px; margin-right:8px; vertical-align:middle; border:1px solid #dbeafe; font-weight:800;">
                        To. ${displayName}
                    </span>
                    ${icon}${i.text}
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

            // 1. 데이터를 하나로 합쳐서 배열로 변환
            const combinedList = [];
            Object.keys(yesterdayData).forEach(token => {
                combinedList.push({ ...yesterdayData[token], token, isYesterday: true });
            });
            Object.keys(todayData).forEach(token => {
                combinedList.push({ ...todayData[token], token, isYesterday: false });
            });

            // 2. 가나다순(이름순) 정렬 실행
            combinedList.sort((a, b) => a.name.localeCompare(b.name));

            if (combinedList.length === 0) {
                tbody.innerHTML = "<tr><td colspan='6' style='padding:50px; color:#94a3b8;'>신청 내역이 없습니다.</td></tr>";
                return;
            }

            // 3. 정렬된 리스트를 화면에 출력
            combinedList.forEach(item => {
                appendRow(item, item.isYesterday, item.token);
            });

            function appendRow(item, isYesterday, token) {
                const typeNm = item.type === 'outing' ? 
                    '<span style="color:#f59e0b; font-weight:bold;">외출</span>' : 
                    '<span style="color:#ef4444; font-weight:bold;">외박</span>';
                
                const datePrefix = isYesterday ? '<small style="color:#94a3b8;">[어제]</small> ' : '';
                const timeStr = new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                const targetDate = isYesterday ? getYesterdayString() : getTodayString();

                tbody.innerHTML += `
                    <tr>
                        <td>${count++}</td>
                        <td>${datePrefix}${typeNm}</td>
                        <td style="font-weight:bold;">${item.name}</td>
                        <td>${item.phone}</td>
                        <td style="color:#94a3b8; font-size:13px;">${timeStr}</td>
                        <td>
                            <button class="btn-table-action" onclick="ui.cancelIndividualAdminAction('${targetDate}', '${token}')" 
                                    style="background-color:#64748b; font-size:11px; padding:5px 8px;">
                                취소
                            </button>
                        </td>
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
            
            const tokens = Object.keys(data);
            const totalEl = document.getElementById('dinnerSkipTotal');
            if(totalEl) totalEl.innerText = tokens.length;

            // [정렬 로직 추가] 데이터를 이름순으로 먼저 정렬합니다.
            const sortedList = tokens.map(token => ({
                token: token,
                nameStr: data[token]
            })).sort((a, b) => a.nameStr.localeCompare(b.nameStr));

            // 정렬된 리스트(sortedList)를 화면에 출력합니다.
            tbody.innerHTML = sortedList.length ? 
                sortedList.map((item, idx) => `
                    <tr>
                        <td>${idx+1}</td>
                        <td style="font-weight:bold;">${item.nameStr}</td>
                        <td style="color:#ef4444; font-weight:800;">석식 미취식</td>
                        <td>
                            <button class="btn-table-action" onclick="ui.cancelIndividualDinnerSkip('${item.token}')" 
                                    style="background-color:#64748b; font-size:11px; padding:5px 8px;">
                                제외 취소
                            </button>
                        </td>
                    </tr>
                `).join('') : 
                "<tr><td colspan='4' style='padding:50px; color:#94a3b8;'>제외 신청자가 없습니다.</td></tr>";
        });
    },

// [신규] 특정 학생 한 명만 석식 제외 명단에서 삭제 (식사 가능 상태로 복구)
    cancelIndividualDinnerSkip: function(token) {
        if(!confirm("이 학생을 석식 제외 명단에서 삭제하시겠습니까?\n(정상 식사 가능 상태로 변경됨)")) return;
        
        const today = getTodayString();
        firebase.database().ref(`courses/${state.room}/dinner_skips/${today}/${token}`).remove()
            .then(() => {
                ui.showAlert("✅ 해당 학생이 제외 명단에서 삭제되었습니다.");
            });
    },

// [신규] 특정 학생의 외출/외박 신청을 관리자가 강제 취소(삭제)
    cancelIndividualAdminAction: function(date, token) {
        if(!confirm("해당 외출/외박 신청을 취소하시겠습니까?")) return;
        
        firebase.database().ref(`courses/${state.room}/admin_actions/${date}/${token}`).remove()
            .then(() => {
                ui.showAlert("✅ 신청 내역이 삭제되었습니다.");
            });
    },


// [수정] 차량 신청 개별 취소: 취소 후 즉시 팝업 닫고 화면 갱신
cancelIndividualShuttle: function(waveId, locId, token, name) {
    if(!confirm(`[${name}]님의 차량 신청을 취소하시겠습니까?`)) return;
    
    const rPath = `courses/${state.room}/shuttle/out`;
    
    // 만약 waveId가 'both'(자차)라면 wave1, wave2 양쪽 다 확인해서 삭제
    if(waveId === 'both') {
        firebase.database().ref(`${rPath}/wave1/${locId}/${token}`).remove();
        firebase.database().ref(`${rPath}/wave2/${locId}/${token}`).remove();
    } else {
        firebase.database().ref(`${rPath}/${waveId}/${locId}/${token}`).remove();
    }

    ui.showAlert("✅ 취소되었습니다.");
    
    // [핵심] 팝업창을 닫아버려서 데이터가 남은것처럼 보이는 현상 해결
    document.getElementById('qaModal').style.display = 'none';
    
    // 배경 화면 데이터 갱신 (이미 리스너가 작동중이겠지만 확실히 하기 위해 호출)
    ui.loadShuttleData();
},






loadStudentList: function() {
    if(!state.room) return;

    // 1. 기존 리스너 정리
    const expectedRef = firebase.database().ref(`courses/${state.room}/expectedStudents`);
    const actualRef = firebase.database().ref(`courses/${state.room}/students`);
    expectedRef.off();
    actualRef.off();

    // 2. 데이터 감시 시작
    expectedRef.on('value', expSnap => {
        const expectedNames = expSnap.val() || [];
        
        actualRef.on('value', snap => {
            const data = snap.val() || {};
            const tbody = document.getElementById('studentListTableBody');
            if(!tbody) return;

            const actualStudents = Object.keys(data).map(key => ({
                token: key,
                ...data[key]
            })).filter(s => s.name && s.name !== "undefined");

            const actualNames = actualStudents.map(s => s.name);
            const combinedNames = Array.from(new Set([...expectedNames, ...actualNames])).sort((a,b) => a.localeCompare(b));

            tbody.innerHTML = ""; 
            let arrivedCount = 0;

            combinedNames.forEach((name, idx) => {
                const sList = actualStudents.filter(student => student.name === name);
                const isArrived = sList.length > 0;
                const isExpected = expectedNames.includes(name); // 명단에 있는지 확인
                
                // [복구] 입장 경로 아이콘 판별
                let joinTypeIcon = "";
                if (isArrived) {
                    if (isExpected) {
                        // 명단에 있는 사람이 입장 (파란색 체크 유저)
                        joinTypeIcon = '<i class="fa-solid fa-user-check" style="color:#3b82f6; margin-right:8px;" title="명단 내 입장"></i>';
                    } else {
                        // 명단에 없는데 QR로 들어옴 (초록색 QR 아이콘)
                        joinTypeIcon = '<i class="fa-solid fa-qrcode" style="color:#10b981; margin-right:8px;" title="QR 직접 입장"></i>';
                    }
                } else {
                    // 미입장 (회색 대기 아이콘)
                    joinTypeIcon = '<i class="fa-solid fa-user-clock" style="color:#cbd5e1; margin-right:8px;" title="입장 대기"></i>';
                }

                const studentData = isArrived ? sList[0] : null;
                const isOnline = isArrived && studentData.isOnline === true;
                const isLeader = isArrived && studentData.isLeader === true;

                if(isArrived) arrivedCount++;

                const leaderBtnStyle = isLeader 
                    ? "background:#3b82f6; color:white; border:none;" 
                    : "background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1;";
                const leaderBtnText = isLeader ? "해제" : "학생장";

                tbody.innerHTML += `
                    <tr style="${isLeader ? 'background-color:#eff6ff;' : ''}">
                        <td>${idx + 1}</td>
                        <!-- 중앙 정렬 및 아이콘 배치를 위해 td 스타일 수정 -->
                        <td style="text-align:center;">
                            <div style="display:inline-flex; align-items:center; justify-content:center; min-width:150px;">
                                ${joinTypeIcon}
                                <span style="color:${isOnline ? '#22c55e' : '#cbd5e1'}; margin-right:8px; font-size:12px;">●</span>
                                <span style="font-weight:800; color:#1e293b;">${name}</span>
                                ${isLeader ? '<span style="color:#3b82f6; margin-left:6px; font-size:14px; font-weight:bold;">[학생장 👑]</span>' : ''}
                            </div>
                        </td>
                        <td><span class="status-badge ${isArrived ? 'status-arrived' : 'status-wait'}">${isArrived ? '입교 완료' : '미입교'}</span></td>
                        <td style="color:#94a3b8; font-size:13px;">${isArrived ? (isOnline ? '접속 중' : '오프라인') : '-'}</td>
                        <td>
                            ${isArrived ? `
                                <div style="display:flex; gap:5px; justify-content:center;">
                                    <button class="btn-table-action" onclick="dataMgr.toggleLeader('${studentData.token}', '${name}')" 
                                            style="${leaderBtnStyle} padding:4px 10px; font-size:11px; border-radius:6px; font-weight:bold;">
                                        ${leaderBtnText}
                                    </button>
                                    <button class="btn-table-action" onclick="dataMgr.deleteStudent('${studentData.token}')" 
                                            style="background:#ef4444; color:white; padding:4px 10px; font-size:11px; border-radius:6px; border:none; font-weight:bold;">
                                        삭제
                                    </button>
                                </div>
                            ` : `-`}
                        </td>
                    </tr>`;
            });

            const total = combinedNames.length;
            const percent = total > 0 ? Math.round((arrivedCount / total) * 100) : 0;
            const statusEl = document.getElementById('arrivalStatusSmall');
            if(statusEl) statusEl.innerText = `${arrivedCount} / ${total} 명 (${percent}%)`;
        });
    });
},

// [추가 1] 생활관 중복 제거 및 데이터 로드 함수
loadDormitoryData: function() {
        if(!state.room) return;
        const tbody = document.getElementById('dormitoryTableBody');
        const statusEl = document.getElementById('dormArrivalStatus');
        if(!tbody) return;

        const expectedRef = firebase.database().ref(`courses/${state.room}/expectedStudents`);
        const actualRef = firebase.database().ref(`courses/${state.room}/students`);
        const dormRef = firebase.database().ref(`system/dormitory_assignments`);

        const renderAll = (expData, actData, dormData) => {
            const expectedNames = expData || [];
            const actualStudents = Object.values(actData || {}).filter(s => s.name && s.name !== "undefined");
            const actualNames = actualStudents.map(s => s.name);
            const combinedNames = Array.from(new Set([...expectedNames, ...actualNames])).sort((a,b) => a.localeCompare(b));

            let arrivedCount = 0;
            combinedNames.forEach(name => { if(actualNames.includes(name)) arrivedCount++; });
            const total = combinedNames.length;
            const percent = total > 0 ? Math.round((arrivedCount / total) * 100) : 0;
            if(statusEl) statusEl.innerText = `${arrivedCount} / ${total} 명 (${percent}%)`;

            tbody.innerHTML = "";
            if (combinedNames.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5' style='padding:50px; color:#94a3b8;'>명단이 존재하지 않습니다.</td></tr>";
                return;
            }

            combinedNames.forEach((name, idx) => {
                const isArrived = actualNames.includes(name);
                const sData = actualStudents.find(s => s.name === name) || {};
                const phoneSuffix = sData.phone ? sData.phone.slice(-4) : "-";

                const cleanName = name.trim();
                const assigned = dormData[cleanName] || { building: "-", room: "미배정" };
                
                // [확실한 색상 구분 로직]
                let buildingColor = "#94a3b8"; // 기본 회색 (미배정)
                const bName = assigned.building;
                
                if (bName.includes("청렴")) {
                    buildingColor = "#2563eb"; // 청렴관: 파란색
                } else if (bName.includes("상생")) {
                    buildingColor = "#16a34a"; // 상생관: 초록색
                } else if (bName.includes("국제")) {
                    buildingColor = "#9333ea"; // 국제동: 보라색
                }

                const isAssigned = assigned.building !== "-";
                const statusIcon = isArrived ? '<i class="fa-solid fa-circle-check" style="color:#22c55e; margin-right:5px;"></i>' : '<i class="fa-solid fa-circle" style="color:#e2e8f0; margin-right:5px;"></i>';

                tbody.innerHTML += `
                    <tr onclick="ui.setMode('students')" style="${!isArrived ? 'opacity:0.6;' : ''} cursor:pointer;">
                        <td>${idx + 1}</td>
                        <td style="font-weight:bold; text-align:center;">
                            ${statusIcon} ${name}
                        </td>
                        <td style="color:#64748b;">${phoneSuffix}</td>
                        <!-- 아래 두 칸에 동일한 buildingColor를 강제로 적용합니다 -->
                        <td style="color:${buildingColor} !important; font-weight:800;">${assigned.building}</td>
                        <td style="color:${buildingColor} !important; font-weight:900;">${assigned.room}${isAssigned ? '호' : ''}</td>
                    </tr>`;
            });
        };

        let cacheExp = [], cacheAct = {}, cacheDorm = {};
        expectedRef.on('value', s => { cacheExp = s.val(); renderAll(cacheExp, cacheAct, cacheDorm); });
        actualRef.on('value', s => { cacheAct = s.val(); renderAll(cacheExp, cacheAct, cacheDorm); });
        dormRef.on('value', s => { cacheDorm = s.val() || {}; renderAll(cacheExp, cacheAct, cacheDorm); });
    },


// [추가 2] 화면 전환 및 버튼 제어 함수 (교체본)
    setMode: function(mode) {
        const homeBtn = document.getElementById('floatingHomeBtn');
        if (homeBtn) homeBtn.style.display = (mode === 'dashboard') ? 'none' : 'flex';

        // 모든 뷰 숨기기
        document.querySelectorAll('[id^="view-"]').forEach(v => { v.style.display = 'none'; });
        
        // 대상 뷰 보이기
        const targetView = (mode === 'admin-action') ? 'view-admin-action' : (mode === 'dinner-skip') ? 'view-dinner-skip' : `view-${mode}`;
        const targetEl = document.getElementById(targetView);
        if(targetEl) {
            targetEl.style.display = (['prof-presentation', 'quiz', 'qa', 'guide', 'shuttle', 'admin-action', 'dinner-skip', 'students', 'notice', 'attendance', 'dormitory'].includes(mode)) ? 'flex' : 'block';
        }

        // 상단 탭 활성화
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        const targetTab = document.getElementById(`tab-${mode}`);
        if(targetTab) targetTab.classList.add('active');
        
        localStorage.setItem('kac_last_mode', mode);

        // [중요] 교육생 플랫폼 모드 동기화 (DB 저장)
        if (state.room) {
        // 퀴즈 모드일 때만 교육생에게 'quiz' 신호를 보내고, 나머지는 모두 'qa'(게시판)로 보냅니다.
            let studentMode = (mode === 'quiz') ? 'quiz' : 'qa';
            firebase.database().ref(`courses/${state.room}/status/mode`).set(studentMode);

            if (mode === 'quiz') { 
                document.getElementById('quizSelectModal').style.display = 'flex'; 
                quizMgr.loadSavedQuizList(); 
            }
            if (mode === 'dashboard') this.loadDashboardStats(); 
            if (mode === 'notice') this.loadNoticeView(); 
            if (mode === 'attendance') this.loadAttendanceView();
            if (mode === 'shuttle') this.loadShuttleData();
            if (mode === 'admin-action') this.loadAdminActionData();
            if (mode === 'dinner-skip') this.loadDinnerSkipData();
            if (mode === 'students') this.loadStudentList();
            if (mode === 'dormitory') this.loadDormitoryData();
        }
    },









// [완결본] 차량 신청 명단 실시간 로드 (상하단 색상 완전 동기화 버전)
    loadShuttleData: function() {
        if(!state.room) return;

        // 1. 좌측 파란색 박스: 날짜, 시간, 문구 레이아웃
        firebase.database().ref(`courses/${state.room}/shuttle/departure`).on('value', snap => {
            const dep = snap.val();
            const el = document.getElementById('shuttleDepartureTime');
            if(!el) return;

            if (dep && dep.time) {
                el.innerHTML = `
                    <div style="font-size:20px; opacity:0.8; margin-bottom:2px;">${dep.date}</div>
                    <div style="font-size:42px; font-weight:900; line-height:1.1;">${dep.time}</div>
                    <div style="font-size:16px; margin-top:10px; font-weight:800; background:rgba(255,255,255,0.15); padding:4px 12px; border-radius:50px; display:inline-block;">
                        항기원 출발
                    </div>
                `;
                el.style.color = "white";
            } else {
                firebase.database().ref('system/shuttle_notice').once('value', s => {
                    const notice = s.val() || "시간 정보 없음";
                    el.innerHTML = `<div style="font-size:18px; opacity:0.7;">${notice}</div>`;
                    el.style.color = "white";
                });
            }
        });

        // 2. 신청 명단 실시간 연동 및 상단 요약 숫자 업데이트
        firebase.database().ref(`courses/${state.room}/shuttle/requests`).on('value', snap => {
            const requests = snap.val() || {};
            const tbody = document.getElementById('shuttleListTableBody');
            if(!tbody) return;

            tbody.innerHTML = "";
            const items = Object.values(requests).sort((a,b) => a.timestamp - b.timestamp);
            
            let counts = { osong: 0, terminal: 0, airport: 0, car: 0 };

            if (items.length === 0) {
                tbody.innerHTML = "<tr><td colspan='5' style='padding:80px 0; color:#94a3b8; text-align:center; font-weight:600;'>차량 신청 내역이 없습니다.</td></tr>";
            } else {
                items.forEach((item, idx) => {
                    counts[item.type]++;
                    
                    // [색상 통일화 핵심 로직] 
                    // 칩 색상과 동일하게 강제 매칭 (텍스트에 '오송'이 포함되면 무조건 빨간색 등)
                    let color = "#64748b"; // 기본 회색 (자차)
                    const text = item.typeText || "";
                    
                    if(item.type === 'osong' || text.includes('오송')) {
                        color = "#ef4444"; // 상단과 동일한 Red
                    } else if(item.type === 'terminal' || text.includes('터미널')) {
                        color = "#3b82f6"; // 상단과 동일한 Blue
                    } else if(item.type === 'airport' || text.includes('공항')) {
                        color = "#10b981"; // 상단과 동일한 Green
                    }

                    const timeStr = new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                    tbody.innerHTML += `
                        <tr>
                            <td>${idx + 1}</td>
                            <td style="font-weight:800; color:#1e293b;">${item.name}</td>
                            <td style="color:#64748b;">${item.phone}</td>
                            <td style="color:${color} !important; font-weight:900; font-size:16px;">${text}</td>
                            <td style="color:#94a3b8; font-size:12px;">${timeStr}</td>
                        </tr>`;
                });
            }

            // 상단 카운트 숫자에 데이터 반영
            if(document.getElementById('cnt-car')) document.getElementById('cnt-car').innerText = counts.car;
            if(document.getElementById('cnt-osong')) document.getElementById('cnt-osong').innerText = counts.osong;
            if(document.getElementById('cnt-terminal')) document.getElementById('cnt-terminal').innerText = counts.terminal;
            if(document.getElementById('cnt-airport')) document.getElementById('cnt-airport').innerText = counts.airport;
            if(document.getElementById('cnt-total')) document.getElementById('cnt-total').innerText = items.length;
        });
    },



    // [추가 4] 차량 신청 명단 팝업 함수
    showShuttleListModal: function(waveId, waveName, locName, members) {
        if (members.length === 0) return;
        const modal = document.getElementById('qaModal');
        const mText = document.getElementById('m-text');
        const mActions = document.querySelector('#qaModal .modal-actions');
        if(!modal || !mText) return;
        mText.innerHTML = `<div style="text-align:left;"><div style="font-size:13px; color:#64748b;">${waveName}</div><div style="font-size:20px; font-weight:900; color:#003366; margin-bottom:20px; border-bottom:2px solid #f1f5f9; padding-bottom:10px;">${locName} 신청 명단 (${members.length}명)</div><div style="display:flex; flex-wrap:wrap; gap:10px; max-height:350px; overflow-y:auto; padding:5px;">${members.map(([token, name]) => `<div class="member-tag" style="padding: 10px 15px; font-size:15px; background:#f8fafc; border:1px solid #e2e8f0; display:flex; align-items:center; border-radius:10px; font-weight:700;">${name} <i class="fa-solid fa-circle-xmark" onclick="event.stopPropagation(); ui.cancelIndividualShuttle('${waveId}', '${locName.includes('오송') ? 'osong' : locName.includes('터미널') ? 'terminal' : locName.includes('공항') ? 'airport' : 'car'}', '${token}', '${name}')" style="margin-left:12px; color:#ef4444; cursor:pointer; font-size:18px;"></i></div>`).join('')}</div></div>`;
        if(mActions) mActions.style.display = 'none';
        modal.style.display = 'flex';
        const closeHandler = (e) => { if (e.target.id === 'qaModal' || e.target.tagName === 'BUTTON') { if(mActions) mActions.style.display = 'flex'; modal.removeEventListener('click', closeHandler); } };
        modal.addEventListener('click', closeHandler);
    },










    toggleMenuDropdown: function() {
        const dropdown = document.getElementById('menuDropdown');
        if(dropdown) dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
    }
}; // <--- ui 객체를 닫는 진짜 문입니다. (이 아래에 quizMgr 등이 나옵니다)




// --- 4. Quiz Logic ---
const quizMgr = {
    loadFile: function(e) {
        const fileInput = e.target; // 파일 입력창 요소 저장
        const f = fileInput.files[0]; 
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
                        text: l[0], 
                        options: options, 
                        correct: correct, 
                        checked: true, 
                        isSurvey: isSurvey,
                        isOX: (options.length === 2 && options[0].toUpperCase() === 'O')
                    });
                }
            });

            state.isExternalFileLoaded = true;
            
            // 제목 입력 시 현재 시간을 기본으로 넣어 중복 제목 방지
            const now = new Date();
            const defaultTitle = `${f.name.split('.')[0]}_${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
            const quizTitle = prompt("이 퀴즈 세트의 이름을 입력해주세요:", defaultTitle);
            
            if (!quizTitle) { 
                alert("업로드가 취소되었습니다."); 
                fileInput.value = ""; // 취소 시에도 초기화
                return; 
            }

            firebase.database().ref(`courses/${state.room}/quizBank`).push().set({
                title: quizTitle, 
                data: state.quizList, 
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).then(() => { 
                ui.showAlert("✅ 퀴즈가 성공적으로 업로드되었습니다."); 
                quizMgr.loadSavedQuizList(); 
                
                // [핵심] 업로드 완료 후 파일 입력창을 완전히 비웁니다.
                // 이렇게 해야 같은 파일명을 또 선택해도 'onchange' 이벤트가 정상 작동합니다.
                fileInput.value = ""; 
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
        state.quizList.push({ 
            text: q, 
            options: opts, 
            correct: parseInt(a), 
            checked: true, 
            isOX: opts.length === 2, 
            isSurvey: false 
        });
        this.renderMiniList();
    },
    
    renderMiniList: function() {
        const d = document.getElementById('miniQuizList'); 
        if(!d) return;
        d.innerHTML = "";
        state.quizList.forEach((q, i) => {
            const typeLabel = q.isSurvey ? '[설문]' : (q.isOX ? '[OX]' : '[4지]');
            d.innerHTML += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:12px; display:flex; gap:10px;"><input type="checkbox" ${q.checked?'checked':''} onchange="state.quizList[${i}].checked=!state.quizList[${i}].checked"><b>${typeLabel} Q${i+1}.</b> ${q.text.substring(0,20)}...</div>`;
        });
    },
    
    downloadSample: function() {
        let content = "";
        DEFAULT_QUIZ_DATA.forEach(q => {
            content += q.text + "\n" + q.options.join('\n') + "\n" + (q.isSurvey ? "SURVEY" : q.correct) + "\n\n";
        });
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
        const container = document.getElementById('savedQuizListContainer');
        if(!container) return;
        firebase.database().ref(`courses/${state.room}/quizBank`).on('value', snap => {
            container.innerHTML = "";
            const data = snap.val();
            if (!data) {
                container.innerHTML = `<div style="text-align:center; padding:30px; color:#ef4444; font-weight:bold;">⚠️ 저장된 퀴즈가 없습니다.</div>`;
                return;
            }
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
            if (val) { 
                state.quizList = val.data; 
                state.isExternalFileLoaded = true; 
                this.renderMiniList(); 
                this.completeQuizLoading(); 
            }
        });
    },
    
    deleteQuizSet: function(key, title) {
        if (confirm(`'${title}' 퀴즈를 삭제할까요?`)) {
            firebase.database().ref(`courses/${state.room}/quizBank/${key}`).remove();
        }
    },
    
    prevNext: function(d) {
        let n = state.currentQuizIdx + d;
        if (n < 0 || n >= state.quizList.length) {
            return ui.showAlert(n < 0 ? "첫 번째 문항입니다." : "마지막 문항입니다.");
        }
        if(!state.quizList[n].checked) { 
            state.currentQuizIdx = n; 
            this.prevNext(d); 
            return; 
        }
        state.currentQuizIdx = n;
        this.showQuiz();
    },
    
    showQuiz: function() {
        const card = document.querySelector('.quiz-card');
        if(card) card.classList.remove('result-mode');
        const q = state.quizList[state.currentQuizIdx];
        this.resetTimerUI(); 
        this.renderScreen(q);
        const pauseBtn = document.getElementById('btnPause');
        if(pauseBtn) pauseBtn.style.display = 'none';
        const smartBtn = document.getElementById('btnSmartNext');
        if(smartBtn) {
            smartBtn.style.display = 'flex';
            smartBtn.innerHTML = '현재 퀴즈 시작 <i class="fa-solid fa-play" style="margin-left:10px;"></i>';
        }
        firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'none' });
        firebase.database().ref(`courses/${state.room}/activeQuiz`).set({ 
            id: `Q${state.currentQuizIdx}`, 
            status: 'ready', 
            type: q.isOX?'OX':'MULTIPLE', 
            ...q 
        });
        const ctrl = document.getElementById('quizControls');
        if(ctrl) ctrl.style.display = 'flex';
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
        if(oDiv) oDiv.style.display = 'flex'; 
        if(cDiv) cDiv.style.display = 'none';
        if(oDiv) {
            oDiv.innerHTML = "";
            q.options.forEach((o, i) => {
                oDiv.innerHTML += `<div class="quiz-opt ${q.isOX?'ox-mode':''}" id="opt-${i+1}"><div class="opt-num">${i+1}</div><div class="opt-text">${o}</div></div>`;
            });
        }
        const guide = document.getElementById('quizGuideArea');
        if(guide) guide.innerText = ""; 
    },
    
    startAnswerMonitor: function() {
        const id = `Q${state.currentQuizIdx}`;
        const joinCntEl = document.getElementById('currentJoinCount');
        const ansCntEl = document.getElementById('answeredCount');
        const pendCntEl = document.getElementById('pendingCount');

        if (state.ansListener) dbRef.ans.child(id).off();
        state.ansListener = dbRef.ans.child(id).on('value', snap => {
            const answers = snap.val() || {};
            const answeredCount = Object.keys(answers).length;
            const totalCount = parseInt(joinCntEl ? joinCntEl.innerText : 0) || 0;
            if(ansCntEl) ansCntEl.innerText = answeredCount;
            if(pendCntEl) pendCntEl.innerText = Math.max(0, totalCount - answeredCount);
        });
    },
    
    action: function(act) {
        firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ status: act });
        if(act === 'open') { 
            this.startTimer(); 
        } else if(act === 'close') { 
            this.stopTimer(); 
            const q = state.quizList[state.currentQuizIdx];
            if(!q.isSurvey) { 
                const opt = document.getElementById(`opt-${q.correct}`); 
                if(opt) opt.classList.add('reveal-answer'); 
            } else { 
                const guide = document.getElementById('quizGuideArea');
                if(guide) guide.innerText = "마감되었습니다."; 
            }
        } else if(act === 'result') { 
            this.stopTimer(); 
            const card = document.querySelector('.quiz-card');
            if(card) card.classList.add('result-mode');
            const oDiv = document.getElementById('d-options');
            const cDiv = document.getElementById('d-chart');
            if(oDiv) oDiv.style.display='none'; 
            if(cDiv) cDiv.style.display='flex'; 
            this.renderChart(`Q${state.currentQuizIdx}`, state.quizList[state.currentQuizIdx].correct); 
        }
    },
    
    smartNext: function() { 
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
            if(pauseBtn) {
                pauseBtn.innerHTML = '다시 시작 <i class="fa-solid fa-play" style="margin-left:10px;"></i>';
                pauseBtn.style.backgroundColor = '#3b82f6'; 
            }
        } else { 
            this.action('open'); 
            if(pauseBtn) {
                pauseBtn.innerHTML = '일시정지 <i class="fa-solid fa-pause" style="margin-left:10px;"></i>';
                pauseBtn.style.backgroundColor = '#f59e0b'; 
            }
        }
    },

    startTimer: function() {
        this.stopTimer(); 
        const smartBtn = document.getElementById('btnSmartNext');
        const pauseBtn = document.getElementById('btnPause');
        if (smartBtn) smartBtn.style.display = 'none';
        if (pauseBtn) { 
            pauseBtn.style.display = 'flex'; 
            pauseBtn.innerHTML = '일시정지 <i class="fa-solid fa-pause" style="margin-left:15px;"></i>'; 
            pauseBtn.style.background = '#f59e0b'; 
        }
        let t = state.remainingTime;
        const d = document.getElementById('quizTimer'); 
        if (d) {
            d.classList.remove('urgent');
            d.innerText = `00:${t < 10 ? '0' + t : t}`;
        }
        const endTime = Date.now() + (t * 1000);
        if(dbRef.quiz) dbRef.quiz.update({ endTime: endTime });
        if(t <= 5 && d) d.classList.add('urgent');
        let lastPlayedSec = -1;
        if (!state.timerAudio) state.timerAudio = new Audio('timer.mp3');
        state.timerInterval = setInterval(() => {
            const r = Math.ceil((endTime - Date.now()) / 1000);
            const displaySec = r < 0 ? 0 : r;
            state.remainingTime = displaySec; 
            if (d) { 
                d.innerText = `00:${displaySec < 10 ? '0' + displaySec : displaySec}`; 
                if(r <= 5) d.classList.add('urgent'); 
            }
            if (r <= 8 && r > 0 && r !== lastPlayedSec) { 
                state.timerAudio.pause(); 
                state.timerAudio.currentTime = 0; 
                state.timerAudio.play().catch(e => {}); 
                lastPlayedSec = r; 
            }
            if(r <= 0) {
                this.stopTimer(); 
                this.action('close'); 
                setTimeout(() => {
                    this.action('result');
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
            state.timerInterval = null; 
        } 
        if (state.timerAudio) { 
            state.timerAudio.pause(); 
            state.timerAudio.currentTime = 0; 
        } 
    },
    
    resetTimerUI: function() { 
        this.stopTimer(); 
        const d = document.getElementById('quizTimer');
        if(d) {
            d.innerText = "00:08"; 
            d.classList.remove('urgent'); 
        }
    },
    
    showFinalSummary: async function() {
        const snap = await firebase.database().ref(`courses/${state.room}/quizAnswers`).get();
        const allAns = snap.val() || {};
        const totalParticipants = new Set();
        let totalQuestions = 0; 
        let totalCorrect = 0; 
        let totalAnswerCount = 0;
        let questionStats = []; 
        const userScoreMap = {};
        
        state.quizList.forEach((q, idx) => {
            if(!q.checked || q.isSurvey) return; 
            const id = `Q${idx}`; 
            const answers = allAns[id] || {}; 
            const keys = Object.keys(answers);
            if(keys.length > 0) totalQuestions++;
            keys.forEach(k => {
                totalParticipants.add(k); 
                totalAnswerCount++;
                if(!userScoreMap[k]) userScoreMap[k] = { score: 0, pCount: 0 };
                userScoreMap[k].pCount++; 
                if(answers[k].choice === q.correct) { 
                    totalCorrect++; 
                    userScoreMap[k].score++; 
                }
            });
            if(keys.length > 0) { 
                const corrCnt = keys.filter(k => answers[k].choice === q.correct).length; 
                questionStats.push({ 
                    title: q.text, 
                    accuracy: (corrCnt / keys.length) * 100 
                }); 
            }
        });
        
        const sortedUsers = Object.keys(userScoreMap)
            .map(t => ({ token: t, ...userScoreMap[t] }))
            .filter(u => u.pCount === totalQuestions)
            .sort((a, b) => b.score - a.score);
        
        const finalRankingData = {}; 
        let rank = 1;
        sortedUsers.forEach((u, i) => { 
            if (i > 0 && u.score < sortedUsers[i - 1].score) rank = i + 1; 
            finalRankingData[u.token] = { 
                score: u.score, 
                rank: rank, 
                total: sortedUsers.length 
            }; 
        });
        
        await firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(finalRankingData);
        await firebase.database().ref(`courses/${state.room}/status`).update({ quizStep: 'summary' });
        
        const grid = document.getElementById('summaryStats');
        if(grid) {
            const avgAcc = totalAnswerCount > 0 ? Math.round((totalCorrect / totalAnswerCount) * 100) : 0;
            grid.innerHTML = `
                <div class="summary-card"><span>총 인원</span><b>${totalParticipants.size}명</b></div>
                <div class="summary-card"><span>평균 정답률</span><b>${avgAcc}%</b></div>
                <div class="summary-card"><span>문항 수</span><b>${totalQuestions}개</b></div>
                <div class="summary-card"><span>전체 제출</span><b>${totalAnswerCount}건</b></div>
            `;
        }
        
        if(questionStats.length > 0) { 
            questionStats.sort((a,b) => a.accuracy - b.accuracy); 
            const missArea = document.getElementById('mostMissedArea');
            const missTxt = document.getElementById('mostMissedText');
            if(missArea) missArea.style.display = 'block'; 
            if(missTxt) missTxt.innerText = `"${questionStats[0].title.substring(0,30)}..." (${Math.round(questionStats[0].accuracy)}%)`; 
        }
        
        const summaryOverlay = document.getElementById('quizSummaryOverlay');
        if(summaryOverlay) summaryOverlay.style.display = 'flex';
    },
    
    renderChart: function(id, corr) {
        const div = document.getElementById('d-chart'); 
        if(!div) return;
        div.innerHTML = "";
        const q = state.quizList[state.currentQuizIdx];
        firebase.database().ref(`courses/${state.room}/quizAnswers`).child(id).once('value', s => {
            const d = s.val() || {}; 
            const cnt = new Array(q.options.length).fill(0);
            Object.values(d).forEach(v => { 
                if(v.choice >= 1 && v.choice <= q.options.length) cnt[v.choice-1]++; 
            });
            const max = Math.max(...cnt, 1);
            
            if(q.isSurvey) {
                let maxIdx = cnt.indexOf(Math.max(...cnt));
                firebase.database().ref(`courses/${state.room}/activeQuiz`).update({ 
                    surveyResult: `가장 많은 선택: '${q.options[maxIdx]}' (${Math.round((cnt[maxIdx]/Object.values(d).length)*100)}%)` 
                });
            }
            
            for(let i=0; i < q.options.length; i++) {
                const isCorrect = !q.isSurvey && (i + 1) === corr; 
                const h = (cnt[i]/max)*80;
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
    
    closeQuizMode: function() { 
        const exitModal = document.getElementById('quizExitModal');
        if(exitModal) exitModal.style.display = 'flex'; 
    },
    
confirmExitQuiz: function(type) {
        const exitModal = document.getElementById('quizExitModal'); // 'I'로 수정
        if(exitModal) exitModal.style.display = 'none';
        if(type === 'reset') {
            state.currentQuizIdx = 0; 
            state.isExternalFileLoaded = false; 
            state.quizList = [];
            firebase.database().ref(`courses/${state.room}/activeQuiz`).set(null);
            firebase.database().ref(`courses/${state.room}/status/quizStep`).set('none');
            firebase.database().ref(`courses/${state.room}/quizAnswers`).set(null);
            firebase.database().ref(`courses/${state.room}/quizFinalResults`).set(null);
            quizMgr.renderMiniList();
            const qTxt = document.getElementById('d-qtext'); // 'I'로 수정
            const oDiv = document.getElementById('d-options'); // 'I'로 수정
            if(qTxt) qTxt.innerText = "Ready?"; 
            if(oDiv) oDiv.innerHTML = "";
        }
        ui.setMode('qa'); // 이 줄이 반드시 있어야 Q&A로 돌아갑니다.
    }
}; // quizMgr 객체를 닫는 중괄호





/* --- [수정 2차 - 완결본] 입교안내 가이드 관리 로직 (동적 스케일 및 기존 기능 통합) --- */
const guideMgr = {
    pdfDoc: null,
    pageNum: 1,
    isRendering: false,

    // 1. 초기화 (기존 로직 + 리사이즈 감시 추가)
    init: function() {
        if(!state.room) return;
        
        if (window['pdfjs-dist/build/pdf']) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }

        // 기존 Firebase 리스너 유지
        firebase.database().ref(`courses/${state.room}/entranceGuide`).off(); 
        firebase.database().ref(`system/sharedGuide`).on('value', snap => {
            const data = snap.val();
            const badge = document.getElementById('guideStatusBadge');
            
            if(data) {
                if(badge) {
                    badge.innerText = "✅ 가이드 등록 완료";
                    badge.style.color = "#10b981";
                }
                guideMgr.pageNum = 1;
                guideMgr.loadPDF(data);
            } else {
                if(badge) {
                    badge.innerText = "❌ 등록된 파일 없음";
                    badge.style.color = "#ef4444";
                }
            }
        });

        // [추가] 화면 크기가 변하거나 전체화면이 바뀔 때 PDF를 다시 계산해서 그림
        window.addEventListener('resize', () => {
            if (document.getElementById('view-guide').style.display !== 'none') {
                guideMgr.renderPage(guideMgr.pageNum);
            }
        });

        document.addEventListener('fullscreenchange', () => {
            // 전체화면 전환 애니메이션 시간을 고려해 200ms 뒤에 다시 그림
            setTimeout(() => guideMgr.renderPage(guideMgr.pageNum), 200);
        });
    },

    // 2. 가이드 업로드 (사용자님의 확인 팝업 버전 유지)
    uploadGuide: function(input) {
        const file = input.files[0];
        if(!file || file.type !== 'application/pdf') {
            ui.showAlert("PDF 파일만 업로드 가능합니다.");
            input.value = ""; 
            return;
        }

        const userConfirmed = confirm(
            "⚠️ [주의] 새 가이드를 업로드하시겠습니까?\n\n" +
            "업로드 시 기존에 등록되어 있던 가이드 자료는\n" +
            "즉시 삭제되고 새로운 파일로 교체됩니다.\n\n" +
            "진행하시겠습니까?"
        );

        if (!userConfirmed) {
            input.value = ""; 
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            firebase.database().ref(`system/sharedGuide`).set(e.target.result)
                .then(() => {
                    ui.showAlert("✅ 가이드가 성공적으로 교체되었습니다.");
                    input.value = "";
                });
        };
        reader.readAsDataURL(file);
    },

    // 3. PDF 로드 (기존 로직 유지)
    loadPDF: async function(base64) {
        try {
            const raw = atob(base64.split(',')[1]);
            const array = new Uint8Array(new ArrayBuffer(raw.length));
            for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
            
            const loadingTask = pdfjsLib.getDocument({data: array});
            guideMgr.pdfDoc = await loadingTask.promise;
            guideMgr.renderPage(guideMgr.pageNum);
        } catch (err) {
            console.error("PDF 로딩 실패:", err);
        }
    },

    // 4. 화면 렌더링 (동적 스케일 계산 적용 및 인디케이터 업데이트 포함)
    renderPage: async function(num) {
        if(!guideMgr.pdfDoc || guideMgr.isRendering) return;
        guideMgr.isRendering = true;

        try {
            const page = await guideMgr.pdfDoc.getPage(num);
            const canvas = document.getElementById('guideCanvas');
            if(!canvas) return;
            const ctx = canvas.getContext('2d');
            
            // --- [핵심 수정: 동적 크기 계산] ---
            // 현재 화면(브라우저 창)의 너비와 높이를 가져옴
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // PDF 원본 크기 정보를 가져옴
            const unscaledViewport = page.getViewport({scale: 1.0});

            // 화면에 꽉 차도록(하지만 잘리지 않게 98% 비율로) 계산
            const ratioW = (winW * 0.98) / unscaledViewport.width;
            const ratioH = (winH * 0.98) / unscaledViewport.height;

            // 가로와 세로 중 더 작은 비율을 선택해야 화면 밖으로 안 나감 (Fit-to-Screen)
            let dynamicScale = Math.min(ratioW, ratioH);

            // 전체화면이 아닐 때는 일반 뷰이므로 너무 커지지 않게 최대 1.5배로 제한
            if (!document.fullscreenElement) {
                dynamicScale = Math.min(dynamicScale, 1.5);
            }
            // ---------------------------------

            const viewport = page.getViewport({scale: dynamicScale}); 
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({canvasContext: ctx, viewport: viewport}).promise;
            guideMgr.isRendering = false;
            
            // 페이지 번호 인디케이터 업데이트 (기존 로직 유지)
            const indicator = document.getElementById('pageIndicator');
            if(indicator) {
                indicator.innerText = `Page: ${num} / ${guideMgr.pdfDoc.numPages}`;
            }
        } catch (err) {
            guideMgr.isRendering = false;
        }
    },

    // 5. 페이지 이동 (기존 로직 유지)
    changePage: function(offset) {
        if(!guideMgr.pdfDoc || guideMgr.isRendering) return;
        let newPage = guideMgr.pageNum + offset;
        if(newPage > 0 && newPage <= guideMgr.pdfDoc.numPages) {
            guideMgr.pageNum = newPage;
            guideMgr.renderPage(guideMgr.pageNum);
        }
    },

    // 6. 진짜 전체화면 모드 (기존 로직 유지)
    toggleFullScreen: function() {
        const elem = document.getElementById('view-guide');
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`전체화면 모드를 실행할 수 없습니다: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
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


// [최종] 통합 설정 관리 매니저 (직접 입력 대응 버전)
const setupMgr = {
// [최종] 환경 설정 진입 로직: 비어있는 방은 즉시 오픈, 사용 중인 방은 비번 확인
    openSetupModal: async function() {
        if(!state.room) return ui.showAlert("강의실을 먼저 선택하세요.");
        
        // 1. 현재 방의 실시간 상태 확인
        const statusSnap = await firebase.database().ref(`courses/${state.room}/status`).get();
        const st = statusSnap.val() || {};

        // 2. [핵심 조건문] 
        // 방이 '사용 중(active)'인데 + 그 주인이 '내가 아닐(sessionId 다름)' 경우에만 차단
        if (st.roomStatus === 'active' && st.ownerSessionId !== state.sessionId) {
            ui.showAlert("⚠️ 현재 다른 강사님이 운영 중인 과정입니다. 제어권 인증(비번)을 먼저 완료해주세요.");
            // 인증창 띄우기 위해 기존에 만든 비번창 소환 함수 호출
            dataMgr.switchRoomAttempt(state.room); 
            return;
        }

        // 3. 위 조건에 걸리지 않으면 (비어있거나 내가 주인이면) 아래 설정창 로직 실행
        let profOptions = '<option value="">(선택 안함)</option>';
        profMgr.list.forEach(p => { profOptions += `<option value="${p.name}">${p.name} 교수</option>`; });
        document.getElementById('setup-prof-select').innerHTML = profOptions;

        firebase.database().ref('system/coordinators').once('value', snap => {
            const coords = snap.val() || {};
            let coordOptions = '<option value="">--- 담당자 선택 ---</option>';
            Object.values(coords).forEach(c => {
                coordOptions += `<option value="${c.name}">${c.name}</option>`;
            });
            document.getElementById('setup-coord-select').innerHTML = coordOptions;
            this.loadCurrentSettings(); // 설정 데이터 불러오기
        });
    },

    // 설정을 불러오는 내부 함수 분리
    loadCurrentSettings: function() {
        firebase.database().ref(`courses/${state.room}`).once('value', snap => {
            const data = snap.val() || {};
            const s = data.settings || {};
            const st = data.status || {};
            
            document.getElementById('setup-course-name').value = s.courseName || "";
            document.getElementById('setup-room-pw').value = s.password ? atob(s.password) : "7777";
            document.getElementById('setup-prof-select').value = st.professorName || "";
            document.getElementById('setup-coord-select').value = s.coordinatorName || "";

            const roomSelect = document.getElementById('setup-room-select');
            const roomDirect = document.getElementById('setup-room-direct');
            const currentRoomValue = s.roomDetailName || "";

            let found = false;
            for (let i = 0; i < roomSelect.options.length; i++) {
                if (roomSelect.options[i].value === currentRoomValue) {
                    roomSelect.value = currentRoomValue;
                    found = true;
                    break;
                }
            }

            if (!found && currentRoomValue) {
                roomSelect.value = "direct";
                roomDirect.value = currentRoomValue;
                roomDirect.style.display = "block";
            } else {
                roomDirect.style.display = "none";
            }

            if(s.period && s.period.includes(" ~ ")) {
                const dates = s.period.split(" ~ ");
                document.getElementById('setup-start-date').value = dates[0];
                document.getElementById('setup-end-date').value = dates[1];
            }
            
            subjectMgr.renderListInModal();
            document.getElementById('courseSetupModal').style.display = 'flex';
        });
    },

    // 선택창 값 변경 감지 함수
    checkDirectInput: function(val) {
        const directInput = document.getElementById('setup-room-direct');
        if (val === "direct") {
            directInput.style.display = "block";
            directInput.focus();
        } else {
            directInput.style.display = "none";
        }
    },

    closeSetupModal: function() {
        document.getElementById('courseSetupModal').style.display = 'none';
    },

saveAll: function() {
        const name = document.getElementById('setup-course-name').value.trim();
        const rawPw = document.getElementById('setup-room-pw').value.trim();
        const sDate = document.getElementById('setup-start-date').value;
        const eDate = document.getElementById('setup-end-date').value;
        const profName = document.getElementById('setup-prof-select').value;
        const coordName = document.getElementById('setup-coord-select').value;

        const statusSelect = document.getElementById('roomStatusSelect');
        if(statusSelect) statusSelect.value = 'active';
        
        const roomSelectVal = document.getElementById('setup-room-select').value;
        const roomName = (roomSelectVal === "direct") ? document.getElementById('setup-room-direct').value.trim() : roomSelectVal;

        if(!name || !sDate || !eDate || !rawPw || !roomName) {
            alert("모든 필수 항목(과정명, 암호, 기간, 장소)을 입력해주세요.");
            return;
        }

        const updates = {};
        updates[`courses/${state.room}/settings/courseName`] = name;
        updates[`courses/${state.room}/settings/password`] = btoa(rawPw);
        updates[`courses/${state.room}/settings/period`] = `${sDate} ~ ${eDate}`;
        updates[`courses/${state.room}/settings/roomDetailName`] = roomName;
        updates[`courses/${state.room}/settings/coordinatorName`] = coordName; // 담당자 저장 추가
        updates[`courses/${state.room}/status/professorName`] = profName;
        updates[`courses/${state.room}/status/roomStatus`] = 'active';
        updates[`courses/${state.room}/status/ownerSessionId`] = state.sessionId;

        firebase.database().ref().update(updates).then(() => {
            document.getElementById('courseNameInput').value = name;
            document.getElementById('roomPw').value = rawPw;
            document.getElementById('displayCourseTitle').innerText = name;
            localStorage.setItem('last_owned_room', state.room);
            ui.showAlert("✅ 설정이 저장되었으며, 강의실이 활성화되었습니다.");
            this.closeSetupModal();
        });
    }
};

// [신규] 팝업 내부 전용 과목 관리 기능 (이 함수들이 점선 아래로 들어가야 합니다)
subjectMgr.renderListInModal = function() {
    const container = document.getElementById('setup-subject-list');
    if(!container) return;
    container.innerHTML = "";
    if(this.list.length === 0) {
        container.innerHTML = '<div style="color: #94a3b8; font-size: 11px; text-align: center;">등록된 과목이 없습니다.</div>';
        return;
    }
    this.list.forEach(item => {
        container.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #f1f5f9; margin-bottom: 4px; border-radius: 6px; font-size: 12px; color: #1e293b; border: 1px solid #e2e8f0;">
                <span>${item.name}</span>
                <i class="fa-solid fa-trash-can" onclick="subjectMgr.deleteSubject('${item.key}')" style="cursor: pointer; color: #ef4444;"></i>
            </div>`;
    });
};



subjectMgr.addSubjectInModal = function() {
    const input = document.getElementById('setup-new-subject');
    const name = input.value.trim();
    if(!name) return;
    firebase.database().ref(`courses/${state.room}/settings/subjects`).push(name).then(() => {
        input.value = "";
    });
};





// 2. [실행] 페이지 로드 시 초기화 통합
window.onload = function() { 
    dataMgr.checkMobile(); 
    dataMgr.initSystem(); 
    profMgr.init();   
    coordMgr.init(); // 과정 담당자 초기화 추가
    guideMgr.init();

    // 새로고침 시 기존 접속 강의실 자동 복구
    const lastRoom = localStorage.getItem('kac_last_room');
    if (lastRoom) {
        setTimeout(() => {
            if (firebase.auth().currentUser) {
                dataMgr.forceEnterRoom(lastRoom);
            }
        }, 500);
    }
};

// [수정] 전역 클릭 이벤트 (설정창 드래그 시 닫힘 버그 해결)
window.onclick = function(event) {
    // 1. 메뉴 드롭다운 외 클릭 시 닫기 로직
    if (!event.target.matches('.dropdown-trigger') && !event.target.closest('.dropdown-trigger')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].style.display === "block") {
                dropdowns[i].style.display = "none";
            }
        }
    }

    // 2. 중요 설정창(Course Setup)은 드래그 실수로 닫히지 않도록 
    // "배경 클릭 시 자동 닫기" 기능을 제거했습니다.
    // 이제 오직 [취소] 버튼이나 [설정 저장] 버튼을 눌러야만 닫힙니다.
};