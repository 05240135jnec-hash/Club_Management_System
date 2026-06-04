import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Login        from './pages/auth/Login'
import Register     from './pages/auth/Register'
import VerifyEmail  from './pages/auth/VerifyEmail'
import ChangePassword from './pages/auth/ChangePassword'
import GoogleCallback  from './pages/auth/GoogleCallback'

// ── PUBLIC (no login required) ──
import PublicHome       from './pages/public/PublicHome'
import ClubPublicDetail from './pages/public/ClubPublicDetail'
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// ── SUPERADMIN ──
import Dashboard               from './pages/superadmin/Dashboard'
import UserManagement          from './pages/superadmin/UserManagement'
import AllClubs                from './pages/superadmin/AllClubs'
import SuperAdminClubDetail    from './pages/superadmin/SuperAdminClubDetail'
import SubmittedReports        from './pages/superadmin/SubmittedReports'
import Settings                from './pages/superadmin/Settings'
import FeatureControl          from './pages/superadmin/FeatureControl'
import SuperAdminAnnouncements from './pages/superadmin/Announcements'
import SuperAdminAttendance    from './pages/superadmin/SuperAdminAttendance'
import SuperAdminCertificate   from './pages/superadmin/SuperAdminCertificate'

// ── ADVISOR ──
import AdvisorHome            from './pages/advisor/AdvisorHome'
import AdvisorOtherClub       from './pages/advisor/AdvisorOtherClub'
import AdvisorClubDashboard   from './pages/advisor/AdvisorClubDashboard'
import AdvisorClubDetails     from './pages/advisor/AdvisorClubDetails'
import AdvisorEnrollmentKey   from './pages/advisor/AdvisorEnrollmentKey'
import AdvisorMembers         from './pages/advisor/AdvisorMembers'
import AdvisorAnnouncements   from './pages/advisor/AdvisorAnnouncements'
import AdvisorReports         from './pages/advisor/AdvisorReports'
import AdvisorWorkPlan        from './pages/advisor/AdvisorWorkPlan'
import AdvisorUploadImage     from './pages/advisor/AdvisorUploadImage'
import AdvisorBlog            from './pages/advisor/AdvisorBlog'
import AdvisorInviteCoadvisor from './pages/advisor/AdvisorInviteCoadvisor'
import AcceptInvitation       from './pages/advisor/AcceptInvitation'
import AssignSecretary        from './pages/advisor/AssignSecretary'
import AdvisorAttendance      from './pages/advisor/AdvisorAttendance'
import AdvisorSettings from './pages/advisor/AdvisorSettings';
import AdvisorPublicAnnouncements from './pages/advisor/AdvisorPublicAnnouncements';

// ── SECRETARY ──
import SecretaryDashboard   from './pages/secretary/SecretaryDashboard'
import SecretaryClubDetails from './pages/secretary/SecretaryClubDetail'
import SecretaryMembers     from './pages/secretary/SecretaryMembers'
import SecretaryAnnouncements from './pages/secretary/SecretaryAnnouncements'
import SecretaryAttendance  from './pages/secretary/SecretaryAttendance'
import SecretaryWorkPlan    from './pages/secretary/SecretaryWorkPlan'
import SecretaryUploadImage from './pages/secretary/SecretaryUploadImage'
import SecretaryBlog        from './pages/secretary/SecretaryBlog'
import SecretaryReports     from './pages/secretary/SecretaryReports'
import SecretaryEnrollmentKey from './pages/secretary/SecretaryEnrollmentKey'
import SecretarySettings from './pages/secretary/SecretarySettings';
import SecretaryCertificate from './pages/secretary/SecretaryCertificate';

