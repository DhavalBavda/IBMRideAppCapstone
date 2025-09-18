import { AuthUtils } from "../../js/user/auth-utils.js";

const userInfo = AuthUtils.getUserInfo();

const tbody = document.getElementById("transactions-body");
const paginationControls = document.getElementById("pagination-controls");

let transactions = [];
let currentPage = 1;
const rowsPerPage = 5;

function renderTable() {
    tbody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const paginatedItems = transactions.slice(start, start + rowsPerPage);

    paginatedItems.forEach((data, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${start + index + 1}</td>
            <td>₹ ${parseFloat(data.amount || 0).toFixed(2)}</td>
            <td class="${data.status === 'SUCCESS' ? 'status-success' : 'status-failed'}">
                ${data.status || ''}
            </td>
            <td>${new Date(data.created_at).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });

    renderPagination();
}

function renderPagination() {
    paginationControls.innerHTML = "";

    const totalPages = Math.ceil(transactions.length / rowsPerPage);

    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.disabled = currentPage === 1;
    if (prevButton.disabled) prevButton.classList.add("disabled");
    prevButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.disabled = currentPage === totalPages;
    if (nextButton.disabled) nextButton.classList.add("disabled");
    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });

    paginationControls.appendChild(prevButton);

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;
        if (i === currentPage) {
            pageButton.classList.add("disabled");
        }
        pageButton.addEventListener("click", () => {
            currentPage = i;
            renderTable();
        });
        paginationControls.appendChild(pageButton);
    }

    paginationControls.appendChild(nextButton);
}

if (userInfo && userInfo.id) {
    const driverId = userInfo.id;
    const walletApiUrl = AuthUtils.API_ENDPOINTS.getDriverWalletDetails.replace(":driver_id", driverId);

    // First fetch the wallet details to get wallet_id
    AuthUtils.apiRequest(walletApiUrl)
        .then(walletResponse => {
            if (walletResponse.success && walletResponse.data) {
                const walletId = walletResponse.data.wallet_id;
                const transactionApiUrl = AuthUtils.API_ENDPOINTS.getPaymentsforWallet.replace(":wallet_id", walletId);

                // Now fetch the transactions using the wallet_id
                return AuthUtils.apiRequest(transactionApiUrl);
            } else {
                throw new Error("Failed to fetch wallet details");
            }
        })
        .then(transactionResponse => {
            if (transactionResponse.success && transactionResponse.data && Array.isArray(transactionResponse.data.data)) {
                transactions = transactionResponse.data.data;
                renderTable();
            } else {
                tbody.innerHTML = `<tr><td colspan="4">No transactions found.</td></tr>`;
                console.error("Failed to load transactions");
            }
        })
        .catch(error => {
            tbody.innerHTML = `<tr><td colspan="4">Error loading data.</td></tr>`;
            console.error("Error:", error.message);
        });

} else {
    tbody.innerHTML = `<tr><td colspan="4">User information not available.</td></tr>`;
    console.error("Driver ID not found in user info");
}
