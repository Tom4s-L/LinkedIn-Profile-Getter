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
  const url = (nameLink?.href || '').split('?')[0]
  const rawName = nameLink?.textContent?.trim().replace(/\s+/g, ' ') || ''
  const name = formatNameWithUppercaseLastName(rawName)
  const nameP = nameLink?.closest('p')
  const headline = nameP?.nextElementSibling?.textContent?.trim().replace(/\s+/g, ' ') || ''

  return { name, headline, url }
}

// ==================== Injection des boutons ====================

const createLogButton = (profileLink: HTMLElement): HTMLButtonElement => {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = '💾 Notion'
  btn.className = 'tg-log-btn'

  Object.assign(btn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#0a66c2',
    border: '1px solid #0a66c2',
    borderRadius: '16px',
    transition: 'all 0.2s ease',
    fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif',
    boxShadow: 'none',
  })

  // Hover effect
  btn.addEventListener('mouseenter', () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = '#e8f3fb'
      btn.style.borderWidth = '2px'
    }
  })

  btn.addEventListener('mouseleave', () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = 'transparent'
      btn.style.borderWidth = '1px'
    }
  })

  // Vérifier si le profil existe déjà
  const card = profileLink.closest('div[data-view-name="people-search-result"]') as HTMLElement
  const data = extractProfileData(card || profileLink)
  chrome.runtime.sendMessage(
    {
      type: 'CHECK_PROFILE_EXISTS',
      url: data.url,
    },
    (response) => {
      if (response?.exists) {
        // Profil déjà enregistré - griser le bouton
        btn.textContent = 'Déjà ajouté à Notion'
        btn.disabled = true
        btn.style.backgroundColor = '#f3f4f6'
        btn.style.color = '#6b7280'
        btn.style.borderColor = '#d1d5db'
        btn.style.cursor = 'not-allowed'
      }
    },
  )

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Désactiver le bouton pendant l'envoi
    btn.disabled = true
    btn.textContent = '⏳ Envoi...'
    btn.style.cursor = 'wait'
    btn.style.backgroundColor = '#e8f3fb'

    const card = profileLink.closest('div[data-view-name="people-search-result"]') as HTMLElement
    const data = extractProfileData(card || profileLink)
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
          btn.textContent = '✓ Enregistré'
          btn.style.backgroundColor = '#d1fae5'
          btn.style.color = '#059669'
          btn.style.borderColor = '#10b981'
          setTimeout(() => {
            btn.textContent = 'Déjà ajouté à Notion'
            btn.style.backgroundColor = '#f3f4f6'
            btn.style.color = '#6b7280'
            btn.style.borderColor = '#d1d5db'
            btn.style.cursor = 'not-allowed'
          }, 2000)
        }
        else {
          // Erreur
          btn.textContent = '✗ Erreur'
          btn.style.backgroundColor = '#fee'
          btn.style.color = '#dc2626'
          btn.style.borderColor = '#fca5a5'
          console.error('Erreur Notion:', result.error)
          setTimeout(() => {
            btn.textContent = '💾 Notion'
            btn.style.backgroundColor = 'transparent'
            btn.style.color = '#0a66c2'
            btn.style.borderColor = '#0a66c2'
            btn.disabled = false
            btn.style.cursor = 'pointer'
          }, 2000)
        }
      },
    )
  })

  return btn
}

// Fonction pour détecter si on est sur une page de profil
const isProfilePage = (): boolean => {
  return window.location.pathname.startsWith('/in/')
}

