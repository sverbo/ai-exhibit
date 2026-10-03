import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const LauncherView = lazy(() => import("./views/launcher/LauncherView.tsx"));
const PresentView = lazy(() => import("./views/present/PresentView.tsx"));
const ProjectorView = lazy(() => import("./views/projector/ProjectorView.tsx"));
const PresenterView = lazy(() => import("./views/presenter/PresenterView.tsx"));
const OverviewView = lazy(() => import("./views/overview/OverviewView.tsx"));
const HandoutView = lazy(() => import("./views/handout/HandoutView.tsx"));
const LabView = lazy(() => import("./views/lab/LabView.tsx"));
const GlossaryView = lazy(() => import("./views/glossary/GlossaryView.tsx"));

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<LauncherView />} />
          <Route path="/present" element={<PresentView />} />
          <Route path="/projector" element={<ProjectorView />} />
          <Route path="/presenter" element={<PresenterView />} />
          <Route path="/overview" element={<OverviewView />} />
          <Route path="/handout" element={<HandoutView />} />
          <Route path="/lab" element={<LabView />} />
          <Route path="/glossary" element={<GlossaryView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
