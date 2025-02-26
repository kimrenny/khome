if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const googleToggle = document.getElementById("google-search-toggle");
    const duckDuckGoToggle = document.getElementById(
      "duckduckgo-search-toggle"
    );
    const bingToggle = document.getElementById("bing-search-toggle");
    const naverToggle = document.getElementById("naver-search-toggle");

    let engine;

    function disableAllExcept(activeToggle = googleToggle) {
      const toggles = [googleToggle, duckDuckGoToggle, bingToggle, naverToggle];
      toggles.forEach((otherToggle) => {
        if (otherToggle.classList.contains("on")) {
          otherToggle.classList.remove("on");
        }

        if (!otherToggle.classList.contains("off")) {
          otherToggle.classList.add("off");
        }
      });

      setTimeout(() => {
        if (activeToggle.classList.contains("off")) {
          activeToggle.classList.remove("off");
        }
        if (!activeToggle.classList.contains("on")) {
          activeToggle.classList.add("on");
        }
      }, 0);
    }

    function switchValidation(engine) {
      const toggles = [googleToggle, duckDuckGoToggle, bingToggle, naverToggle];
      const resultOfTests = [];
      let testEngineResult = false;

      toggles.forEach((toggle) => {
        if (toggle.id === engine.id) {
          if (toggle.classList.contains("on")) {
            resultOfTests.push(true);
          } else {
            resultOfTests.push(false);
          }
          if (!toggle.classList.contains("off")) {
            resultOfTests.push(true);
          } else {
            resultOfTests.push(false);
          }
        } else {
          if (toggle.classList.contains("off")) {
            resultOfTests.push(true);
          } else {
            resultOfTests.push(false);
          }
          if (!toggle.classList.contains("on")) {
            resultOfTests.push(true);
          } else {
            resultOfTests.push(false);
          }
        }
      });

      testEngineResult = resultOfTests.every((test) => test === true);

      return testEngineResult;
    }

    function clearEngineFromLocalStorage() {
      localStorage.removeItem("search_engine");
    }

    function saveEngineToLocalStorage(engine) {
      chrome.storage.local.set({ search_engine: engine.id });
    }

    function loadEngineFromLocalStorage(callback) {
      chrome.storage.local.get("search_engine", function (result) {
        const searchEngine = result["search_engine"];
        callback(searchEngine);
      });
    }

    function setInitialEngine() {
      let activeToggle;
      loadEngineFromLocalStorage(function (savedEngine) {
        if (savedEngine) {
          activeToggle = document.getElementById(savedEngine);
        } else {
          const toggles = [
            googleToggle,
            duckDuckGoToggle,
            bingToggle,
            naverToggle,
          ];
          toggles.forEach((toggle) => {
            if (toggle.classList.contains("on")) {
              activeToggle = toggle;
            }
          });
        }
        if (activeToggle) {
          setActiveToggle(activeToggle);
          engine = activeToggle.id.replace("-search-toggle", "");
        } else {
          setActiveToggle(googleToggle);
          saveEngineToLocalStorage(googleToggle);
          engine = "google";
        }
      });
    }

    function setActiveToggle(toggle) {
      if (toggle) {
        disableAllExcept(toggle);
        toggle.classList.remove("off");
        toggle.classList.add("on");
      }
    }

    googleToggle.addEventListener("click", function () {
      engine = "google";
      setActiveToggle(googleToggle);
      saveEngineToLocalStorage(googleToggle);
    });

    duckDuckGoToggle.addEventListener("click", function () {
      engine = "duckduckgo";
      setActiveToggle(duckDuckGoToggle);
      saveEngineToLocalStorage(duckDuckGoToggle);
      if (!switchValidation(duckDuckGoToggle)) {
        if (duckDuckGoToggle.classList.contains("off")) {
          duckDuckGoToggle.classList.remove("off");
        }
        if (!duckDuckGoToggle.classList.contains("on")) {
          duckDuckGoToggle.classList.add("on");
        }
      }
    });

    bingToggle.addEventListener("click", function () {
      engine = "bing";
      setActiveToggle(bingToggle);
      saveEngineToLocalStorage(bingToggle);
      if (!switchValidation(bingToggle)) {
        if (bingToggle.classList.contains("off")) {
          bingToggle.classList.remove("off");
        }
        if (!bingToggle.classList.contains("on")) {
          bingToggle.classList.add("on");
        }
      }
    });

    naverToggle.addEventListener("click", function () {
      engine = "naver";
      setActiveToggle(naverToggle);
      saveEngineToLocalStorage(naverToggle);
      if (!switchValidation(naverToggle)) {
        if (naverToggle.classList.contains("off")) {
          naverToggle.classList.remove("off");
        }
        if (!naverToggle.classList.contains("on")) {
          naverToggle.classList.add("on");
        }
      }
    });

    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const searchText = searchInput.value;
        const encodedSearchText = encodeURIComponent(searchText);
        let searchUrl;

        switch (engine) {
          case "google":
            searchUrl = `https://www.google.com/search?q=${encodedSearchText}`;
            break;
          case "duckduckgo":
            searchUrl = `https://duckduckgo.com/?q=${encodedSearchText}`;
            break;
          case "bing":
            searchUrl = `https://www.bing.com/search?q=${encodedSearchText}`;
            break;
          case "naver":
            searchUrl = `https://search.naver.com/search.naver?query=${encodedSearchText}`;
            break;
          default:
            searchUrl = `https://www.google.com/search?q=${encodedSearchText}`;
        }

        window.open(searchUrl, "_blank");
        searchInput.value = "";
      }
    });
    setInitialEngine();
  });
}
