import { isProfilePage } from './extractors'
import { injectButtonIntoProfilePage, injectButtonsIntoSearchResults } from './injectors'

let currentUrl = window.location.href
let currentObserver: MutationObserver | null = null

function injectButtons() {
  if (isProfilePage()) {
    injectButtonIntoProfilePage()
  }
  else {
    injectButtonsIntoSearchResults()
  }
}

function cleanupPreviousState() {
  if (currentObserver) {
    currentObserver.disconnect()
    currentObserver = null
  }

  const oldButton = document.querySelector('.tg-log-btn-profile')
  if (oldButton) {
    oldButton.closest('div')?.remove()
  }
}

function setupMutationObserver() {
  currentObserver = new MutationObserver(injectButtons)
  currentObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

export function onNavigationChange() {
  cleanupPreviousState()

  setTimeout(injectButtons, 1000)
  setupMutationObserver()
}

export function setupNavigationListeners() {
  const originalPushState = history.pushState.bind(history)
  history.pushState = (...args: Parameters<typeof history.pushState>) => {
    originalPushState(...args)
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href
      onNavigationChange()
    }
  }

  const originalReplaceState = history.replaceState.bind(history)
  history.replaceState = (...args: Parameters<typeof history.replaceState>) => {
    originalReplaceState(...args)
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href
      onNavigationChange()
    }
  }

  window.addEventListener('popstate', () => {
    if (currentUrl !== window.location.href) {
      currentUrl = window.location.href
      onNavigationChange()
    }
  })
}
