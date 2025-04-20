// Initialize Firebase
const firebaseConfig = {
    databaseURL: "https://grossmancousinsclub-default-rtdb.firebaseio.com/"
};

// Wait for the DOM to load before initializing Firebase
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Firebase if it's available
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        initializeApp();
    } else {
        console.error("Firebase SDK not loaded!");
        showError("Could not connect to database. Please check your internet connection.");
    }
});

// Main app initialization
function initializeApp() {
    // Reference the database
    const database = firebase.database();
    const chatRef = database.ref("chat");
    const profilesRef = database.ref("profiles");
    
    // Set up event listeners
    setupChatSystem(chatRef);
    setupProfileForm(profilesRef);
    setupAdminLogin();
    
    // Check if the map element exists and initialize Google Maps
    if (document.getElementById("map")) {
        loadGoogleMapsScript();
    }
    
    // Check if the calendar element exists and initialize FullCalendar
    if (document.getElementById("calendar")) {
        initializeCalendar();
    }
}

// Set up chat system
function setupChatSystem(chatRef) {
    const chatBox = document.getElementById("chat-box");
    const messageInput = document.getElementById("message-input");
    
    if (!chatBox || !messageInput) return; // Skip if we're not on the chat page
    
    // Listen for Enter key
    messageInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });
    
    // Display messages
    chatRef.on("child_added", snapshot => {
        const message = snapshot.val();
        const messageId = snapshot.key;
        displayMessage(message, messageId, chatBox);
    });
    
    // Handle message removal
    chatRef.on("child_removed", snapshot => {
        const messageId = snapshot.key;
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });
}

// Send a message to the chat
function sendMessage() {
    const messageInput = document.getElementById("message-input");
    if (!messageInput) return;
    
    const messageText = messageInput.value.trim();
    if (messageText === "") return;
    
    const database = firebase.database();
    const chatRef = database.ref("chat");
    
    const message = {
        text: messageText,
        timestamp: Date.now(),
        sender: "user" // You might want to add proper user IDs later
    };
    
    chatRef.push(message);
    messageInput.value = "";
}

// Display a message in the chat box
function displayMessage(message, messageId, chatBox) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");
    messageElement.setAttribute("data-message-id", messageId);
    
    messageElement.innerHTML = `
        <span>${escapeHTML(message.text)}</span> 
        <button class="delete-btn" onclick="deleteMessage('${messageId}')">❌</button>
    `;
    
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
}

// Delete a message (admin function)
function deleteMessage(messageId) {
    const adminPassword = "Akivagro8"; // In production, use a more secure method
    const enteredPassword = prompt("Enter admin password to delete:");
    
    if (enteredPassword === adminPassword) {
        const database = firebase.database();
        database.ref(`chat/${messageId}`).remove()
            .then(() => console.log("Message deleted"))
            .catch(error => {
                console.error("Error deleting message:", error);
                alert("Error deleting message");
            });
    } else {
        alert("Incorrect password");
    }
}

// Set up profile form
function setupProfileForm(profilesRef) {
    const form = document.getElementById("cousin-form");
    if (!form) return; // Skip if we're not on the profile page
    
    form.addEventListener("submit", function(event) {
        event.preventDefault();
        
        const name = document.getElementById("name").value.trim();
        const dob = document.getElementById("dob").value;
        const location = document.getElementById("location").value.trim();
        const meeting = document.getElementById("meeting").value;
        const bio = document.getElementById("bio")?.value.trim() || "";
        
        if (!name || !dob || !location || !meeting) {
            alert("Please fill out all required fields");
            return;
        }
        
        // Show loading overlay
        toggleLoadingOverlay(true);
        
        // Create profile object
        const profile = {
            name,
            dob,
            location,
            meeting,
            bio,
            createdAt: Date.now()
        };
        
        // Save to Firebase
        profilesRef.push(profile)
            .then(() => {
                alert("Profile created successfully!");
                form.reset();
                toggleLoadingOverlay(false);
            })
            .catch(error => {
                console.error("Error creating profile:", error);
                alert("Error creating profile. Please try again.");
                toggleLoadingOverlay(false);
            });
    });
}

// Set up admin login
function setupAdminLogin() {
    const loginBtn = document.getElementById("admin-login-btn");
    if (!loginBtn) return;
    
    loginBtn.addEventListener("click", adminLogin);
}

// Admin login handler
function adminLogin() {
    const passwordInput = document.getElementById("admin-password");
    if (!passwordInput) return;
    
    const password = passwordInput.value.trim();
    const correctPassword = "Akivagro8"; // In production, use a more secure method
    
    if (password === correctPassword) {
        // Show admin panel
        const adminPanel = document.getElementById("admin-panel");
        if (adminPanel) {
            adminPanel.style.display = "block";
            passwordInput.value = "";
            
            // Set up admin panel buttons
            setupAdminPanelButtons();
        }
    } else {
        alert("Incorrect password");
    }
}

