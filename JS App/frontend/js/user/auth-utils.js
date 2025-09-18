/**
 * Shared Authentication Utilities
 * Common functions used across all authentication pages
 */

export class AuthUtils {
  static BASE_URL = "http://localhost:3000";
  // API endpoints configuration
  static API_ENDPOINTS = {
    register: `${this.BASE_URL}/user/register`,
    login: `${this.BASE_URL}/user/login`,
    logout: `${this.BASE_URL}/user/logout`,
    verifyOtp: `${this.BASE_URL}/user/verify-otp`,
    resendOtp: `${this.BASE_URL}/user/resend-otp`,
    adminLogin: `${this.BASE_URL}/user/admin/login`,
    forgotPassword: `${this.BASE_URL}/user/forgot-password`,
    verifyPasswordOtp: `${this.BASE_URL}/user/verify-password-otp`,
    resetPassword: `${this.BASE_URL}/user/reset-password`,
    recoverAccount: `${this.BASE_URL}/user/recover-account`,
    getUserProfile: `${this.BASE_URL}/user/profile`,
    updateUserLocation: `${this.BASE_URL}/user/update-location`,

    // Device token
    registerDeviceToken: `${this.BASE_URL}/device/registerDevice`,
    deRegisterDeviceToken: `${this.BASE_URL}/device/deRegisterDevice`,


    // driver-dashboard
    getActiveVehicle : `${this.BASE_URL}/vehicle/active-vehicle`,
    getDriverWalletDetails : `${this.BASE_URL}/wallet/driver-wallet/:driver_id`,
    getOngoingRidesDriver : `${this.BASE_URL}/ride/ongoing/driver`,
    setDriverAvailableForRide : `${this.BASE_URL}/user/set-available`,
    withdrawAmount : `${this.BASE_URL}/wallet/withdraw/:driver_id`,
    getPaymentsforWallet : `${this.BASE_URL}/analysis/get-payment/:wallet_id`,
    
    getActiveVehicle: `${this.BASE_URL}/vehicle/active-vehicle`,
    getDriverWalletDetails: `${this.BASE_URL}/wallet/driver-wallet/:driver_id`,
    getOngoingRidesDriver: `${this.BASE_URL}/ride/ongoing/driver`,
    setDriverAvailableForRide: `${this.BASE_URL}/user/set-available`,
    driverRideHistory: `${this.BASE_URL}/ride/history/driver`,

    // Ride Apis
    startRide : `${this.BASE_URL}/ride/start/:id`,
    driverArrived : `${this.BASE_URL}/ride/driver-arrive/:id`,
    cancelRide : `${this.BASE_URL}/ride/cancel/:id`,
    completeRide : `${this.BASE_URL}/ride/complete/:id`,
    acceptRide : `${this.BASE_URL}/ride/accept/:id`,
    ignoreRide : `${this.BASE_URL}/ridematch/ignore/:id`,

    //vehicle Apis
    viewMyVehicles: `${this.BASE_URL}/vehicle/my`,
    updateVehicle: `${this.BASE_URL}/vehicle/update/:id`,
    registerVehicle: `${this.BASE_URL}/vehicle/register`,
    deleteVehicle: `${this.BASE_URL}/vehicle/delete/:id`,
    viewVehicleDetails: `${this.BASE_URL}/vehicle/:id`,




  }

  // Local storage keys
  static STORAGE_KEYS = {
    authToken: "authToken",
    adminToken: "adminToken",
    userRole: "role",
    pendingEmail: "pendingEmail",
    resetEmail: "resetEmail",
    resetToken: "resetToken",
  }

  // Cookie store keys
  static COOKIE_STORE_KEYS = {
    userInfo: "user_info",
    // Add other cookie keys here if needed in the future
  }


