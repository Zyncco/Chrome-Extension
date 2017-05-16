const CLIPBOARD_CURRENT = document.getElementById("clipboard-current");
const CLIPBOARD_PREVIOUS = document.getElementById("clipboard-previous");
const PATTERN_IGNORE = new RegExp("^<!--StartFragment-->.*<!--EndFragment-->$", "im");

CLIPBOARD_CURRENT.addEventListener("paste", function(event) {
	event.stopPropagation();
	event.preventDefault();
	
	let items = (event.clipboardData || event.originalEvent.clipboardData).items;
	let data = [];
	
	for (let i = 0; i < items.length; i++) {
		let item = items[0];
		
		if (item.kind == "file") {
			data.push(item.getAsFile());
		} else {
			item.getAsString(function(result) {
				if (!PATTERN_IGNORE.test(result)) {
					data.push(result);
				}
			});
		}
	}
	
	if (data.length == 0) {
		console.log("empty");
		return;
	}
	
	console.log(data)
});

CLIPBOARD_CURRENT.select();
document.execCommand('paste');
