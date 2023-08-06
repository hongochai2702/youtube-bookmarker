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

const viewiAllVideoYoutube = async (data) => {
  /* {
    "1YOriwQm3lk": "[{\"time\":4.904894,\"desc\":\"Bookmark at 00:00:04\"}]",
    "3elGSZSWTbM": "[]",
    "A96Up2FCFa4": "[]",
    "M_T56hUiCGA": "[{\"time\":351.46559,\"desc\":\"Bookmark at 00:05:51\"}]",
    "ppKv0rfh7p4": "[{\"time\":8.893242,\"desc\":\"Bookmark at 00:00:08\"}]",
    "xHJJg09ZSVg": "[{\"time\":321.052007,\"desc\":\"Bookmark at 00:05:21\"},{\"time\":995.071173,\"desc\":\"Bookmark at 00:16:35\"},{\"time\":7105.563928,\"desc\":\"Bookmark at 01:58:25\"}]",
    "xKs2IZZya7c": "[{\"time\":5186.087615,\"desc\":\"Bookmark at 01:26:26\"},{\"time\":5219.054956,\"desc\":\"Bookmark at 01:26:59\"},{\"time\":6064,\"desc\":\"Bookmark at 01:41:04\"},{\"time\":6064,\"desc\":\"Bookmark at 01:41:04\"},{\"time\":6064,\"desc\":\"Bookmark at 01:41:04\"}]"
  } */
  let videoURL = "https://www.youtube.com/watch?v={0}";
  const container = document.getElementsByClassName("container")[0];
  container.innerHTML =
    '<div class="title">This is list youtube video page.</div>';
  const activeTab = await getActiveTabURL();
  const listTagElm = document.createElement("ul");
  for (const [key, value] of Object.entries(data)) {
    const itemTagElm = document.createElement("li");
    // const linkVideoElm = document.createElement("a");
    const videoTimestamp = value ? JSON.parse(value) : [];
    itemTagElm.textContent = key;
    itemTagElm.style.cursor = "pointer";
    itemTagElm.style.color = "blue";

    itemTagElm.title = "Click to play video";
    if (videoTimestamp?.length > 0) {
      videoURL = videoURL.concat("&t=", videoTimestamp[0].time);
    }

    itemTagElm.setAttribute("href", videoURL.replace("{0}", key));
    itemTagElm.addEventListener("click", () => {
      chrome.tabs.sendMessage(activeTab.id, {
        type: "OPEN_YTP",
        value: videoURL.replace("{0}", key),
      });
    });

    // itemTagElm.appendChild(linkVideoElm);
    listTagElm.appendChild(itemTagElm);
  }

  container.appendChild(listTagElm);
  // container.innerHTML =
  //   '<div class="title">This is not a youtube video page.</div>';
  console.log(data);
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
  } else if (activeTab.url.includes("youtube.com")) {
    chrome.storage.sync.get().then((data) => {
      viewiAllVideoYoutube(data);
    });
  } else {
    const container = document.getElementsByClassName("container")[0];
    container.innerHTML =
      '<div class="title">This is not a youtube video page.</div>';
  }
});
