import { AuthUtils } from "../user/auth-utils.js";
import socket from "../socket.js";

// const urlParams = new URLSearchParams(window.location.search);
// const rideId = urlParams.get('ride_id');

// if (rideId) {
//   console.log("Ride ID from URL:", rideId);

//   // Now connect to socket and emit join
//   socket.emit('joinRideRoom', rideId);
//   socket.to(`ride_${rideId}`).emit('rideUpdate', rideId);
// }

socket.on('rideUpdate', async (data) => {
    try {
        console.log("in here th eovker");
        
        setTimeout(async () => {
            await refreshRideCard();
        }, 100);
    } catch (error) {
        console.error(error);
    }
});

let currentRide = null; // global ride object

// Global alert container
const alertContainer = document.getElementById("alert-container");

document.addEventListener("DOMContentLoaded", async function () {

    const loggedInUser = AuthUtils.getUserInfo();
    if (!loggedInUser) {
        window.location.href = "/html/user/login.html";
        return;
    }


    // Extract user details
    const userId = loggedInUser?.id || null;
    const firstname = loggedInUser?.firstname || "Driver";
    const lastname = loggedInUser?.lastname || "User";
    const username = firstname + " " + lastname;

    // Update welcome message
    const heroHeading = document.querySelector(".hero-text h2");
    if (heroHeading) {
        heroHeading.textContent = `Welcome, ${username} 👋`;
    }

    try {
        // 1. Vehicle info
        const vehicleRes = await AuthUtils.apiRequest(
            AuthUtils.API_ENDPOINTS.getActiveVehicle,
            { method: "GET" }
        );
        if (vehicleRes.success && vehicleRes.data?.data) {
            const vehicle = vehicleRes.data.data;
            const vehicleInfoElement = document.querySelector(
                ".card p"
            );
            if (vehicleInfoElement) {
                vehicleInfoElement.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`;
            }
        }

        // 2. Wallet info
        const walletUrl = AuthUtils.API_ENDPOINTS.getDriverWalletDetails.replace(
            ":driver_id",
            encodeURIComponent(userId)
        );
        const walletRes = await AuthUtils.apiRequest(walletUrl, { method: "GET" });
        if (walletRes.success && walletRes.data?.data) {
            const wallet = walletRes.data.data;
            const totalElement = document.getElementById("wallet-total");
            const availableElement = document.getElementById("wallet-available");
            if (totalElement) {
                totalElement.textContent =
                    wallet.total_balance?.toLocaleString("en-IN") || "0";
            }
            if (availableElement) {
                availableElement.textContent =
                    wallet.actual_balance?.toLocaleString("en-IN") || "0";
            }
        }

        // 3. Ongoing rides (initial load)
        await refreshRideCard();
    } catch (err) {
        console.error("Failed to load dashboard data:", err);
        AuthUtils.showAlert(alertContainer, "Failed to load dashboard data.", "error", 3000);
    }

    // Start Driving button
    const startDrivingBtn = document.getElementById("start-driving-btn");
    if (startDrivingBtn) {
        const userProfileData = await AuthUtils.apiRequest(
            AuthUtils.API_ENDPOINTS.getUserProfile,
            { method: "GET" }
        );
        if (userProfileData?.success && userProfileData.data?.data) {
            if (userProfileData.data.data.isAvailable) {
                startDrivingBtn.textContent = "Stop Driving";
                startDrivingBtn.classList.remove("primary");
                startDrivingBtn.classList.add("danger");
            } else {
                startDrivingBtn.textContent = "Start Driving";
                startDrivingBtn.classList.remove("danger");
                startDrivingBtn.classList.add("primary");
            }
        }

        startDrivingBtn.addEventListener("click", async () => {
            const driverId = loggedInUser?.id;
            if (!driverId) {
                AuthUtils.showAlert(alertContainer, "User not authenticated.", "error", 3000);
                return;
            }

            try {
                const isStarting =
                    startDrivingBtn.textContent.trim() === "Start Driving";

                const res = await AuthUtils.apiRequest(
                    AuthUtils.API_ENDPOINTS.setDriverAvailableForRide,
                    {
                        method: "POST",
                        body: JSON.stringify({ isAvailable: isStarting }),
                    }
                );

                if (res.success && res.status === 200) {
                    if (isStarting) {
                        startDrivingBtn.textContent = "Stop Driving";
                        startDrivingBtn.classList.remove("primary");
                        startDrivingBtn.classList.add("danger");
                        AuthUtils.showAlert(alertContainer, "Driving session started!", "success", 3000);
                    } else {
                        startDrivingBtn.textContent = "Start Driving";
                        startDrivingBtn.classList.remove("danger");
                        startDrivingBtn.classList.add("primary");
                        AuthUtils.showAlert(alertContainer, "Driving session stopped!", "info", 3000);
                    }
                } else {
                    AuthUtils.showAlert(alertContainer, "Something went wrong.", "error", 3000);
                }
            } catch (error) {
                console.error("Failed to toggle driving state:", error);
                AuthUtils.showAlert(alertContainer, "Failed to update driving state. Please try again.", "error", 3000);
            }
        });
    }
});

/* ---------- Ride Card Helpers ---------- */
async function refreshRideCard() {
    const ongoingRideCard = document.getElementById("ongoing-ride-card");
    if (!ongoingRideCard) return;

    try {
        const ridesRes = await AuthUtils.apiRequest(
            AuthUtils.API_ENDPOINTS.getOngoingRidesDriver,
            { method: "GET" }
        );
        console.log(ridesRes);
        const rideDetailsContainer = document.getElementById("ride-details");

        if (ridesRes.success && ridesRes.data?.data) {
            const ride = ridesRes.data.data;
            currentRide = ride;

            socket.emit('joinRideRoom', ride.ride_id);

            // Update ride info
            rideDetailsContainer.innerHTML = `
                <p><strong>Rider:</strong> <span id="rider-name">${(ride.Rider?.firstname + " " + ride.Rider?.lastname) || "Unknown"}</span></p>
                <p><strong>Pickup:</strong> <span id="pickup-location">${ride.pickup_address || "-"}</span></p>
                <p><strong>Drop:</strong> <span id="drop-location">${ride.dropoff_address || "-"}</span></p>
                <p><strong>Fare:</strong> ₹ <span id="ride-fare">${ride.fare || "0"}</span></p>
                <p><strong>Status:</strong> <span id="ride-status">${ride.ride_status
                    ? ride.ride_status.charAt(0).toUpperCase() + ride.ride_status.slice(1).toLowerCase()
                    : "-"}</span></p>
            `;

            toggleRideUI(ride.ride_status);
        } else {
            rideDetailsContainer.innerHTML = "<p>No rides currently.</p>";
            ongoingRideCard.querySelector(".ride-actions").classList.add("hidden");
            currentRide = null;
        }
    } catch (err) {
        console.error("Failed to refresh ride:", err);
        AuthUtils.showAlert(document.getElementById("alert-container"), "Failed to refresh rides.", "error", 3000);
    }
}

function toggleRideUI(status) {
    const otpField = document.getElementById("entered-otp");
    const arrivedBtn = document.getElementById("arrived-btn");
    const startBtn = document.getElementById("start-ride-btn");
    const cancelBtn = document.getElementById("cancel-ride-btn");
    const cancelReasonInput = document.getElementById("cancel-reason");
    const completeBtn = document.getElementById("complete-ride-btn");
    const mapLinkBtn = document.getElementById("maps-link");

    [otpField, arrivedBtn, startBtn, cancelReasonInput, cancelBtn, completeBtn, mapLinkBtn].forEach(
        (el) => el?.classList.add("hidden")
    );
    document.querySelector(".ride-actions").classList.remove("hidden");
    

    switch (status) {
        case "accepted":
            arrivedBtn.classList.remove("hidden");
            cancelReasonInput.classList.remove("hidden");
            cancelBtn.classList.remove("hidden");
            break;
        case "driver_arrived":
            otpField.classList.remove("hidden");
            startBtn.classList.remove("hidden");
            cancelReasonInput.classList.remove("hidden");
            cancelBtn.classList.remove("hidden");
            break;
        case "ongoing":
            completeBtn.classList.remove("hidden");
            mapLinkBtn.classList.remove("hidden");
            break;
    }
}

/* ---------- Ride Action Buttons ---------- */
const arrivedBtn = document.getElementById("arrived-btn");
const startBtn = document.getElementById("start-ride-btn");
const cancelBtn = document.getElementById("cancel-ride-btn");
const cancelReasonInput = document.getElementById("cancel-reason");
const completeBtn = document.getElementById("complete-ride-btn");
const enteredOtp = document.getElementById("entered-otp");
const mapLinkBtn = document.getElementById("maps-link");

arrivedBtn?.addEventListener("click", async () => {
    if (!currentRide) return AuthUtils.showAlert(alertContainer, "No active ride found.", "error", 3000);

    try {
        const url = AuthUtils.API_ENDPOINTS.driverArrived.replace(
            ":id",
            encodeURIComponent(currentRide.ride_id)
        );
        const res = await AuthUtils.apiRequest(url, { method: "POST" });

        if (res.success) {
            AuthUtils.showAlert(alertContainer, "Marked as arrived!", "success", 3000);
            await refreshRideCard();
        } else {
            AuthUtils.showAlert(alertContainer, res.error || "Failed to mark arrived.", "error", 3000);
        }
    } catch (err) {
        console.error(err);
        AuthUtils.showAlert(alertContainer, "Unexpected error while marking arrived.", "error", 3000);
    }
});

startBtn?.addEventListener("click", async () => {
    if (!currentRide) return AuthUtils.showAlert(alertContainer, "No active ride found.", "error", 3000);

    if (!enteredOtp.value) return AuthUtils.showAlert(alertContainer, "Please enter the OTP!", "warning", 3000);

    try {
        const url = AuthUtils.API_ENDPOINTS.startRide.replace(
            ":id",
            encodeURIComponent(currentRide.ride_id)
        );
        const res = await AuthUtils.apiRequest(url, {
            method: "POST",
            body: JSON.stringify({ otp: enteredOtp.value }),
        });

        if (res.success) {
            AuthUtils.showAlert(alertContainer, "Ride started!", "success", 3000);
            await refreshRideCard();
        } else {
            AuthUtils.showAlert(alertContainer, res.error || "Failed to start ride.", "error", 3000);
        }
    } catch (err) {
        console.error(err);
        AuthUtils.showAlert(alertContainer, "Unexpected error while starting ride.", "error", 3000);
    }
});

cancelBtn?.addEventListener("click", async () => {
    if (!currentRide) return AuthUtils.showAlert(alertContainer, "No active ride found.", "error", 3000);

    const reason = cancelReasonInput.value.trim();
    if (!reason) {
        AuthUtils.showAlert(alertContainer, "Please provide a reason for cancellation.", "warning", 3000);
        return;
    }

    try {
        const url = AuthUtils.API_ENDPOINTS.cancelRide.replace(
            ":id",
            encodeURIComponent(currentRide.ride_id)
        );
        const cancelRideRes = await AuthUtils.apiRequest(url, { 
            method: "POST",
            body : JSON.stringify({reason})
        });

        if (cancelRideRes.success) {
            AuthUtils.showAlert(alertContainer, "Ride cancelled.", "success", 3000);
            await refreshRideCard();
        } else {
            AuthUtils.showAlert(alertContainer, cancelRideRes.error || "Failed to cancel ride.", "error", 3000);
        }
    } catch (err) {
        console.error(err);
        AuthUtils.showAlert(alertContainer, "Unexpected error while cancelling ride.", "error", 3000);
    }
});

completeBtn?.addEventListener("click", async () => {
    if (!currentRide) return AuthUtils.showAlert(alertContainer, "No active ride found.", "error", 3000);

    try {
        const url = AuthUtils.API_ENDPOINTS.completeRide.replace(
            ":id",
            encodeURIComponent(currentRide.ride_id)
        );
        const res = await AuthUtils.apiRequest(url, { method: "POST", body : JSON.stringify({...currentRide}) });

        if (res.success) {
            AuthUtils.showAlert(alertContainer, "Ride completed!", "success", 3000);
            await refreshRideCard();
        } else {
            AuthUtils.showAlert(alertContainer, res.error || "Failed to complete ride.", "error", 3000);
        }
    } catch (err) {
        console.error(err);
        AuthUtils.showAlert(alertContainer, "Unexpected error while completing ride.", "error", 3000);
    }
});

mapLinkBtn?.addEventListener("click", (e) => {
    if (!currentRide) return AuthUtils.showAlert(alertContainer, "No active ride found.", "error", 3000);

    e.preventDefault();

    const { pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude } = currentRide;

    // Google Maps Directions URL
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickup_latitude},${pickup_longitude}&destination=${dropoff_latitude},${dropoff_longitude}&travelmode=driving`;

    // Open in new tab
    window.open(mapsUrl, "_blank");
});


window.addEventListener("newRideRequest", (event) => {
  const rideInfo = event.detail;
  const accept = confirm(`A new Ride request has arrived. \nPickup: ${rideInfo.pickup_address || "Unknown location"} \nDrop: ${rideInfo.dropoff_address} \nFare: ${rideInfo.fare}\nAccept ?`);
  if (accept) {
    acceptRide(rideInfo.ride_id);
  } else {
    ignoreRide(rideInfo.ride_id);
  }
});

// Helper functions
async function acceptRide(rideId) {
    try {
        const res = await fetch(`http://localhost:3000/ride/accept/${encodeURIComponent(rideId)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
            socket.emit("joinRideRoom", rideId);
            AuthUtils.showAlert(alertContainer, "Ride accepted!", "success", 3000);
            setTimeout(async () => {
                await refreshRideCard();
            }, 100);
        }
    } catch (err) {
        console.log(err);
        AuthUtils.showAlert(alertContainer, "Unexpected error while accepting ride.", "error", 3000);
    }
}

async function ignoreRide(rideId) {
    try {
        const res = await fetch(`http://localhost:3000/ridematch/ignore`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rideId: rideId })
        });
        if (res.ok) {
            AuthUtils.showAlert(alertContainer, "Ride ignored.", "info", 3000);
        } else {
            AuthUtils.showAlert(alertContainer, "Failed to ignore ride. Please try again.", "error", 3000);
        }
    } catch (err) {
        console.error("Ignore ride error:", err);
        AuthUtils.showAlert(alertContainer, "Unexpected error while ignoring ride.", "error", 3000);
    }
}