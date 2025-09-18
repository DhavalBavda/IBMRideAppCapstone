import { AuthUtils } from "../user/auth-utils.js";

const userInfo = AuthUtils.getUserInfo();
console.log(AuthUtils.getUserInfo());
const balanceEl = document.getElementById("walletBalance");
const totalEarningsEl = document.getElementById("totalEarnings");
const withdrawBtn = document.querySelector(".withdraw-btn");

document.addEventListener("DOMContentLoaded", async function () {

    if (!userInfo) {
        window.location.href = "/html/user/login.html";
        return;
    }
    if (userInfo && userInfo.id) {
        const driverId = userInfo.id;

        // Build the API URL using the endpoint template
        const apiUrl = AuthUtils.API_ENDPOINTS.getDriverWalletDetails.replace(":driver_id", driverId);
        const withdrawUrl = AuthUtils.API_ENDPOINTS.withdrawAmount.replace(":driver_id", driverId);
        
        // Select the balance element
        const balanceEl = document.getElementById("walletBalance");
        const totalEarningsEl = document.getElementById("totalEarnings");
        console.log("Balance Element:", document.getElementById("walletBalance"));
        console.log("Total Earnings Element:", document.getElementById("totalEarnings"));

        // Fetch the wallet details
        AuthUtils.apiRequest(apiUrl)
            .then(response => {
                if (response.success && response.data && response.data.data) {
                    const data = response.data.data;
                    console.log("Actual Balance Raw:", data.actual_balance);
                    console.log("Total Balance Raw:", data.total_balance);

                    // Update the actual balance
                    balanceEl.textContent = `₹ ${parseFloat(data.actual_balance).toFixed(2)}`;

                    // Update the total balance
                    totalEarningsEl.textContent = `₹ ${parseFloat(data.total_balance).toFixed(2)}`;
                } else {
                    console.error("API error:", response.error);
                    balanceEl.textContent = "Error loading balance";
                    totalEarningsEl.textContent = "Error loading total earnings";
                }
            })
            .catch(error => {
                if (response.success && response.data) {
                    const data = response.data;

                    // Update the actual balance
                    balanceEl.textContent = `₹ ${parseFloat(data.actual_balance).toFixed(2)}`;

                    // Update the total balance
                    totalEarningsEl.textContent = `₹ ${parseFloat(data.total_balance).toFixed(2)}`;
                } else {
                    console.error("API error:", response.error);
                    balanceEl.textContent = "Error loading balance";
                    totalEarningsEl.textContent = "Error loading total earnings";
                }
            });
    
    withdrawBtn.addEventListener("click", () => {
        Swal.fire({
            title: 'Withdraw Funds',
            html: `
                <input id="amount" type="number" step="0.01" class="swal2-input" placeholder="Amount" required>
                <input id="account_holder_name" type="text" class="swal2-input" placeholder="Account Holder Name" required>
                <input id="bank_name" type="text" class="swal2-input" placeholder="Bank Name" required>
                <input id="ifsc_code" type="text" class="swal2-input" placeholder="IFSC Code" required>
                <input id="account_number" type="text" class="swal2-input" placeholder="Account Number" required>
                <input id="contact_info" type="text" class="swal2-input" placeholder="Contact Info" required>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Submit',
            preConfirm: () => {
                const amount = document.getElementById('amount').value;
                const account_holder_name = document.getElementById('account_holder_name').value;
                const bank_name = document.getElementById('bank_name').value;
                const ifsc_code = document.getElementById('ifsc_code').value;
                const account_number = document.getElementById('account_number').value;
                const contact_info = document.getElementById('contact_info').value;

                if (!amount || !account_holder_name || !bank_name || !ifsc_code || !account_number || !contact_info) {
                    Swal.showValidationMessage('Please fill all fields');
                    return;
                }

                return {
                    amount,
                    account_holder_name,
                    bank_name,
                    ifsc_code,
                    account_number,
                    contact_info
                };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const payload = result.value;

                // Send the withdraw request
                AuthUtils.apiRequest(withdrawUrl, {
                    method: "POST",
                    body: JSON.stringify(payload)
                })
                .then(response => {
                    if (response.success) {
                        Swal.fire('Success', 'Withdrawal request submitted!', 'success');
                    } else {
                        Swal.fire('Error', response.error || 'Something went wrong', 'error');
                    }
                })
                .catch(error => {
                    console.error("Withdraw request failed:", error);
                    Swal.fire('Error', 'Request failed', 'error');
                });
            }
        });
    });

    } else {
        console.error("Unexpected error:", error);
        balanceEl.textContent = "Error loading balance";
        totalEarningsEl.textContent = "Error loading total earnings";
    }
});