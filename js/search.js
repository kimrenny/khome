if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");

    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const searchText = searchInput.value.trim();
        if (!searchText) return;

        if (chrome.search && chrome.search.query) {
          chrome.search
            .query({
              text: searchText,
              disposition: "NEW_TAB",
            })
            .catch((error) => {
              console.error("Search query failed:", error);
            });
        } else {
          chrome.tabs.create({
            url: `https://www.google.com/search?q=${encodeURIComponent(
              searchText
            )}`,
          });
        }

        searchInput.value = "";
      }
    });
  });
}
