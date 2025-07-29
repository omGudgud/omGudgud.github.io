document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (event) => {
        console.log(`Button with id '${event.target.id}' was clicked.`);
    });
});

// Prevent double-tap to zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);
