// ----------------- State -----------------
let state = {
  tests: [],
  currentTest: null,
  currentIndex: 0,
  answers: {},
  timer: null,
  timeLeft: 0
};

// ----------------- Elements -----------------
const testsList = document.getElementById('tests-list'),
      testScreen = document.getElementById('test-screen'),
      lobby = document.getElementById('lobby'),
      testTitle = document.getElementById('test-title'),
      timerEl = document.getElementById('timer'),
      questionArea = document.getElementById('question-area'),
      prevBtn = document.getElementById('prev-btn'),
      nextBtn = document.getElementById('next-btn'),
      submitBtn = document.getElementById('submit-btn'),
      quitBtn = document.getElementById('quit-btn'),
      resultScreen = document.getElementById('result-screen'),
      resultSummary = document.getElementById('result-summary'),
      backHome = document.getElementById('back-home'),
      adminOpen = document.getElementById('admin-open'),
      adminModal = document.getElementById('admin-modal'),
      adminList = document.getElementById('admin-list'),
      addTestBtn = document.getElementById('add-test'),
      exportBtn = document.getElementById('export-json'),
      resetBtn = document.getElementById('reset-json'),
      closeAdmin = document.getElementById('close-admin');

// ----------------- Sample Data -----------------
state.tests = [
  {
    "id": "verbal1",
    "title": "Verbal Section Sample",
    "duration_minutes": 20,
    "questions": [
      {"id":"q1","text":"Choose the synonym of 'obstinate'.","options":["Flexible","Stubborn","Friendly","Timid"],"answer":1},
      {"id":"q2","text":"If 3x + 5 = 20, find x.","options":["3","5","8","-5"],"answer":0}
    ]
  },
  {
    "id": "quant1",
    "title": "Quant Section Sample",
    "duration_minutes": 25,
    "questions": [
      {"id":"q1","text":"What is 12 * 8?","options":["80","96","108","104"],"answer":1},
      {"id":"q2","text":"Solve for x: 2x + 7 = 15","options":["3","4","5","6"],"answer":1}
    ]
  }
];

// ----------------- Render Lobby -----------------
function renderTests() {
  testsList.innerHTML = '';
  if (state.tests.length === 0) {
    testsList.innerHTML = '<p class="muted">No tests available.</p>';
  }
  state.tests.forEach(t => {
    const el = document.createElement('div');
    el.className = 'test';
    el.innerHTML = `<div><strong>${t.title}</strong><div class="muted">${t.questions.length} questions · ${t.duration_minutes} min</div></div>`;
    const bwrap = document.createElement('div');
    const start = document.createElement('button');
    start.className = 'primary';
    start.textContent = 'Start';
    start.onclick = () => startTest(t.id);
    bwrap.appendChild(start);
    el.appendChild(bwrap);
    testsList.appendChild(el);
  });
}

// ----------------- Test Functions -----------------
function startTest(id) {
  const t = state.tests.find(x => x.id === id);
  if (!t) return alert('Test not found');
  state.currentTest = JSON.parse(JSON.stringify(t));
  state.currentIndex = 0;
  state.answers = {};
  state.timeLeft = state.currentTest.duration_minutes * 60;
  lobby.classList.add('hidden');
  testScreen.classList.remove('hidden');
  resultScreen.classList.add('hidden');
  testTitle.textContent = state.currentTest.title;
  renderQuestion();
  startTimer();
}

function renderQuestion() {
  const q = state.currentTest.questions[state.currentIndex];
  questionArea.innerHTML = '';
  const qdiv = document.createElement('div');
  qdiv.className = 'question';
  qdiv.innerHTML = `<div><strong>Q${state.currentIndex+1}.</strong> ${q.text}</div>`;
  const opts = document.createElement('div');
  opts.className = 'options';
  q.options.forEach((opt,i) => {
    const o = document.createElement('div');
    o.className = 'option';
    o.textContent = opt;
    o.onclick = () => { state.answers[q.id] = i; renderQuestion(); };
    if (state.answers[q.id] === i) o.classList.add('selected');
    opts.appendChild(o);
  });
  questionArea.appendChild(qdiv);
  questionArea.appendChild(opts);
}

