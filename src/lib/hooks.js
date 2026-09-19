import { useEffect, useState } from 'react'
import { RM } from './data.js'

export function useClock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])
  return {
    date: t.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' }),
    time: t.toLocaleTimeString('en-US', { hour12: false })
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'light')
  const apply = t => {
    const h = document.documentElement
    setTheme(t)
    if (h.getAttribute('data-theme') === t) return
    h.setAttribute('data-theme', t)
    try { localStorage.setItem('mrx-theme', t) } catch (e) {}
    if (RM) return
    h.classList.remove('theme-transition')
    void h.offsetWidth
    h.classList.add('theme-transition')
    setTimeout(() => h.classList.remove('theme-transition'), 350)
  }
  const toggle = () => apply(theme === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}