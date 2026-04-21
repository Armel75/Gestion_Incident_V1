import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { RequireRole } from "./src/types/auth/RequireRole";
import { ProtectedRoute } from "./src/types/auth/ProtectedRoute";

import { Dashboard } from "./pages/Dashboard";
import { IncidentList } from "./pages/IncidentList";
import { IncidentDetail } from "./pages/IncidentDetail";
import { NewIncident } from "./pages/NewIncident";
import { Login } from "./pages/Login";
import { Pilotage } from "./pages/Pilotage";
import { Settings } from "./pages/Settings";
import { TaskList } from "./pages/TaskList";
import { NewTask } from "./pages/NewTask";
import { IncidentAttachments } from "./pages/IncidentAttachments";

import { SiteList } from "./pages/SiteList";
import { NewSite } from "./pages/NewSite";
import { CategoryList } from "./pages/CategoryList";
import { NewCategory } from "./pages/NewCategory";
import { SubCategoryList } from "./pages/SubCategoryList";
import { NewSubCategory } from "./pages/NewSubCategory";
import { ProcessList } from "./pages/ProcessList";
import { NewProcess } from "./pages/NewProcess";
import { SubProcessList } from "./pages/SubProcessList";
import { NewSubProcess } from "./pages/NewSubProcess";

import { UserList } from "./pages/admin/UserList";
import { RoleList } from "./pages/admin/RoleList";
import { PermissionList } from "./pages/admin/PermissionList";
import { RolePermissionAssign } from "./pages/admin/RolePermissionAssign";
import { NewUser } from "./pages/admin/NewUser";
import { NewRole } from "./pages/admin/NewRole";
import { NewPermission } from "./pages/admin/NewPermission";

import { NewPersonne } from "./pages/NewPersonne";
import { PersonneList } from "./pages/PersonneList";
import { TaskAttachments } from "./pages/TaskAttachments";
import { Archives } from "./pages/Archives";
import { TypeList } from "./pages/TypeList";
import { NewType } from "./pages/NewType";
import { Register } from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App: React.FC = () => {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* PROTÉGÉ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/archives" element={<Archives />} />
          <Route path="/incidents" element={<IncidentList />} />
          <Route path="/incidents/new" element={<NewIncident />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/incidents/:id/edit" element={<NewIncident />} />
          <Route path="/incidents/:id/attachments" element={<IncidentAttachments />} />

          <Route path="/tasks" element={<TaskList />} />
          <Route path="/incidents/:incidentId/tasks/new" element={<NewTask />} />
          <Route path="/incidents/:incidentId/tasks/:taskId/edit" element={<NewTask />} />
          <Route
            path="/incidents/:incidentId/tasks/:taskId/attachments"
            element={<TaskAttachments />}
          />

          {/* PROTÉGÉ + ADMIN */}
          <Route element={<RequireRole allowedRoles={["ADMIN"]} />}>
            <Route path="/pilotage" element={<Pilotage />} />

            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/sites" element={<SiteList />} />
            <Route path="/settings/sites/new" element={<NewSite />} />
            <Route path="/settings/sites/:id/edit" element={<NewSite />} />

            <Route path="/settings/types" element={<TypeList />} />
            <Route path="/settings/types/new" element={<NewType />} />
            <Route path="/settings/types/:id/edit" element={<NewType />} />

            <Route path="/settings/categories" element={<CategoryList />} />
            <Route path="/settings/categories/new" element={<NewCategory />} />
            <Route path="/settings/categories/:id/edit" element={<NewCategory />} />

            <Route path="/settings/sub-categories" element={<SubCategoryList />} />
            <Route path="/settings/sub-categories/new" element={<NewSubCategory />} />
            <Route path="/settings/sub-categories/:id/edit" element={<NewSubCategory />} />

            <Route path="/settings/processes" element={<ProcessList />} />
            <Route path="/settings/processes/new" element={<NewProcess />} />
            <Route path="/settings/processes/:id/edit" element={<NewProcess />} />

            <Route path="/settings/sub-processes" element={<SubProcessList />} />
            <Route path="/settings/sub-processes/new" element={<NewSubProcess />} />
            <Route path="/settings/sub-processes/:id/edit" element={<NewSubProcess />} />

            <Route path="/settings/users" element={<UserList />} />
            <Route path="/settings/users/new" element={<NewUser />} />
            <Route path="/settings/users/:id/edit" element={<NewUser />} />

            <Route path="/settings/roles" element={<RoleList />} />
            <Route path="/settings/roles/new" element={<NewRole />} />
            <Route path="/settings/roles/:id/edit" element={<NewRole />} />

            <Route path="/settings/permissions" element={<PermissionList />} />
            <Route path="/settings/permissions/new" element={<NewPermission />} />

            <Route path="/settings/personnes" element={<PersonneList />} />
            <Route path="/settings/personnes/new" element={<NewPersonne />} />
            <Route path="/settings/personnes/:id/edit" element={<NewPersonne />} />

            <Route path="/settings/assignment" element={<RolePermissionAssign />} />
          </Route>

          {/* fallback privé */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>

      {/* fallback public */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
