// Booking and payment integration
document.addEventListener('DOMContentLoaded', function() {
    // Initialize booking modal functionality
    initBookingSystem();
});

// Global variables to store booking information
let currentBookingData = null;

function initBookingSystem() {
    // Add event listeners to all booking buttons
    const bookButtons = document.querySelectorAll('.primary-btn');
    
    bookButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get coach and service details from the parent card
            const card = this.closest('.coach-card');
            const coachName = card.querySelector('.coach-name').textContent;
            const serviceType = card.querySelector('.service-type').textContent;
            const price = card.querySelector('.coach-price').textContent;
            
            // Open the booking modal with these details
            openBookingModal(coachName, serviceType, price, this.getAttribute('data-calendly-url'));
        });
    });
    
    // Close modal when clicking the close button or outside the modal
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('booking-modal-overlay')) {
            closeBookingModal();
        }
    });
    
    // Add a beforeunload event to warn users if they try to leave during payment
    window.addEventListener('beforeunload', function(e) {
        if (currentBookingData && document.getElementById('step-payment').classList.contains('active')) {
            // This will show a confirmation dialog if the user tries to leave during payment
            e.preventDefault();
            e.returnValue = 'You have not completed your payment. Your booking will be cancelled if you leave.';
            return e.returnValue;
        }
    });
}

function openBookingModal(coachName, serviceType, price, calendlyUrl) {
    // Create modal if it doesn't exist
    if (!document.querySelector('.booking-modal-overlay')) {
        createBookingModal();
        
        // Add event listeners for the modal close button
        document.querySelector('.modal-close').addEventListener('click', closeBookingModal);
    }
    
    // Reset booking data
    currentBookingData = {
        coachName: coachName,
        serviceType: serviceType,
        price: price,
        calendlyUrl: calendlyUrl || getDefaultCalendlyUrl(coachName, serviceType)
    };
    
    // Update modal content
    const modalTitle = document.querySelector('.booking-modal-title');
    modalTitle.textContent = `Book ${serviceType} with ${coachName}`;
    
    // Set the price in the payment section
    const paymentPrice = document.querySelector('.payment-price');
    paymentPrice.textContent = price;
    
    // Set the coach name and service type in the payment section
    const bookingCoachName = document.querySelector('.booking-coach-name');
    bookingCoachName.textContent = coachName;
    const bookingServiceType = document.querySelector('.booking-service-type');
    bookingServiceType.textContent = serviceType;
    
    // Show the modal
    const modal = document.querySelector('.booking-modal-overlay');
    modal.classList.add('active');
    
    // Reset steps - ensure payment step is shown first
    document.getElementById('step-payment').classList.add('active');
    document.getElementById('step-calendly').classList.remove('active');
    document.getElementById('step-confirmation').classList.remove('active');
    
    // Initialize payment buttons with the price
    const priceValue = parseFloat(price.replace(/[^0-9.]/g, ''));
    initializeStripeButton(priceValue);
    initializePayPalButton(priceValue);
    
    console.log('Booking modal opened with payment step active');
}

