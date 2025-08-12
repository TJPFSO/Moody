// Mood Log Object
const moodLog = {};

// Handle Quick Mood Logging (from emoji buttons)
function logMood(emoji) {
    const now = new Date();
    const dateKey = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    const entry = `${dateKey} (${time}) - Mood: ${emoji}`;
    const listItem = document.createElement("li");
    listItem.textContent = entry;
    document.getElementById("mood-history").appendChild(listItem);
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

    moodLog[dateKey] = {
        time,
        happy,
        sad,
        angry,
        moods
    };

    document.getElementById('lastEntry').innerText = `Last mood entry: ${dateKey} at ${time}`;
    alert('Mood saved!');
}


function showCalendar() {
    const calendar = document.getElementById('calendar');
    const list = document.getElementById('calendarEntries');
    list.innerHTML = '';

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
