import { getActiveTabURL } from "./utils.js";

// adding a new bookmark row to the popup
const addNewBookmark = (bookmarksElement, bookmarkItem) => {
  const bookmarkTitleElm = document.createElement("div");
  const newBookmarkElm = document.createElement("div");
  const controlElement = document.createElement("div");

  bookmarkTitleElm.textContent = bookmarkItem.desc;
  bookmarkTitleElm.className = "bookmark-title";

  controlElement.className = "bookmark-controls";

  newBookmarkElm.id = "bookmark-" + bookmarkItem.time;
  newBookmarkElm.className = "bookmark";
  newBookmarkElm.setAttribute("timestamp", bookmarkItem.time);

  setBookmarkAttributes("play", onPlay, controlElement);
  setBookmarkAttributes("delete", onDelete, controlElement);

  newBookmarkElm.appendChild(bookmarkTitleElm);
  newBookmarkElm.appendChild(controlElement);
  bookmarksElement.appendChild(newBookmarkElm);
};

const viewBookmarks = (bookmarkVideos = []) => {
  const bookmarksElement = document.getElementById("bookmarks");
  bookmarksElement.innerHTML = "";

  if (bookmarkVideos.length > 0) {
    for (let i = 0; i < bookmarkVideos.length; i++) {
      const bookmarkItem = bookmarkVideos[i];
      // Create a new bookmark
      addNewBookmark(bookmarksElement, bookmarkItem);
    }
  } else {
    bookmarksElement.innerHTML = '<i class="row">No bookmarks to show</i>';
  }
};

const onPlay = async (e) => {
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const activeTab = await getActiveTabURL();

  chrome.tabs.sendMessage(activeTab.id, {
    type: "PLAY",
    value: bookmarkTime,
  });
};

const onDelete = async (e) => {
  const activeTab = await getActiveTabURL();
  const bookmarkTime = e.target.parentNode.parentNode.getAttribute("timestamp");
  const bookmarkElmToDelete = document.getElementById(
    `bookmark-${bookmarkTime}`
  );

  bookmarkElmToDelete.parentNode.removeChild(bookmarkElmToDelete);
  chrome.tabs.sendMessage(
    activeTab.id,
    { type: "DELETE", value: bookmarkTime },
    viewBookmarks
  );
};

const setBookmarkAttributes = (src, eventListener, controlParentElement) => {
  const controlElement = document.createElement("img");
  controlElement.src = `assets/${src}.png`;
  controlElement.title = src;
  controlElement.addEventListener("click", eventListener);
  controlParentElement.appendChild(controlElement);
};

document.addEventListener("DOMContentLoaded", async () => {
  const activeTab = await getActiveTabURL();
  const queryParameters = activeTab.url.split("?")[1];
  const urlParameters = new URLSearchParams(queryParameters);
  const currentVideoId = urlParameters.get("v");
  if (activeTab.url.includes("youtube.com/watch") && currentVideoId) {
    chrome.storage.sync.get([currentVideoId], (data) => {
      const bookmarkVideos = data[currentVideoId]
        ? JSON.parse(data[currentVideoId])
        : [];
      // viewbookmarks
      viewBookmarks(bookmarkVideos);
    });
  } else {
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML =
      '<div class="title">This is not a youtube video page.</div>';
  }
});
