// we create a listener on our extension button
chrome.action.onClicked.addListener(function(){
  chrome.tabs.create({ url: "https://bard.google.com/u/1/?hl=en" });
});