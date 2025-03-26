// Function to hide the loader
function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.classList.add('hidden');
    }
  }
  
  // Hide loader after page load with a 1-second delay
  window.addEventListener('load', () => {
    setTimeout(hideLoader, 1000); // 1-second delay for better user experience
  });