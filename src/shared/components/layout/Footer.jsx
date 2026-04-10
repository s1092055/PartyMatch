import { Link } from "react-router-dom";
import { PageContainer } from "./PageContainer.jsx";
import { Button } from "../ui/Button.jsx";

const productLinks = ["功能介紹", "如何運作", "定價方案", "更新日誌"];
const supportLinks = ["常見問題", "聯絡我們", "服務條款", "隱私權"];
const accountLinks = [
  { label: "登入", to: "/login" },
  { label: "建立群組", to: "/create-group" },
  { label: "群組管理", to: "/manage-group" },
];
const socialLinks = ["GitHub", "LinkedIn", "Email"];

export function Footer() {
  return (
    <footer data-app-footer className="bg-neutral-950 text-white">
      <PageContainer>
        <div className="px-4 pb-28 pt-12 sm:px-6 sm:pb-32 lg:px-8">
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Product
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {productLinks.map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Support
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {supportLinks.map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Account
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {accountLinks.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="transition hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Social / Download
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                {socialLinks.map((item) => (
                  <li key={item}>
                    <a href="#" className="transition hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-white/45">App 即將推出</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <div>
              © {new Date().getFullYear()} PartyMatch. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="transition hover:text-white/70">
                條款
              </a>
              <a href="#" className="transition hover:text-white/70">
                隱私
              </a>
              <a href="#" className="transition hover:text-white/70">
                Cookie
              </a>
            </div>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