  /**
   * Validate email format
   * @param {string} email
   * @returns {boolean}
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate phone number format
   * @param {string} phone
   * @returns {boolean}
   */
  static isValidPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, "")
    return cleanPhone.length >= 10 && cleanPhone.length <= 15
  }

  /**
   * Check password strength
   * @param {string} password
   * @returns {object} strength info
   */
  static checkPasswordStrength(password) {
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^a-zA-Z0-9]/.test(password),
    }

    Object.values(checks).forEach((check) => {
      if (check) score++
    })

    const levels = [
      { text: "Very Weak", color: "#dc2626", percentage: 20 },
      { text: "Weak", color: "#ea580c", percentage: 40 },
      { text: "Fair", color: "#ca8a04", percentage: 60 },
      { text: "Good", color: "#16a34a", percentage: 80 },
      { text: "Strong", color: "#15803d", percentage: 100 },
    ]

    return {
      ...(levels[score] || levels[0]),
      score,
      checks,
    }
  }

  /**
   * Format file size for display
   * @param {number} bytes
   * @returns {string}
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  /**
   * Show loading state on button
   * @param {HTMLElement} button
   * @param {boolean} loading
   * @param {string} loadingText
   * @param {string} normalText
   */
  static setButtonLoading(button, loading, loadingText = "Loading...", normalText = "Submit") {
    if (loading) {
      button.innerHTML = `<span class="spinner"></span>${loadingText}`
      button.disabled = true
    } else {
      button.innerHTML = normalText
      button.disabled = false
    }
  }

  /**
   * Show alert message
   * @param {HTMLElement} container
   * @param {string} message
   * @param {string} type
   * @param {number} autoHide
   */
  static showAlert(container, message, type = "info", autoHide = 0) {
    container.innerHTML = `
            <div class="alert alert-${type}">
                ${message}
            </div>
        `

    if (autoHide > 0) {
      setTimeout(() => {
        container.innerHTML = ""
      }, autoHide)
    }

    // Scroll to show alert
    container.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  /**
   * Clear alert message
   * @param {HTMLElement} container
   */
  static clearAlert(container) {
    container.innerHTML = ""
  }

  /**
   * Make API request with error handling
   * @param {string} url
   * @param {object} options
   * @returns {Promise<{success: boolean, data?: any, error?: string, status?: number}>}
   */
  static async apiRequest(url, options = {}) {
    const isFormData = options.body instanceof FormData;

    const defaultOptions = {
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      let data = null;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text || null;
      }

      if (!response.ok) {
        return {
          success: false,
          error: data?.message || `HTTP error! status: ${response.status}`,
          status: response.status,
        };
      }

      return { success: true, data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Network error occurred",
        status: null,
      };
    }
  }



  /**
   * Store authentication token
   * @param {string} token
   * @param {boolean} isAdmin
   */
  static storeAuthToken(token, isAdmin = false) {
    const key = isAdmin ? this.STORAGE_KEYS.adminToken : this.STORAGE_KEYS.authToken
    localStorage.setItem(key, token)

    if (isAdmin) {
      localStorage.setItem(this.STORAGE_KEYS.userRole, "admin")
    }
  }

  /**
   * Get authentication token
   * @param {boolean} isAdmin
   * @returns {string|null}
   */
  static getAuthToken(isAdmin = false) {
    const key = isAdmin ? this.STORAGE_KEYS.adminToken : this.STORAGE_KEYS.authToken
    return localStorage.getItem(key)
  }

  /**
   * Clear authentication data
   */
  static clearAuthData() {
    Object.values(this.STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })
    sessionStorage.clear()
  }

  /**
   * Check if user is authenticated
   * @param {boolean} isAdmin
   * @returns {boolean}
   */
  static isAuthenticated(isAdmin = false) {
    return !!this.getAuthToken(isAdmin)
  }

  /**
   * Redirect with delay
   * @param {string} url
   * @param {number} delay
   */
  static redirectTo(url, delay = 0) {
    setTimeout(() => {
      window.location.href = url
    }, delay)
  }

  /**
   * Debounce function calls
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  static debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * Copy text to clipboard
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        return true
      } catch (err) {
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }

  /**
   * Generate random string
   * @param {number} length
   * @returns {string}
   */
  static generateRandomString(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Format date for display
   * @param {Date|string} date
   * @returns {string}
   */
  static formatDate(date) {
    const d = new Date(date)
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  /**
  * Get user_info cookie and parse it as JSON
  * @returns {object|null} Parsed user info object or null if not found/invalid
  */
  static getUserInfo() {
    const cookieName = this.COOKIE_STORE_KEYS.userInfo + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(cookieName) === 0) {
        const cookieValue = cookie.substring(cookieName.length);
        try {
          return JSON.parse(cookieValue);
        } catch (e) {
          console.error("Failed to parse user_info cookie:", e);
          return null;
        }
      }
    }
    return null; // cookie not found
  }


}

// // Export for use in other files
window.AuthUtils = AuthUtils
