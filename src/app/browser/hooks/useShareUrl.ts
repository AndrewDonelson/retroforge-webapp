import { useMemo } from 'react'

export function useShareUrl(): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return ''
    const locationObj = window.location
    return locationObj.href
  }, [])
}

