import { handleFareRide, handleRequestRide } from "./backendCoordinates.js";
import { AuthUtils } from "../user/auth-utils.js";

import socket from "../socket.js";

socket.on('rideUpdate', async (data) => {
    try {
        console.log("in the soket rider");
        
        await loadRequestedRides();
    } catch (error) {
        console.error(error);
    }
});

const fareRideBtn = document.getElementById('searchBtn');
const requestRideBtn = document.getElementById('requestRide');

// Fare calculation
fareRideBtn.addEventListener('click', async () => {
    const coords = await handleFareRide();
    if (!coords) return;

    const payload = {
        cords: {
            pickup: [coords.pickupLng, coords.pickupLat],
            drop: [coords.dropoffLng, coords.dropoffLat]
        }
    };

    try {
        const response = await fetch('http://localhost:3000/analysis/fare-cal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById("distance").textContent = data.data.distance_km.toFixed(2);
            document.getElementById("duration").textContent = data.data.duration_minutes.toFixed(2);
            document.getElementById("fare").textContent = data.data.fare_estimate.toFixed(2);

            document.getElementById("fareResult").classList.remove("hidden");

            localStorage.setItem("latestFare", data.data.fare_estimate.toFixed(2));
            requestRideBtn.disabled = false;
        } else {
            alert("Could not calculate fare: " + data.message);
        }
    } catch (error) {
        console.error('Failed to send ride coordinates:', error);
    }
});

// Book Ride
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = AuthUtils.getUserInfo();
    if (!loggedInUser) {
        window.location.href = "/html/user/login.html";
        return;
    }

    const modal = document.getElementById("rideModal");
    const closeModal = document.getElementById("closeModal");

    requestRideBtn.disabled = true;

    requestRideBtn.addEventListener('click', async () => {
        const requestData = await handleRequestRide();
        if (!requestData) return;

        const latestFare = localStorage.getItem("latestFare") || "0";

        try {
            const response = await fetch('http://localhost:3000/ride/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success) {

                socket.emit("joinRideRoom", data.data.ride_id);

                document.getElementById("rideStatus").textContent = "Your ride is booked successfully ✅";
                document.getElementById("pickupText").textContent = requestData.pickup_address;
                document.getElementById("dropText").textContent = requestData.dropoff_address;
                document.getElementById("fareText").textContent = latestFare;

                requestRideBtn.disabled = true;
                modal.style.display = "block";

                loadRequestedRides();
            } else {
                alert(data.message || "Something went wrong!");
            }
        } catch (error) {
            console.error('Failed to request ride:', error);
        }
    });

    closeModal.onclick = () => { modal.style.display = "none"; };
    window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
});

