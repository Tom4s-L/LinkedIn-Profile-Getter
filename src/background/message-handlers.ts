import type { CheckExistsResponse, NotionResponse } from './types'
import { checkProfileExists, sendToNotion } from './notion-api'

type MessageHandler = (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) => boolean | void

const handlers: Record<string, MessageHandler> = {
  SEND_TO_NOTION: (message, _sender, sendResponse) => {
    sendToNotion(message.data)
      .then((response: NotionResponse) => sendResponse(response))
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
        })
      })
    return true
  },

  CHECK_PROFILE_EXISTS: (message, _sender, sendResponse) => {
    checkProfileExists(message.url)
      .then(exists => sendResponse({ exists } as CheckExistsResponse))
      .catch((error) => {
        console.error('Erreur dans checkProfileExists:', error)
        sendResponse({ exists: false } as CheckExistsResponse)
      })
    return true
  },
}

export function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = handlers[message.type]

    if (handler) {
      return handler(message, sender, sendResponse)
    }

    return false
  })
}
