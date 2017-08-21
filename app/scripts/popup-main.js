//Temporary thing to enable/ disable Zync animation
const activator = document.querySelector('.zync-activator');

activator.addEventListener('click', () => {
  activator.classList.toggle('active');

  sendMessage("toggleActive", {});
});

// initally set activity based on last setting
sendMessage("getActive", {}, (res) => {
  if (res.active) {
    activator.classList.add('active');
  } else {
    activator.classList.remove('active');
  }
});

function sendMessage(method, message, callback) {
  message.method = method;
  chrome.runtime.sendMessage(
    message,
    callback
  );
}