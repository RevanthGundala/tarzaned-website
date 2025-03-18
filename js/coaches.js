document.addEventListener('DOMContentLoaded', function() {
    // Coach filtering functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    const coachProfiles = document.querySelectorAll('.coach-profile');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Show/hide coach profiles based on filter
            coachProfiles.forEach(profile => {
                if (filter === 'all') {
                    profile.style.display = 'block';
                } else {
                    const roles = profile.getAttribute('data-roles');
                    if (roles.includes(filter)) {
                        profile.style.display = 'block';
                    } else {
                        profile.style.display = 'none';
                    }
                }
            });
        });
    });
    
    // Booking form functionality
    const bookButtons = document.querySelectorAll('.book-btn');
    const coachInput = document.getElementById('coach');
    const serviceInput = document.getElementById('service');
    const bookingForm = document.querySelector('.booking-form');
    
    bookButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Prevent default anchor behavior
            e.preventDefault();
            
            // Get coach and service data
            const coach = this.getAttribute('data-coach');
            const service = this.getAttribute('data-service');
            
            // Set form values
            coachInput.value = coach;
            serviceInput.value = service;
            
            // Scroll to booking form
            document.getElementById('booking-form').scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Form submission
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const formDataObj = {};
        
        formData.forEach((value, key) => {
            formDataObj[key] = value;
        });
        
        // Show submission confirmation
        this.innerHTML = `
            <div class="form-success">
                <h3>Booking Request Submitted!</h3>
                <p>Thank you for booking a coaching session with ${formDataObj.coach}.</p>
                <p>We'll contact you at ${formDataObj.email} within 24 hours to confirm your booking details.</p>
                <p>Please make sure to check your email and Discord for our message.</p>
                <a href="coaches.html" class="btn primary-btn">Return to Coaches</a>
            </div>
        `;
        
        // Scroll to top of form
        document.getElementById('booking-form').scrollIntoView({
            behavior: 'smooth'
        });
        
        // In a real implementation, you would send this data to a server
        console.log('Form Data:', formDataObj);
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainMenu = document.querySelector('.main-menu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainMenu.classList.toggle('active');
        });
    }
    
    // Smooth scroll for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#') {
                e.preventDefault();
                
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Animation for coach profiles
    const animateCoachProfiles = () => {
        coachProfiles.forEach(profile => {
            const profilePosition = profile.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (profilePosition < screenPosition) {
                profile.classList.add('animated');
            }
        });
    };
    
    // Run animation on scroll
    window.addEventListener('scroll', animateCoachProfiles);
    // Run once on page load
    setTimeout(animateCoachProfiles, 100);
});
