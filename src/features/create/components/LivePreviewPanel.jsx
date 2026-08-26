import ExploreGroupCard from "../../explore/components/ExploreGroupCard";
import { getServiceById } from "../../../common/utils/serviceUtils";
import { useAuthStore } from "../../../common/stores/useAuthStore";
import { buildPreviewGroupId } from "../utils/previewGroupId";

export default function LivePreviewPanel({ form }) {
  const service = getServiceById(form.serviceId);
  const plan = service?.plans.find(p => p.name === form.planName);
  const maxSeats = plan?.maxSeats ?? null;
  const user = useAuthStore(s => s.user);
  const activeUser = user ? useAuthStore.getState().getProfile() : null;

  const group = {
    id: buildPreviewGroupId(form),
    serviceId: form.serviceId,
    serviceName: service?.fullName ?? service?.name ?? form.serviceId ?? "",
    planName: form.planName || "尚未選擇方案",
    pricePerSeat: form.pricePerSeat || 0,
    billingCycle: form.billingCycle,
    // 總名額固定顯示方案本身的容量；開放名額是 Step3 選的招募目標，兩者各自獨立，不互相推導
    totalSeats: form.planName ? maxSeats : null,
    usedSeats: form.planName ? 1 : 0,
    openSeats: form.planName ? Math.max(form.recruitHeadcount - 1, 0) : null,
    tags: [service?.category].filter(Boolean),
    hostName: activeUser?.displayName ?? "使用者",
    hostAvatarColor: activeUser?.avatarColor ?? null,
    hostAvatarInitial: activeUser?.avatarInitial ?? "",
    hostRating: null,
    status: "recruiting",
  };

  return (
    <div className="pointer-events-none">
      <ExploreGroupCard group={group} hideActions />
    </div>
  );
}
