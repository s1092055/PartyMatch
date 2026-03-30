import { AnimatePresence, motion } from "framer-motion";
import {
  RectangleGroupIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Link, NavLink } from "react-router-dom";
import {
  DASHBOARD_MODES,
  getDashboardModeMenu,
} from "../../../pages/main/manage-group/dashboardNavigation.config.js";

const MotionSpan = motion.span;
const MotionDiv = motion.div;

function SidebarModeButton({
  active,
  expanded,
  mobile,
  icon,
  label,
  onClick,
}) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={[
        "group flex w-full rounded-[24px] transition-all duration-200 ease-out",
        mobile || expanded
          ? "items-center gap-3 px-3 py-3"
          : "justify-center px-0 py-3",
        active
          ? "bg-[#eef3ff] text-[#1d4ed8] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]"
          : "text-black/58 hover:bg-black/[0.03] hover:text-black",
      ].join(" ")}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
        <IconComponent className="h-5 w-5 shrink-0" />
      </span>
      <AnimatePresence initial={false}>
        {mobile || expanded ? (
          <MotionSpan
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="truncate"
          >
            {label}
          </MotionSpan>
        ) : null}
      </AnimatePresence>
    </button>
  );
}

function SidebarNavItem({ item, expanded, mobile, onNavigate, action = false }) {
  const Icon = item.icon;
  const baseClass = [
    "group flex w-full rounded-[24px] transition-all duration-200 ease-out",
    mobile || expanded
      ? "items-start gap-3 px-3 py-3.5"
      : "justify-center px-0 py-3.5",
  ].join(" ");

  const content = ({ isActive }) => (
    <div
      className={[
        baseClass,
        isActive
          ? "bg-[#eef3ff] text-[#1d4ed8] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]"
          : "text-black/68 hover:bg-black/[0.03] hover:text-black",
      ].join(" ")}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
        <Icon className="h-5 w-5 shrink-0" />
      </span>
      <AnimatePresence initial={false}>
        {mobile || expanded ? (
          <MotionDiv
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-w-0"
          >
            <div className="truncate text-sm font-semibold">{item.label}</div>
            {item.description ? (
              <div className="mt-1 text-xs leading-5 text-black/45">
                {item.description}
              </div>
            ) : null}
          </MotionDiv>
        ) : null}
      </AnimatePresence>
    </div>
  );

  if (action) {
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onNavigate}
        title={!expanded && !mobile ? item.label : undefined}
      >
        {content({ isActive: false })}
      </Link>
    );
  }

  return (
    <NavLink
      key={item.to}
      to={item.to}
      end
      onClick={onNavigate}
      title={!expanded && !mobile ? item.label : undefined}
    >
      {content}
    </NavLink>
  );
}

export function Sidebar({
  mode,
  expanded = true,
  mobile = false,
  onNavigate,
  onModeChange,
  onClose,
}) {
  const { primary, common, actions } = getDashboardModeMenu(mode);
  const showLabels = mobile || expanded;

  return (
    <div
      className={[
        "flex h-full flex-col rounded-[32px] border border-black/8 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-md",
        showLabels ? "p-4" : "p-3",
      ].join(" ")}
    >
      {mobile ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/8 text-black/65 transition hover:bg-black/[0.03] hover:text-black"
            aria-label="關閉群組管理側欄"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div>
        {showLabels ? (
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">
            身份切換
          </div>
        ) : null}
        <div className="space-y-2">
          <SidebarModeButton
            active={mode === DASHBOARD_MODES.EXPLORER}
            expanded={expanded}
            mobile={mobile}
            icon={UserIcon}
            label="探索者"
            onClick={() => onModeChange?.(DASHBOARD_MODES.EXPLORER)}
          />
          <SidebarModeButton
            active={mode === DASHBOARD_MODES.HOST}
            expanded={expanded}
            mobile={mobile}
            icon={RectangleGroupIcon}
            label="團主"
            onClick={() => onModeChange?.(DASHBOARD_MODES.HOST)}
          />
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto border-t border-black/8 pt-5">
        {showLabels ? (
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">
            管理分頁
          </div>
        ) : null}
        <nav className="space-y-2">
          {primary.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              expanded={expanded}
              mobile={mobile}
              onNavigate={onNavigate}
            />
          ))}

          {common.length ? (
            <div className="mt-5 border-t border-black/8 pt-5">
              {showLabels ? (
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">
                  共用
                </div>
              ) : null}
              <div className="space-y-2">
                {common.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    expanded={expanded}
                    mobile={mobile}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {actions.length ? (
            <div className="mt-5 border-t border-black/8 pt-5">
              {showLabels ? (
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">
                  快速操作
                </div>
              ) : null}
              <div className="space-y-2">
                {actions.map((item) => (
                  <SidebarNavItem
                    key={item.to}
                    item={item}
                    expanded={expanded}
                    mobile={mobile}
                    onNavigate={onNavigate}
                    action
                  />
                ))}
              </div>
            </div>
          ) : null}
        </nav>
      </div>
    </div>
  );
}
