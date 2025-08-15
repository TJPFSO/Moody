

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

function showCalendar() {
    const calendar = document.getElementById('calendar');
    const list = document.getElementById('calendarEntries');
    list.innerHTML = '';


    moodLog = loadMoodLog();

    for (const [date, entry] of Object.entries(moodLog)) {
        const item = document.createElement('li');
        item.innerText = `${date} (${entry.time}) - Happy: ${entry.happy}, Sad: ${entry.sad}, Angry: ${entry.angry}, Moods: ${entry.moods.join(', ')}`;
        list.appendChild(item);
    }

    calendar.style.display = 'block';
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
});
