import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/DropdownMenu";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { useGroups } from "../../../shared/modules/groups/hooks/useGroups.js";
import { ExploreFilterCardNav } from "../../../pages/explore/components/ExploreFilterCardNav.jsx";

const MotionDiv = motion.div;
const NAVBAR_SCROLL_IGNORE_DELTA = 6;

function ExploreNavbarSearch({ navbarStyle = false, className = "", buttonClassName = "" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    filteredGroups,
    search,
    setSearch,
    platform,
    setPlatform,
    sort,
    setSort,
  } = useGroups("newest", { scope: "discover" });

  useEffect(() => {
    const q = searchParams.get("q");
    setSearch(q ?? "");
  }, [searchParams, setSearch]);

  return (
    <ExploreFilterCardNav
      searchValue={search}
      onSearchChange={setSearch}
      sortValue={sort}
      onSortChange={setSort}
      selectedServiceId={platform}
      onSelectServiceId={setPlatform}
      filteredGroups={filteredGroups}
      onSelectGroup={(group) => navigate(`/groups/${group.id}`)}
      navbarStyle={navbarStyle}
      className={className}
      buttonClassName={buttonClassName}
    />
  );
}

export function Navbar() {
  const location = useLocation();
  const { user, loading, signOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const userLabel = user?.displayName || user?.email || "Guest";
  const isExplorePage = location.pathname === "/explore";
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const visibleRef = useRef(true);

  useEffect(() => {
    visibleRef.current = isNavbarVisible;
  }, [isNavbarVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    lastScrollYRef.current = window.scrollY;
    visibleRef.current = true;

    const frameId = window.requestAnimationFrame(() => {
      setIsNavbarVisible(true);
      setIsMobileMenuOpen(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const nextIsModalOpen = document.body.hasAttribute("data-modal-count");
      setIsModalOpen(nextIsModalOpen);
      if (nextIsModalOpen) setIsMobileMenuOpen(false);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-modal-count"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (currentScrollY < 24) {
        if (!visibleRef.current) {
          visibleRef.current = true;
          setIsNavbarVisible(true);
        }
      } else if (Math.abs(delta) >= NAVBAR_SCROLL_IGNORE_DELTA) {
        if (delta > 0 && visibleRef.current) {
          visibleRef.current = false;
          setIsNavbarVisible(false);
          setIsMobileMenuOpen(false);
        } else if (delta < 0 && !visibleRef.current) {
          visibleRef.current = true;
          setIsNavbarVisible(true);
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error("登出失敗", error);
    }
  }

  return (
    <header className="relative z-40 h-24 sm:h-28">
      <div
        className={[
          "fixed inset-x-0 z-40 flex justify-center px-3 sm:px-4 transition-[pointer-events] duration-200",
          isNavbarVisible && !isModalOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      >
        <MotionDiv
          initial={false}
          animate={
            isNavbarVisible && !isModalOpen
              ? { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
              : { y: -22, opacity: 0, scale: 0.985, filter: "blur(6px)" }
          }
          transition={{ type: "spring", stiffness: 260, damping: 28, mass: 0.7 }}
          className={[
            "w-[calc(100vw-1.5rem)] overflow-hidden rounded-full border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,249,252,0.76))] shadow-[0_20px_56px_rgba(15,23,42,0.14)] backdrop-blur-2xl",
            "sm:max-w-[1060px]",
          ].join(" ")}
        >
          <div className="relative flex h-14 items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-4">

            {/* Logo */}
            <div className="flex min-w-0 items-center gap-2">
              <Link
                to="/"
                className="flex shrink-0 items-center gap-2 rounded-full"
                aria-label="回到首頁"
              >
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full">
                  <img
                    src="/imgs/logo.png"
                    alt="PartyMatch"
                    className="h-full w-full object-contain"
                  />
                </span>
                <span className="hidden truncate text-sm font-extrabold tracking-tight text-black sm:inline">
                  PartyMatch
                </span>
              </Link>
            </div>

            {/* Explore search bar */}
            {isExplorePage ? (
              <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="pointer-events-auto flex items-center">
                  <ExploreNavbarSearch
                    navbarStyle
                    className="pb-0"
                    buttonClassName="justify-between px-5 pr-4 w-[220px] sm:w-[340px] lg:w-[460px] xl:w-[520px]"
                  />
                </div>
              </div>
            ) : null}

            {/* Desktop: user menu */}
            <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 lg:flex">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="開啟使用者選單"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/82 text-black/62 transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="w-64 rounded-[24px] border border-black/10 bg-white/96 p-2 shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl"
                >
                  <div className="rounded-[20px] border border-black/8 bg-black/[0.02] px-4 py-4 text-center">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={userLabel}
                        className="mx-auto h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-black/[0.06] text-black">
                        <UserCircleIcon className="h-8 w-8" />
                      </div>
                    )}
                    <div className="mt-3 text-sm font-semibold text-black">{userLabel}</div>
                  </div>

                  <div className="pt-2">
                    {loading ? (
                      <button
                        type="button"
                        disabled
                        className="flex w-full items-center justify-center gap-2 rounded-[18px] border border-black/10 px-3 py-2.5 text-sm font-medium text-black/40"
                      >
                        載入中...
                      </button>
                    ) : isAuthenticated ? (
                      <DropdownMenuItem asChild>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] bg-black px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus:outline-none"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                          <span>登出</span>
                        </button>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem asChild>
                        <NavLink
                          to="/login"
                          className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-black px-3 py-2.5 text-sm font-medium text-white transition hover:bg-black/80 focus:outline-none"
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                          <span>登入</span>
                        </NavLink>
                      </DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label={isMobileMenuOpen ? "關閉選單" : "開啟選單"}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className={[
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition lg:hidden",
                isMobileMenuOpen
                  ? "border-black/20 bg-black text-white"
                  : "border-black/10 bg-white/82 text-black/62 hover:bg-white hover:text-black",
              ].join(" ")}
            >
              {isMobileMenuOpen
                ? <XMarkIcon className="h-5 w-5" />
                : <Bars3Icon className="h-5 w-5" />
              }
            </button>
          </div>
        </MotionDiv>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {isMobileMenuOpen ? (
            <MotionDiv
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-[28px] border border-black/10 bg-white/96 shadow-[0_20px_56px_rgba(15,23,42,0.16)] backdrop-blur-2xl lg:hidden"
            >
              <div className="p-3">
                <div className="pt-1">
                  {loading ? null : isAuthenticated ? (
                    <div className="flex items-center justify-between gap-3 rounded-[18px] px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[0.06] text-black">
                          <UserCircleIcon className="h-5 w-5" />
                        </div>
                        <span className="truncate text-sm font-medium text-black">{userLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="shrink-0 rounded-full border border-black/10 px-3.5 py-1.5 text-xs font-medium text-black/60 transition hover:border-black hover:bg-black hover:text-white"
                      >
                        登出
                      </button>
                    </div>
                  ) : (
                    <NavLink
                      to="/login"
                      className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-black/80"
                    >
                      登入
                    </NavLink>
                  )}
                </div>
              </div>
            </MotionDiv>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            className="fixed inset-0 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </header>
  );
}
