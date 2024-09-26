function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('settings'));
    return settings || {}; // Ensure that settings is an object, even if it's null
}

window.addEventListener('load', function () {
    let currentUrl = window.location.href;

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

    function handleAd(articleElement) {
        const settings = loadSettings();
        const kmPerDayThreshold = settings.kmPerDayThreshold || 0;

        const mileage = parseInt(articleElement.getAttribute('data-mileage'), 10);
        const firstRegistration = articleElement.getAttribute('data-first-registration');

        // Call the calculation function
        const kilometersPerDay = calculateKilometersPerDay(mileage, firstRegistration);


        const speedometerElement = articleElement.querySelector('[data-testid="sellerinfo-section"]');

        const clonedElement = speedometerElement.cloneNode(true);

        clonedElement.innerHTML = `
            <svg width="18" height="18" color="currentColor" viewBox="0 0 24 24"><use xlink:href="/assets/as24-search-funnel/icons/icons-sprite-9b029e50.svg#speedometer"></use></svg>km per day: ${kilometersPerDay}
        `;
        if (kilometersPerDay > kmPerDayThreshold) {
            clonedElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'; // Highlight in red
        }

        // Append the cloned element to the same container as the original speedometer
        speedometerElement.parentElement.appendChild(clonedElement);

    }

    function addKilometersPerDay() {
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
    addKilometersPerDay();
    // Monitor URL changes (works for SPAs where the URL changes without a reload)
    const checkForUrlChange = () => {
        if (currentUrl !== window.location.href) {
            currentUrl = window.location.href;
            console.log('URL changed: ', currentUrl);
            addKilometersPerDay(); // Re-apply the plugin when URL changes
        }
    };

    setInterval(checkForUrlChange, 1000); // Poll for URL changes every second

});
