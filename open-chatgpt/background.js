// we create a listener on our extension button
chrome.action.onClicked.addListener(function(){
  chrome.tabs.create({ url: "https://chat.openai.com/" });
});