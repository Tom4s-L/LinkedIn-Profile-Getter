import { createButton } from './button'
import { extractProfileDataFromCard, extractProfileDataFromPage } from './extractors'
import { $x } from './utils'

export function injectButtonIntoProfilePage() {
  if (document.querySelector('.tg-log-btn-profile'))
    return

  const newContainer = $x('/html/body/div[1]/div[2]/div[2]/div[2]/div/main/div/div/div[1]/div/div/div[1]/div/section/div/div/div[2]')
  let targetContainer = newContainer[0] as HTMLElement | null

  if (!targetContainer) {
    const actionButtons = $x('//div[contains(@class, "pvs-profile-actions")]')
    targetContainer = actionButtons[0] as HTMLElement | null
  }

  if (!targetContainer) {
    const buttons = $x('//main//button[contains(text(), "Message") or contains(text(), "Plus")]')
    if (buttons.length > 0) {
      targetContainer = buttons[0].parentElement as HTMLElement
    }
  }

  if (!targetContainer) {
    const section = $x('//main/section[1]')[0] as HTMLElement
    if (!section)
      return
    targetContainer = section
  }

  const btn = createButton('tg-log-btn-profile', 'large', extractProfileDataFromPage)

  if (targetContainer.tagName === 'SECTION') {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'padding: 24px 0; border-top: 1px solid #e5e7eb; display: flex; justify-content: center;'
    wrapper.appendChild(btn)
    targetContainer.appendChild(wrapper)
  }
  else {
    targetContainer.appendChild(btn)
  }
}

export function injectButtonsIntoSearchResults() {
  const cards = $x('//div[@data-view-name="people-search-result"]')

  cards.forEach((cardNode) => {
    const card = cardNode as HTMLElement

    if (card.querySelector('.tg-log-btn'))
      return

    const profileLink = card.querySelector('a[data-view-name=\'search-result-lockup-title\'][href*=\'/in/\']') as HTMLElement
    if (!profileLink)
      return

    const btn = createButton('tg-log-btn', 'small', () => extractProfileDataFromCard(card))

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display: flex; justify-content: center; padding: 12px 16px; border-top: 1px solid #e5e7eb; margin-top: 12px;'
    wrapper.appendChild(btn)

    card.appendChild(wrapper)
  })
}
