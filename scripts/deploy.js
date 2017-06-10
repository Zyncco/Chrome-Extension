const URL_REFRESH_TOKEN = "";
const URL_WEBSTORE_UPLOAD = "";

function packExtension() {
	setTimeout(() => {
		console.log("packExtension");
	}, 5000);
}

function uploadExtension() {
	setTimeout(() => {
		console.log("uploadExtension");
	}, 5000);
}

function publishExtension() {
	setTimeout(() => {
		console.log("publishExtension");
	}, 5000);
}

function invalidFunction() {
	console.log("invalidFunction");
}

let args = process.argv.slice(2);
for (let i = 0; i < args.length; i++)
{
	(window[args[i] + 'Extension'] || invalidFunction)();
}