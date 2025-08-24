document.addEventListener("DOMContentLoaded", function () {
  // Initialize EmailJS
  emailjs.init("4FWgmfHCRbCX00_Nu");

  const forms = document.querySelectorAll("form");
  const modal = document.getElementById("partnerModal"); // The popup/modal

  forms.forEach(form => {
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      // Prevent duplicate submission
      if (form.classList.contains("is-submitting")) return;
      form.classList.add("is-submitting");

      const formData = new FormData(form);
      const formDetails = {};
      let content = "";

      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          try {
            const base64Image = await handleImageUpload(value);
            const imageUrl = await uploadImageToCloud(base64Image);
            content += `[${key.replace(/_/g, " ")}]: ${imageUrl}\n`;
          } catch (error) {
            console.log("Image upload failed", error);
          }
        } else {
          content += `[${key.replace(/_/g, " ")}]: ${value}\n`;
        }
      }

      formDetails["message"] = content;
      formDetails["to_name"] = "Recipient"; // Customize as needed

      emailjs.send("service_0blnmok", "template_a8hwyud", formDetails)
        .then(response => {
          // Success
          form.reset();
          form.classList.remove("is-submitting");

          // Close the popup/modal after 2 seconds if it's open
          if (modal && modal.style.display !== "none") {
            setTimeout(() => {
              modal.style.display = "none";
            }, 2000);
          }
        })
        .catch(error => {
          console.log("FAILED...", error);
          form.classList.remove("is-submitting");
        });
    });
  });
});
