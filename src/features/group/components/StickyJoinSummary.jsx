import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreditScoreBadge from '../../../shared/components/ui/CreditScoreBadge'
import {
  CheckCircle2,
  Users,
  Calendar,
  ChevronRight,
  LogIn,
  ShieldCheck,
  Heart,
  CreditCard,
} from "lucide-react";
import Button from "../../../shared/components/ui/Button";
import Avatar from "../../../shared/components/ui/Avatar";
import ProgressBar from "../../../shared/components/ui/ProgressBar";
import ApplyJoinModal from "./ApplyJoinModal";
import { getApplicationByUserAndGroup } from "../../../shared/stores/applicationStore";
import {
  isCurrentUserMember,
  getMemberByUserAndGroup,
} from "../../../shared/stores/memberStore";
import {
  isGroupFavorited,
  toggleFavorite,
} from "../../../shared/stores/favoriteStore";
import { getActiveUser } from "../../../shared/stores/userStore";

export default function StickyJoinSummary({ group, inModal = false }) {
  const navigate = useNavigate();
  const activeUser = getActiveUser();
  const activeUserId = activeUser?.id;
  const isHost = group.hostId === activeUserId;

  const [isMember, setIsMember] = useState(() => isCurrentUserMember(group.id));
  const memberRecord = activeUserId
    ? getMemberByUserAndGroup(activeUserId, group.id)
    : null;
  const isPendingPayment =
    isMember && memberRecord?.paymentStatus === "pending";
  const isMarkedPaid = isMember && memberRecord?.paymentStatus === "markedPaid";
  const [applied, setApplied] = useState(() =>
    activeUserId
      ? !!getApplicationByUserAndGroup(activeUserId, group.id)
      : false,
  );
  const [openSeats, setOpenSeats] = useState(group.openSeats);
  const [usedSeats, setUsedSeats] = useState(group.usedSeats);
  const [modalOpen, setModalOpen] = useState(false);
  const [isFav, setIsFav] = useState(() =>
    activeUserId ? isGroupFavorited(activeUserId, group.id) : false,
  );

  const isFull = openSeats <= 0;

  function renderCTA() {
    if (!activeUserId) {
      return (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate("/login?redirectTo=/explore")}
        >
          <LogIn size={16} />
          登入以加入群組
        </Button>
      );
    }
    if (isHost) {
      return (
        <div className="flex items-center gap-2 bg-brand-subtle text-brand text-sm font-medium px-4 py-3 rounded-lg">
          <ShieldCheck size={16} />
          你是此群組的團主
        </div>
      );
    }
    if (isPendingPayment) {
      return (
        <div className="flex items-center gap-2 bg-warning-subtle text-warning-text text-sm font-medium px-4 py-3 rounded-lg">
          <CreditCard size={16} />
          已加入，請前往「我的訂閱」完成付款
        </div>
      );
    }
    if (isMarkedPaid) {
      return (
        <div className="flex items-center gap-2 bg-purple-subtle text-purple-text text-sm font-medium px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} />
          已標記付款，等待團主確認
        </div>
      );
    }
    if (isMember) {
      return (
        <div className="flex items-center gap-2 bg-success-subtle text-success-text text-sm font-medium px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} />
          已加入此群組
        </div>
      );
    }
    if (isFull) {
      return (
        <Button
          variant="ghost"
          size="lg"
          className="w-full border border-line"
          disabled
        >
          已額滿
        </Button>
      );
    }
    if (applied) {
      return (
        <div className="flex items-center gap-2 bg-warning-subtle text-warning-text text-sm font-medium px-4 py-3 rounded-lg">
          <CheckCircle2 size={16} />
          已送出申請，等待團主審核
        </div>
      );
    }
    return (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={() => setModalOpen(true)}
      >
        申請加入
        <ChevronRight size={16} />
      </Button>
    );
  }

  return (
    <>
      <div className={`sticky ${inModal ? 'top-4' : 'top-[7rem]'} panel overflow-hidden`}>
        <div className="px-5 py-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink-2 mb-0.5">每席價格</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-brand">
                NT${group.pricePerSeat}
              </span>
              <span className="text-ink-2 text-sm font-bold">/ 每月</span>
            </div>
          </div>
          <button
            onClick={() =>
              activeUserId
                ? setIsFav(toggleFavorite(activeUserId, group.id))
                : navigate("/login")
            }
            className="mt-1 w-9 h-9 flex items-center justify-center rounded-full hover:bg-raised transition-colors shrink-0"
            aria-label={isFav ? "取消收藏" : "加入收藏"}
          >
            <Heart
              size={20}
              className={isFav ? "fill-red-500 text-red-500" : "text-ink-4"}
            />
          </button>
        </div>

        <div className="border-t border-line-subtle p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sm text-ink-2">
                <Users size={14} />
                <span>剩餘名額</span>
              </div>
              <span className="text-sm font-semibold text-ink">
                <span className="text-ink">{openSeats}</span> 席 / 總名額{" "}
                {group.totalSeats} 席
              </span>
            </div>
            <ProgressBar value={usedSeats} max={group.totalSeats} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-ink-4">已佔 {usedSeats} 人</span>
              <span className="text-xs text-ink-4">
                共 {group.totalSeats} 人
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-line-subtle">
            <div className="flex items-center gap-1.5 text-sm text-ink-3">
              <Calendar size={14} />
              <span>{['active', 'paused', 'cancelled', 'ended'].includes(group.status) ? '下次扣款日' : '建立日期'}</span>
            </div>
            <span className="text-sm font-bold text-ink-2">
              {['active', 'paused', 'cancelled', 'ended'].includes(group.status) ? group.nextBillingDate : group.createdAt}
            </span>
          </div>

          {renderCTA()}

          {openSeats <= 2 && !isFull && !isMember && !applied && !isHost && (
            <p className="text-xs text-warning-text text-center -mt-2">
              僅剩 {openSeats} 個名額，手快有！
            </p>
          )}

          <div className="border-t border-line-subtle pt-4">
            <p className="text-xs text-ink-4 mb-3">關於團主</p>
            <div className="flex items-center gap-3">
              <Avatar
                initial={group.hostAvatarInitial}
                color={group.hostAvatarColor}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink">
                    {group.hostName}
                  </span>
                  {group.isHostVerified && (
                    <CheckCircle2 size={13} className="text-brand shrink-0" />
                  )}
                </div>
                <div className="mt-0.5">
                  <CreditScoreBadge score={group.hostRating} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ApplyJoinModal
        group={group}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setApplied(true);
          setModalOpen(false);
        }}
      />
    </>
  );
}
