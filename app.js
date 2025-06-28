// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('Service Worker registered'));
}

//log mood
function logMood(mood) {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(today, mood);
    alert(`Mood logged: ${mood}`);
    renderHistory();
}

//  mood history
function renderHistory() {
    const list = document.getElementById('mood-history');
    list.innerHTML = '';
    const keys = Object.keys(localStorage).sort().reverse();
    keys.forEach(date => {
        const mood = localStorage.getItem(date);
        const li = document.createElement('li');
        li.textContent = `${date}: ${mood}`;
        list.appendChild(li);
    });
}

// Request and send notification
function sendNotification() {
    if (Notification.permission === 'granted') {
        new Notification("Don't forget to log your mood today!");
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification("Thanks for enabling notifications!");
            }
        });
    }
}

window.onload = renderHistory;

//Test change for github
