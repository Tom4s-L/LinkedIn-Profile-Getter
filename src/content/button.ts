import type { NotionResponse, ProfileData } from './types'
import { BUTTON_BASE_STYLES, BUTTON_STATES } from './styles'

export function applyButtonState(btn: HTMLButtonElement, state: keyof typeof BUTTON_STATES) {
  const stateConfig = BUTTON_STATES[state]
  btn.textContent = stateConfig.text

  if (stateConfig.backgroundColor)
    btn.style.backgroundColor = stateConfig.backgroundColor
  if (stateConfig.color)
    btn.style.color = stateConfig.color
  if (stateConfig.borderColor)
    btn.style.borderColor = stateConfig.borderColor

  if (state === 'disabled') {
    btn.disabled = true
    btn.style.cursor = 'not-allowed'
  }
  else if (state === 'loading') {
    btn.disabled = true
    btn.style.cursor = 'wait'
  }
  else if (state === 'default') {
    btn.disabled = false
    btn.style.cursor = 'pointer'
  }
}

function setupHoverEffect(btn: HTMLButtonElement) {
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
}

function checkIfProfileExists(btn: HTMLButtonElement, url: string) {
  chrome.runtime.sendMessage(
    {
      type: 'CHECK_PROFILE_EXISTS',
      url,
    },
    (response) => {
      if (response?.exists) {
        applyButtonState(btn, 'disabled')
      }
    },
  )
}

async function handleNotionSend(btn: HTMLButtonElement, data: ProfileData) {
  applyButtonState(btn, 'loading')

  chrome.runtime.sendMessage(
    {
      type: 'SEND_TO_NOTION',
      data,
    },
    (result: NotionResponse) => {
      if (result.success) {
        applyButtonState(btn, 'success')
        setTimeout(() => applyButtonState(btn, 'disabled'), 2000)
      }
      else {
        applyButtonState(btn, 'error')
        console.error('Erreur Notion:', result.error)
        setTimeout(() => applyButtonState(btn, 'default'), 2000)
      }
    },
  )
}

export function createButton(className: string, size: 'small' | 'large', getData: () => ProfileData | null): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = className

  const sizeStyles = size === 'large'
    ? { padding: '10px 16px', fontSize: '16px', borderRadius: '24px', marginLeft: '8px' }
    : { padding: '6px 12px', borderRadius: '16px' }

  Object.assign(btn.style, BUTTON_BASE_STYLES, sizeStyles)

  applyButtonState(btn, 'default')
  setupHoverEffect(btn)

  const data = getData()
  if (data) {
    checkIfProfileExists(btn, data.url)
  }

  btn.addEventListener('click', async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const profileData = getData()
    if (!profileData) {
      applyButtonState(btn, 'error')
      setTimeout(() => applyButtonState(btn, 'default'), 2000)
      return
    }

    // eslint-disable-next-line no-console
    console.log('📋 Profile Data:', profileData)
    await handleNotionSend(btn, profileData)
  })

  return btn
}
