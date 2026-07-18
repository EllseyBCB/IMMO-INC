import { useEffect } from 'react'
import { ladeSpielstand, useGame } from './state/game'
import Onboarding from './features/onboarding/Onboarding'
import PhoneOS from './features/phone/PhoneOS'

export default function App() {
  const { gestartet, laden } = useGame()

  useEffect(() => {
    const saved = ladeSpielstand()
    if (saved && saved.gestartet) laden(saved)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Echtzeit-Herzschlag: wendet jede Sekunde die vergangene Zeit an (auch offline).
  useEffect(() => {
    const id = setInterval(() => useGame.getState().tick(), 1000)
    return () => clearInterval(id)
  }, [])

  if (!gestartet) {
    return <Onboarding />
  }

  return <PhoneOS />
}
