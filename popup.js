document.getElementById("saveButton").addEventListener("click", async () => {

    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    document.getElementById("output").textContent =
        `Title:\n${tab.title}\n\nURL:\n${tab.url}`;

});