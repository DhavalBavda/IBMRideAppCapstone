import { AuthUtils } from "../js/user/auth-utils.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
// import { getMessaging, getToken, onMessage, onTokenRefresh } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging.js";
// import socket from "./socket.js";

// socket.on('connect', () => {
//   console.log('Socket connected in MAIN THREAD');
// });

console.log("mani");

const firebaseConfig = {
  apiKey: "AIzaSyBGcHy8oxKeDgolTXNOj2naQl7VkOejq7c", // "YOUR_API_KEY"
  authDomain: "fcm-demo-5be57.firebaseapp.com", // "YOUR_PROJECT.firebaseapp.com" 
  projectId: "fcm-demo-5be57", // "YOUR_PROJECT_ID" 
  storageBucket: "fcm-demo-5be57.firebasestorage.app", // "YOUR_PROJECT.appspot.com"
  messagingSenderId: "325809546502", // "YOUR_SENDER_ID" 
  appId: "1:325809546502:web:a7bbcdc71419e83d072a87", // "YOUR_APP_ID" 
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function loadComponent(containerId, file) {
  const container = document.getElementById(containerId);
  if (container) {
    try {
      const res = await fetch(`/components/${file}`);
      if (res.ok) {
        container.innerHTML = await res.text();

        const cssPath = `/components/${file.replace('.html', '.css')}`;

        if (!document.querySelector(`link[href="${cssPath}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = cssPath;
          document.head.appendChild(link);
        }

      } else {
        console.error(`Failed to load ${file}`);
      }
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }
}

function updateNav() {
  const nav = document.getElementById("nav-links");
  const footer = document.getElementById("footer-links");

  const loggedInUser = AuthUtils.getUserInfo();
  const role = loggedInUser?.role;
  const profile = loggedInUser?.profile;
console.log(profile);

  console.log("calling");
  
  let headerLinks = "";
  let footerLinks = "";

  if (role === "driver") {
    headerLinks = `
      <a href="/html/driver/driver-dashboard.html">Home</a>
      <a href="/html/vehicle/active-vehicle.html">Vehicles</a>
      <a href="/html/driver/ride-history.html">Rides</a>
      <a href="#">Ratings</a>
      <a href="/html/wallet/wallet.html">Wallet</a>
      
      <div class="dropdown">
      <img src=${profile} class="profile-icon">
      <div class="dropdown-content">
        <a href="/html/user/profile.html">Profile</a>
        <a href="#" class="logout">Logout</a>
      </div>
    </div>
    `;
    footerLinks = `
      <a href="index.html">Home</a> |
      <a href="/html/ride-requests.html">Ride Requests</a> |
      <a href="/html/wallet/wallet.html">Wallet</a> |
      <a href="/html/user/profile.html">Profile</a> |
      <a href="#" class="logout">Logout</a>
    `;
  } else if (role === "rider") {
    headerLinks = `
      <a href="/html/ride/ride.html">Book Ride</a>
      <a href="/html/ride/ride-history.html">Rides</a>
      <div class="dropdown">
      <img src=${profile} class="profile-icon">
      <div class="dropdown-content">
        <a href="/html/user/profile.html">Profile</a>
        <a href="#" class="logout">Logout</a>
      </div>
    </div>
    `;
    footerLinks = `
      <a href="/html/ride/ride.html">Book a Ride</a> |
      <a href="/html/ride/ride-history.html">Ride History</a> |
      <a href="/html/user/profile.html">Profile</a> |
      <a href="#" class="logout">Logout</a>
    `;
  } else {
    headerLinks = `
      <a href="/html/index.html">Home</a>
      <a href="html/user/login.html" id = "login" >Login</a>
      <div class="dropdown">
        <button class="signup-btn" id = "sign-up" >Sign Up</button>
      </div>
    `;
    footerLinks = `
      <a href="/html/index.html">Home</a> |
      <a href="html/user/login.html" id = "login" >Login</a> |
      <a href="html/user/register.html" id = "sign-up" >Sign Up</a> |
      <a href="html/contact.html">Contact</a>
    `;
  }

  if (nav) nav.innerHTML = headerLinks;
  if (footer) footer.innerHTML = footerLinks;

  attachLogoutHandler();
  attachLoginHandler();
  attachSignUpHandler();
}

// Logout Btn
function attachLogoutHandler() {

  document.querySelectorAll(".logout").forEach(link => {
    link.addEventListener("click", async (e) => {

      e.preventDefault();

      if (typeof AuthUtils !== "undefined") {

        const deviceId = localStorage.getItem('deviceId');
        const loggedInUser = AuthUtils.getUserInfo();
        const userId = loggedInUser.id;

        AuthUtils.clearAuthData();
        localStorage.removeItem(AuthUtils.STORAGE_KEYS.userRole);

        try {

          await AuthUtils.apiRequest(AuthUtils.API_ENDPOINTS.logout, {
            method : "POST"
          });

          // Deregister the token from the backend
          const s = await AuthUtils.apiRequest(AuthUtils.API_ENDPOINTS.deRegisterDeviceToken, {
            method: "POST",
            body: JSON.stringify({ userId, deviceId }),
          });
          console.log(s);
          
          
        } catch (error) {
          console.error(error);
        }
        AuthUtils.redirectTo("/html/index.html");
      } else {
        localStorage.clear();
        window.location.href = "/html/index.html";
      }

    });
  });
}

// Login Btn
function attachLoginHandler() {

  document.querySelectorAll("#login").forEach(link => {
    
    link.addEventListener("click", async (e) => {

      e.preventDefault();

      if (typeof AuthUtils !== "undefined") {
        AuthUtils.redirectTo("/html/user/login.html");
      } else {
        localStorage.clear();
        window.location.href = "/html/user/login.html";
      }

    });
  });
}

// Sign Up Btn
function attachSignUpHandler() {

  document.querySelectorAll("#sign-up").forEach(link => {
    
    link.addEventListener("click", async (e) => {

      e.preventDefault();

      if (typeof AuthUtils !== "undefined") {
        AuthUtils.redirectTo("/html/user/register.html");
      } else {
        localStorage.clear();
        window.location.href = "/html/user/register.html";
      }

    });
  });
}

// Location Tracking Logic
function startLocationTracking() {

  // Check if the user is logged in
  const userLoggedIn = AuthUtils.getUserInfo() // Check the user logged in or not
  if (!userLoggedIn || (userLoggedIn && (userLoggedIn.role === "rider" || userLoggedIn.role === "admin"))) return;  // Don't start tracking if not logged in or the logged inuser is admin or rider

  if ("geolocation" in navigator) {

    // Ask for user permission
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log("Permission granted. Tracking location...");

        let lastSentTime = 0;

        navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            console.log(`Latitude: ${lat}, Longitude: ${lng}`);

            const now = Date.now();
            if (now - lastSentTime >= 3000) {
              sendLocation(lat, lng); // Call backend API to save location
              lastSentTime = now;
            }
          },
          (error) => {
            console.error("Error tracking location:", error);
          },
          { 
            enableHighAccuracy: true, 
            maximumAge: 0, 
            timeout: 10000
          }
        );
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          console.log("Location permission denied.");
          alert("📍 Location permission is required to use this app.");
        }
      }
    );
  }
}

// funtion to send the location of the user to the servers
async function sendLocation(lat, lng) {
  
  await AuthUtils.apiRequest(AuthUtils.API_ENDPOINTS.updateUserLocation, {
    method: "POST",
    body: JSON.stringify({ latitude: lat, longitude: lng })
  });

}


// Firebase Cloud Meaasging Handlers ----- START -----

// Service Worker Registration
async function registerServiceWorker() {
  try {
    await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("Service Worker registered. ----------- ");
  } catch (err) {
    console.error("Service Worker registration failed:", err);
  }
}

// Get and register the FCM token
async function registerToken(loggedInUser) {
  try {
    await registerServiceWorker();
    if (!loggedInUser) return;

    // Request permission for notifications
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Notifications denied.");
      return;
    }

    // Get the token
    const token = await getToken(messaging, {
      vapidKey: "BLyfUAYQi8FQx0FSjcjPJgIGjz8FFCaC7Lq9Eu3kvQGu3udRnhX3J9IxywyRxIKfNbO1qcy4ThR6EtuLRgAkubM",
    });

    // Save token and user/device info to your backend
    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
    const userId = loggedInUser?.id;
    const deviceType = "web";

    // Register the token with your backend
    await AuthUtils.apiRequest(AuthUtils.API_ENDPOINTS.registerDeviceToken, {
      method: "POST",
      body: JSON.stringify({ fcmToken: token, userId, deviceId, deviceType }),
    });

    // alert("Token registered!");
  } catch (err) {
    console.error("Error registering token:", err);
  }
}

// Generate a unique device ID if not already available
function generateDeviceId() {
  const existingDeviceId = localStorage.getItem("deviceId");
  if (existingDeviceId) return existingDeviceId;

  const newDeviceId = "xxxx-xxxx-xxxx-xxxx".replace(/[x]/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  });

  localStorage.setItem("deviceId", newDeviceId);
  return newDeviceId;
}

// Handle Foreground Firebase Messages
function handleFirebaseForegroundMessage() {
  onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);

    // Extract ride data from payload.data
    const rideData = payload.data || {};

    // Fire a custom event with the ride info payload
    const rideEvent = new CustomEvent("newRideRequest", { detail: rideData });
    window.dispatchEvent(rideEvent);
  });
}

// Handle Token Refresh
function handleTokenRefresh(loggedInUser) {
  
  if (!loggedInUser) return;

  onTokenRefresh(messaging, async (loggedInUser) => {

    const newToken = await getToken(messaging);
    console.log("New FCM Token:", newToken);

    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();

    // Send this updated token to your backend here
    await AuthUtils.apiRequest(AuthUtils.API_ENDPOINTS.registerDeviceToken, {
      method: "POST",
      body: JSON.stringify({ fcmToken: newToken, userId : loggedInUser?.id, deviceId : deviceId, deviceType : "web" }),
    });

  });
}
// Firebase Cloud Meaasging Handlers ----- END -----


document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header-container", "header.html");
  await loadComponent("footer-container", "footer.html");
  setTimeout(updateNav, 100);

  // Start tracking location
  startLocationTracking();

  // Firebase Cloud Messaging
  const loggedInUser = AuthUtils.getUserInfo();
  await registerServiceWorker(); // Register service worker once
  await registerToken(loggedInUser);
  handleFirebaseForegroundMessage(); // Handle the Firebase messages foreground
  // handleTokenRefresh(loggedInUser); // Listen for token refreshes
});

window.addEventListener("newRideRequest", (event) => {
  if (window.location.pathname !== "/html/driver/dashboard.html") {
    // Show simple notification fallback
    const rideInfo = event.detail;

    if (Notification.permission === "granted") {
      new Notification("New Ride Request", {
        body: `Pickup: ${rideInfo.pickup_address || "Unknown location"} \nDrop: ${rideInfo.dropoff_address} \nFare: ${rideInfo.fare}`,
        icon: "/img/default_icon.png",
      });
    }
  }
});



// // Listen for messages from service worker
// navigator.serviceWorker.addEventListener('message', (event) => {
//   const { type, ride_id, payload } = event.data;

//   if (type === 'joinRideRoom') {
//     console.log(`Joining ride room: ride_${ride_id}`);
//     socket.emit('joinRideRoom', ride_id);

//     // Emit ride update
//     socket.emit('rideUpdate', payload); // or payload.ride_id, etc.
//   }
// });