import { AuthUtils } from "./auth-utils.js";

class RegisterForm {
  constructor() {
    this.form = document.getElementById("registerForm");
    this.registerBtn = document.getElementById("registerBtn");
    this.alertContainer = document.getElementById("alert-container");
    this.roleSelect = document.getElementById("role");
    this.driverFields = document.getElementById("driverFields");

    this.init();
  }

  init() {
    this.form.addEventListener("submit", this.handleSubmit.bind(this));

    // Toggle driver-only fields
    this.roleSelect.addEventListener("change", (e) => {
      this.driverFields.style.display = e.target.value === "driver" ? "block" : "none";
    });
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.form);

    // Convert FormData to object for debugging (not used for sending)
    const dataObj = {};
    formData.forEach((value, key) => (dataObj[key] = value));
    console.log("Register form data:", dataObj);

    if (!this.validateForm(dataObj)) return;

    AuthUtils.setButtonLoading(this.registerBtn, true, "Signing Up...", "Sign Up");

    try {
      const result = await AuthUtils.apiRequest(AuthUtils.API_ENDPOINTS.register, {
        method: "POST",
        body: formData, // FormData will carry text + files
      });

      console.log("Register response:", result);

      if (result.success) {
        if (dataObj.email) {
          // Store pending email for OTP verification
          localStorage.setItem(AuthUtils.STORAGE_KEYS.pendingEmail, dataObj.email);
        }

        AuthUtils.showAlert(
          this.alertContainer,
          "Registration successful! Check your email for OTP.",
          "success",
          3000
        );

        setTimeout(() => {
          window.location.href = "verify-otp.html";
        }, 2000);
      } else {
        AuthUtils.showAlert(
          this.alertContainer,
          result.error || "Registration failed.",
          "error"
        );
      }
    } catch (err) {
      console.error("Network/Request Error:", err);
      AuthUtils.showAlert(this.alertContainer, "Network error. Please try again.", "error");
    } finally {
      AuthUtils.setButtonLoading(this.registerBtn, false, "Signing Up...", "Sign Up");
    }
  }

  validateForm(data) {
    if (!data.email || !data.password || !data.role) {
      AuthUtils.showAlert(this.alertContainer, "Please fill in all required fields.", "error");
      return false;
    }

    if (!AuthUtils.isValidEmail(data.email)) {
      AuthUtils.showAlert(this.alertContainer, "Please enter a valid email address.", "error");
      return false;
    }

    // Extra validation for drivers
    if (data.role === "driver") {
      const avatar = this.form.querySelector('input[name="avatar"]').files[0];
      const license = this.form.querySelector('input[name="license"]').files[0];
      const aadhar = this.form.querySelector('input[name="aadhar"]').files[0];

      if (!data.license_number || !data.license_expiry_date || !data.aadhar_number) {
        AuthUtils.showAlert(
          this.alertContainer,
          "Please fill in license number, expiry date, and Aadhaar number.",
          "danger"
        );
        return false;
      }

      if (!avatar || !license || !aadhar) {
        AuthUtils.showAlert(
          this.alertContainer,
          "Please upload avatar, license, and Aadhaar images.",
          "danger"
        );
        return false;
      }
    }

    return true;
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  new RegisterForm();
});
