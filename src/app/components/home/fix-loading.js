// 🔧 EMERGENCY FIX: Chạy script này trong Console để fix loading ngay lập tức
// Copy và paste vào Browser Console (F12) để chạy

console.log('🚨 EMERGENCY LOADING FIX ACTIVATED...');

// 1. Remove loading-active class from body
if (document.body.classList.contains('loading-active')) {
  document.body.classList.remove('loading-active');
  console.log('✅ Removed loading-active class from body');
}

// 2. Remove loading overlay if exists
const loadingOverlays = document.querySelectorAll('.loading-overlay');
loadingOverlays.forEach(overlay => {
  overlay.remove();
  console.log('✅ Removed loading overlay');
});

// 3. Remove blur and opacity effects from main content
const mainSections = document.querySelectorAll('.main-section');
mainSections.forEach(section => {
  section.classList.remove('loading');
  section.style.filter = 'none';
  section.style.opacity = '1';
  section.style.pointerEvents = 'auto';
  console.log('✅ Removed blur from main section');
});

// 4. Remove header loading class
const headers = document.querySelectorAll('app-header');
headers.forEach(header => {
  header.classList.remove('header-loading');
  header.style.opacity = '1';
  header.style.visibility = 'visible';
  header.style.transform = 'none';
  header.style.pointerEvents = 'auto';
  console.log('✅ Restored header visibility');
});

// 5. Enable scroll
document.body.style.overflow = 'auto';
document.html?.style.overflow = 'auto';

// 6. Remove any content-loading classes
const contentElements = document.querySelectorAll('.content-loading');
contentElements.forEach(element => {
  element.classList.remove('content-loading');
  element.style.opacity = '1';
  element.style.pointerEvents = 'auto';
  console.log('✅ Restored content visibility');
});

// 7. Remove search loading states
const searchContainers = document.querySelectorAll('.search-box-container');
searchContainers.forEach(container => {
  container.classList.remove('loading');
  console.log('✅ Removed search loading state');
});

// 8. Enable buttons
const buttons = document.querySelectorAll('button[disabled]');
buttons.forEach(button => {
  button.removeAttribute('disabled');
  console.log('✅ Enabled disabled buttons');
});

// 9. Stop any spinning animations
const spinners = document.querySelectorAll('.fa-spinner, .spinner, .loading-spinner');
spinners.forEach(spinner => {
  spinner.remove();
  console.log('✅ Removed spinners');
});

console.log('🎉 EMERGENCY FIX COMPLETED! Page should be normal now.');
console.log('📝 If problem persists, try refreshing the page (Ctrl+F5)');
