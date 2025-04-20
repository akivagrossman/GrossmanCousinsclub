// === Firebase Initialization ===
const firebaseConfig = {
    databaseURL: "https://grossmancousinsclub-default-rtdb.firebaseio.com/"
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        initializeApp();
    } else {
        console.error("Firebase SDK not loaded!");
        showError("Could not connect to database. Please check your internet connection.");
    }
});

function initializeApp() {
    const database = firebase.database();
    const chatRef = database.ref("chat");
    const profilesRef = database.ref("profiles");

    setupChatSystem(chatRef);
    setupProfileForm(profilesRef);
    setupAdminLogin();

    if (document.getElementById("map")) {
        loadGoogleMapsScript();
    }

    if (document.getElementById("calendar")) {
        initializeCalendar();
    }
}

// === Chat System ===
function setupChatSystem(chatRef) {
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    const usernameInput = document.getElementById("chat-username");

    if (!chatBox || !messageInput || !usernameInput) return;

    if (localStorage.getItem("username")) {
        usernameInput.value = localStorage.getItem("username");
    }

    usernameInput.addEventListener("change", () => {
        localStorage.setItem("username", usernameInput.value.trim());
    });

    messageInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    chatRef.on("child_added", snapshot => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        displayMessage(message, messageId, chatBox);
    });

    chatRef.on("child_removed", snapshot => {
        const messageId = snapshot.key;
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) messageElement.remove();
    });
}

function sendMessage() {
    const messageInput = document.getElementById("message-input");
    const usernameInput = document.getElementById("chat-username");

    const text = messageInput.value.trim();
    const sender = usernameInput.value.trim();

    if (!text || !sender) return alert("Enter your name and message.");

    localStorage.setItem("username", sender);

    const chatRef = firebase.database().ref("chat");
    const message = {
        text,
        sender,
        timestamp: Date.now()
    };

    chatRef.push(message);
    messageInput.value = "";
}

function displayMessage(message, messageId, chatBox) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.setAttribute("data-message-id", messageId);

    const currentUser = localStorage.getItem("username") || "";
    const isSender = currentUser === message.sender;
    const isAdmin = currentUser === "admin";

    if (isSender) messageElement.classList.add("sent-message");

    messageElement.innerHTML = `
        <strong>${escapeHTML(message.sender)}</strong>: 
        <span>${escapeHTML(message.text)}</span>
        ${(isSender || isAdmin) ? `<button class="delete-btn" onclick="deleteMessage('${messageId}')">❌</button>` : ""}
    `;

    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function deleteMessage(messageId) {
    const chatRef = firebase.database().ref("chat");
    chatRef.child(messageId).remove();
}

// === Profile Form ===
function setupProfileForm(profilesRef) {
    const form = document.getElementById("cousin-form");
    if (!form) return;

    form.addEventListener("submit", function(event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        const dob = document.getElementById("dob").value;
        const location = document.getElementById("location").value.trim();
        const meeting = document.getElementById("meeting").value;
        const bio = document.getElementById("bio")?.value.trim() || "";

        if (!name || !dob || !location || !meeting) {
            return alert("Please fill out all required fields.");
        }

        toggleLoadingOverlay(true);

        const profile = {
            name,
            dob,
            location,
            meeting,
            bio,
            createdAt: Date.now()
        };

        profilesRef.push(profile)
            .then(() => {
                alert("Profile created!");
                form.reset();
                toggleLoadingOverlay(false);
            })
            .catch(error => {
                console.error("Error:", error);
                alert("Error. Try again.");
                toggleLoadingOverlay(false);
            });
    });
}

// === Admin ===
function setupAdminLogin() {
    const loginBtn = document.getElementById("admin-login-btn");
    if (!loginBtn) return;

    loginBtn.addEventListener("click", adminLogin);
}

function adminLogin() {
    const passwordInput = document.getElementById("admin-password");
    if (!passwordInput) return;

    const password = passwordInput.value.trim();
    if (password === "Akivagro8") {
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) adminPanel.style.display = "block";
        localStorage.setItem("username", "admin");
    } else {
        alert("Incorrect password");
    }
}

function loadGoogleMapsScript() {
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyABC123_REPLACE_WITH_REAL_KEY&callback=initMap";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        document.getElementById("map").innerHTML = `<p>Map load error.</p>`;
    };
    document.body.appendChild(script);
}

let selectedLatLng = null;
function initMap() {
    const mapElement = document.getElementById("map");
    const map = new google.maps.Map(mapElement, {
        center: { lat: 31.7683, lng: 35.2137 },
        zoom: 8,
        styles: [
            {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
            {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
            {featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{color: '#d59563'}]},
            {featureType: 'road', elementType: 'geometry', stylers: [{color: '#38414e'}]},
            {featureType: 'road', elementType: 'geometry.stroke', stylers: [{color: '#212a37'}]},
            {featureType: 'road', elementType: 'labels.text.fill', stylers: [{color: '#9ca5b3'}]},
            {featureType: 'water', elementType: 'geometry', stylers: [{color: '#17263c'}]}
        ]
    });

    const marker = new google.maps.Marker({
        map,
        draggable: false
    });

    map.addListener("click", function(event) {
        selectedLatLng = event.latLng;
        marker.setPosition(selectedLatLng);

        const locationInput = document.getElementById("location");
        if (locationInput) {
            locationInput.value = `${selectedLatLng.lat().toFixed(5)}, ${selectedLatLng.lng().toFixed(5)}`;
        }
    });
}

function initializeCalendar() {
    const calendarEl = document.getElementById("calendar");
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        themeSystem: 'standard',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'
        },
        events: [
            { title: "Akiva's Birthday", start: "2025-05-15", color: '#00A884' },
            { title: "Family Meetup", start: "2025-06-10", color: '#00A884' },
            { title: "Sarah's Wedding", start: "2025-07-22", end: "2025-07-23", color: '#8f44ad' },
            { title: "David's Bar Mitzvah", start: "2025-08-05", color: '#e67e22' }
        ],
        eventClick: function(info) {
            alert(`Event: ${info.event.title}\nDate: ${info.event.start.toDateString()}`);
        }
    });

    calendar.render();
}

function toggleLoadingOverlay(show) {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) overlay.style.display = show ? "flex" : "none";
}

function showError(message) {
    alert(message);
}

function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}




