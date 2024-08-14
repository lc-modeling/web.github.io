document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('online-classes-form');
    const nationalitySelect = document.getElementById('online_nationality');
    const countySelect = document.getElementById('online_county');

    // Fetch countries and populate nationality select
    function fetchCountries() {
        fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/countries.json')
            .then(response => response.json())
            .then(data => {
                data.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country.name;
                    option.textContent = country.name;
                    nationalitySelect.appendChild(option);
                });
            });
    }

    // Fetch states based on selected country
    function fetchStates(country, targetSelect) {
        fetch('https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/states.json')
            .then(response => response.json())
            .then(data => {
                targetSelect.innerHTML = '';
                data.forEach(state => {
                    if (state.country_name === country) {
                        const option = document.createElement('option');
                        option.value = state.name;
                        option.textContent = state.name;
                        targetSelect.appendChild(option);
                    }
                });
            });
    }

    nationalitySelect.addEventListener('change', function() {
        fetchStates(this.value, countySelect);
    });

    fetchCountries();

    
});