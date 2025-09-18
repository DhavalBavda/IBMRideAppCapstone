export async function loadRideHistory() {
    const rideHistoryList = document.getElementById("rideHistoryList");
    const modal = document.getElementById("rateRideModal");
    const closeModal = document.getElementById("closeRateModal");
    const ratingInput = document.getElementById("rideRating");
    const reviewInput = document.getElementById("rideReview");
    const submitBtn = document.getElementById("submitRating");

    rideHistoryList.innerHTML = '<p class="no-rides">Loading ride history...</p>';

    try {
        const response = await fetch("http://localhost:3000/ride/", {
            method: "GET",
            credentials: "include"
        });
        const data = await response.json();

        if (!data.success || !data.data || data.data.length === 0) {
            rideHistoryList.innerHTML = '<p class="no-rides">No ride history available.</p>';
            return;
        }

        const historyRides = data.data.filter(r =>
            r.ride_status === "cancelled" || r.ride_status === "rejected" ||
            (r.ride_status === "completed" && r.payment_status === "completed")
        );

        const uniqueHistoryRides = Array.from(new Map(historyRides.map(r => [r.ride_id, r])).values());

        if (!historyRides.length) {
            rideHistoryList.innerHTML = '<p class="no-rides">No ride history.</p>';
            return;
        }

        rideHistoryList.innerHTML = "";

        for (const ride of uniqueHistoryRides) {
            const rideEl = document.createElement("div");
            rideEl.classList.add("ride-history-item");

            const driverInfo = ride.Driver
                ? `<p><strong>Driver:</strong> ${ride.Driver.firstname} ${ride.Driver.lastname}</p>
                   <p><strong>Phone:</strong> ${ride.Driver.phone}</p>`
                : "<p><strong>Driver:</strong> Not Assigned</p>";

            const vehicleInfo = ride.Vehicle
                ? `<p><strong>Vehicle:</strong> ${ride.Vehicle.model} (${ride.Vehicle.color})</p>
                   <p><strong>Reg. No:</strong> ${ride.Vehicle.registration_number}</p>`
                : "<p><strong>Vehicle:</strong> Not Assigned</p>";

            // Fetch rating
            let ratingHtml = "<p><strong>Rating:</strong> Not given</p>";
            let hasRated = false;
            try {
                const ratingRes = await fetch(`http://localhost:3000/rating/ratings/${ride.ride_id}`, {
                    method: "GET",
                    credentials: "include"
                });
                const ratingData = await ratingRes.json();
                if (ratingRes.ok && ratingData.data) {
                    hasRated = true;
                    ratingHtml = `
                        <p><strong>Rating:</strong> ⭐ ${ratingData.data.score}/5</p>
                        ${ratingData.data.comment ? `<p><strong>Comment:</strong><em>${ratingData.data.comment}</em></p>` : ""}
                    `;
                }
            } catch (err) {
                console.error(`Failed to fetch rating for ride ${ride.ride_id}:`, err);
            }

            // 🔹 Default payment html
            let paymentHtml = "<p><strong>Payment:</strong> Not available</p>";

            try {
                const payRes = await fetch(`http://localhost:3000/payment/paymentDetails/${ride.ride_id}`, {
                    method: "GET",
                    credentials: "include"
                });
                const payData = await payRes.json();

                if (payRes && payData) {
                    const p = payData
                    paymentHtml = `
            <p><strong>Payment Status:</strong> ${p.status}</p>
            <p><strong>Payment Id:</strong> ${p.payment_id}</p>
            <p><strong>Amount:</strong> ₹ ${String(p.amount).replace(/,/g, "")}</p>
            <p><strong>Payment Method:</strong> ${p.payment_method}</p>
            <p><strong>Created At:</strong> ${p.created_at}</p>
        `;
                }
            } catch (err) {
                console.error(`❌ Failed to fetch payment details for ride ${ride.ride_id}:`, err);
            }

            rideEl.innerHTML = `
                <p><strong>Pickup:</strong> ${ride.pickup_address}</p>
                <p><strong>Drop:</strong> ${ride.dropoff_address}</p>
                <p><strong>Ride Status:</strong> ${ride.ride_status}</p>
                <p><strong>Payment Status:</strong> ${ride.payment_status}</p>
                ${paymentHtml}
                ${driverInfo}
                ${vehicleInfo}
                ${ratingHtml}
                ${ride.ride_status === "completed" && !hasRated
                    ? `<button class="rate-ride-btn" data-ride-id="${ride.ride_id}">Rate Ride</button>`
                    : ""}
            `;

            if (!document.querySelector(`[data-ride-id="${ride.ride_id}"]`)) {
                rideHistoryList.appendChild(rideEl);
            }
        }

        // Attach event listeners for "Rate Ride" buttons
        document.querySelectorAll(".rate-ride-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const rideId = e.target.dataset.rideId;

                // Show modal and clear inputs
                modal.style.display = "block";
                ratingInput.value = "";
                reviewInput.value = "";

                // Submit rating
                submitBtn.onclick = async () => {
                    const score = parseInt(ratingInput.value);
                    const comment = reviewInput.value;

                    if (!score || score < 1 || score > 5) {
                        alert("Rating must be between 1 and 5");
                        return;
                    }

                    try {
                        const res = await fetch("http://localhost:3000/rating/ratings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ rideid: rideId, score, comment })
                        });
                        const resData = await res.json();
                        if (resData.message) {
                            alert("Rating submitted ✅");
                            modal.style.display = "none";
                            loadRideHistory(); // refresh ride history
                        } else {
                            alert("Failed to submit rating: " + (resData.message || ""));
                        }
                    } catch (err) {
                        console.error(err);
                        alert("Error submitting rating. Check console.");
                    }
                };
            });
        });

        // Modal close handlers
        closeModal.onclick = () => { modal.style.display = "none"; };
        window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };

    } catch (err) {
        console.error("Failed to load ride history:", err);
        rideHistoryList.innerHTML = '<p class="no-rides">Failed to load ride history.</p>';
    }
}

// Load ride history on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    const refreshBtn = document.getElementById("refreshBtn");

    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            console.log("🔄 Refreshing requested rides...");
            loadRideHistory(); // call your existing function
        });
    }

    // Load rides initially
    loadRideHistory();
});