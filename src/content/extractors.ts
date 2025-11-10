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

  const nameNodes = $x('//main//h1')
  const rawName = (nameNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''
  const name = formatNameWithUppercaseLastName(rawName)

  const headlineNodes = $x('//div[contains(@class, "break-words")][@data-generated-suggestion-target]')
  const headline = (headlineNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''

  if (!name || !url)
    return null

  return { name, headline, url }
}

export function isProfilePage(): boolean {
  return window.location.pathname.startsWith('/in/')
}
