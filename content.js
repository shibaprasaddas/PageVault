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
            content: article ? article.content : ""
        });

    }

});