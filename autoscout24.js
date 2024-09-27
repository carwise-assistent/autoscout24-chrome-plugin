function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings'));
    return settings || {}; // Ensure that settings is an object, even if it's null
}

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params.entries());
}

window.addEventListener('load', function () {
    let hash = window.location.href + getQueryParams();

    console.log('autoscout24.js loaded');

    function transformToDate(dateString) {
        // Split the date string by the hyphen
        const [month, year] = dateString.split('-');

        // JavaScript's Date object expects the month to be zero-indexed (0 for January, 11 for December)
        const dateObject = new Date(year, parseInt(month, 10) - 1); // Subtract 1 from month to get zero-indexed month

        return dateObject;
    }

    function calculateKilometersPerDay(mileage, firstRegistration) {
        const today = new Date();
        const registrationDate = transformToDate(firstRegistration);

        // Calculate the difference in time between today and first registration
        const diffTime = Math.abs(today - registrationDate);

        // Convert time difference to days
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Calculate kilometers per day
        const kilometersPerDay = mileage / diffDays;

        return kilometersPerDay.toFixed(2); // Return rounded to 2 decimals
    }

    function calculateKilometersPerYear(kilometersPerDay) {
        const daysInYear = 365.25; // Account for leap years
        const kilometersPerYear = kilometersPerDay * daysInYear;
        return kilometersPerYear.toFixed(2);
    }

    function handleAd(articleElement) {
        const settings = loadSettings();
        const kmPerDayThreshold = settings.kmPerDayThreshold || 0;

        const mileage = parseInt(articleElement.getAttribute('data-mileage'), 10);
        const firstRegistration = articleElement.getAttribute('data-first-registration');

        // Call the calculation function
        const kilometersPerDay = calculateKilometersPerDay(mileage, firstRegistration);
        const kilometersPerYear = calculateKilometersPerYear(kilometersPerDay);

        function findSellerElement() {
            const sellerSection = articleElement.querySelector('[data-testid="sellerinfo-section"]');
            if (sellerSection !== null) {
                return sellerSection;
            }
            const privateSeller = document.querySelectorAll('[class^="SellerInfo_private"]');
            if (privateSeller.length > 0) {
                return privateSeller[0];
            }
            return null;
        }

        const sellerSection = findSellerElement();
        if (sellerSection === null) {
            return;
        }

        // Create a new element to display the kilometers data
        const kmElement = document.createElement('div');
        kmElement.classList.add('km-info-container'); // Add a class for easy styling

        // Add content using modern, semantic HTML
        kmElement.innerHTML = `
        <div class="km-info">
            <span class="km-label"><strong>Avg km per day:</strong></span> 
            <span class="km-value">${kilometersPerDay}</span>
        </div>
        <div class="km-info">
            <span class="km-label"><strong>Avg km per year:</strong></span> 
            <span class="km-value">${kilometersPerYear}</span>
        </div>
    `;

        // Apply additional styling based on threshold
        if (kilometersPerDay > kmPerDayThreshold) {
            kmElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'; // Highlight in red if above threshold
            kmElement.style.border = '1px solid red'; // Add a border to make it more visible
        } else {
            kmElement.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'; // Highlight in green if below threshold
            kmElement.style.border = '1px solid green'; // Add a border to make it more visible
        }

        // General styling to make the kmElement look fancy
        kmElement.style.display = 'block';
        kmElement.style.padding = '10px';
        kmElement.style.marginTop = '10px';
        kmElement.style.borderRadius = '8px';
        kmElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        kmElement.style.backgroundColor = '#f9f9f9'; // Light gray background for clarity
        kmElement.style.fontFamily = 'Arial, sans-serif';
        kmElement.style.fontSize = '14px';

        // Optionally, add a tooltip for more information
        kmElement.title = "Average kilometers based on the car's mileage and registration date.";

        // Append the fancy kmElement to the seller section
        sellerSection.parentElement.appendChild(kmElement);
    }

    function addKilometersMetrics() {
        const vehicleArticles = document.querySelectorAll('.list-page-item');
        vehicleArticles.forEach(article => {
            handleAd(article);
        });
    }

    function setThreshold(event) {
        const kmPerDayThreshold = parseFloat(event.target.value);
        const settings = loadSettings();
        settings.kmPerDayThreshold = kmPerDayThreshold;
        saveSettings(settings);
        location.reload(); // Reload the page to apply the new threshold
    }

    // Create the modal settings window
    function createSettingsModal() {
        const settings = loadSettings();
        const kmPerDayThreshold = settings.kmPerDayThreshold || 0;

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.padding = '20px';
        modal.style.backgroundColor = 'white';
        modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        modal.style.zIndex = '1000';
        modal.style.display = 'none'; // Hide by default

        // Input for km per day threshold
        const thresholdLabel = document.createElement('label');
        thresholdLabel.innerText = 'Set km/day threshold: ';
        const thresholdInput = document.createElement('input');
        thresholdInput.type = 'number';
        thresholdInput.value = kmPerDayThreshold;
        thresholdInput.addEventListener('change', setThreshold);

        thresholdLabel.appendChild(thresholdInput);
        modal.appendChild(thresholdLabel);

        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.style.marginTop = '10px';
        closeButton.addEventListener('click', function () {
            modal.style.display = 'none';
        });

        modal.appendChild(closeButton);

        document.body.appendChild(modal);

        return modal; // Return the modal element for later use
    }

    // Inject the settings modal button into a div with the class 'top-info-list'
    const targetDiv = document.querySelector('.hfo-header__nav__right');
    if (targetDiv) {
        const settingsButton = document.createElement('button');
        settingsButton.innerText = 'Plugin Settings';

        const modal = createSettingsModal(); // Create the modal and store it

        settingsButton.addEventListener('click', function () {
            modal.style.display = 'block'; // Show the modal on button click
        });

        // Append the settings button into the target div
        targetDiv.appendChild(settingsButton);
    } else {
        console.error('Could not find the target div');
    }
    addKilometersMetrics();
    // Monitor URL changes (works for SPAs where the URL changes without a reload)
    const checkForUrlChange = () => {
        const currentHash = window.location.href + getQueryParams();
        if (hash !== currentHash) {
            hash = currentHash;
            addKilometersMetrics(); // Re-apply the plugin when URL changes
        }
    };

    setInterval(checkForUrlChange, 1000); // Poll for URL changes every second
});