// Load Active Rides
export async function loadRequestedRides() {
    const ridesList = document.getElementById("ridesList");
    ridesList.innerHTML = '<p class="no-rides">Loading rides...</p>';

    try {
        const response = await fetch("http://localhost:3000/ride/", {
            method: "GET",
            credentials: "include"
        });
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            ridesList.innerHTML = '<p class="no-rides">No active rides.</p>';
            return;
        }

        
        
        const activeRides = data.data.filter(r =>
            ["requested", "accepted", "ongoing", "driver_arrived"].includes(r.ride_status) ||
            (r.ride_status === "completed" && r.payment_status !== "completed")
        );
        
        if (activeRides.length) {
            ridesList.innerHTML = "";
            activeRides.forEach(ride => {
                socket.emit('joinRideRoom', ride.ride_id);
                const rideEl = document.createElement("div");
                rideEl.classList.add("ride-item");

                const fareToShow = `${parseFloat(localStorage.getItem("latestFare") || "0").toLocaleString("en-IN")}`;

                if (ride.ride_status === "requested") {
                    rideEl.innerHTML = `
                        <p><strong>Pickup:</strong> ${ride.pickup_address}</p>
                        <p><strong>Drop:</strong> ${ride.dropoff_address}</p>
                        <p><strong>Ride Status:</strong> ${ride.ride_status}</p>
                        <p><strong>Fare:</strong> ₹ ${fareToShow}</p>
                        <button class="cancel-btn" data-ride-id="${ride.ride_id}">Cancel Ride</button>
                    `;
                }
                else if (ride.ride_status === "completed" && ride.payment_status !== "completed") {
                    rideEl.innerHTML = `
                        <p><strong>Pickup:</strong> ${ride.pickup_address}</p>
                        <p><strong>Drop:</strong> ${ride.dropoff_address}</p>
                        <p><strong>Ride Status:</strong> ${ride.ride_status}</p>
                        <p><strong>Fare:</strong> ₹ ${fareToShow}</p>
                        ${ride.Driver ? `<p><strong>Driver:</strong> ${ride.Driver.firstname} ${ride.Driver.lastname}</p>` : ""}
                        ${ride.Driver ? `<p><strong>Phone:</strong> ${ride.Driver.phone}</p>` : ""}
                        ${ride.Vehicle ? `<p><strong>Vehicle Model:</strong> ${ride.Vehicle.model} </p>` : ""}
                        ${ride.Vehicle ? `<p><strong>Vehicle Color:</strong> ${ride.Vehicle.color}</p>` : ""}
                        ${ride.Vehicle ? `<p><strong>Registration Number:</strong> ${ride.Vehicle.registration_number}</p>` : ""}
                        <p><strong>Payment Status:</strong> ${ride.payment_status}</p>
                        <button  class="pay-now-btn" data-ride-id="${ride.ride_id}" data-driver-id="${ride.Driver?.user_id || ''}" data-rider-id="${ride.rider_id || ''}" data-fare="${fareToShow}" >Pay Now</button>          
                    `;
                }
                else {
                    // accepted / ongoing
                    rideEl.innerHTML = `
                        <p><strong>Pickup:</strong> ${ride.pickup_address}</p>
                        <p><strong>Drop:</strong> ${ride.dropoff_address}</p>
                        <p><strong>Ride Status:</strong> ${ride.ride_status}</p>
                        <p><strong>Fare:</strong> ₹ ${fareToShow}</p>
                        <p><strong>OTP:</strong> ${ride.otp}</p>
                        ${ride.Driver ? `<p><strong>Driver:</strong> ${ride.Driver.firstname} ${ride.Driver.lastname}</p>` : ""}
                        ${ride.Driver ? `<p><strong>Phone:</strong> ${ride.Driver.phone}</p>` : ""}
                        ${ride.Vehicle ? `<p><strong>Vehicle Model:</strong> ${ride.Vehicle.model} </p>` : ""}
                        ${ride.Vehicle ? `<p><strong>Vehicle Color:</strong> ${ride.Vehicle.color}</p>` : ""}
                        ${ride.Vehicle ? `<p><strong>Registration Number:</strong> ${ride.Vehicle.registration_number}</p>` : ""}
                        <p><strong>Payment Status:</strong> ${ride.payment_status}</p>
                        ${["accepted"].includes(ride.ride_status) ? `<button class="cancel-btn" data-ride-id="${ride.ride_id}">Cancel Ride</button>` : ""}
                    `;
                }
                ridesList.appendChild(rideEl);
            });
        } else {
            ridesList.innerHTML = '<p class="no-rides">No active rides.</p>';
        }
        // After appending all rides
        document.querySelectorAll(".cancel-btn").forEach(btn => {
            btn.addEventListener("click", async e => {
                const rideId = e.target.dataset.rideId;
                const reason = prompt("Why do you want to cancel this ride?");
                if (!reason) return;

                try {
                    const res = await fetch(`http://localhost:3000/ride/cancel/${rideId}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        credentials: "include",
                        body: JSON.stringify({ reason })
                    });

                    const resData = await res.json();
                    if (res.ok && resData.success) {
                        alert("Ride cancelled successfully ✅");
                        loadRequestedRides(); // refresh
                    } else {
                        alert("Error: " + (resData.message || "Failed to cancel ride"));
                    }
                } catch (err) {
                    console.error("Cancel error:", err);
                    alert("Cancel request failed. Check console.");
                }
            });
        });
        document.querySelectorAll(".pay-now-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const rideId = e.target.dataset.rideId;
                const driverId = e.target.dataset.driverId;
                const fare = e.target.dataset.fare;
                const riderId = e.target.dataset.riderId;

                // Redirect with query params
                window.location.href = `../../html/payment/checkout.html?rideId=${rideId}&riderId=${riderId}&driverId=${driverId}&fare=${fare}`;
            });
        });
    } catch (err) {
        console.error("Failed to load requested rides:", err);
        ridesList.innerHTML = '<p class="no-rides">Failed to load rides.</p>';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = AuthUtils.getUserInfo();
    if (!loggedInUser) {
        window.location.href = "/html/user/login.html";
        return;
    }
    const refreshBtn = document.getElementById("refreshBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            console.log("🔄 Refreshing requested rides...");
            loadRequestedRides(); // call your existing function
        });
    }

    // Load rides initially
    loadRequestedRides();
});
