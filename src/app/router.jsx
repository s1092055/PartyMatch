import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { AppLayout } from "../shared/components/layout/AppLayout.jsx";
import { ProtectedRoute } from "../shared/components/route/ProtectedRoute.jsx";
import { LoginPage } from "../pages/auth/login/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/register/RegisterPage.jsx";
import { GroupDetailPage } from "../pages/group-detail/GroupDetailPage.jsx";
import { ApplyGroupPage } from "../pages/group-detail/ApplyGroupPage.jsx";
import { AccountCenterPage } from "../pages/account/AccountCenterPage.jsx";
import { CreateGroupFlowPage } from "../pages/create-group/CreateGroupFlowPage.jsx";
import { ExploreGroupPage } from "../pages/explore/ExploreGroupPage.jsx";
import { HomePage } from "../pages/home/HomePage.jsx";
import { ManageGroupPage } from "../pages/manage-group/ManageGroupPage.jsx";
import { FavoritesView } from "../pages/manage-group/components/FavoritesView.jsx";
import { HostedGroupsView } from "../pages/manage-group/components/HostedGroupsView.jsx";
import { MyGroupsView } from "../pages/manage-group/components/MyGroupsView.jsx";
import { PendingApplicationsView } from "../pages/manage-group/components/PendingApplicationsView.jsx";
import { NotificationsPage } from "../pages/notifications/NotificationsPage.jsx";
import { NotFoundPage } from "../pages/support/not-found/NotFoundPage.jsx";

function RouterView() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExploreGroupPage />} />
        <Route path="groups" element={<Navigate to="/explore" replace />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route
          path="groups/:id/apply"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後再申請加入群組。">
              <ApplyGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="create-group"
          element={
            <ProtectedRoute authRequiredMessage="請先登入才能使用建立群組的功能。" />
          }
        >
          <Route index element={<CreateGroupFlowPage />} />
          <Route path="new" element={<CreateGroupFlowPage />} />
        </Route>
        <Route
          path="create"
          element={
            <ProtectedRoute authRequiredMessage="請先登入才能使用建立群組的功能。">
              <Navigate to="/create-group" replace />
            </ProtectedRoute>
          }
        />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="account" element={<AccountCenterPage />} />
        <Route path="help" element={<Navigate to="/" replace />} />
        <Route
          path="manage-group"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你的群組管理中心。">
              <ManageGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-group/overview"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你的群組管理中心。">
              <MyGroupsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-group/my-groups"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你加入的群組。">
              <MyGroupsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-group/hosted-groups"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你建立的群組。">
              <HostedGroupsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-group/pending"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你的申請狀態。">
              <PendingApplicationsView />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-group/favorites"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你追蹤的群組。">
              <FavoritesView />
            </ProtectedRoute>
          }
        />
        <Route path="manage-group/applications" element={<Navigate to="/manage-group/pending" replace />} />
        <Route path="manage-group/host/applications" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="manage-group/host/members" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="manage-group/host/settings" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="manage-group/billing" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard" element={<Navigate to="/manage-group" replace />} />
        <Route path="dashboard/overview" element={<Navigate to="/manage-group/overview" replace />} />
        <Route path="dashboard/my-groups" element={<Navigate to="/manage-group/my-groups" replace />} />
        <Route path="dashboard/hosted-groups" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard/favorites" element={<Navigate to="/manage-group/favorites" replace />} />
        <Route path="dashboard/notifications" element={<Navigate to="/notifications" replace />} />
        <Route path="dashboard/profile" element={<Navigate to="/account" replace />} />
        <Route path="dashboard/settings" element={<Navigate to="/account" replace />} />
        <Route path="dashboard/applications" element={<Navigate to="/manage-group" replace />} />
        <Route path="dashboard/host/applications" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard/host/members" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard/host/settings" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard/billing" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard/payments" element={<Navigate to="/manage-group/hosted-groups" replace />} />
        <Route path="dashboard/help" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <RouterView />
    </BrowserRouter>
  );
}
