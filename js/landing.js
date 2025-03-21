/**
 * Landing page functionality for Block Blast
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize countdown timers
    initCountdownTimers();
    
    // Initialize smooth scrolling for navigation links
    initSmoothScroll();
    
    // Initialize play buttons for video content
    initPlayButtons();
    
    // Initialize CTA buttons to redirect to the game
    initCtaButtons();
});

/**
 * Initialize countdown timers
 */
function initCountdownTimers() {
    const countdownTimer = document.getElementById('countdown-timer');
    const countdownTimerSmall = document.getElementById('countdown-timer-small');
    
    if (!countdownTimer && !countdownTimerSmall) return;
    
    // Set expiration time to 24 hours from now
    const now = new Date();
    let expirationTime = new Date(now);
    expirationTime.setHours(now.getHours() + 24);
    
    // Check if expiration time is already saved in localStorage
    const savedExpirationTime = localStorage.getItem('offerExpirationTime');
    if (savedExpirationTime) {
        expirationTime = new Date(parseInt(savedExpirationTime, 10));
    } else {
        // Save the expiration time
        localStorage.setItem('offerExpirationTime', expirationTime.getTime().toString());
    }
    
    // Update timers every second
    const updateTimers = () => {
        const now = new Date();
        const timeLeft = expirationTime - now;
        
        if (timeLeft <= 0) {
            // Reset expiration time if it's passed
            expirationTime = new Date(now);
            expirationTime.setHours(now.getHours() + 24);
            localStorage.setItem('offerExpirationTime', expirationTime.getTime().toString());
            return updateTimers();
        }
        
        // Calculate hours, minutes, seconds
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        // Format the time as HH:MM:SS
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update the timer displays
        if (countdownTimer) countdownTimer.textContent = formattedTime;
        if (countdownTimerSmall) countdownTimerSmall.textContent = formattedTime;
    };
    
    // Initial update
    updateTimers();
    
    // Update every second
    setInterval(updateTimers, 1000);
}

/**
 * Initialize smooth scrolling for navigation links
 */
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Prevent default anchor click behavior
            e.preventDefault();
            
            // Get the target element
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;
            
            // Scroll to the target element
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for navbar
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Initialize play buttons for video content
 */
function initPlayButtons() {
    const playButtons = document.querySelectorAll('.play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            // In a real implementation, this would play the video
            alert('Video would play here in the full implementation');
        });
    });
}

/**
 * Initialize CTA buttons to redirect to the game
 */
function initCtaButtons() {
    const ctaButtons = document.querySelectorAll('.cta-button, .pricing-cta');
    
    ctaButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Redirect to the game page
            window.location.href = 'index.html';
        });
    });
}
