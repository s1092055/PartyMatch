export function CreateGroupEmptyState({ isAuthenticated, onCreate }) {
  return (
    <div className="rounded-[24px] border border-dashed border-black/10 bg-black/[0.015] px-6 py-14 text-center">
      <div className="text-2xl font-semibold tracking-tight text-black">
        {isAuthenticated ? "尚未建立任何群組" : "登入後即可開始建立群組"}
      </div>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-black/56">
        {isAuthenticated
          ? "建立第一個群組後，這裡會顯示服務、方案與招募狀態。"
          : "登入後即可開始建立並管理你的共享群組。"}
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85 active:scale-[0.99]"
      >
        {isAuthenticated ? "建立第一個群組" : "登入後開始建立"}
      </button>
    </div>
  );
}
