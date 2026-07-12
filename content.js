function cleanTitle(title) {

    if (!title)
        return "";

    return title
        .split(/\s+[|–—]\s+/)[0]
        .trim();

}

function createCleanText(html) {

    if (!html)
        return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const elements = doc.body.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, li"
    );

    let lines = [];

    elements.forEach(element => {

        // Skip paragraphs already contained within a list item
        if (
            element.tagName === "P" &&
            element.closest("li")
        )
            return;

        let text = element.innerText.trim();

        if (!text)
            return;

        // Prefix list items with a bullet
        if (element.tagName === "LI")
            text = "• " + text;

        lines.push(text);

    });

    return lines
        .join("\n\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

}
// ===== Old createCleanText() =====
/*
function createCleanText(html) {

    if (!html)
        return "";

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    let output = "";

    function append(text) {

        if (text)
            output += text;

    }

    function walk(node) {

        if (node.nodeType === Node.TEXT_NODE) {

            append(node.textContent);

            return;

        }

        if (node.nodeType !== Node.ELEMENT_NODE)
            return;

        const tag = node.tagName.toLowerCase();

        switch (tag) {

            case "br":
                append("\n");
                break;

            case "p":
                node.childNodes.forEach(walk);
                append("\n\n");
                break;

            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                append("\n\n");
                node.childNodes.forEach(walk);
                append("\n\n");
                break;
            case "li":

                append("\n• ");

                node.childNodes.forEach(walk);

                return;
            default:
                node.childNodes.forEach(walk);

        }

    }

    let sections = [];

    for (const child of doc.body.children) {

        const text = child.innerText.trim();

        if (text)
            sections.push(text);

    }

    return sections.join("\n\n");

}
*/

function cleanCompanyName(name) {

    if (!name)
        return "";

    return name
        .replace(/\bJob Portal\b/gi, "")
        .replace(/\bCareer Portal\b/gi, "")
        .replace(/\bCareers\b/gi, "")
        .replace(/\bJobs\b/gi, "")
        .replace(/\bRecruitment\b/gi, "")
        .replace(/\bHiring\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

}

function detectCompany() {

        // Try Open Graph site name
    const ogSiteName = document.querySelector(
        'meta[property="og:site_name"]'
    );

    if (ogSiteName && ogSiteName.content)
        return cleanCompanyName(ogSiteName.content);

    // Try application name
    const appName = document.querySelector(
        'meta[name="application-name"]'
    );

    if (appName && appName.content)
        return cleanCompanyName(appName.content);
    
    const scripts = document.querySelectorAll(
        'script[type="application/ld+json"]'
    );

    console.log("JSON-LD scripts found:", scripts.length);

    for (const script of scripts) {

        try {
            console.log(script.textContent);
            const data = JSON.parse(script.textContent);

            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {

                if (item["@type"] === "JobPosting" &&
                    item.hiringOrganization &&
                    item.hiringOrganization.name) {

                    return cleanCompanyName(item.hiringOrganization.name);

                }

            }

        }
        catch (e) {
            // Ignore invalid JSON
        }

    }

    console.log("No company found");

    // Try extracting company from the page title
    const title = document.title;

    const separators = ["|", "–", "—", "-"];

    for (const separator of separators) {

        if (title.includes(separator)) {

            const parts = title.split(separator);

            const company = cleanCompanyName(
                parts[parts.length - 1]
            );

            if (company.length > 1)
                return company;

        }

    }

    return null;

}

function detectGermanRequirement(cleanText) {

    if (!cleanText)
        return "";

    for (const rule of EXTRACTION_RULES.german) {

        const match = cleanText.match(rule);

        if (match)
            return match[0];

    }

    return "";

}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    console.log(typeof Readability);
    console.log("Message received:", request);

    if (request.action === "getPageData") {

        // Clone the document so Readability doesn't modify the live page
        const documentClone = document.cloneNode(true);

        // Extract the main content
        const reader = new Readability(documentClone);
        const article = reader.parse();

        const cleanText = createCleanText(
            article ? article.content : ""
        );

        sendResponse({
            title: cleanTitle(
                article ? article.title : document.title
            ),
            url: window.location.href,

            // Original Readability text
            text: article ? article.textContent : document.body.innerText,

            // AI-friendly text generated from HTML
            cleanText: cleanText,

            // Original extracted HTML
            content: article ? article.content : "",

            company: detectCompany(),
            german: detectGermanRequirement(cleanText)
        });

    }

});