function createBookingModal() {
    const modalHTML = `
        <div class="booking-modal-overlay">
            <div class="booking-modal">
                <div class="modal-close">&times;</div>
                <h2 class="booking-modal-title">Book a Session</h2>
                
                <div class="booking-steps">
                    <div class="booking-step active" id="step-payment">
                        <h3>1. Complete Payment</h3>
                        <p>Please complete your payment to proceed to scheduling.</p>
                        <div class="payment-summary">
                            <p>Coach: <span class="booking-coach-name">Coach Name</span></p>
                            <p>Service: <span class="booking-service-type">Service Type</span></p>
                            <p>Total: <span class="payment-price">$0</span></p>
                        </div>
                        <div class="payment-options">
                            <div id="stripe-button-container" class="payment-button-container"></div>
                            <div class="payment-separator">or</div>
                            <div id="paypal-button-container" class="payment-button-container"></div>
                        </div>
                    </div>
                    
                    <div class="booking-step" id="step-calendly">
                        <h3>2. Schedule Your Session</h3>
                        <p>Payment successful! Now choose a time that works for you.</p>
                        <div class="calendly-container"></div>
                    </div>
                    
                    <div class="booking-step" id="step-confirmation">
                        <h3>Booking Confirmed!</h3>
                        <p>Your session has been scheduled and payment received.</p>
                        <p>You will receive a confirmation email shortly with all the details.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeBookingModal() {
    const modal = document.querySelector('.booking-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        
        // If there's an active booking but payment wasn't completed, notify the user
        if (currentBookingData && document.getElementById('step-payment').classList.contains('active')) {
            if (confirm('You have not completed your payment. Your booking will be cancelled. Are you sure you want to exit?')) {
                // User confirmed exit, handle cancellation on server
                handleCancellation();
            } else {
                // User chose to stay and complete payment
                modal.classList.add('active');
                return;
            }
        }
        
        // Stop countdown if it's running
        stopCountdown();
        
        // Reset booking data
        currentBookingData = null;
    }
}

function loadCalendly(calendlyUrl) {
    // Only load Calendly if the widget.js is available
    if (typeof Calendly === 'undefined') {
        console.error('Calendly widget.js is not loaded');
        return;
    }
    
    // Clear any existing Calendly widget
    const container = document.querySelector('.calendly-container');
    container.innerHTML = '';
    
    // Create and load the Calendly inline widget
    Calendly.initInlineWidget({
        url: calendlyUrl,
        parentElement: container,
        prefill: {},
        utm: {}
    });
    
    console.log('Calendly widget initialized with URL:', calendlyUrl);
    
    // Listen for Calendly events
    window.addEventListener('message', function(e) {
        if (e.data.event && e.data.event.indexOf('calendly') === 0) {
            console.log('Calendly event received:', e.data.event);
            
            // When scheduling is complete, show confirmation step
            if (e.data.event === 'calendly.event_scheduled') {
                console.log('Calendly event scheduled, showing confirmation step');
                
                // Store booking data for potential cancellation
                if (e.data.payload) {
                    currentBookingData.eventUri = e.data.payload.event.uri;
                    currentBookingData.inviteeUri = e.data.payload.invitee.uri;
                    currentBookingData.cancelUrl = e.data.payload.invitee.cancel_url;
                    currentBookingData.email = e.data.payload.invitee.email;
                    currentBookingData.name = e.data.payload.invitee.name;
                    currentBookingData.eventTime = e.data.payload.event.start_time;
                    
                    // Store booking data in localStorage for recovery
                    localStorage.setItem('pendingBooking', JSON.stringify({
                        data: currentBookingData,
                        timestamp: Date.now()
                    }));
                }
                
                showConfirmation();
            }
        }
    });
}

function getDefaultCalendlyUrl(coachName, serviceType) {
    // Return the Tarzaned Calendly URL
    return 'https://calendly.com/tarzanedisgod';
}

function showCalendlyStep() {
    console.log('Showing Calendly step');
    
    // Hide payment step and show calendly step
    document.getElementById('step-payment').classList.remove('active');
    document.getElementById('step-calendly').classList.add('active');
    
    // Load Calendly with the stored URL
    if (currentBookingData && currentBookingData.calendlyUrl) {
        console.log('Loading Calendly with URL:', currentBookingData.calendlyUrl);
        loadCalendly(currentBookingData.calendlyUrl);
    } else {
        console.error('No Calendly URL found');
        // Fallback to the Tarzaned Calendly URL
        loadCalendly('https://calendly.com/tarzanedisgod');
    }
}

function processStripePayment(amount) {
    console.log('Processing Stripe payment for $' + amount);
    
    // For demo purposes, we'll simulate a successful payment
    alert('In production, this would process a Stripe payment. For now, we\'ll simulate a successful payment.');
    
    // After successful payment, show calendly step
    showCalendlyStep();
}

function processPayPalPayment(amount) {
    console.log('Processing PayPal payment for $' + amount);
    
    // For demo purposes, we'll simulate a successful payment
    alert('In production, this would process a PayPal payment. For now, we\'ll simulate a successful payment.');
    
    // After successful payment, show calendly step
    showCalendlyStep();
}

// Countdown timer for payment
let countdownInterval = null;

function startCountdown(seconds) {
    const countdownElement = document.getElementById('payment-countdown');
    
    // Clear any existing interval
    stopCountdown();
    
    // Update the countdown every second
    countdownInterval = setInterval(function() {
        seconds--;
        
        // Format the time as mm:ss
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        countdownElement.textContent = `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        
        // If the countdown reaches zero, cancel the booking
        if (seconds <= 0) {
            stopCountdown();
            handleCancellation();
            closeBookingModal();
            alert('Your booking time has expired and has been cancelled. Please try again.');
        }
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function handleCancellation() {
    if (currentBookingData) {
        console.log('Cancelling booking:', currentBookingData);
        
        // In a production environment, you would send this data to your server
        // to handle the cancellation via Calendly's API
        
        // For demonstration, we'll show what would happen:
        console.log('Server would cancel Calendly booking using:');
        console.log('- Event URI:', currentBookingData.eventUri);
        console.log('- Invitee URI:', currentBookingData.inviteeUri);
        
        // Clear the stored booking data
        localStorage.removeItem('pendingBooking');
        
        // Reset booking data
        currentBookingData = null;
    }
}

function initializeStripeButton(amount) {
    const stripeContainer = document.getElementById('stripe-button-container');
    stripeContainer.innerHTML = '';
    
    // Create a custom button for Stripe checkout
    const stripeButton = document.createElement('button');
    stripeButton.className = 'stripe-checkout-button';
    stripeButton.textContent = 'Checkout';
    stripeButton.addEventListener('click', function() {
        processStripePayment(amount);
    });
    
    stripeContainer.appendChild(stripeButton);
}

function initializePayPalButton(amount) {
    const paypalContainer = document.getElementById('paypal-button-container');
    paypalContainer.innerHTML = '';
    
    // Create a PayPal checkout button
    const paypalButton = document.createElement('button');
    paypalButton.id = 'paypal-checkout-button';
    paypalButton.className = 'paypal-checkout-button';
    paypalButton.innerHTML = '<img src="https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png" alt="PayPal"> Pay with PayPal';
    
    paypalContainer.appendChild(paypalButton);
    
    // Add event listener to the button
    paypalButton.addEventListener('click', function() {
        // In production, this would initialize the PayPal SDK and render the button
        processPayPalPayment(amount);
    });
}

function showConfirmation() {
    // Hide calendly step and show confirmation
    document.getElementById('step-calendly').classList.remove('active');
    document.getElementById('step-confirmation').classList.add('active');
    
    // Stop the countdown
    stopCountdown();
    
    // Clear the stored booking data as it's now paid
    localStorage.removeItem('pendingBooking');
    
    // Reset booking data as it's now paid
    currentBookingData = null;
}

function getPaymentAmount() {
    const priceElement = document.querySelector('.payment-price');
    const priceText = priceElement.textContent;
    return parseFloat(priceText.replace(/[^0-9.]/g, ''));
}

// Check for any pending bookings on page load
document.addEventListener('DOMContentLoaded', function() {
    const pendingBooking = localStorage.getItem('pendingBooking');
    
    if (pendingBooking) {
        try {
            const bookingData = JSON.parse(pendingBooking);
            const timestamp = bookingData.timestamp;
            const currentTime = Date.now();
            
            // If the booking is less than 10 minutes old, handle it
            if (currentTime - timestamp < 10 * 60 * 1000) {
                // In production, you would check with your server if this booking was paid
                // If not paid, cancel it
                handleCancellation();
            } else {
                // Booking is old, just remove it
                localStorage.removeItem('pendingBooking');
            }
        } catch (e) {
            console.error('Error processing pending booking:', e);
            localStorage.removeItem('pendingBooking');
        }
    }
});
