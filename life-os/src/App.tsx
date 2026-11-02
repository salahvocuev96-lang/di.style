import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Today from './pages/Today'
import Schedule from './pages/Schedule'
import Habits from './pages/Habits'
import Projects from './pages/Projects'
import Sport from './pages/Sport'
import English from './pages/English'
import Sleep from './pages/Sleep'
import Settings from './pages/Settings'

// HashRouter: адреса вида /#/habits работают на любом статическом хостинге
// (включая папку внутри сайта) без настройки сервера.
export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/sport" element={<Sport />} />
          <Route path="/english" element={<English />} />
          <Route path="/sleep" element={<Sleep />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
