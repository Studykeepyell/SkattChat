document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed");

    const fileInput = document.getElementById('upload-img');
    const profileImg = document.getElementById('profile-img');
    const uploadForm = document.getElementById('upload-form');
    const userId = localStorage.getItem('userId');
    
    // Load profile image and username from localStorage on page load
    const savedImageURL = localStorage.getItem('profileImageURL');
    const savedUsername = localStorage.getItem('username');

    if (savedImageURL) {
        profileImg.src = savedImageURL;
        profileImg.style.display = 'block';
    }

    if (savedUsername) {
        document.getElementById('username').value = savedUsername; // Display saved username
    } else {
        console.warn("No username found in localStorage");
    }

    // Preview the image when selected
    fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                profileImg.src = e.target.result; // Preview the selected image
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload image to the server on form submit
    uploadForm.onsubmit = async function(event) {
        event.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        try {
            const response = await fetch(`/api/uploadProfileImage/${userId}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                localStorage.setItem('profileImageURL', result.imageUrl); // Save URL in localStorage
                alert('Profile image uploaded successfully!');
            } else {
                console.error('Image upload failed:', result.message);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    // Save profile information when "Save" button is clicked
    document.getElementById('save-profile').addEventListener('click', async () => {
        console.log("Save button clicked");

        const username = document.getElementById('username').value;
        const profileImageURL = localStorage.getItem('profileImageURL');

        console.log("Saving profile with:", { userId, username, profileImageURL });

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, profileImage: profileImageURL })
            });
            const result = await response.json();

            if (result.success) {
                alert('Profile saved successfully!');
                localStorage.setItem('username', username); // Update username in localStorage
            } else {
                console.error('Profile save failed:', result.message);
                alert('Failed to save profile.');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    });
});
