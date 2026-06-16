import ExploreGroupCard from "../../explore/components/ExploreGroupCard";
import { getServiceById } from "../../../shared/utils/serviceUtils";
import { getActiveUserProfile } from "../../../shared/stores/authStore";

export default function LivePreviewPanel({ form }) {
  const service = getServiceById(form.serviceId);
  const activeUser = getActiveUserProfile();

  const group = {
    id: "__preview__",
    serviceId: form.serviceId,
    serviceName: service?.fullName ?? service?.name ?? form.serviceId ?? "",
    planName: form.planName || "尚未選擇方案",
    pricePerSeat: form.pricePerSeat || 0,
    billingCycle: form.billingCycle,
    totalSeats: form.planName ? form.totalSeats : null,
    usedSeats: form.planName ? 1 : 0,
    openSeats: form.planName ? Math.max(form.totalSeats - 1, 0) : null,
    tags: [service?.category].filter(Boolean),
    hostName: activeUser?.displayName ?? "使用者",
    hostAvatarColor: activeUser?.avatarColor ?? "#94A3B8",
    hostAvatarInitial: activeUser?.avatarInitial ?? "U",
    hostRating: null,
    status: "recruiting",
  };

  return (
    <div className="pointer-events-none">
      <ExploreGroupCard group={group} hideActions />
    </div>
  );
}
