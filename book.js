document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('booking-form');

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        const formData = new FormData(form);
        const googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSetOX8LdoCREB8kZGOetri6VA331Cytzv2Bi8WkU9dxXKhIdQ/formResponse';

        // Map form data to Google Form fields
        const submissionData = new URLSearchParams();
        submissionData.append('entry.954361757', formData.get('full_name'));
        submissionData.append('entry.841028548', formData.get('email'));
        submissionData.append('entry.715078990', formData.get('telephone'));
        submissionData.append('entry.737583946', formData.get('project_details'));

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