import { useState } from "react";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Textarea } from "@/shared/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/Select";
import { cn } from "@/lib/utils";
import { useToast } from "../../../shared/hooks/useToast.js";
import { useGroupsActions } from "../../../shared/modules/groups/state/index.js";
import { JOIN_POLICY } from "../../../shared/modules/groups/state/groupsTypes.js";

export function GroupEditPanel({ group, onClose }) {
  const { updateGroup, dissolveGroup } = useGroupsActions();
  const { addToast } = useToast();
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);

  const [description, setDescription] = useState(group.description ?? "");
  const [availableSeats, setAvailableSeats] = useState(
    Math.max(0, (group.totalSlots ?? 0) - (group.takenSlots ?? 0)),
  );
  const [joinPolicy, setJoinPolicy] = useState(group.joinPolicy ?? JOIN_POLICY.REVIEW);

  const minSeats = 0;
  const maxNewTotal = 10;
  const maxSeats = maxNewTotal - (group.takenSlots ?? 0);

  async function handleSave() {
    try {
      const newTotal = (group.takenSlots ?? 0) + availableSeats;
      await updateGroup(group.id, {
        description,
        joinPolicy,
        totalSlots: newTotal,
        availableSeats,
      });
      addToast("群組資料已更新");
      onClose();
    } catch (error) {
      addToast(error.message || "更新群組失敗");
    }
  }

  async function handleDissolve() {
    try {
      await dissolveGroup(group.id);
      addToast("群組已解散");
      onClose();
    } catch (error) {
      addToast(error.message || "解散群組失敗");
    }
  }

  const fieldClass = "rounded-xl border-black/12 bg-white text-sm text-black focus-visible:ring-black/15 focus-visible:border-black/30";

  return (
    <div className="space-y-5 rounded-2xl border border-black/8 bg-[#f8f9fb] p-5">
      <h3 className="text-base font-bold text-black">編輯群組</h3>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-black/70">群組描述</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={fieldClass}
          placeholder="輸入群組描述..."
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1 space-y-1.5">
          <Label className="text-sm font-medium text-black/70">可用名額</Label>
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
          <p className="text-xs text-black/45">目前已加入 {group.takenSlots ?? 0} 人</p>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label className="text-sm font-medium text-black/70">加入方式</Label>
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

      <div className="flex items-center justify-between border-t border-black/10 pt-4">
        <div>
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
              className="text-sm font-medium text-red-500 transition hover:text-red-700"
              onClick={() => setShowDissolveConfirm(true)}
            >
              解散群組
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/12 px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80"
          >
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
}
