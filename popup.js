const USER_NAME = "Shiba";
const COMPANY_PLACEHOLDER = "Company";
const SOURCE_PLACEHOLDER = "Source";

function sanitizeFileName(text) {

    return text

        // Remove common gender notation
        .replace(/\(m\/f\/d\)/gi, "")
        .replace(/\(m\/w\/d\)/gi, "")
        .replace(/\(mwd\)/gi, "")

        // Remove any remaining brackets
        .replace(/[()]/g, "")

        // Remove illegal filename characters
        .replace(/[\\/:*?"<>|]/g, "")

        // Replace dots with underscores
        .replace(/\./g, "_")

        // Replace whitespace with underscore
        .replace(/\s+/g, "_")

        // Collapse multiple underscores
        .replace(/_+/g, "_")

        // Remove leading/trailing underscores
        .replace(/^_+|_+$/g, "");

}

function formatDate(date = new Date()) {

    const months = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;

}

function detectSource(url) {

    const host = new URL(url).hostname.toLowerCase();

    let source = host;

    // Remove common prefixes
    source = source.replace(/^www\./, "");
    source = source.replace(/^careers\./, "");
    source = source.replace(/^career\./, "");
    source = source.replace(/^jobs\./, "");
    source = source.replace(/^job\./, "");
    source = source.replace(/^emp\./, "");

    // Keep only the first part of the hostname
    source = source.split(".")[0];

    // Replace hyphens and underscores with spaces
    source = source.replace(/[-_]/g, " ");

    // Convert each word to Title Case
    source = source
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join("");

    return source;

}

function createBaseFileName(pageData) {

    const jobTitle = sanitizeFileName(pageData.title);

    const company =
    pageData.company
        ? sanitizeFileName(pageData.company)
        : COMPANY_PLACEHOLDER;

    const source = detectSource(pageData.url);

    return [
        USER_NAME,
        jobTitle,
        company,
        source,
        formatDate()
    ].join("_");

}

function createHtml(pageData) {

    return `<!DOCTYPE html>
<html>
<head>

<meta charset="UTF-8">

<title>${pageData.title}</title>

<style>

body {
    font-family: Arial, sans-serif;
    max-width: 900px;
    margin: 40px auto;
    padding: 20px;
    line-height: 1.7;
    color: #222;
}

h1 {
    margin-bottom: 10px;
}

.content {
    line-height: 1.7;
}

.content p {
    margin-bottom: 1em;
}

.content ul,
.content ol {
    margin-left: 25px;
}

.content h1,
.content h2,
.content h3 {
    margin-top: 1.5em;
}

a {
    color: #0066cc;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}

hr {
    margin: 25px 0;
}

</style>

</head>

<body>

<h1>${pageData.title}</h1>

<p>
<strong>Original URL:</strong><br>
<a href="${pageData.url}">
${pageData.url}
</a>
</p>

<p>
<strong>Saved:</strong>
${new Date().toLocaleString()}
</p>

<hr>

<div class="content">
${pageData.content || pageData.text}
</div>

</body>
</html>`;

}

function createJson(pageData) {

    const jobData = {

        version: "1.0",

        extensionVersion: "0.1.0",

        savedOn: new Date().toISOString(),

        source: new URL(pageData.url).hostname,

        title: pageData.title,

        url: pageData.url,

        text: pageData.text,

        content: pageData.content

    };

    return JSON.stringify(jobData, null, 2);

}


document.getElementById("saveButton").addEventListener("click", async () => {

    const output = document.getElementById("output");

    output.textContent = "Reading page...";

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    chrome.tabs.sendMessage(
        tab.id,
        { action: "getPageData" },
        (response) => {

            if (chrome.runtime.lastError) {

                output.textContent =
                    "Error:\n" + chrome.runtime.lastError.message;

                return;
            }

            output.textContent =
`Title

${response.title}

URL

${response.url}

Characters

${response.text.length}

Preview

${response.text.substring(0,300)}
`;
// NEW CODE
const html = createHtml(response);
const json = createJson(response);

const zip = new JSZip();

const baseName = createBaseFileName(response);

zip.file(baseName + ".html", html);

zip.file(baseName + ".json", json);

console.log(zip);

zip.generateAsync({
    type: "blob"
}).then((zipBlob) => {

    const zipUrl = URL.createObjectURL(zipBlob);

    chrome.downloads.download({

        url: zipUrl,

        filename: baseName + ".zip",

        saveAs: true

    }, (downloadId) => {

        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }

        console.log("ZIP Download started:", downloadId);

        URL.revokeObjectURL(zipUrl);

    });

});

const jsonBlob = new Blob([json], {
    type: "application/json"
});

const jsonBlobUrl = URL.createObjectURL(jsonBlob);

console.log(json);
console.log(html);
console.log(typeof JSZip);

const blob = new Blob([html], { type: "text/html" });

const blobUrl = URL.createObjectURL(blob);

/*
chrome.downloads.download({

    url: blobUrl,

    filename:
        response.title.replace(/[\\/:*?"<>|]/g, "_") + ".html",

    saveAs: true

}, (downloadId) => {

    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
    }

    console.log("Download started:", downloadId);

    // Free the memory used by the Blob
    URL.revokeObjectURL(blobUrl);

});

chrome.downloads.download({

    url: jsonBlobUrl,

    filename:
        response.title.replace(/[\\/:*?"<>|]/g, "_") + ".json",

    saveAs: true

}, (downloadId) => {

    if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
    }

    console.log("JSON Download started:", downloadId);

    URL.revokeObjectURL(jsonBlobUrl);

});
*/

        }
    );

});