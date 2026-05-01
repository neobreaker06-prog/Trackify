const EMOJIS = ['🏃','💧','📚','🧘','🥗','💪','🛌','✍️','🎸','🌿','🧠','☀️','🚴','🧴','🎯','🌊'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let habits = [];
let selectedEmoji = EMOJIS[0];
let todayKey = '';

// ── Helpers ──

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function save() {
  try { localStorage.setItem('trackify_v2', JSON.stringify(habits)); } catch(e) {}
}

function load() {
  try {
    const raw = localStorage.getItem('trackify_v2');
    if (raw) habits = JSON.parse(raw);
  } catch(e) { habits = []; }
}

function seedDefaults() {
  if (habits.length === 0) {
    habits = [
      { name: 'Morning run',    icon: '🏃', freq: 'Daily',    log: {} },
      { name: 'Read 30 mins',   icon: '📚', freq: 'Daily',    log: {} },
      { name: 'Drink 2L water', icon: '💧', freq: 'Daily',    log: {} },
      { name: 'Meditate',       icon: '🧘', freq: 'Weekdays', log: {} },
    ];
  }
}

// ── Calculations ──

function calcStreak(h) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const k = dayKey(d);
    if (h.log && h.log[k]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function calcWeekRate() {
  if (!habits.length) return null;
  let done = 0, total = 0;
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = dayKey(d);
    habits.forEach(h => {
      total++;
      if (h.log && h.log[k]) done++;
    });
  }
  return total ? Math.round((done / total) * 100) : 0;
}

// ── Render functions ──

function renderDateChip() {
  const d = new Date();
  document.getElementById('dateChip').textContent =
    `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function renderWeekBar() {
  const bar = document.getElementById('weekBar');
  bar.innerHTML = '';
  const today = new Date();
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dk = dayKey(d);
    const doneCount = habits.filter(h => h.log && h.log[dk]).length;
    const cell = document.createElement('div');
    cell.className = 'day-cell' + (i === 0 ? ' today' : '') + (doneCount > 0 ? ' active' : '');
    cell.innerHTML = `
      <span class="day-name">${DAYS[d.getDay()]}</span>
      <span class="day-num">${d.getDate()}</span>
      <div class="day-ring">${doneCount > 0 ? doneCount : (i === 0 ? '·' : '')}</div>
    `;
    bar.appendChild(cell);
  }
}

function renderStats() {
  const todayDone = habits.filter(h => h.log && h.log[todayKey]).length;
  const doneEl = document.getElementById('doneCount');
  doneEl.childNodes[0].textContent = todayDone;
  document.getElementById('totalCount').textContent = habits.length;

  const rate = calcWeekRate();
  document.getElementById('rateVal').textContent = rate !== null ? rate + '%' : '—';

  const maxStreak = habits.length ? Math.max(...habits.map(calcStreak)) : 0;
  document.getElementById('bestStreakVal').textContent = maxStreak;
  document.getElementById('streakLabel').textContent = maxStreak + ' day streak';

  const pct = habits.length ? Math.round((todayDone / habits.length) * 100) : 0;
  document.getElementById('progressPct').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressFooter').style.display = habits.length ? '' : 'none';
}

function renderEmojiPicker() {
  const pick = document.getElementById('emojiPick');
  pick.innerHTML = '';
  EMOJIS.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'ep-btn' + (em === selectedEmoji ? ' sel' : '');
    btn.textContent = em;
    btn.addEventListener('click', () => { selectedEmoji = em; renderEmojiPicker(); });
    pick.appendChild(btn);
  });
}

function renderHabits() {
  const list = document.getElementById('habitsList');
  list.innerHTML = '';
  document.getElementById('emptyState').className = 'empty-state' + (habits.length ? '' : ' show');

  habits.forEach((h, idx) => {
    const done = h.log && h.log[todayKey];
    const streak = calcStreak(h);

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7.push(!!(h.log && h.log[dayKey(d)]));
    }

    const card = document.createElement('div');
    card.className = 'habit-card' + (done ? ' done' : '');
    card.innerHTML = `
      <div class="habit-check"><div class="checkmark"></div></div>
      <div class="habit-icon">${h.icon}</div>
      <div class="habit-info">
        <div class="habit-name">${h.name}</div>
        <div class="habit-meta">${h.freq}</div>
        <div class="mini-dots">${last7.map(f => `<div class="mini-dot${f ? ' filled' : ''}"></div>`).join('')}</div>
      </div>
      <div class="habit-streak">${streak > 0 ? streak + 'd 🔥' : ''}</div>
      <button class="delete-btn" title="Remove habit"><div class="del-x"></div></button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      if (!h.log) h.log = {};
      if (h.log[todayKey]) delete h.log[todayKey];
      else h.log[todayKey] = true;
      save();
      renderAll();
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      habits.splice(idx, 1);
      save();
      renderAll();
    });

    list.appendChild(card);
  });

  renderStats();
  renderWeekBar();
}

function renderAll() { renderHabits(); }

// ── Event listeners ──

document.getElementById('addToggle').addEventListener('click', () => {
  const form = document.getElementById('addForm');
  const open = form.classList.toggle('open');
  document.getElementById('addToggle').textContent = open ? '× Close' : '+ Add habit';
  if (open) { renderEmojiPicker(); document.getElementById('habitName').focus(); }
});

document.getElementById('cancelAdd').addEventListener('click', () => {
  document.getElementById('addForm').classList.remove('open');
  document.getElementById('addToggle').textContent = '+ Add habit';
});

document.getElementById('saveHabit').addEventListener('click', () => {
  const name = document.getElementById('habitName').value.trim();
  if (!name) { document.getElementById('habitName').focus(); return; }
  const freq = document.getElementById('freqSelect').value;
  habits.push({ name, icon: selectedEmoji, freq, log: {} });
  save();
  document.getElementById('habitName').value = '';
  selectedEmoji = EMOJIS[0];
  document.getElementById('addForm').classList.remove('open');
  document.getElementById('addToggle').textContent = '+ Add habit';
  renderAll();
});

document.getElementById('habitName').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('saveHabit').click();
});

// ── Init ──
todayKey = getTodayKey();
load();
seedDefaults();
renderDateChip();
renderEmojiPicker();
renderAll();