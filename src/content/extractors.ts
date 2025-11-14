import type { ProfileData } from './types'
import { $x, formatNameWithUppercaseLastName } from './utils'

export function extractProfileDataFromCard(card: HTMLElement): ProfileData {
  const nameLink = card.querySelector('a[data-view-name=\'search-result-lockup-title\'][href*=\'/in/\']') as HTMLAnchorElement | null
  const url = (nameLink?.href || '').split('?')[0]
  const rawName = nameLink?.textContent?.trim().replace(/\s+/g, ' ') || ''
  const name = formatNameWithUppercaseLastName(rawName)
  const nameP = nameLink?.closest('p')
  const headline = nameP?.nextElementSibling?.textContent?.trim().replace(/\s+/g, ' ') || ''

  return { name, headline, url }
}

export function extractProfileDataFromPage(): ProfileData | null {
  const url = window.location.href.split('?')[0]

  let rawName = ''
  let headline = ''

  const verifiedBadgeNodes = $x('//div[@data-view-name="profile-top-card-verified-badge"]//p[1]')
  if (verifiedBadgeNodes.length > 0) {
    rawName = (verifiedBadgeNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''

    const badgeContainer = (verifiedBadgeNodes[0] as HTMLElement).closest('div[data-view-name="profile-top-card-verified-badge"]')
    if (badgeContainer) {
      const allParagraphs = $x('following::p', badgeContainer)
      for (let i = 0; i < Math.min(allParagraphs.length, 5); i++) {
        const text = (allParagraphs[i] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''
        if (text && text.length > 20 && !text.startsWith('·') && !text.includes('abonnés')) {
          headline = text
          break
        }
      }
    }
  }

  if (!rawName) {
    const nameNodes = $x('//main//h1')
    rawName = (nameNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''
  }

  if (!headline) {
    const headlineNodes = $x('//div[contains(@class, "break-words")][@data-generated-suggestion-target]')
    headline = (headlineNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''
  }

  const name = formatNameWithUppercaseLastName(rawName)

  if (!name || !url)
    return null

  return { name, headline, url }
}

export function isProfilePage(): boolean {
  return window.location.pathname.startsWith('/in/')
}
