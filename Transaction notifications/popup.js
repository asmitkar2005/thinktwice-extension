const input = document.getElementById("msg");
const saveBtn = document.getElementById("save");

chrome.storage.sync.get(["userMessage"], (res) => {
  if (res.userMessage) {
    input.value = res.userMessage;
  }
});

saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set({
    userMessage: input.value || "Think before buying"
  });
});
