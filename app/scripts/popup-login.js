const google = document.querySelector('.zync-popup-login-container');

google.addEventListener('click', () => {
  chrome.tabs.create({url: '../pages/login.html'});
});