// Fonction pour extraire les données depuis une page de profil
const extractProfileDataFromProfilePage = (): ProfileData | null => {
  // Récupérer l'URL actuelle
  const url = window.location.href.split('?')[0]

  // Chercher le nom avec XPath
  const nameNodes = $x('//main//h1')
  const rawName = (nameNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''
  const name = formatNameWithUppercaseLastName(rawName)

  // Chercher le headline avec XPath
  const headlineNodes = $x('//div[contains(@class, "break-words")][@data-generated-suggestion-target]')
  const headline = (headlineNodes[0] as HTMLElement)?.textContent?.trim().replace(/\s+/g, ' ') || ''

  if (!name || !url)
    return null

  return { name, headline, url }
}

// Fonction pour ajouter le bouton sur une page de profil
const addLogButtonToProfilePage = () => {
  // Éviter les doublons
  if (document.querySelector('.tg-log-btn-profile'))
    return

  // Trouver le container des boutons d'action (Message, Plus, etc.)
  const actionButtons = $x('//div[contains(@class, "pvs-profile-actions")]')
  let targetContainer = actionButtons[0] as HTMLElement | null

  // Si pas trouvé, chercher les boutons directement
  if (!targetContainer) {
    const buttons = $x('//main//button[contains(text(), "Message") or contains(text(), "Plus")]')
    if (buttons.length > 0) {
      targetContainer = buttons[0].parentElement as HTMLElement
    }
  }

  // Fallback: ajouter après la section principale
  if (!targetContainer) {
    const section = $x('//main/section[1]')[0] as HTMLElement
    if (!section)
      return
    targetContainer = section
  }

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.textContent = '💾 Notion'
  btn.className = 'tg-log-btn-profile'

  Object.assign(btn.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '10px 16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#0a66c2',
    border: '1px solid #0a66c2',
    borderRadius: '24px',
    transition: 'all 0.2s ease',
    fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif',
    marginLeft: '8px',
    boxShadow: 'none',
  })

  // Hover effect
  btn.addEventListener('mouseenter', () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = '#e8f3fb'
      btn.style.borderWidth = '2px'
    }
  })

  btn.addEventListener('mouseleave', () => {
    if (!btn.disabled) {
      btn.style.backgroundColor = 'transparent'
      btn.style.borderWidth = '1px'
    }
  })

  // Vérifier si le profil existe déjà
  const data = extractProfileDataFromProfilePage()
  if (!data)
    return

  chrome.runtime.sendMessage(
    {
      type: 'CHECK_PROFILE_EXISTS',
      url: data.url,
    },
    (response) => {
      if (response?.exists) {
        btn.textContent = 'Déjà ajouté à Notion'
        btn.disabled = true
        btn.style.backgroundColor = '#f3f4f6'
        btn.style.color = '#6b7280'
        btn.style.borderColor = '#d1d5db'
        btn.style.cursor = 'not-allowed'
      }
    },
  )

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    btn.disabled = true
    btn.textContent = '⏳ Envoi...'
    btn.style.cursor = 'wait'
    btn.style.backgroundColor = '#e8f3fb'

    const profileData = extractProfileDataFromProfilePage()
    if (!profileData) {
      btn.textContent = '✗ Erreur'
      btn.style.backgroundColor = '#fee'
      btn.style.color = '#dc2626'
      btn.style.borderColor = '#fca5a5'
      setTimeout(() => {
        btn.textContent = '💾 Notion'
        btn.style.backgroundColor = 'transparent'
        btn.style.color = '#0a66c2'
        btn.style.borderColor = '#0a66c2'
        btn.disabled = false
        btn.style.cursor = 'pointer'
      }, 2000)
      return
    }

    // eslint-disable-next-line no-console
    console.log('📋 Profile Data:', profileData)

    chrome.runtime.sendMessage(
      {
        type: 'SEND_TO_NOTION',
        data: profileData,
      },
      (result) => {
        if (result.success) {
          btn.textContent = '✓ Enregistré'
          btn.style.backgroundColor = '#d1fae5'
          btn.style.color = '#059669'
          btn.style.borderColor = '#10b981'
          setTimeout(() => {
            btn.textContent = 'Déjà ajouté à Notion'
            btn.style.backgroundColor = '#f3f4f6'
            btn.style.color = '#6b7280'
            btn.style.borderColor = '#d1d5db'
            btn.style.cursor = 'not-allowed'
          }, 2000)
        }
        else {
          btn.textContent = '✗ Erreur'
          btn.style.backgroundColor = '#fee'
          btn.style.color = '#dc2626'
          btn.style.borderColor = '#fca5a5'
          console.error('Erreur Notion:', result.error)
          setTimeout(() => {
            btn.textContent = '💾 Notion'
            btn.style.backgroundColor = 'transparent'
            btn.style.color = '#0a66c2'
            btn.style.borderColor = '#0a66c2'
            btn.disabled = false
            btn.style.cursor = 'pointer'
          }, 2000)
        }
      },
    )
  })

  // Insérer le bouton
  if (targetContainer.tagName === 'SECTION') {
    // Si c'est une section, créer un wrapper centré
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'padding: 24px 0; border-top: 1px solid #e5e7eb; display: flex; justify-content: center;'
    wrapper.appendChild(btn)
    targetContainer.appendChild(wrapper)
  }
  else {
    // Sinon l'ajouter directement à côté des autres boutons
    targetContainer.appendChild(btn)
  }
}

// Fonction pour ajouter les boutons sur les cartes de recherche
const addLogButtons = () => {
  // Chercher toutes les cartes de résultats de recherche
  const cards = $x('//div[@data-view-name="people-search-result"]')

  cards.forEach((cardNode) => {
    const card = cardNode as HTMLElement

    // Éviter les doublons
    if (card.querySelector('.tg-log-btn'))
      return

    // Trouver le lien du profil dans cette carte
    const profileLink = card.querySelector('a[data-view-name=\'search-result-lockup-title\'][href*=\'/in/\']') as HTMLElement
    if (!profileLink)
      return

    // Créer un wrapper pour le bouton (centré en bas)
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display: flex; justify-content: center; padding: 12px 16px; border-top: 1px solid #e5e7eb; margin-top: 12px;'

    // Ajouter le bouton dans le wrapper
    const btn = createLogButton(profileLink)
    wrapper.appendChild(btn)

    // Ajouter le wrapper à la carte
    card.appendChild(wrapper)
  })
}

// ==================== Détection de navigation ====================

let currentUrl = window.location.href
let currentObserver: MutationObserver | null = null

const onNavigationChange = () => {
  // Nettoyer l'ancien observer
  if (currentObserver) {
    currentObserver.disconnect()
    currentObserver = null
  }

  // Supprimer l'ancien bouton de profil s'il existe
  const oldButton = document.querySelector('.tg-log-btn-profile')
  if (oldButton) {
    oldButton.closest('div')?.remove()
  }

  // Délai pour laisser le DOM se charger
  setTimeout(() => {
    if (isProfilePage()) {
      addLogButtonToProfilePage()
    }
    else {
      addLogButtons()
    }
  }, 1000)

  // Créer un nouvel observer pour les changements dynamiques du DOM
  currentObserver = new MutationObserver(() => {
    if (isProfilePage()) {
      addLogButtonToProfilePage()
    }
    else {
      addLogButtons()
    }
  })
  currentObserver.observe(document.body, {
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
