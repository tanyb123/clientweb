// WAF Testing Portal - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Add form validation and enhancements
    
    // Auto-focus first input in forms
    const firstInput = document.querySelector('input[type="text"], input[type="password"]');
    if (firstInput) {
        firstInput.focus();
    }
    
    // Add loading state to buttons on form submit
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const button = form.querySelector('button[type="submit"]');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Processing...';
                button.disabled = true;
                
                // Re-enable after 5 seconds as fallback
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 5000);
            }
        });
    });
    
    // Add copy to clipboard functionality for result pre tags
    const preTags = document.querySelectorAll('.result pre');
    preTags.forEach(pre => {
        pre.style.cursor = 'pointer';
        pre.title = 'Click to copy';
        pre.addEventListener('click', function() {
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalBg = this.style.background;
                this.style.background = '#27ae60';
                setTimeout(() => {
                    this.style.background = originalBg;
                }, 500);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        });
    });
    
    // Highlight active navigation link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            (currentPath === '/' && link.getAttribute('href') === '/')) {
            link.style.background = '#667eea';
            link.style.color = 'white';
        }
    });
    
    // Add smooth scroll to results
    const results = document.querySelectorAll('.result');
    if (results.length > 0) {
        results[results.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

// Console warning
console.log('%c⚠️ WARNING', 'color: red; font-size: 20px; font-weight: bold;');
console.log('%cThis is a vulnerable application for WAF testing only!', 'color: orange; font-size: 14px;');

