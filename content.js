function detectCompany() {

        // Try Open Graph site name
    const ogSiteName = document.querySelector(
        'meta[property="og:site_name"]'
    );

    if (ogSiteName && ogSiteName.content)
        return ogSiteName.content.trim();

    // Try application name
    const appName = document.querySelector(
        'meta[name="application-name"]'
    );

    if (appName && appName.content)
        return appName.content.trim();
    
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

                    return item.hiringOrganization.name.trim();

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

            const company = parts[parts.length - 1].trim();

            if (company.length > 1)
                return company;

        }

    }

    return null;

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

        sendResponse({
            title: article ? article.title : document.title,
            url: window.location.href,
            text: article ? article.textContent : document.body.innerText,
            content: article ? article.content : "",
            company: detectCompany()
        });

    }

});