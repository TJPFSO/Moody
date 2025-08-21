

//  storage keys
const STORAGE_KEY_HISTORY = 'moody.quickHistory.v1';
const STORAGE_KEY_MOODLOG = 'moody.moodlog.v1';

//  load helpers
function loadHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}
function saveHistory(arr) {
    try { localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(arr)); } catch {}
}
function loadMoodLog() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_MOODLOG);
        const parsed = raw ? JSON.parse(raw) : {};
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch { return {}; }
}
function saveMoodLog(obj) {
    try { localStorage.setItem(STORAGE_KEY_MOODLOG, JSON.stringify(obj)); } catch {}
}
 //in-memory structures, hydrated from storage
let quickHistory = loadHistory();
let moodLog = loadMoodLog();



function renderQuickHistory() {
    const list = document.getElementById("mood-history");
    if (!list) return;
    list.innerHTML = quickHistory
        .slice()                // copy
        .reverse()              // newest first
        .map(e => `<li>${e.date} (${e.time}) - Mood: ${e.emoji}</li>`)
        .join('');
}

// Update "Last mood entry" label (based on saved moodLog)
function renderLastEntryLabel() {
    const label = document.getElementById('lastEntry');
    if (!label) return;
    // pick most recent by date+time from moodLog
    const entries = Object.entries(moodLog);
    if (!entries.length) {
        label.textContent = 'Last mood entry: —';
        return;
    }

    //milestone code
    // find latest by Date
    const latest = entries
        .map(([date, e]) => ({ date, ts: new Date(`${date} ${e.time}`).getTime(), e }))
        .sort((a, b) => b.ts - a.ts)[0];
    label.textContent = `Last mood entry: ${latest.date} at ${latest.e.time}`;
}

// Handle Quick Mood Logging (from emoji buttons)
function logMood(emoji) {
    const now = new Date();
    const dateKey = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    quickHistory.push({ date: dateKey, time, emoji });
    saveHistory(quickHistory);

    // render
    renderQuickHistory();
}

// Get checked mood tags
function getSelectedMoods() {
    const checkboxes = document.querySelectorAll('.checkboxes input[type=checkbox]');
    return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

// mood sliders and check boxes
function saveMood() {
    const happy = document.getElementById('happySlider').value;
    const sad = document.getElementById('sadSlider').value;
    const angry = document.getElementById('angrySlider').value;
    const moods = getSelectedMoods();

    const now = new Date();
    const dateKey = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    // store the day's structured entry
    moodLog[dateKey] = {
        time,
        happy,
        sad,
        angry,
        moods
    };


    saveMoodLog(moodLog);

    document.getElementById('lastEntry').innerText = `Last mood entry: ${dateKey} at ${time}`;
    alert('Mood saved!');
}



function hideCalendar() {
    document.getElementById('calendar').style.display = 'none';
}

function sendNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Don't forget to track your mood today!");
    } else if ("Notification" in window && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Don't forget to track your mood today!");
            }
        });
    } else {
        alert("Notifications are not supported or permission denied.");
    }
}


