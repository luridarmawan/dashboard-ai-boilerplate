import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/User/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
// Lazy load heavy components with charts and calendar
const LineChart = React.lazy(() => import("./pages/Charts/LineChart"));
const BarChart = React.lazy(() => import("./pages/Charts/BarChart"));
const Calendar = React.lazy(() => import("./pages/Calendar"));
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { I18nProvider } from "./context/I18nContext";
import { ClientProvider } from "./context/ClientContext";
import { PermissionProvider } from "./context/PermissionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
// import Home from "./pages/Dashboard/Home";
// Lazy load heavy dashboard & user management component
const HomeAI = React.lazy(() => import("./pages/Dashboard/HomeAI"));
const UserListPage = React.lazy(() => import("./pages/User/UserListPage"));
const ConfigurationPage = React.lazy(() => import("./pages/Configuration/ConfigurationPage"));
const ClientListPage = React.lazy(() => import("./pages/Clients/ClientList"));
const ChatPage = React.lazy(() => import("./pages/Chat/ChatPage"));
import ResetPassword from "./pages/AuthPages/ResetPassword";
import EmailVerificationPage from "./pages/AuthPages/EmailVerificationPage";
import GroupListPage from "./pages/Groups/GroupList";
import GroupPermissionListPage from "./pages/Groups/GroupPermissionList";
import GroupMember from "./pages/Groups/GroupMember";
import ModulePage from "./pages/Module/ModulePage";

// TODO: buat menu generator
import ExampleMain from "../modules/Example/frontend/ExampleMain";
const ExampleLazyPage = React.lazy(() => import("../modules/Example/frontend/ExampleLazyPage"));

// YOUR MODULE //
// Place your module here
const ExplorerMain = React.lazy(() => import("../modules/DataStudio/frontend/ExplorerMain"));
const OCRTesterPage = React.lazy(() => import("../modules/DataStudio/frontend/OCRTesterPage"));
const ExpensePage = React.lazy(() => import("../modules/Accounting/frontend/ExpensePage"));
// /YOUR MODULE //

import { DevConsoleProtection, ContextMenuProtection, DevConsoleCheck, DevSupport } from "@bs/frontend";

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <ClientProvider>
          <PermissionProvider>
            <Router>
              <DevConsoleProtection>
                <ContextMenuProtection>
                  <ScrollToTop />
                  <Routes>
                    {/* Dashboard Layout - Protected Routes */}
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index path="/" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <HomeAI />
                        </Suspense>
                      } />

                      {/* Chat Routes - Lazy Loaded */}
                      <Route path="/chat" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ChatPage />
                        </Suspense>
                      } />
                      <Route path="/chat/:conversationId" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ChatPage />
                        </Suspense>
                      } />

                      {/* Others Page */}
                      <Route path="/profile" element={<UserProfiles />} />
                      <Route path="/calendar" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <Calendar />
                        </Suspense>
                      } />
                      <Route path="/blank" element={<Blank />} />
                      <Route path="/user" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <UserListPage />
                        </Suspense>
                      } />
                      <Route path="/group/role/:groupPermissionId/:groupName" element={<GroupPermissionListPage />} />
                      <Route path="/group/member/:groupId/:groupName" element={<GroupMember />} />
                      <Route path="/group" element={<GroupListPage />} />
                      <Route path="/client" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ClientListPage />
                        </Suspense>
                      } />
                      <Route path="/configuration" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ConfigurationPage />
                        </Suspense>
                      } />
                      <Route path="/module" element={<ModulePage />} />

                      {/* // TODO: make module generator */}
                      <Route path="/example" element={<ExampleMain />} />
                      {/* Example Page with Lazy Load */}
                      <Route path="/example-lazy" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ExampleLazyPage />
                        </Suspense>
                      } />


                      {/* === YOUR MODULE === */}

                      {/* === Data Studio === */}
                      {/* Explorer Page with Lazy Load */}
                      <Route path="/explorer" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ExplorerMain />
                        </Suspense>
                      } />
                      <Route path="/ocr-tester" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <OCRTesterPage />
                        </Suspense>
                      } />
                      {/* === /Data Studio === */}

                      <Route path="/expense" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <ExpensePage />
                        </Suspense>
                      } />

                      {/* === /YOUR MODULE === */}

                      {/* Developer Console Protection Route */}
                      <Route path="/dev-console-check" element={<DevConsoleCheck />} />
                      <Route path="/dev-support" element={<DevSupport />} />

                      {/* Forms */}
                      <Route path="/form-elements" element={<FormElements />} />

                      {/* Tables */}
                      <Route path="/basic-tables" element={<BasicTables />} />

                      {/* Ui Elements */}
                      <Route path="/alerts" element={<Alerts />} />
                      <Route path="/avatars" element={<Avatars />} />
                      <Route path="/badge" element={<Badges />} />
                      <Route path="/buttons" element={<Buttons />} />
                      <Route path="/images" element={<Images />} />
                      <Route path="/videos" element={<Videos />} />

                      {/* Charts - Lazy Loaded */}
                      <Route path="/line-chart" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <LineChart />
                        </Suspense>
                      } />
                      <Route path="/bar-chart" element={
                        <Suspense fallback={<div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>}>
                          <BarChart />
                        </Suspense>
                      } />
                    </Route>

                    {/* Auth Layout - Public Routes */}
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/email-verification" element={<EmailVerificationPage />} />
                    {import.meta.env.VITE_SIGNUP_ENABLE === 'true' && (
                      <Route path="/signup" element={<SignUp />} />
                    )}

                    {/* Fallback Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ContextMenuProtection>
              </DevConsoleProtection>
            </Router>
          </PermissionProvider>
        </ClientProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
