import { setupMessageListener } from './message-handlers'

function setupActionClickHandler() {
  chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('./dist/app/index.html'),
    })
  })
}

function init() {
  setupActionClickHandler()
  setupMessageListener()
}

init()
