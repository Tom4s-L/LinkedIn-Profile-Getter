import type { NotionResponse, ProfileData } from './types'
import { NOTION_CONFIG } from '../config/notion'

const NOTION_API_BASE = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'

function getNotionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_CONFIG.apiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  }
}

export async function checkProfileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${NOTION_API_BASE}/databases/${NOTION_CONFIG.databaseId}/query`, {
      method: 'POST',
      headers: getNotionHeaders(),
      body: JSON.stringify({
        filter: {
          property: 'Url LinkedIn',
          url: { equals: url },
        },
      }),
    })

    if (!response.ok) {
      console.error('Erreur lors de la vérification du profil')
      return false
    }

    const data = await response.json()
    return data.results.length > 0
  }
  catch (error) {
    console.error('Erreur lors de la vérification:', error)
    return false
  }
}

function buildNotionPagePayload(data: ProfileData) {
  return {
    parent: {
      database_id: NOTION_CONFIG.databaseId,
    },
    properties: {
      'Name': {
        title: [{ text: { content: data.name } }],
      },
      'Headline': {
        rich_text: [{ text: { content: data.headline } }],
      },
      'Url LinkedIn': {
        url: data.url,
      },
      'Type': {
        select: { name: NOTION_CONFIG.defaultType },
      },
      'Connecté': {
        select: { name: '⏳ Demande envoyée' },
      },
      'Statut': {
        select: { name: '😴 Pas contacté' },
      },
      'Commentaire': {
        rich_text: [],
      },
    },
  }
}

export async function sendToNotion(data: ProfileData): Promise<NotionResponse> {
  try {
    const response = await fetch(`${NOTION_API_BASE}/pages`, {
      method: 'POST',
      headers: getNotionHeaders(),
      body: JSON.stringify(buildNotionPagePayload(data)),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Erreur API Notion:', error)
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'envoi à Notion',
      }
    }

    return { success: true }
  }
  catch (error) {
    console.error('Erreur lors de l\'envoi à Notion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