// ── STUDENT ──
import StudentHome          from './pages/student/StudentHome'
import StudentClubDetail    from './pages/student/StudentClubDetail'
import StudentDashboard     from './pages/student/StudentDashboard'
import StudentAnnouncements from './pages/student/StudentAnnouncements'
import StudentAttendance    from './pages/student/StudentAttendance'
import StudentWorkPlan      from './pages/student/StudentWorkPlan'
import StudentGallery       from './pages/student/StudentGallery'
import StudentBlog          from './pages/student/StudentBlog'
import StudentAuditReport from './pages/student/StudentAuditReport'
import StudentPublicAnnouncements from './pages/student/StudentPublicAnnouncements'
import StudentSettings from './pages/student/StudentSettings';
import StudentCertificate  from './pages/student/StudentCertificate';

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ════════════════════════
                    PUBLIC
                ════════════════════════ */}
                <Route path="/"          element={<PublicHome />} />
                <Route path="/clubs/:id" element={<ClubPublicDetail />} />

                {/* ════════════════════════
                    AUTH
                ════════════════════════ */}
                <Route path="/login"         element={<Login />} />
                <Route path="/register"      element={<Register />} />
                <Route path="/verify-email"  element={<VerifyEmail />} />
                <Route path="/change-password"    element={<ChangePassword />} />
                <Route path="/auth/google/success" element={<GoogleCallback />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password"  element={<ResetPassword />} />

                {/* ════════════════════════
                    SUPERADMIN
                ════════════════════════ */}
                <Route path="/superadmin/dashboard"        element={<Dashboard />} />
                <Route path="/superadmin/user-management"     element={<UserManagement />} />
                <Route path="/superadmin/all-clubs"        element={<AllClubs />} />
                <Route path="/superadmin/clubs/:id"        element={<SuperAdminClubDetail />} />
                <Route path="/superadmin/reports"          element={<SubmittedReports />} />
                <Route path="/superadmin/announcements"    element={<SuperAdminAnnouncements />} />
                <Route path="/superadmin/settings"         element={<Settings />} />
                <Route path="/superadmin/feature-control"  element={<FeatureControl />} />
                <Route path="/superadmin/attendance"       element={<SuperAdminAttendance />} />
                <Route path="/superadmin/certificate"      element={<SuperAdminCertificate />} />

                {/* ════════════════════════
                    ADVISOR
                ════════════════════════ */}
                <Route path="/advisor/dashboard"        element={<AdvisorHome />} />
                <Route path="/advisor/clubs/:id"        element={<AdvisorOtherClub />} />
                <Route path="/advisor/club-dashboard"   element={<AdvisorClubDashboard />} />
                <Route path="/advisor/club-details"     element={<AdvisorClubDetails />} />
                <Route path="/advisor/enrollment-key"   element={<AdvisorEnrollmentKey />} />
                <Route path="/advisor/members"          element={<AdvisorMembers />} />
                <Route path="/advisor/announcements"    element={<AdvisorAnnouncements />} />
                <Route path="/advisor/public-announcements" element={<AdvisorPublicAnnouncements />} />
                <Route path="/advisor/reports"          element={<AdvisorReports />} />
                <Route path="/advisor/upload-reports"   element={<AdvisorReports />} />
                <Route path="/advisor/work-plan"        element={<AdvisorWorkPlan />} />
                <Route path="/advisor/upload-workplan"  element={<AdvisorWorkPlan />} />
                <Route path="/advisor/upload-image"     element={<AdvisorUploadImage />} />
                <Route path="/advisor/upload-blog"      element={<AdvisorBlog />} />
                <Route path="/advisor/invite-coadvisor" element={<AdvisorInviteCoadvisor />} />
                <Route path="/advisor/assign-secretary" element={<AssignSecretary />} />
                <Route path="/advisor/attendance"       element={<AdvisorAttendance />} />
                <Route path="/accept-invitation"        element={<AcceptInvitation />} />
                <Route path="/advisor/settings"         element={<AdvisorSettings />} />

                {/* ════════════════════════
                    SECRETARY
                ════════════════════════ */}
                <Route path="/secretary/dashboard"      element={<SecretaryDashboard />} />
                <Route path="/secretary/club-details"   element={<SecretaryClubDetails />} />
                <Route path="/secretary/members"        element={<SecretaryMembers />} />
                <Route path="/secretary/announcements"  element={<SecretaryAnnouncements />} />
                <Route path="/secretary/attendance"     element={<SecretaryAttendance />} />
                <Route path="/secretary/work-plan"      element={<SecretaryWorkPlan />} />
                <Route path="/secretary/upload-image"   element={<SecretaryUploadImage />} />
                <Route path="/secretary/upload-blog"    element={<SecretaryBlog />} />
                <Route path="/secretary/upload-reports" element={<SecretaryReports />} />
                <Route path="/secretary/enrollment-key" element={<SecretaryEnrollmentKey />} />
                <Route path="/secretary/settings"       element={<SecretarySettings />} />
                <Route path="/secretary/certificate"    element={<SecretaryCertificate />} />

                {/* ════════════════════════
                    STUDENT
                ════════════════════════ */}
                <Route path="/student/StudentHome"           element={<StudentHome />} />
                <Route path="/student/clubs/:id"             element={<StudentClubDetail />} />

                <Route path="/student/dashboard/:clubId"     element={<StudentDashboard />} />
                <Route path="/student/dashboard"             element={<StudentDashboard />} />

                <Route path="/student/announcements/:clubId" element={<StudentAnnouncements />} />
                <Route path="/student/announcements"         element={<StudentAnnouncements />} />

                <Route path="/student/attendance/:clubId"    element={<StudentAttendance />} />
                <Route path="/student/attendance"            element={<StudentAttendance />} />

                <Route path="/student/workplan/:clubId"      element={<StudentWorkPlan />} />
                <Route path="/student/workplan"              element={<StudentWorkPlan />} />

                <Route path="/student/gallery/:clubId"       element={<StudentGallery />} />
                <Route path="/student/gallery"               element={<StudentGallery />} />

                <Route path="/student/blog/:clubId"          element={<StudentBlog />} />
                <Route path="/student/blog"                  element={<StudentBlog />} />
                <Route path="/student/audit-report"          element={<StudentAuditReport />} />
                <Route path="/student/public-announcements"  element={<StudentPublicAnnouncements />} />
                <Route path="/student/settings"              element={<StudentSettings />} />
                <Route path="/student/certificate/:clubId"   element={<StudentCertificate />} />
                <Route path="/student/certificate"           element={<StudentCertificate />} />

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