// Set up admin panel buttons
function setupAdminPanelButtons() {
    // Clear chat button
    const clearChatBtn = document.getElementById("clear-chat-btn");
    if (clearChatBtn) {
        clearChatBtn.addEventListener("click", clearChat);
    }
    
    // Manage profiles button
    const manageProfilesBtn = document.getElementById("manage-profiles-btn");
    if (manageProfilesBtn) {
        manageProfilesBtn.addEventListener("click", manageProfiles);
    }
    
    // Export data button
    const exportDataBtn = document.getElementById("export-data-btn");
    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", exportData);
    }
    
    // Logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            document.getElementById("admin-panel").style.display = "none";
        });
    }
}

// Clear all chat messages
function clearChat() {
    if (confirm("Are you sure you want to delete ALL chat messages? This cannot be undone.")) {
        toggleLoadingOverlay(true);
        
        const database = firebase.database();
        database.ref("chat").remove()
            .then(() => {
                alert("Chat cleared successfully");
                toggleLoadingOverlay(false);
            })
            .catch(error => {
                console.error("Error clearing chat:", error);
                alert("Error clearing chat");
                toggleLoadingOverlay(false);
            });
    }
}

// Manage cousin profiles
function manageProfiles() {
    alert("Profile management interface coming soon!");
    // This would typically load a modal or navigate to a profiles management page
}

// Export data as JSON
function exportData() {
    toggleLoadingOverlay(true);
    
    const database = firebase.database();
    Promise.all([
        database.ref("chat").once("value"),
        database.ref("profiles").once("value")
    ])
    .then(([chatSnapshot, profilesSnapshot]) => {
        const data = {
            chat: chatSnapshot.val() || {},
            profiles: profilesSnapshot.val() || {}
        };
        
        // Create downloadable file
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement("a");
        a.href = url;
        a.download = `grossman_cousins_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toggleLoadingOverlay(false);
        }, 100);
    })
    .catch(error => {
        console.error("Error exporting data:", error);
        alert("Error exporting data");
        toggleLoadingOverlay(false);
    });
}

// Load Google Maps API script
function loadGoogleMapsScript() {
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyABC123_REPLACE_WITH_REAL_KEY&callback=initMap";
    script.async = true;
    script.defer = true;
    script.onerror = () => {
        console.error("Failed to load Google Maps API");
        document.getElementById("map").innerHTML = 
            `<div style="padding: 20px; text-align: center;">
                <p>Map couldn't be loaded. Please check your internet connection.</p>
            </div>`;
    };
    document.body.appendChild(script);
}

// Initialize Google Map
function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;
    
    try {
        const map = new google.maps.Map(mapElement, {
            center: { lat: 31.7683, lng: 35.2137 }, // Israel
            zoom: 8,
            styles: [
                // Dark mode styling for the map
                {elementType: 'geometry', stylers: [{color: '#242f3e'}]},
                {elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
                {elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
                {
                    featureType: 'administrative.locality',
                    elementType: 'labels.text.fill',
                    stylers: [{color: '#d59563'}]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry',
                    stylers: [{color: '#38414e'}]
                },
                {
                    featureType: 'road',
                    elementType: 'geometry.stroke',
                    stylers: [{color: '#212a37'}]
                },
                {
                    featureType: 'road',
                    elementType: 'labels.text.fill',
                    stylers: [{color: '#9ca5b3'}]
                },
                {
                    featureType: 'water',
                    elementType: 'geometry',
                    stylers: [{color: '#17263c'}]
                }
            ]
        });
        
        // Sample cousin locations - in production, fetch from Firebase
        const cousins = [
            { name: "Akiva", location: { lat: 32.0731, lng: 34.801 } },
            { name: "Sarah", location: { lat: 31.7767, lng: 35.2345 } },
            { name: "David", location: { lat: 32.7940, lng: 34.9896 } }
        ];
        
        // Add markers for each cousin
        cousins.forEach(cousin => {
            const marker = new google.maps.Marker({
                position: cousin.location,
                map: map,
                title: cousin.name,
                animation: google.maps.Animation.DROP
            });
            
            // Add info window
            const infoWindow = new google.maps.InfoWindow({
                content: `<div style="color: black;"><strong>${cousin.name}</strong></div>`
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        });
    } catch (error) {
        console.error("Error initializing map:", error);
        mapElement.innerHTML = 
            `<div style="padding: 20px; text-align: center;">
                <p>Error loading map: ${error.message}</p>
            </div>`;
    }
}

// Initialize Calendar
function initializeCalendar() {
    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) return;
    
    try {
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
    } catch (error) {
        console.error("Error initializing calendar:", error);
        calendarEl.innerHTML = 
            `<div style="padding: 20px; text-align: center;">
                <p>Error loading calendar: ${error.message}</p>
            </div>`;
    }
}

// Helper function to toggle loading overlay
function toggleLoadingOverlay(show) {
    const overlay = document.getElementById("loading-overlay");
    if (!overlay) return;
    
    overlay.style.display = show ? "flex" : "none";
}

// Helper function to show error messages
function showError(message) {
    alert(message);
}

// Helper function to escape HTML to prevent XSS
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


