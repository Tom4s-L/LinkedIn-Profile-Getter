import { NOTION_CONFIG } from '../config/notion'

// Ouvrir l'app au clic sur l'icône
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('./dist/app/index.html'),
  })
})

// Interface pour les données de profil
interface ProfileData {
  name: string
  headline: string
  url: string
}

interface NotionResponse {
  success: boolean
  error?: string
}

// Fonction pour vérifier si un profil existe déjà dans Notion
async function checkProfileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_CONFIG.databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'Url LinkedIn',
          url: {
            equals: url,
          },
        },
      }),
    })

    if (!response.ok) {
      console.error('Error checking profile existence')
      return false
    }

    const data = await response.json()
    return data.results.length > 0
  }
  catch (error) {
    console.error('Error checking profile:', error)
    return false
  }
}

// Fonction pour envoyer à Notion
async function sendToNotion(data: ProfileData): Promise<NotionResponse> {
  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: {
          database_id: NOTION_CONFIG.databaseId,
        },
        properties: {
          'Name': {
            title: [
              {
                text: {
                  content: data.name,
                },
              },
            ],
          },
          'Headline': {
            rich_text: [
              {
                text: {
                  content: data.headline,
                },
              },
            ],
          },
          'Url LinkedIn': {
            url: data.url,
          },
          'Type': {
            select: {
              name: NOTION_CONFIG.defaultType,
            },
          },
          'Commentaire': {
            rich_text: [],
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Notion API Error:', error)
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi à Notion',
      }
    }

    return { success: true }
  }
  catch (error) {
    console.error('Error sending to Notion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

// Écouter les messages du content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEND_TO_NOTION') {
    sendToNotion(message.data)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
        })
      })
    return true // Indique qu'on va répondre de manière asynchrone
  }

  if (message.type === 'CHECK_PROFILE_EXISTS') {
    checkProfileExists(message.url)
      .then(exists => sendResponse({ exists }))
      .catch((error) => {
        console.error('Error in checkProfileExists:', error)
        sendResponse({ exists: false })
      })
    return true
  }
})
