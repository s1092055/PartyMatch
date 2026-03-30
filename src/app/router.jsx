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
import { GroupDetailPage } from "../pages/detail/GroupDetailPage.jsx";
import { AccountCenterPage } from "../pages/main/account/AccountCenterPage.jsx";
import { CreateGroupFlowPage } from "../pages/main/create-group/CreateGroupFlowPage.jsx";
import { CreateGroupHomePage } from "../pages/main/create-group/CreateGroupHomePage.jsx";
import { ExploreGroupPage } from "../pages/main/explore-group/ExploreGroupPage.jsx";
import { HomePage } from "../pages/main/home/HomePage.jsx";
import { ManageGroupPage } from "../pages/main/manage-group/ManageGroupPage.jsx";
import { FavoritesView } from "../pages/main/manage-group/views/FavoritesView.jsx";
import { HostedGroupsView } from "../pages/main/manage-group/views/HostedGroupsView.jsx";
import { MyGroupsView } from "../pages/main/manage-group/views/MyGroupsView.jsx";
import { NotificationsPage } from "../pages/main/notifications/NotificationsPage.jsx";
import { HelpPage } from "../pages/support/help/HelpPage.jsx";
import { NotFoundPage } from "../pages/support/not-found/NotFoundPage.jsx";

function RouterView() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExploreGroupPage />} />
        <Route path="groups" element={<Navigate to="/explore" replace />} />
        <Route path="groups/:id" element={<GroupDetailPage />} />
        <Route path="create-group" element={<CreateGroupHomePage />} />
        <Route
          path="create-group/new"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後再建立新的共享群組。">
              <CreateGroupFlowPage />
            </ProtectedRoute>
          }
        />
        <Route path="create" element={<Navigate to="/create-group" replace />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="account" element={<AccountCenterPage />} />
        <Route path="help" element={<HelpPage />} />
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
          path="manage-group/favorites"
          element={
            <ProtectedRoute authRequiredMessage="請先登入後查看你追蹤的群組。">
              <FavoritesView />
            </ProtectedRoute>
          }
        />
        <Route path="manage-group/applications" element={<Navigate to="/manage-group" replace />} />
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
        <Route path="dashboard/help" element={<Navigate to="/help" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
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
