// Configuration
const RAMADAN_START = new Date('2024-03-10');
const EID_AL_FITR = new Date('2024-04-09');
let currentLocation = { lat: null, lng: null };

// DOM Elements
const elements = {
    loading: document.querySelector('.loading'),
    error: document.querySelector('.error-message'),
    geolocationBtn: document.getElementById('geolocation-btn')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await populateCountrySelect();
    await getGeolocation();
});

async function populateCountrySelect() {
    const response = await fetch('https://api.aladhan.com/v1/counts');
    const countries = await response.json();
    
    const countrySelect = document.getElementById('country-select');
    countries.data.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
    });
}

async function getGeolocation() {
    elements.loading.style.display = 'block';
    elements.error.textContent = '';
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        await updatePrayerTimes();
    } catch (error) {
        elements.error.textContent = 'Geolocation blocked. Please select manually.';
        currentLocation = { lat: 3.1390, lng: 101.6869 }; // Default to Kuala Lumpur
    } finally {
        elements.loading.style.display = 'none';
    }
}

async function updatePrayerTimes() {
    try {
        const { data } = await getPrayerTimes(currentLocation.lat, currentLocation.lng);
        const timings = data.timings;
        
        // Update DOM elements
        document.getElementById('fajr-time').textContent = timings.Fajr;
        document.getElementById('sunrise-time').textContent = timings.Sunrise;
        document.getElementById('dhuhr-time').textContent = timings.Dhuhr;
        document.getElementById('asr-time').textContent = timings.Asr;
        document.getElementById('maghrib-time').textContent = timings.Maghrib;
        
        // Update countdowns
        startCountdowns(timings);
    } catch (error) {
        elements.error.textContent = 'Failed to fetch prayer times. Please try again.';
    }
}

function startCountdowns(timings) {
    const updateInterval = 1000; // 1 second
    
    function update() {
        const now = new Date();
        
        // Ramadan countdown
        const ramadanDays = Math.floor((now - RAMADAN_START) / (86400000));
        const eidCountdown = Math.ceil((EID_AL_FITR - now) / (86400000));
        document.getElementById('ramadan-countdown').textContent = 
            `${ramadanDays} Days | ${eidCountdown} to Eid`;

        // Prayer time countdowns
        Object.entries(timings).forEach(([prayer, time]) => {
            const [hours, minutes] = time.split(':').map(Number);
            const prayerDate = new Date();
            prayerDate.setHours(hours, minutes, 0, 0);
            
            if (prayerDate < now) prayerDate.setDate(prayerDate.getDate() + 1);
            
            const diff = prayerDate - now;
            const hoursLeft = Math.floor(diff / 3600000);
            const minutesLeft = Math.floor((diff % 3600000) / 60000);
            
            if (document.getElementById(`${prayer.toLowerCase()}-timer`)) {
                document.getElementById(`${prayer.toLowerCase()}-timer`).textContent = 
                    `${hoursLeft}h ${minutesLeft}m`;
            }
        });
    }

    update();
    setInterval(update, updateInterval);
}