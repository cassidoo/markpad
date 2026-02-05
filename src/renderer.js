require("./styles.css");
const { marked } = require("marked");
const DOMPurify = require("dompurify");

let currentContent = "";
let isDirty = false;

const editor = document.getElementById("editor");
const preview = document.getElementById("preview");

function updatePreview() {
	const markdown = editor.value;
	const html = marked.parse(markdown);
	preview.innerHTML = DOMPurify.sanitize(html);
	currentContent = markdown;
	isDirty = true;
}

editor.addEventListener("input", updatePreview);

window.electronAPI.onFileNew(() => {
	editor.value = "";
	updatePreview();
	isDirty = false;
});

window.electronAPI.onFileOpened((data) => {
	editor.value = data.content;
	updatePreview();
	isDirty = false;
	addRecentFile(data.path);
});

window.electronAPI.onRequestContentForSave(async () => {
	const result = await window.electronAPI.saveContent(editor.value);
	if (result.success) {
		isDirty = false;
		showNotification("File saved successfully", "success");
		addRecentFile(result.path);
	} else {
		showNotification(`Failed to save: ${result.error}`, "error");
	}
});

window.electronAPI.onPublishGist(async () => {
	const content = editor.value;

	if (!content.trim()) {
		showNotification("Cannot publish empty content", "error");
		return;
	}

	const filename = await getFilenameForGist();

	showNotification("Publishing to Gist...", "info");

	const result = await window.electronAPI.publishGist({ filename, content });

	if (result.success) {
		showNotification(`Published! Opening in browser...`, "success");
		setTimeout(() => {
			window.electronAPI.openExternal(result.url);
		}, 1000);
	} else {
		showNotification(`Failed to publish: ${result.error}`, "error");
	}
});

async function getFilenameForGist() {
	const currentPath = await window.electronAPI.getCurrentFilePath();

	if (currentPath) {
		return currentPath.split(/[/\\]/).pop();
	}

	const content = editor.value;
	const firstLine = content.split("\n")[0].trim();

	if (firstLine.startsWith("#")) {
		const title = firstLine.replace(/^#+\s*/, "").trim();
		const dashCase = title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		return dashCase ? `${dashCase}.md` : "untitled.md";
	}

	return "untitled.md";
}

function addRecentFile(filePath) {
	let recent = JSON.parse(localStorage.getItem("recentFiles") || "[]");
	recent = recent.filter((f) => f !== filePath);
	recent.unshift(filePath);
	recent = recent.slice(0, 10);
	localStorage.setItem("recentFiles", JSON.stringify(recent));
}

function showNotification(message, type = "info") {
	const notification = document.getElementById("notification");
	notification.textContent = message;
	notification.className = `notification ${type}`;
	notification.classList.remove("hidden");

	setTimeout(() => {
		notification.classList.add("hidden");
	}, 3000);
}

updatePreview();
