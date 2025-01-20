import './startscreen.css';

const songButtons = document.querySelectorAll(".song-menu > button");

// Bind each song button with navigating to game screen with
// song index as a parameter appended to the URL, which
// gamescreen.js can can access to know which song to play
songButtons.forEach((button) =>
  button.addEventListener("click", () => {
    window.location.href = `gamescreen.html?songIndex=${button.dataset.songIndex}`;
  }),
);
