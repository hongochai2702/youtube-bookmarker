(() => {
  let ytpLeftControls, ytpPlayer;
  let currentVideo = "";
  let currentVideoBookmarks = [];
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;
    if (type === "NEW") {
      currentVideo = videoId;
      newVideoLoadded();
    } else if (type === "PLAY") {
      ytpPlayer.currentTime = value;
      ytpPlayer.play();
    } else if (type === "DELETE") {
      console.log("DELETE", currentVideoBookmarks);
      currentVideoBookmarks = currentVideoBookmarks.filter(
        (bookmark) => bookmark.time != value
      );
      chrome.storage.sync.set({
        [currentVideo]: JSON.stringify(currentVideoBookmarks),
      });
      response(currentVideoBookmarks);
    } else if (type === "OPEN_YTP") {
      const promt = window.confirm("Are you sure you want to open this video?");
      if (promt) {
        window.open(value, "_self");
      }
    }
  });

  const fetchBookmarks = () => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([currentVideo], (obj) => {
        resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
      });
    });
  };

  const newVideoLoadded = async () => {
    const bookmarkBtnExists =
      document.getElementsByClassName("bookmark-btn")[0];

    currentVideoBookmarks = await fetchBookmarks();
    ytpLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
    ytpPlayer = document.getElementsByClassName("video-stream")[0];
    if (!bookmarkBtnExists) {
      const bookmarkBtnElm = document.createElement("img");
      bookmarkBtnElm.src = chrome.runtime.getURL("assets/bookmark.png");
      bookmarkBtnElm.classList.add("bookmark-btn", "ytp-button");
      bookmarkBtnElm.title = "Click to bookmark current timestamp";
      bookmarkBtnElm.addEventListener("click", addNewBookmarkVideoHandler);

      ytpLeftControls.appendChild(bookmarkBtnElm);
    }
  };

  const addNewBookmarkVideoHandler = async (e) => {
    // console.log(e);
    const currentTime = ytpPlayer.currentTime;
    const newBookmark = {
      time: currentTime,
      desc: `Bookmark at ${getTime(currentTime)}`,
    };

    currentVideoBookmarks = await fetchBookmarks();
    const currentVideoBookmarksData = [
      ...currentVideoBookmarks,
      newBookmark,
    ].sort((a, b) => a.time - b.time);

    currentVideoBookmarks = currentVideoBookmarksData;
    console.log({ newBookmark, currentVideoBookmarksData });
    chrome.storage.sync.set({
      [currentVideo]: JSON.stringify(currentVideoBookmarksData),
    });
  };
})();

const getTime = (t) => {
  const date = new Date(0);
  date.setSeconds(t);
  return date.toISOString().substring(11, 19);
};
