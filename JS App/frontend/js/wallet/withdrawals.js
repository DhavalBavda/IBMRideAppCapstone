import { AuthUtils } from "../../js/user/auth-utils.js";

const userInfo = AuthUtils.getUserInfo();
console.log(userInfo);

if (userInfo && userInfo.id) {
    const driverId = userInfo.id;
    const apiUrl = AuthUtils.API_ENDPOINTS.withdrawAmount.replace(":driver_id", driverId);

    const tbody = document.getElementById("withdrawals-body");
    const paginationControls = document.getElementById("pagination-controls");

    let withdrawals = [];
    let currentPage = 1;
    const rowsPerPage = 5;

    function renderTable() {
        tbody.innerHTML = "";
        const start = (currentPage - 1) * rowsPerPage;
        const paginatedItems = withdrawals.slice(start, start + rowsPerPage);

        paginatedItems.forEach((data, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${start + index + 1}</td>
                <td>${data.account_holder_name || ''}</td>
                <td>${data.account_number || ''}</td>
                <td>₹ ${parseFloat(data.amount || 0).toFixed(2)}</td>
                <td>${data.bank_name || ''}</td>
                <td>${data.ifsc_code || ''}</td>
                <td>${data.contact_info || ''}</td>
                <td class="${data.status === 'COMPLETE' ? 'status-active' : 'status-inactive'}">
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

        const totalPages = Math.ceil(withdrawals.length / rowsPerPage);

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

        // Page numbers
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

    AuthUtils.apiRequest(apiUrl)
        .then(response => {
            if (response.success && response.data && Array.isArray(response.data.data)) {
                withdrawals = response.data.data;
                renderTable();
            } else {
                tbody.innerHTML = `<tr><td colspan="9">Failed to load withdrawal data.</td></tr>`;
                console.error("API error:", response.error);
            }
        })
        .catch(error => {
            tbody.innerHTML = `<tr><td colspan="9">Error loading withdrawal data.</td></tr>`;
            console.error("Network error:", error);
        });

} else {
    const tbody = document.getElementById("withdrawals-body");
    tbody.innerHTML = `<tr><td colspan="9">User information not available.</td></tr>`;
    console.error("Driver ID not found in user_info");
}
