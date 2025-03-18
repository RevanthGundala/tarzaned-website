document.addEventListener('DOMContentLoaded', function() {
    // Initialize header state on page load
    const header = document.querySelector('header');
    
    // Function to handle header scroll state
    function handleHeaderScroll() {
        const scrollPosition = window.scrollY;
        
        // Add or remove the 'scrolled' class based on scroll position
        if (scrollPosition > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Check initial scroll position
    handleHeaderScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleHeaderScroll);

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainMenu = document.querySelector('.main-menu');
    
    mobileMenuToggle.addEventListener('click', function() {
        mainMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (mainMenu.classList.contains('active')) {
                    mainMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            }
        });
    });
    
    // Add section animation classes
    const sections = document.querySelectorAll('section:not(.hero)');
    sections.forEach(section => {
        section.classList.add('section-animate');
    });
    
    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
        );
    }
    
    // Function to handle section animations on scroll
    function handleSectionAnimations() {
        const animatedSections = document.querySelectorAll('.section-animate');
        
        animatedSections.forEach(section => {
            if (isInViewport(section)) {
                section.classList.add('visible');
            }
        });
    }
    
    // Check for visible sections on load
    handleSectionAnimations();
    
    // Add scroll event listener for section animations
    window.addEventListener('scroll', handleSectionAnimations);
});
