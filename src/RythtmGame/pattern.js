import './pattern.css';

document.addEventListener("DOMContentLoaded", () => {
  //get references to html elements
  const gameCanvas = document.getElementById("gameCanvas");
  const patternCanvas = document.getElementById("patternCanvas");
  const gameCtx = gameCanvas.getContext("2d"); //2D rendering context for user input
  const patternCtx = patternCanvas.getContext("2d"); //2D rendering context for target pattern
  const startButton = document.getElementById("startButton");
  const completeButton = document.getElementById("completeButton");
  const message = document.getElementById("message");
  const roundCounter = document.getElementById("roundCounter");
  const scoreCounter = document.getElementById("scoreCounter");

  const points = [
    //define points on the grid
    { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 250, y: 50 },
    { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 250, y: 150 },
    { x: 50, y: 250 }, { x: 150, y: 250 }, { x: 250, y: 250 },
  ];

  const patterns = [
    //define patterns draw in 5 rounds
    [2, 1, 0, 3, 6, 7, 8],
    [6, 1, 8],
    [2, 1, 0, 3, 4, 5, 8, 7, 6],
    [0, 3, 6, 6, 4, 7],
    [6, 1, 8, 3, 4, 5, 7],
  ];

  let currentRound = 0; //track current round
  let userInput = []; //store user input as an array points
  let currentPattern = [];
  let score = 0; //initialize score

  function drawGrid(ctx) {
    //function to draw grid of points on canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "white";

    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPattern(ctx, pattern, color) {
    //function to draw specified pattern on canvas
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;

    ctx.beginPath();

    pattern.forEach((index, i) => {
      if (i === 0) {
        ctx.moveTo(points[index].x, points[index].y);
      } else {
        ctx.lineTo(points[index].x, points[index].y);
      }
    });

    ctx.stroke();
  }

  function startGame() {
    currentRound = 0; //reset current round
    score = 0; //reset score

    roundCounter.textContent = currentRound + 1; //update round count
    scoreCounter.textContent = score; //update score

    nextRound(); //moving on to next round
  }

  function nextRound() {
    if (currentRound < patterns.length) {
      userInput = []; //clear previous userinput
      currentPattern = patterns[currentRound];

      drawGrid(gameCtx);
      drawGrid(patternCtx);
      drawPattern(patternCtx, currentPattern, "red");

      message.textContent = `Round ${currentRound + 1}: Draw the pattern!`;
      completeButton.style.display = "block";
    } else {
      message.textContent = "Game Over! You completed all rounds.";
      completeButton.style.display = "none";
    }
  }

  function validateInput() {
    if (userInput.length !== currentPattern.length) {
      message.textContent = "Pattern not matched! Try again.";
    } else if (userInput.every((val, index) => val === currentPattern[index])) {
      message.textContent = "Pattern matched! Good job!";
      score++;
      scoreCounter.textContent = score;
    } else {
      message.textContent = "Pattern not matched! Try again.";
    }

    setTimeout(() => {
      //there is a short delay before moving on to the next round
      clearGameCanvas(); //clear game canvas
      currentRound++; //increase round number
      roundCounter.textContent = currentRound + 1; //update round counter display
      nextRound(); //start nextround
    }, 2000);
  }

  function clearGameCanvas() {
    //clear the game canvas
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawGrid(gameCtx); //redraw the grid
  }

  gameCanvas.addEventListener("mousedown", (e) => {
    const rect = gameCanvas.getBoundingClientRect(); //get the canvas position
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedPointIndex = points.findIndex(
      (point) => Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2) < 10,
    );

    if (clickedPointIndex !== -1 && !userInput.includes(clickedPointIndex)) {
      userInput.push(clickedPointIndex);
      drawUserInput();
    }
  });

  gameCanvas.addEventListener("mousemove", (e) => {
    //for mouse movement over the game canvas
    if (userInput.length > 0) {
      const rect = gameCanvas.getBoundingClientRect(); //get canvas position
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const hoveredPointIndex = points.findIndex(
        (point) => Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2) < 10,
      );

      if (hoveredPointIndex !== -1 && !userInput.includes(hoveredPointIndex)) {
        userInput.push(hoveredPointIndex);
        drawUserInput();
      }
    }
  });

  function drawUserInput() {
    //function to draw the user input
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawGrid(gameCtx);
    drawPattern(gameCtx, userInput, "blue");
    drawPattern(patternCtx, currentPattern, "red");
  }

  startButton.addEventListener("click", startGame); //eventlistener for start button
  completeButton.addEventListener("click", validateInput); //eventlistener for complete button

  //initial draw grid and pattern on both canvas
  drawGrid(gameCtx);
  drawGrid(patternCtx);
});
