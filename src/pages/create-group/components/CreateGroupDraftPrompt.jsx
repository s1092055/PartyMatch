import { CreateGroupDraftPanel } from "./CreateGroupDraftPanel.jsx";

export function CreateGroupDraftPrompt({ draft, onResume, onStartFresh }) {
  return (
    <div className="mx-auto flex h-full min-h-[640px] max-w-3xl items-center justify-center px-1">
      <CreateGroupDraftPanel
        draft={draft}
        onResume={onResume}
        onStartFresh={onStartFresh}
      />
    </div>
  );
}
