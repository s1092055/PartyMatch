import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/react";
import {
  ArrowRightOnRectangleIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../../shared/modules/auth/hooks/useAuth.js";
import { PageContainer } from "./PageContainer.jsx";

export function Navbar() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const isAuthenticated = Boolean(user);
  const userLabel = user?.displayName || user?.email || "Guest";

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("登出失敗", error);
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black/5 bg-white/92 px-5 backdrop-blur">
      <PageContainer>
        <div className="flex h-16 items-center justify-between sm:px-0">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#2563eb] font-black text-white">
              PM
            </span>
            <span className="font-extrabold tracking-tight">PartyMatch</span>
          </Link>

          <div className="flex items-center gap-3">
            <Menu as="div" className="relative">
              <MenuButton
                aria-label="開啟使用者選單"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black/[0.03]"
              >
                <UserCircleIcon className="h-5 w-5" />
              </MenuButton>

              <MenuItems
                anchor="bottom end"
                transition
                className="z-50 mt-2 w-64 rounded-2xl border border-black/10 bg-white p-2 shadow-xl [--anchor-gap:10px] data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <div className="rounded-xl border border-black/10 bg-black/[0.02] px-4 py-4 text-center">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={userLabel}
                      className="mx-auto h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#eef3ff] text-[#1d4ed8]">
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 px-3 py-2.5 text-sm font-medium text-black/40"
                    >
                      載入中...
                    </button>
                  ) : isAuthenticated ? (
                    <MenuItem>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-3 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                        <span>Logout</span>
                      </button>
                    </MenuItem>
                  ) : (
                    <MenuItem>
                      <NavLink
                        to="/login"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d4ed8]"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                        <span>Login</span>
                      </NavLink>
                    </MenuItem>
                  )}
                </div>
              </MenuItems>
            </Menu>

            <NavLink
              to="/help"
              aria-label="前往說明中心"
              className={({ isActive }) =>
                [
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black transition hover:bg-black/[0.03]",
                  isActive ? "border-[#2563eb]/20 bg-[#eef3ff] text-[#1d4ed8]" : "",
                ].join(" ")
              }
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </NavLink>
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
