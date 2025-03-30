// static/js/finder.js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Leaflet map
    const map = L.map('map').setView([28.6692, 77.4538], 13); // Centered on Ghaziabad
    // const map = L.map('map').setView([51.505, -0.09], 13); // Default center (London)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const searchButton = document.getElementById('searchButton');
    const locationInput = document.getElementById('locationInput');
    const hospitalList = document.getElementById('hospitalList');

    searchButton.addEventListener('click', () => {
        const location = locationInput.value.trim();
        if (!location) {
            alert('Please enter a location.');
            return;
        }

        // Use Nominatim (OSM's free geocoding service) to get coordinates
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    alert('Location not found.');
                    return;
                }

                const { lat, lon } = data[0];
                map.setView([lat, lon], 13);

                // Search for hospitals using Overpass API (OSM data)
                const query = `
                    [out:json];
                node["amenity"="hospital"](around:5000,${lat},${lon});
                    out body;
                `;
                fetch('https://overpass-api.de/api/interpreter', {
                    method: 'POST',
                    body: query
                })
                .then(response => response.json())
                .then(hospitals => {
                    hospitalList.innerHTML = ''; // Clear previous results
                    hospitals.elements.forEach(hospital => {
                        if (hospital.tags && hospital.tags.name) {
                            const card = document.createElement('div');
                            card.className = 'hospital__card';
                            // <p>${hospital.tags["addr:street"] || 'Address not available'}</p>
                            // <p>${hospital.tags.phone || 'Phone not available'}</p>
                            card.innerHTML = `
                                <h3>${hospital.tags.name}</h3>
                                
                                <a href="https://www.openstreetmap.org/node/${hospital.id}" target="_blank">View on Map</a>
                            `;
                            hospitalList.appendChild(card);

                            // Add marker to map
                            L.marker([hospital.lat, hospital.lon])
                                .addTo(map)
                                .bindPopup(hospital.tags.name);
                        }
                    });
                })
                .catch(error => console.error('Error fetching hospitals:', error));
            })
            .catch(error => console.error('Error geocoding location:', error));
    });
});

// Include Leaflet.js (add this in your HTML head or at the bottom of finder.js if not already included)
const leafletScript = document.createElement('script');
leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
document.head.appendChild(leafletScript);

const leafletCSS = document.createElement('link');
leafletCSS.rel = 'stylesheet';
leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
document.head.appendChild(leafletCSS);