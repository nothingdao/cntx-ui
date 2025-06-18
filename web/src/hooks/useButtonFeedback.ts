// hooks/useButtonFeedback.ts
import { useState } from 'react'

export type ButtonState = 'idle' | 'loading' | 'success' | 'error'

export function useButtonFeedback() {
  const [buttonStates, setButtonStates] = useState<Record<string, ButtonState>>(
    {}
  )

  const setButtonState = (key: string, state: ButtonState) => {
    setButtonStates((prev) => ({ ...prev, [key]: state }))

    // Auto-clear success/error states
    if (state === 'success') {
      setTimeout(() => {
        setButtonStates((prev) => ({ ...prev, [key]: 'idle' }))
      }, 2000)
    } else if (state === 'error') {
      setTimeout(() => {
        setButtonStates((prev) => ({ ...prev, [key]: 'idle' }))
      }, 3000)
    }
  }

  const getButtonState = (key: string): ButtonState => {
    return buttonStates[key] || 'idle'
  }

  const isLoading = (key: string) => getButtonState(key) === 'loading'
  const isSuccess = (key: string) => getButtonState(key) === 'success'
  const isError = (key: string) => getButtonState(key) === 'error'

  return {
    setButtonState,
    getButtonState,
    isLoading,
    isSuccess,
    isError,
  }
}
