const MAP_TYPE_COLOR = {
	null: null,
	"info": "#4FFFB0",
	"warning": "#FF7E00",
	"error": "#FF0000"
}

let notificationColor = null;
let notificationCount = 0;

function selectColor(color) {
	let colors = Object.value(MAP_TYPE_COLOR);
	
	let currentIndex = colors.indexOf(notificationColor);
	let newIndex = Math.max(currentIndex, colors.indexOf(color));
	
	notificationColor = colors[newIndex];
}

function addNotification(color, message) {}

function updateBadge() {
	chrome.browserAction.setBadgeBackgroundColor({ color: color });
	chrome.browserAction.setBadgeText({ text: notificationCount || "" });
}

chrome.runtime.onMessage.addListener(function (message, sender, response) {
	if (message.purpose === "notification") {
		return;
	}
	
	notificationCount++;
	
	let color = MAP_TYPE_COLOR[message.type];
	
	setColor(color);
	addNotification(color, message.message);
	
	updateBadge();
});

chrome.browserAction.onClicked.addListener(function (tab) {
	notificationColor = null;
	notificationCount = 0;
	
	updateBadge();
});