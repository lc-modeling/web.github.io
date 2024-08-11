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

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);
        const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScV1iTNkIB307Np3Vx8FkMU4xji8ImhZHuPI39WmpbF4pZpOQ/formResponse';

        // Map form data to Google Form fields
        const submissionData = new URLSearchParams();
        submissionData.append('entry.1907795357', formData.get('full_name'));
        submissionData.append('entry.300714677', formData.get('email'));
        submissionData.append('entry.1172669734', formData.get('telephone'));
        submissionData.append('entry.324115376', formData.get('nationality'));
        submissionData.append('entry.1606537056', formData.get('county'));
        submissionData.append('entry.1016435535', formData.get('preferred_course'));
        submissionData.append('entry.1624775783', formData.get('start_date'));

        fetch(googleFormUrl, {
            method: 'POST',
            body: submissionData,
            mode: 'no-cors' // Prevents CORS errors
        }).then(() => {
            alert('Form submitted successfully!');
            form.reset();
        }).catch(error => {
            console.error('Error submitting form:', error);
            alert('There was an error submitting the form.');
        });
    });
});