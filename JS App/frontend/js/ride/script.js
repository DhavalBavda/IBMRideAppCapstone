document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
        alert(`🎉 Payment successful for Ride ${params.get("rideId")}, Fare: ₹${params.get("fare")}`);
    }
});

const apiKey = "j21hFbZv2E0RTPmoyaSngSwC7C2WBGM3"; // Your TomTom API key

class UberMapService {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentRoute = null;
        this.suggestionTimeouts = new Map();
        this.init();
    }

    init() {
        // Wait for DOM and TomTom SDK to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeMap());
        } else {
            this.initializeMap();
        }
    }

    initializeMap() {
        if (typeof tt === 'undefined') {
            console.error('TomTom SDK not loaded');
            this.showMapError('TomTom SDK not loaded. Please check your internet connection.');
            return;
        }

        console.log('🗺️ Initializing TomTom map...');

        try {
            // Initialize map with proper style configuration
            this.map = tt.map({
                key: apiKey,
                container: "map",
                center: [77.5946, 12.9716], // Bangalore coordinates
                zoom: 12,
                // Use basic style without problematic URL scheme
                style: {
                    map: 'basic_main'
                },
                dragPan: true,
                scrollZoom: true,
                interactive: true
            });

            // Handle map load event
            this.map.on('load', () => {
                console.log('✅ Map loaded successfully!');
                this.onMapLoaded();
            });

            // Handle map errors
            this.map.on('error', (error) => {
                console.error('Map error:', error);
                this.showMapError(`Map error: ${error.message || 'Unknown error'}`);
            });

        } catch (error) {
            console.error('Map initialization failed:', error);
            this.showMapError(`Map initialization failed: ${error.message}`);
        }
    }

    onMapLoaded() {
        // Add controls
        this.map.addControl(new tt.NavigationControl());

        // Force resize to ensure proper display
        setTimeout(() => {
            this.map.resize();
        }, 100);

        // Setup event listeners
        this.setupEventListeners();

        // Hide loading indicator
        this.showMapLoading(false);

        console.log('🎉 Map setup complete!');
    }

    showMapError(message) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                    border-radius: 10px;
                    flex-direction: column;
                    text-align: center;
                    padding: 20px;
                    color: #666;
                ">
                    <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                    <div style="font-weight: 600; margin-bottom: 8px; color: #333;">Map Error</div>
                    <div style="font-size: 14px; margin-bottom: 16px; max-width: 300px;">${message}</div>
                    <button onclick="location.reload()" style="
                        padding: 8px 16px;
                        background: #000;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Reload Page</button>
                </div>
            `;
        }
    }

    setupEventListeners() {
        const pickupInput = document.getElementById("pickup");
        const dropoffInput = document.getElementById("dropoff");
        const searchBtn = document.getElementById("searchBtn");

        if (!pickupInput || !dropoffInput || !searchBtn) {
            console.error('Required form elements not found');
            return;
        }

        // Autocomplete for pickup
        pickupInput.addEventListener('input', (e) => {
            this.handleInputChange(e.target, 'pickup');
        });

        // Autocomplete for dropoff  
        dropoffInput.addEventListener('input', (e) => {
            this.handleInputChange(e.target, 'dropoff');
        });

        // Search button
        searchBtn.addEventListener('click', () => this.handleSearch());

        // Enter key support
        [pickupInput, dropoffInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        });

        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                this.clearAllSuggestions();
            }
        });

        console.log('✅ Event listeners setup complete');
    }

    handleInputChange(inputElement, type) {
        const query = inputElement.value.trim();

        // Clear previous timeout
        if (this.suggestionTimeouts.has(type)) {
            clearTimeout(this.suggestionTimeouts.get(type));
        }

        // Clear suggestions if query is too short
        if (query.length < 3) {
            this.clearSuggestions(inputElement);
            return;
        }

        // Debounce API calls
        const timeout = setTimeout(async () => {
            await this.showAutocompleteSuggestions(inputElement, query);
        }, 300);

        this.suggestionTimeouts.set(type, timeout);
    }

    async showAutocompleteSuggestions(inputElement, query) {
        try {
            const suggestions = await this.fetchSuggestions(query);
            this.renderSuggestions(inputElement, suggestions);
        } catch (error) {
            console.warn('Autocomplete failed:', error);
        }
    }

    async fetchSuggestions(query) {
        const response = await fetch(
            `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${apiKey}&limit=5&countrySet=IN&typeahead=true`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.results?.map(result => ({
            address: result.address.freeformAddress,
            coords: [result.position.lon, result.position.lat],
            type: result.type || 'Point Address'
        })) || [];
    }

    renderSuggestions(inputElement, suggestions) {
        this.clearSuggestions(inputElement);

        if (suggestions.length === 0) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-suggestions';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;

        suggestions.forEach((suggestion, index) => {
            const option = document.createElement('div');
            option.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                font-size: 14px;
                line-height: 1.4;
                transition: background-color 0.2s;
            `;

            option.innerHTML = `
                <div style="font-weight: 500; color: #333;">${suggestion.address}</div>
                <div style="font-size: 12px; color: #666; margin-top: 2px;">${suggestion.type}</div>
            `;

            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = '#f8f9fa';
            });

            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = 'white';
            });

            option.addEventListener('click', (e) => {
                e.stopPropagation();
                inputElement.value = suggestion.address;
                inputElement.dataset.coords = JSON.stringify(suggestion.coords);
                this.clearSuggestions(inputElement);
            });

            dropdown.appendChild(option);
        });

        // Position dropdown
        const formGroup = inputElement.closest('.form-group');
        formGroup.style.position = 'relative';
        formGroup.appendChild(dropdown);
    }

    clearSuggestions(inputElement) {
        const formGroup = inputElement.closest('.form-group');
        const existing = formGroup.querySelector('.autocomplete-suggestions');
        if (existing) {
            existing.remove();
        }
    }

    clearAllSuggestions() {
        document.querySelectorAll('.autocomplete-suggestions').forEach(el => el.remove());
    }

    async getCoordinates(query, inputElement = null) {
        // First check if coordinates are already stored from autocomplete
        if (inputElement?.dataset.coords) {
            try {
                const coords = JSON.parse(inputElement.dataset.coords);
                return {
                    coords: coords,
                    name: inputElement.value,
                    confidence: 1
                };
            } catch (e) {
                // Continue with API call if parsing fails
            }
        }

        if (!query?.trim()) return null;

        try {
            const response = await fetch(
                `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query.trim())}.json?key=${apiKey}&countrySet=IN&limit=1`
            );

            if (!response.ok) {
                throw new Error(`Geocoding failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.results?.[0]) {
                const result = data.results[0];
                return {
                    coords: [result.position.lon, result.position.lat],
                    name: result.address.freeformAddress,
                    confidence: result.score || 1
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }

    clearRoute() {
        if (this.map.getSource('route')) {
            this.map.removeLayer('route-line');
            this.map.removeSource('route');
        }
        this.currentRoute = null;
        this.hideRouteInfo();
    }

    addMarker(coords, color, text, isPickup = true) {
        const marker = new tt.Marker({
            color: color,
            scale: 1.2
        })
            .setLngLat(coords)
            .setPopup(
                new tt.Popup({
                    offset: [0, -40],
                    closeButton: true,
                    className: 'uber-popup'
                }).setHTML(`
                <div style="padding: 8px; max-width: 200px;">
                    <div style="font-weight: 600; color: ${color}; margin-bottom: 4px;">
                        ${isPickup ? '🟢 Pickup' : '🔴 Dropoff'}
                    </div>
                    <div style="font-size: 13px; color: #333; line-height: 1.3;">
                        ${text}
                    </div>
                </div>
            `)
            )
            .addTo(this.map);

        this.markers.push(marker);
        return marker;
    }

    async drawRoute(start, end) {
        try {
            this.showMapLoading(true);

            const response = await fetch(
                `https://api.tomtom.com/routing/1/calculateRoute/${start.coords[1]},${start.coords[0]}:${end.coords[1]},${end.coords[0]}/json?key=${apiKey}&routeType=fastest&traffic=true&departAt=now`
            );

            if (!response.ok) {
                throw new Error(`Routing failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.routes?.[0]?.legs) {
                const route = data.routes[0];
                const coordinates = route.legs[0].points.map(pt => [
                    pt.longitude || pt.lon,
                    pt.latitude || pt.lat
                ]);

                this.clearRoute();

                this.map.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    }
                });

                this.map.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    paint: {
                        'line-color': '#000',
                        'line-width': 4,
                        'line-opacity': 0.8
                    }
                });

                this.currentRoute = route.summary;
                this.showRouteInfo(route.summary);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Route drawing error:', error);
            return false;
        } finally {
            this.showMapLoading(false);
        }
    }

    showRouteInfo(summary) {
        // Remove existing route info
        this.hideRouteInfo();

        const distanceKm = (summary.lengthInMeters / 1000).toFixed(1);
        const timeMinutes = Math.round(summary.travelTimeInSeconds / 60);
        const timeDisplay = timeMinutes > 60 ?
            `${Math.floor(timeMinutes / 60)}h ${timeMinutes % 60}m` :
            `${timeMinutes}m`;

        const routeInfo = document.createElement('div');
        routeInfo.id = 'route-info-panel';
        routeInfo.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 200px;
            font-family: Arial, sans-serif;
        `;

        routeInfo.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <div style="font-weight: 600; font-size: 16px;">Route Details</div>
                <button onclick="document.getElementById('route-info-panel').remove()" 
                    style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">×</button>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="margin-right: 8px;">🚗</span>
                <span style="font-weight: 500;">${distanceKm} km</span>
            </div>
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 8px;">⏰</span>
                <span style="font-weight: 500;">${timeDisplay}</span>
            </div>
        `;

        document.body.appendChild(routeInfo);
    }

    hideRouteInfo() {
        const existing = document.getElementById('route-info-panel');
        if (existing) {
            existing.remove();
        }
    }

    showMapLoading(show) {
        let loader = document.getElementById('map-loader');

        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'map-loader';
                loader.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 2000;
                    font-size: 14px;
                    font-weight: 500;
                `;
                loader.textContent = 'Loading...';
                document.getElementById('map').appendChild(loader);
            }
        } else {
            if (loader) {
                loader.remove();
            }
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.getElementById('notification');
        if (existing) existing.remove();

        const colors = {
            info: '#000',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };

        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type]};
            color: white;
            padding: 14px 24px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            font-weight: 500;
            font-size: 14px;
            max-width: 400px;
            text-align: center;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) translateY(-10px)';
                notification.style.transition = 'all 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    async handleSearch() {
        const pickupInput = document.getElementById("pickup");
        const dropoffInput = document.getElementById("dropoff");
        const searchBtn = document.getElementById("searchBtn");

        if (!this.map) {
            this.showNotification("Map is not ready yet. Please wait...", "warning");
            return;
        }

        const pickupQuery = pickupInput.value.trim();
        const dropoffQuery = dropoffInput.value.trim();

        if (!pickupQuery || !dropoffQuery) {
            this.showNotification("Please enter both pickup and dropoff locations", "warning");
            pickupInput.focus();
            return;
        }

        // Update button state
        const originalText = searchBtn.textContent;
        searchBtn.textContent = "Searching...";
        searchBtn.disabled = true;
        searchBtn.style.opacity = "0.6";

        this.clearAllSuggestions();

        try {
            this.showNotification("Finding locations...", "info");

            const [pickupData, dropoffData] = await Promise.all([
                this.getCoordinates(pickupQuery, pickupInput),
                this.getCoordinates(dropoffQuery, dropoffInput)
            ]);

            if (!pickupData) {
                this.showNotification("Pickup location not found. Please try a more specific address.", "error");
                pickupInput.focus();
                return;
            }

            if (!dropoffData) {
                this.showNotification("Dropoff location not found. Please try a more specific address.", "error");
                dropoffInput.focus();
                return;
            }

            // Clear existing data
            this.clearMarkers();
            this.clearRoute();

            // Add markers
            this.addMarker(pickupData.coords, "#28a745", pickupData.name, true);
            this.addMarker(dropoffData.coords, "#dc3545", dropoffData.name, false);

            // Fit bounds
            const bounds = new tt.LngLatBounds();
            bounds.extend(pickupData.coords);
            bounds.extend(dropoffData.coords);
            this.map.fitBounds(bounds, {
                padding: 60,
                maxZoom: 16
            });

            // Force resize after bounds change
            setTimeout(() => {
                this.map.resize();
            }, 100);

            // Draw route
            const routeSuccess = await this.drawRoute(pickupData, dropoffData);

            if (routeSuccess) {
                this.showNotification("Route found! Ready to book your ride.", "success");
                // handleStartRide();
            } else {
                this.showNotification("Locations found but route unavailable.", "warning");
            }

        } catch (error) {
            console.error('Search error:', error);
            this.showNotification("Something went wrong. Please try again.", "error");
        } finally {
            // Reset button
            searchBtn.textContent = originalText;
            searchBtn.disabled = false;
            searchBtn.style.opacity = "1";
        }
    }
}

// Initialize the app
let uberMap;

// Wait for everything to be ready
function initializeApp() {
    console.log('🚀 Initializing Uber Map App...');
    uberMap = new UberMapService();

    // Make it globally accessible for debugging
    window.uberMapInstance = uberMap;
}

// Initialize based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Handle page resize
window.addEventListener('resize', () => {
    if (uberMap && uberMap.map) {
        setTimeout(() => {
            uberMap.map.resize();
        }, 100);
    }
});