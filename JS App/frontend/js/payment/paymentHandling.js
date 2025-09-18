document.getElementById("payBtn").onclick = async function () {
const params = new URLSearchParams(window.location.search);
    console.log("Clicked Now");

    const payload = {
        ride_id: params.get("rideId"),
        rider_id: params.get("riderId"),
        driver_id: params.get("driverId"),
        amount: params.get("fare"),
        payment_method: "CARD"
    };

    try {
        // 1️⃣ Create Razorpay Order
        const response = await fetch("/payment/create-order/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            alert("Failed to create order: " + (data.error || "Unknown error"));
            return;
        }

        const options = {
            key: data.razorpay_key_id,
            amount: data.amount,
            currency: data.currency,
            name: "Test Ride App",
            description: "Test Payment",
            order_id: data.order_id,
            handler: async function (res) {
                try {
                    // 2️⃣ Verify payment
                    const verifyResponse = await fetch("/payment/verify-payment/", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_signature: res.razorpay_signature,
                            payment_id: data.payment_id , // Pass the exact Payment ID
                            ride_id: payload.ride_id  
                        })
                    });

                    const verifyData = await verifyResponse.json();
                    if (verifyResponse.ok) {
                        // alert("Payment successful: " + verifyData.message);
                        window.location.href = `/html/ride/ride.html?rideId=${payload.ride_id}&status=success&fare=${payload.amount}`;
                    } else {
                        alert("Payment verification failed: " + (verifyData.error || "Unknown error"));
                    }
                } catch (err) {
                    console.error("Verification error:", err);
                    alert("Error verifying payment.");
                }
            },
            prefill: {
                name: "Test User",
                email: "test@example.com",
                contact: "9999999999"
            },
            theme: { color: "#3399cc" },
            modal: { escape: true, backdropclose: false }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error("Error creating order:", error.response || error.message || error);
        alert("An error occurred while creating order.");
    }
};

document.getElementById("cashbtn").onclick = async function() {
    const params = new URLSearchParams(window.location.search);

    const payload = {
        ride_id: params.get("rideId"),
        rider_id: params.get("riderId"),
        driver_id: params.get("driverId"),
        amount: params.get("fare")
    };

    try {
        const response = await fetch("/payment/cash-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = `/html/ride/ride.html?rideId=${payload.ride_id}&status=success&fare=${payload.amount}`;
        } else {
            alert("Cash payment failed: " + (data.error || "Unknown error"));
        }
    } catch (err) {
        console.error("Error creating cash payment:", err);
        alert("Cash payment error");
    }
};
