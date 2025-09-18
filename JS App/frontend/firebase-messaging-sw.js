importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBGcHy8oxKeDgolTXNOj2naQl7VkOejqX",
    authDomain: "fcm-demo-5be57.firebaseapp.com",
    projectId: "fcm-demo-5be57",
    storageBucket:  "fcm-demo-5be57.firebasestorage.app",
    messagingSenderId: "325809546502",
    appId: "1:325809546502:web:a7bbcdc71419e83d072a87",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(payload);

  const { title, body, icon, actions, ...restData } = payload.data || {};

  console.log("FCM Payload:", JSON.stringify(payload, null, 2));

  const notificationOptions = {
    body,
    icon: icon || "/img/default_icon.png",
    data: restData,
    actions: []
  };

  try {
    if (actions) {
      notificationOptions.actions = JSON.parse(actions);
    }
  } catch (err) {
    console.warn("Failed to parse actions:", err);
  }

  self.registration.showNotification(title || "New Notification", notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.notification);

  const notificationData = event.notification.data || {};

  event.waitUntil((async () => {
    try {
      if (event.action === "acceptRide") {
        console.log("User accepted the ride.");

        // Hardcoded or environment-based API endpoint URL for accept ride
        const acceptRideUrl = `http://localhost:3000/ride/accept/${encodeURIComponent(notificationData.ride_id)}`;

        await fetch(acceptRideUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        // // Send message to MAIN THREAD to emit socket event
        // const allClients = await clients.matchAll({ type: 'window' });
        // if (allClients.length > 0) {
        //   allClients[0].postMessage({
        //     type: 'joinRideRoom',
        //     ride_id: notificationData.ride_id,
        //     payload: notificationData  // Send full data if needed
        //   });
        // }
        //  else {
        //   // No open window: open one and pass ride ID in URL as fallback
        //   await clients.openWindow(`/html/driver/driver-dashboard.html?ride_id=${notificationData.ride_id}`);
        // }


        await clients.openWindow("/html/driver/driver-dashboard.html");

      } else if (event.action === "ignoreRide") {
        console.log("User ignored the ride.");

        const ignoreRideUrl = `http://localhost:3000/ridematch/ignore`;

        await fetch(ignoreRideUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body : JSON.stringify({rideId : notificationData.ride_id})
        });

      } else {
        await clients.openWindow("/html/driver/driver-dashboard.html");
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }

    event.notification.close();
  })());
});