prevBtn.onclick = () => { if (state.currentIndex > 0) { state.currentIndex--; renderQuestion(); } };
nextBtn.onclick = () => { if (state.currentIndex < state.currentTest.questions.length-1) { state.currentIndex++; renderQuestion(); } };
quitBtn.onclick = () => { if (confirm('Quit test?')) backToLobby(); };
submitBtn.onclick = () => { if (confirm('Submit test now?')) endTest(); };
backHome.onclick = backToLobby;

function backToLobby() {
  state.currentTest = null; state.currentIndex = 0; state.answers = {};
  stopTimer();
  lobby.classList.remove('hidden');
  testScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
}

function endTest() {
  stopTimer();
  const qlist = state.currentTest.questions;
  let correct=0, attempted=0;
  qlist.forEach(q => {
    const a = state.answers[q.id];
    if (typeof a !== 'undefined') { attempted++; if(a===q.answer) correct++; }
  });
  const total = qlist.length;
  const percentage = Math.round((correct/total)*100);
  resultSummary.innerHTML = `<p><strong>Score:</strong> ${correct} / ${total}</p>
                             <p><strong>Attempted:</strong> ${attempted}</p>
                             <p><strong>Accuracy:</strong> ${percentage}%</p>`;
  testScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');
}

// ----------------- Timer -----------------
function startTimer() {
  stopTimer();
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.timeLeft--;
    if(state.timeLeft <= 0) { clearInterval(state.timer); alert('Time is up!'); endTest(); return; }
    updateTimerDisplay();
  },1000);
}
function stopTimer() { if(state.timer) clearInterval(state.timer); state.timer=null; }
function updateTimerDisplay() { const m=Math.floor(state.timeLeft/60), s=state.timeLeft%60; timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }

// ----------------- Admin Mode -----------------
function isAdminMode(){ return location.search.indexOf('admin=1')!==-1; }

function setupAdmin() {
  if(!isAdminMode()) return;
  adminOpen.classList.remove('hidden');
  adminOpen.onclick = () => { adminModal.classList.remove('hidden'); renderAdminList(); };
  closeAdmin.onclick = () => { adminModal.classList.add('hidden'); };
  addTestBtn.onclick = () => {
    const id = 't'+Date.now();
    const newTest = {id, title:'New Test', duration_minutes:10, questions:[]};
    state.tests.push(newTest);
    renderAdminList();
  };
  exportBtn.onclick = () => {
    const data = JSON.stringify({tests:state.tests},null,2);
    const a=document.createElement('a');
    a.href='data:text/json;charset=utf-8,'+encodeURIComponent(data);
    a.download='mocktests.json';
    a.click();
  };
  resetBtn.onclick = () => { alert('Reset not implemented in this version.'); };
}

function renderAdminList() {
  adminList.innerHTML = '';
  state.tests.forEach((t,idx)=>{
    const row=document.createElement('div');
    row.className='admin-row';
    const left=document.createElement('div');
    left.innerHTML=`<strong>${t.title}</strong><div class="muted">${t.questions.length} questions · ${t.duration_minutes} min</div>`;
    const right=document.createElement('div');
    right.className='actions';
    const edit=document.createElement('button'); edit.textContent='Edit'; edit.onclick=()=>alert('Editing not implemented.');
    const del=document.createElement('button'); del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete this test?')){ state.tests.splice(idx,1); renderAdminList(); renderTests(); } };
    right.appendChild(edit); right.appendChild(del);
    row.appendChild(left); row.appendChild(right);
    adminList.appendChild(row);
  });
}

// ----------------- Initialize -----------------
setupAdmin();
renderTests();
