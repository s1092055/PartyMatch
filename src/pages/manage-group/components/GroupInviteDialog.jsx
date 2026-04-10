import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  LinkIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/shared/components/ui/Input";
import { Badge } from "../../../shared/components/ui/Badge.jsx";
import { useModalOpen } from "../../../shared/hooks/useModalOpen.js";
import { useToast } from "../../../shared/hooks/useToast.js";
import { getGroupMembers } from "../../../shared/modules/groups/api/groupApi.js";
import { getRegisteredUsers } from "../../../shared/modules/auth/services/authService.js";

function getUserPreviewLabel(user) {
  return user?.displayName || user?.email || user?.id || "未知使用者";
}

async function copyText(value) {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    throw new Error("目前裝置不支援複製功能。");
  }
  await navigator.clipboard.writeText(value);
}

function InviteContent({ group, onClose }) {
  useModalOpen();

  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [inviteUserId, setInviteUserId] = useState("");
  const registeredUsers = useMemo(() => getRegisteredUsers(), []);

  const matchedUser = useMemo(
    () => registeredUsers.find((user) => user.id === inviteUserId.trim()) ?? null,
    [inviteUserId, registeredUsers],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMembers() {
      setIsLoadingMembers(true);
      try {
        const nextMembers = await getGroupMembers(group.id);
        if (!isMounted) return;
        setMembers(nextMembers);
      } catch {
        if (!isMounted) return;
        setMembers([]);
      } finally {
        if (isMounted) setIsLoadingMembers(false);
      }
    }

    loadMembers();
    return () => { isMounted = false; };
  }, [group.id]);

  async function handleCopyGroupId() {
    try {
      await copyText(group.id);
      addToast("已複製群組 ID");
    } catch (error) {
      addToast(error.message || "複製群組 ID 失敗", "error");
    }
  }

  async function handleCopyInviteMessage() {
    const targetUserId = inviteUserId.trim();
    const inviteMessage = [
      "PartyMatch 群組邀請",
      `群組 ID：${group.id}`,
      targetUserId ? `邀請使用者 ID：${targetUserId}` : null,
      `群組名稱：${group.platform} ${group.plan ?? ""}`.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await copyText(inviteMessage);
      addToast(targetUserId ? "已複製指定使用者的邀請訊息" : "已複製邀請訊息");
    } catch (error) {
      addToast(error.message || "複製邀請訊息失敗", "error");
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-black/8 px-6 py-6 sm:px-7">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
            邀請成員
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
            邀請其他使用者加入這個群組
          </h2>
          <p className="mt-3 text-sm leading-7 text-black/58">
            先查看目前已加入的成員，再輸入想邀請的使用者 ID。你也可以直接複製群組 ID 分享給其他人。
          </p>
        </div>

        <DialogPrimitive.Close asChild>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/45 transition hover:bg-black/[0.03] hover:text-black focus:outline-none"
            aria-label="關閉邀請成員視窗"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </DialogPrimitive.Close>
      </div>

      {/* Body */}
      <div className="space-y-6 px-6 py-6 sm:px-7">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-black">目前已加入的成員</div>
            <Badge tone="blue">{members.length} 位</Badge>
          </div>

          <div className="rounded-[24px] border border-black/8 bg-[#f8f9fb] p-4">
            {isLoadingMembers ? (
              <div className="text-sm text-black/45">正在載入成員清單...</div>
            ) : members.length ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-sm font-semibold text-black">
                        {member.displayName?.slice(0, 1)?.toUpperCase() ?? "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-black">
                          {member.displayName}
                        </div>
                        <div className="truncate text-xs text-black/45">
                          {member.email ?? member.userId}
                        </div>
                      </div>
                    </div>
                    <Badge tone={member.role === "團主" ? "blue" : "gray"}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-black/45">目前還沒有可顯示的成員資料。</div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <label
            className="block text-sm font-semibold text-black"
            htmlFor={`invite-${group.id}`}
          >
            輸入要邀請的使用者 ID
          </label>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                id={`invite-${group.id}`}
                type="text"
                value={inviteUserId}
                onChange={(event) => setInviteUserId(event.target.value)}
                placeholder="例如：demo-user-xxxxxx"
                className="rounded-2xl border-black/12 bg-white pr-11 text-sm text-black focus-visible:border-black/30 focus-visible:ring-black/8"
              />
              <UserPlusIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/24" />
            </div>

            <button
              type="button"
              onClick={handleCopyGroupId}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/12 bg-white text-black/58 transition hover:bg-black/[0.03] hover:text-black"
              aria-label="複製群組 ID"
              title="複製群組 ID"
            >
              <LinkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-[20px] text-xs text-black/45">
            {inviteUserId.trim()
              ? matchedUser
                ? `目前輸入的使用者：${getUserPreviewLabel(matchedUser)}`
                : "找不到這個使用者 ID，但仍可複製群組 ID 分享給對方。"
              : "將群組 ID 分享給對方後，對方即可用這個 ID 找到並加入群組。"}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-black/8 px-6 py-5 sm:flex-row sm:justify-end sm:px-7">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-black/12 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
        >
          關閉
        </button>
        <button
          type="button"
          onClick={handleCopyInviteMessage}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/85"
        >
          複製邀請訊息
        </button>
      </div>
    </>
  );
}

export function GroupInviteDialog({ group, onClose }) {
  return (
    <DialogPrimitive.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[110] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">邀請成員</DialogPrimitive.Title>
          <InviteContent group={group} onClose={onClose} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
