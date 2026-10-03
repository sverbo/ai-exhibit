import PresentView from "../present/PresentView.tsx";

/**
 * The projector: one window that works alone (it runs the stage and takes the
 * keyboard or a clicker) or linked with a presenter view in the same browser
 * profile (it then mirrors the presenter and still takes the keys). See
 * PresentView, variant "projector".
 */
export default function ProjectorView() {
  return <PresentView variant="projector" />;
}
