import { useEffect } from "react";
import { Glossary } from "./Glossary.tsx";

/** /glossary: the audience's phone page. No session, works offline. */
export default function GlossaryView() {
  useEffect(() => {
    document.title = "Glossary · ai-exhibit";
  }, []);
  return <Glossary />;
}