document.addEventListener('DOMContentLoaded', function () {
    renderQuickHistory();
    renderLastEntryLabel();
    /* Calendar: minimal wiring */
    (() => {
        const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
        const LS_KEY = 'moody.entries';
        const today = new Date();
        const state = {y: today.getFullYear(), m: today.getMonth(), sel: iso(today)};

        // open/close (uses your buttons)
        window.showCalendar = () => {
            $('#calendar').style.display = 'grid';
            init();
            render();
        };
        window.hideCalendar = () => {
            $('#calendar').style.display = 'none';
        };

        let inited = false;

        function init() {
            if (inited) return;
            const prev = $('#prevMonth'), next = $('#nextMonth');
            prev && prev.addEventListener('click', () => {
                state.m--;
                if (state.m < 0) {
                    state.m = 11;
                    state.y--;
                }
                render();
            });
            next && next.addEventListener('click', () => {
                state.m++;
                if (state.m > 11) {
                    state.m = 0;
                    state.y++;
                }
                render();
            });
            // emoji toggle
            $$('.cal-selected .emoji').forEach(btn => {
                btn.addEventListener('click', () => {
                    $$('.cal-selected .emoji').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
            $('#calSave')?.addEventListener('click', saveSel);
            $('#calDelete')?.addEventListener('click', delSel);
            inited = true;
        }

        function render() {
            $('#calTitle').textContent = new Date(state.y, state.m, 1).toLocaleString(undefined, {
                month: 'long',
                year: 'numeric'
            });
            const grid = $('#calGrid');
            if (!grid) return;
            grid.innerHTML = '';

            const first = new Date(state.y, state.m, 1).getDay();
            const dim = daysInMonth(state.y, state.m);
            const prevDim = daysInMonth(state.m === 0 ? state.y - 1 : state.y, (state.m + 11) % 12);


            for (let i = 0; i < 42; i++) {
                const dnum = i - first + 1;
                let y = state.y, m = state.m, day = dnum, outside = false;
                if (dnum <= 0) {
                    outside = true;
                    m = (state.m + 11) % 12;
                    y = state.m === 0 ? state.y - 1 : state.y;
                    day = prevDim + dnum;
                } else if (dnum > dim) {
                    outside = true;
                    m = (state.m + 1) % 12;
                    y = state.m === 11 ? state.y + 1 : state.y;
                    day = dnum - dim;
                }

                const d = new Date(y, m, day), id = iso(d);
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'day';
                if (outside) btn.classList.add('outside');
                if (id === iso(today)) btn.classList.add('today');
                if (id === state.sel) btn.classList.add('selected');
                btn.dataset.iso = id;
                btn.innerHTML = `<span class="num">${day}</span><span class="dot"></span>`;
                const e = get(id);
                if (e?.emoji) btn.classList.add(moodClass(e.emoji));
                btn.addEventListener('click', () => {
                    state.sel = id;
                    $$('.day.selected').forEach(x => x.classList.remove('selected'));
                    btn.classList.add('selected');
                    fillPanel();
                });
                grid.appendChild(btn);
            }
            fillPanel();
        }

        function fillPanel() {
            const d = new Date(state.sel + 'T00:00:00');
            const e = get(state.sel);
            $('#selectedDateLabel') && ($('#selectedDateLabel').textContent = d.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }));
            $('#calNote') && ($('#calNote').value = e?.note || '');
            $$('.cal-selected .emoji').forEach(b => b.classList.remove('active'));
            if (e?.emoji) {
                const b = $(`.cal-selected .emoji[data-cal-emoji="${e.emoji}"]`);
                b && b.classList.add('active');
            }
        }

        function saveSel() {
            const btn = $('.cal-selected .emoji.active');
            const emoji = btn ? btn.dataset.calEmoji : undefined;
            const note = $('#calNote') ? $('#calNote').value.trim() : '';
            if (!emoji && !note) {
                return;
            }
            set(state.sel, {emoji, note});
            const dayBtn = $(`.day[data-iso="${state.sel}"]`);
            if (dayBtn) {
                dayBtn.classList.remove('mood-good', 'mood-meh', 'mood-bad');
                if (emoji) dayBtn.classList.add(moodClass(emoji));
            }
        }

        function delSel() {
            del(state.sel);
            const dayBtn = $(`.day[data-iso="${state.sel}"]`);
            if (dayBtn) {
                dayBtn.classList.remove('mood-good', 'mood-meh', 'mood-bad');
            }
            $('#calNote') && ($('#calNote').value = '');
            $$('.cal-selected .emoji').forEach(b => b.classList.remove('active'));
        }

        // storage
        function get(id) {
            try {
                return JSON.parse(localStorage.getItem(LS_KEY) || '{}')[id] || null;
            } catch {
                return null;
            }
        }

        function set(id, val) {
            const all = safeAll();
            all[id] = val;
            localStorage.setItem(LS_KEY, JSON.stringify(all));
        }

        function del(id) {
            const all = safeAll();
            delete all[id];
            localStorage.setItem(LS_KEY, JSON.stringify(all));
        }

        function safeAll() {
            try {
                return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
            } catch {
                return {};
            }
        }

        // utils/
        function iso(d) {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        function daysInMonth(y, m0) {
            return new Date(y, m0 + 1, 0).getDate();
        }

        function moodClass(e) {
            if (e === '😊') return 'mood-good';
            if (e === '😐') return 'mood-meh';
            return 'mood-bad';
        }
    })();
});
