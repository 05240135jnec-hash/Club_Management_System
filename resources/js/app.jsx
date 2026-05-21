import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login            from './pages/auth/Login'
import Register         from './pages/auth/Register'

// ── PUBLIC (no login required) ──
import PublicHome       from './pages/public/PublicHome'
import ClubPublicDetail from './pages/public/ClubPublicDetail'

// ── SUPERADMIN ──
import Dashboard        from './pages/superadmin/Dashboard'
import AdvisorRequests  from './pages/superadmin/AdvisorRequests'

// ── ADVISOR ──
import AdvisorHome          from './pages/advisor/AdvisorHome'
import AdvisorClubDashboard from './pages/advisor/AdvisorClubDashboard'
import AdvisorClubDetails   from './pages/advisor/AdvisorClubDetails'
import AdvisorEnrollmentKey from './pages/advisor/AdvisorEnrollmentKey'
import AdvisorMembers       from './pages/advisor/AdvisorMembers'
import AdvisorAnnouncements from './pages/advisor/AdvisorAnnouncements'
import AdvisorReports       from './pages/advisor/AdvisorReports'
import AdvisorWorkPlan      from './pages/advisor/AdvisorWorkPlan'
import AdvisorUploadImage   from './pages/advisor/AdvisorUploadImage'
import AdvisorBlog          from './pages/advisor/AdvisorBlog'

// ── STUDENT ──
// import StudentHome  from './pages/student/StudentHome'

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ════════════════════════
                    PUBLIC — no login needed
                ════════════════════════ */}
                <Route path="/"          element={<PublicHome />} />
                <Route path="/clubs/:id" element={<ClubPublicDetail />} />

                {/* ════════════════════════
                    AUTH
                ════════════════════════ */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ════════════════════════
                    SUPERADMIN
                ════════════════════════ */}
                <Route path="/superadmin/dashboard"        element={<Dashboard />} />
                <Route path="/superadmin/advisor-requests" element={<AdvisorRequests />} />

                {/* ════════════════════════
                    ADVISOR
                ════════════════════════ */}
                <Route path="/advisor/dashboard"       element={<AdvisorHome />} />
                <Route path="/advisor/club-dashboard"  element={<AdvisorClubDashboard />} />
                <Route path="/advisor/club-details"    element={<AdvisorClubDetails />} />
                <Route path="/advisor/enrollment-key"  element={<AdvisorEnrollmentKey />} />
                <Route path="/advisor/members"         element={<AdvisorMembers />} />
                <Route path="/advisor/announcements"   element={<AdvisorAnnouncements />} />
                <Route path="/advisor/reports"         element={<AdvisorReports />} />
                <Route path="/advisor/upload-reports"  element={<AdvisorReports />} />
                <Route path="/advisor/work-plan"       element={<AdvisorWorkPlan />} />
                <Route path="/advisor/upload-workplan" element={<AdvisorWorkPlan />} />
                <Route path="/advisor/upload-image"    element={<AdvisorUploadImage />} />
                <Route path="/advisor/upload-blog"     element={<AdvisorBlog />} />

                {/* ── Advisor viewing any club detail (no join button) ── */}
                <Route path="/advisor/clubs/:id" element={<ClubPublicDetail mode="advisor" />} />

                {/* ════════════════════════
                    STUDENT
                ════════════════════════ */}
                {/* <Route path="/student/dashboard" element={<StudentHome />} /> */}

            </Routes>
        </BrowserRouter>
    )
}

export default App

const container = document.getElementById('root')
if (!container.dataset.reactMounted) {
    container.dataset.reactMounted = 'true'
    ReactDOM.createRoot(container).render(<App />)
}