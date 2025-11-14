export const BUTTON_BASE_STYLES = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  color: '#0a66c2',
  border: 'none',
  transition: 'all 0.2s ease',
  fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif',
  boxShadow: '0 0 0 1px #0a66c2',
}

interface ButtonState {
  text: string
  backgroundColor?: string
  color?: string
  borderColor?: string
}

export const BUTTON_STATES: Record<string, ButtonState> = {
  default: {
    text: '💾 Notion',
    backgroundColor: 'transparent',
    color: '#0a66c2',
    borderColor: '#0a66c2',
  },
  loading: {
    text: '⏳ Envoi...',
    backgroundColor: '#e8f3fb',
  },
  success: {
    text: '✓ Enregistré',
    backgroundColor: '#d1fae5',
    color: '#059669',
    borderColor: '#10b981',
  },
  error: {
    text: '✗ Erreur',
    backgroundColor: '#fee',
    color: '#dc2626',
    borderColor: '#fca5a5',
  },
  disabled: {
    text: 'Déjà ajouté à Notion',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    borderColor: '#d1d5db',
  },
}
