/* eslint-disable antfu/top-level-function */

// ==================== Helpers ====================

const $x = (xpath: string, context: Node = document): Node[] => {
  const result: Node[] = []
  const query = document.evaluate(xpath, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  for (let i = 0; i < query.snapshotLength; i++) {
    const node = query.snapshotItem(i)
    if (node)
      result.push(node)
  }
  return result
}

// ==================== Extraction des données ====================

interface ProfileData {
  name: string
  headline: string
  url: string
}

const formatNameWithUppercaseLastName = (fullName: string): string => {
  if (!fullName)
    return ''

  const parts = fullName.trim().split(' ')
  if (parts.length === 0)
    return ''

  // Le dernier mot est le nom de famille
  const lastName = parts[parts.length - 1].toUpperCase()
  const firstNames = parts.slice(0, -1).join(' ')

  return firstNames ? `${firstNames} ${lastName}` : lastName
}

const extractProfileData = (card: HTMLElement): ProfileData => {
  const nameLink = card.querySelector('a[data-view-name=\'search-result-lockup-title\'][href*=\'/in/\']') as HTMLAnchorElement | null
  const url = (nameLink?.href || (card as HTMLAnchorElement).href || '').split('?')[0]
  const rawName = nameLink?.textContent?.trim().replace(/\s+/g, ' ') || ''
  const name = formatNameWithUppercaseLastName(rawName)
  const nameP = nameLink?.closest('p')
  const headline = nameP?.nextElementSibling?.textContent?.trim().replace(/\s+/g, ' ') || ''

  return { name, headline, url }
}

// ==================== Injection des boutons ====================

const createLogButton = (card: HTMLElement): HTMLButtonElement => {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = 'Log'
  btn.className = 'tg-log-btn'

  Object.assign(btn.style, {
    position: 'absolute',
    right: '8px',
    top: '8px',
    zIndex: '9999',
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: '#0a66c2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    transition: 'all 0.3s ease',
  })

  // Vérifier si le profil existe déjà
  const data = extractProfileData(card)
  chrome.runtime.sendMessage(
    {
      type: 'CHECK_PROFILE_EXISTS',
      url: data.url,
    },
    (response) => {
      if (response?.exists) {
        // Profil déjà enregistré - griser le bouton
        btn.textContent = '✓ Déjà enregistré'
        btn.disabled = true
        btn.style.backgroundColor = '#6b7280'
        btn.style.cursor = 'not-allowed'
        btn.style.opacity = '0.6'
      }
    },
  )

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Désactiver le bouton pendant l'envoi
    btn.disabled = true
    btn.textContent = '⏳'
    btn.style.cursor = 'wait'

    const data = extractProfileData(card)
    // eslint-disable-next-line no-console
    console.log('📋 Profile Data:', data)

    // Envoyer à Notion via le background script
    chrome.runtime.sendMessage(
      {
        type: 'SEND_TO_NOTION',
        data,
      },
      (result) => {
        if (result.success) {
          // Succès
          btn.textContent = '✓'
          btn.style.backgroundColor = '#10b981'
          setTimeout(() => {
            btn.textContent = '✓ Déjà enregistré'
            btn.style.backgroundColor = '#6b7280'
            btn.style.opacity = '0.6'
            btn.style.cursor = 'not-allowed'
          }, 2000)
        }
        else {
          // Erreur
          btn.textContent = '✗'
          btn.style.backgroundColor = '#ef4444'
          console.error('Erreur Notion:', result.error)
          setTimeout(() => {
            btn.textContent = 'Log'
            btn.style.backgroundColor = '#0a66c2'
            btn.disabled = false
            btn.style.cursor = 'pointer'
          }, 2000)
        }
      },
    )
  })

  return btn
}

const addLogButtons = () => {
  const cards = $x('//a[contains(@href,\'/in/\')][.//a[@data-view-name=\'search-result-lockup-title\']]')

  cards.forEach((cardNode) => {
    const card = cardNode as HTMLElement

    // Éviter les doublons
    if (card.querySelector('.tg-log-btn'))
      return

    // Assurer le positionnement relatif
    if (getComputedStyle(card).position === 'static')
      card.style.position = 'relative'

    // Ajouter le bouton
    const btn = createLogButton(card)
    card.appendChild(btn)
  })
}

// ==================== Détection de navigation ====================

let currentUrl = window.location.href

const onNavigationChange = () => {
  // Délai pour laisser le DOM se charger
  setTimeout(addLogButtons, 1000)

  // Observer les changements dynamiques du DOM
  const observer = new MutationObserver(addLogButtons)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

// ==================== Initialisation ====================

// Au chargement initial
onNavigationChange()

// Intercepter les changements de route (SPA)
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

// Navigation navigateur (retour/avant)
window.addEventListener('popstate', () => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href
    onNavigationChange()
  }
})
