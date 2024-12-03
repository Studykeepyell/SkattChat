// scripts/chat-init.js
document.addEventListener('DOMContentLoaded', () => {
    // Profile image loading
    const savedImage = sessionStorage.getItem("profileImage");
    if (savedImage) {
        document.getElementById("taskbar-profile-img").src = savedImage;
    }

    // Hamburger menu
    document.getElementById("hamburger-menu")
        .addEventListener("click", function() {
            const bubbleMenu = document.getElementById("bubble-menu");
            bubbleMenu.classList.toggle("active");
            bubbleMenu.setAttribute(
                "aria-hidden",
                !bubbleMenu.classList.contains("active")
            );
        });

    // Taskbar navigation
    document.querySelectorAll(".taskbar button[data-target]")
        .forEach(button => {
            button.addEventListener("click", (e) => {
                const target = e.currentTarget.getAttribute("data-target");
                window.location.href = target;
            });
        });

    // Emoji picker
    document.getElementById("emoji-button")
        .addEventListener("click", () => {
            const emojiPicker = document.getElementById("emoji-picker");
            emojiPicker.style.display = emojiPicker.style.display === "none" ? "block" : "none";
        });

    document.querySelectorAll(".emoji").forEach(emoji => {
        emoji.addEventListener("click", () => {
            const messageInput = document.getElementById("messageInput");
            messageInput.value += emoji.textContent;
            document.getElementById("emoji-picker").style.display = "none";
        });
    });

    // Dark mode
    document.getElementById('darkModeButton')
        .addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', 
                document.body.classList.contains('dark-mode')
            );
        });

    const isDarkMode = JSON.parse(localStorage.getItem('darkMode'));
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
});