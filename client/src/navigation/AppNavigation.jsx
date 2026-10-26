import { useState } from 'react'
import Dashboard from '../screens/Dashboard'
import Login from '../screens/Login'
import Signup from '../screens/Signup'

export default function AppNavigation() {
  const [screen, setScreen] = useState('login');


  if (screen === 'dashboard') return <Dashboard onLogout={() => setScreen('login')} />
  if (screen === 'signup') return <Signup onLogin={() => setScreen('login')} onDashboard={() => setScreen('dashboard')} />
  return <Login onSignup={() => setScreen('signup')} onDashboard={() => setScreen('dashboard')} />
}
