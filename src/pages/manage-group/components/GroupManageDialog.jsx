import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MinusCircleIcon, UserMinusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Label } from "@/shared/components/ui/Label";
import { Textarea } from "@/shared/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { Input } from "@/shared/components/ui/Input";
import { Badge } from "../../../shared/components/ui/Badge.jsx";
import { ServiceIcon } from "../../../shared/components/ui/ServiceIcon.jsx";
import { getServiceById, getPlanById } from "../../../data/services.config.js";
import { useModalOpen } from "../../../shared/hooks/useModalOpen.js";
import { useToast } from "../../../shared/hooks/useToast.js";
import { useGroupsActions } from "../../../shared/modules/groups/state/index.js";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { JOIN_POLICY } from "../../../shared/modules/groups/state/groupsTypes.js";
import { getGroupMembers } from "../../../shared/modules/groups/api/groupApi.js";
import { cn } from "@/lib/utils";

const ALL_TABS = [
  { id: "settings", label: "群組設定" },
  { id: "members", label: "管理成員" },
];

function DialogContent({ group, onClose, memberOnly = false }) {
  useModalOpen();

  const { updateGroup, dissolveGroup, leaveGroup } = useGroupsActions();
  const { addToast } = useToast();
  const { user } = useAuth();

  const tabs = memberOnly ? ALL_TABS.filter((t) => t.id === "members") : ALL_TABS;
  const [activeTab, setActiveTab] = useState(memberOnly ? "members" : "settings");

  /* ── Edit form state ── */
  const [description, setDescription] = useState(group.description ?? "");
  const [availableSeats, setAvailableSeats] = useState(
    Math.max(0, (group.totalSlots ?? 0) - (group.takenSlots ?? 0)),
  );
  const [joinPolicy, setJoinPolicy] = useState(group.joinPolicy ?? JOIN_POLICY.REVIEW);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const minSeats = 0;
  const maxSeats = 10 - (group.takenSlots ?? 0);

  /* ── Members state ── */
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [removeMode, setRemoveMode] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoadingMembers(true);
      try {
        const list = await getGroupMembers(group.id);
        if (isMounted) setMembers(list);
      } catch {
        if (isMounted) setMembers([]);
      } finally {
        if (isMounted) setIsLoadingMembers(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [group.id]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const newTotal = (group.takenSlots ?? 0) + availableSeats;
      await updateGroup(group.id, { description, joinPolicy, totalSlots: newTotal, availableSeats });
      addToast("群組資料已更新");
      onClose();
    } catch (error) {
      addToast(error.message || "群組資料儲存失敗，請稍後再試");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDissolve() {
    try {
      await dissolveGroup(group.id);
      addToast("群組已解散");
      onClose();
    } catch (error) {
      addToast(error.message || "解散群組失敗，請稍後再試");
    }
  }

  async function handleRemoveMember(member) {
    try {
      await leaveGroup(group.id, member.userId);
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
      addToast(`已移除成員 ${member.displayName}`);
    } catch (error) {
      addToast(error.message || "移除成員失敗，請稍後再試");
    } finally {
      setConfirmRemoveMember(null);
    }
  }

  const service = getServiceById(group.serviceId ?? group.platform);
  const plan = getPlanById(group.serviceId, group.planId);
  const fieldClass = "rounded-xl border-black/12 bg-white text-sm text-black focus-visible:ring-black/15 focus-visible:border-black/30";

  return (
    <>
      {/* ── Header ── */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/8 px-6 py-5 sm:px-7">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/40">
            群組管理
          </p>
          <div className="mt-2 flex min-w-0 items-center gap-2.5">
            <ServiceIcon
              serviceId={group.serviceId}
              platform={group.platform}
              iconKey={group.iconKey}
              alt={service?.shortLabel ?? group.platform}
              className="h-6 w-6 shrink-0 object-contain"
            />
            <h2 className="truncate text-xl font-semibold tracking-tight text-black">
              {service?.shortLabel ?? group.platform}
              {plan ? <span className="text-black/45"> · {plan.name}</span> : null}
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/45 transition hover:bg-black/[0.03] hover:text-black focus:outline-none"
          aria-label="關閉"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex shrink-0 border-b border-black/8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 pb-3 pt-3.5 text-center text-sm font-medium transition",
              activeTab === tab.id
                ? "text-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-black after:content-['']"
                : "text-black/40 hover:text-black/65",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable body ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* Tab: 群組設定 */}
        {activeTab === "settings" && (
          <div className="space-y-6 px-6 py-7 sm:px-7">
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium text-black/65">群組描述</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(fieldClass, "resize-none")}
                placeholder="輸入群組描述..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label className="text-sm font-medium text-black/65">可用名額</Label>
                <Input
                  type="number"
                  min={minSeats}
                  max={maxSeats}
                  value={availableSeats}
                  onChange={(e) => {
                    const val = Math.max(minSeats, Math.min(maxSeats, Number(e.target.value) || 0));
                    setAvailableSeats(val);
                  }}
                  className={cn(fieldClass, "h-10")}
                />
                <p className="text-xs text-black/40">已加入 {group.takenSlots ?? 0} 人</p>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-sm font-medium text-black/65">加入方式</Label>
                <Select value={joinPolicy} onValueChange={setJoinPolicy}>
                  <SelectTrigger className={cn(fieldClass, "h-10")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={JOIN_POLICY.REVIEW}>需審核</SelectItem>
                    <SelectItem value={JOIN_POLICY.INSTANT}>立即加入</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Tab: 管理成員 */}
        {activeTab === "members" && (
          <div className="space-y-5 px-6 py-7 sm:px-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-black">目前成員</p>
                <Badge tone="blue">{members.length} 位</Badge>
              </div>
              {!memberOnly && members.some((m) => m.userId !== user?.id && m.role !== "團主") && (
                <button
                  type="button"
                  onClick={() => setRemoveMode((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    removeMode
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-black/12 bg-white text-black/55 hover:bg-black/[0.03] hover:text-black",
                  )}
                >
                  <UserMinusIcon className="h-3.5 w-3.5" />
                  {removeMode ? "完成" : "踢除成員"}
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-black/8 bg-black/[0.02]">
              {isLoadingMembers ? (
                <div className="px-4 py-5 text-sm text-black/45">正在載入成員清單...</div>
              ) : members.length ? (
                <div className="divide-y divide-black/6">
                  {members.map((member) => {
                    const isHost = member.role === "團主";
                    const isSelf = member.userId === user?.id;
                    const canRemove = removeMode && !isHost && !isSelf;
                    return (
                      <div key={member.userId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/[0.06] text-xs font-semibold text-black">
                            {member.displayName?.slice(0, 1)?.toUpperCase() ?? "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-black">{member.displayName}</div>
                            <div className="truncate text-xs text-black/45">{member.email ?? member.userId}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={isHost ? "blue" : "gray"}>{member.role}</Badge>
                          {canRemove && (
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveMember(member)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
                              aria-label={`移除 ${member.displayName}`}
                            >
                              <MinusCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-5 text-sm text-black/45">目前還沒有可顯示的成員資料。</div>
              )}
            </div>

            {/* 確認踢除 dialog */}
            {confirmRemoveMember && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmRemoveMember(null)} />
                <div className="relative w-full max-w-sm rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
                  <h3 className="text-base font-semibold text-black">確認移除成員</h3>
                  <p className="mt-2 text-sm leading-6 text-black/55">
                    確定要將 <span className="font-medium text-black">{confirmRemoveMember.displayName}</span> 從群組中移除？此操作無法復原。
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveMember(null)}
                      className="rounded-full border border-black/12 px-4 py-2 text-sm font-medium text-black/60 transition hover:bg-black/5"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(confirmRemoveMember)}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      確認移除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {!memberOnly && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-black/8 px-6 py-4 sm:px-7">
          {showDissolveConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">確定要解散？</span>
              <button
                type="button"
                onClick={handleDissolve}
                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                確認解散
              </button>
              <button
                type="button"
                onClick={() => setShowDissolveConfirm(false)}
                className="rounded-full border border-black/12 px-3 py-1.5 text-xs font-medium text-black/60 transition hover:bg-black/5"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDissolveConfirm(true)}
              className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-700"
            >
              解散群組
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80 disabled:opacity-60"
          >
            {isSaving ? "儲存中…" : "儲存變更"}
          </button>
        </div>
      )}
    </>
  );
}

export function GroupManageDialog({ group, onClose, memberOnly = false }) {
  return (
    <DialogPrimitive.Root open={true} onOpenChange={() => {}}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[110] bg-black/45 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={(e) => e.stopPropagation()}
        />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-[110] flex w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] focus:outline-none h-[min(90dvh,520px)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">群組管理</DialogPrimitive.Title>
          <DialogContent group={group} onClose={onClose} memberOnly={memberOnly} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
