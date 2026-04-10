import { Link } from "react-router-dom";
import { PageHeader } from "../../../shared/components/layout/PageHeader.jsx";
import { SmartContainer } from "../../../shared/components/layout/SmartContainer.jsx";
import { Card } from "../../../shared/components/ui/Card.jsx";

export function NotFoundPage() {
  return (
    <section className="py-14 sm:py-16">
      <SmartContainer size="reading" className="px-4 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="PartyMatch"
          title="找不到這個頁面"
          description="你要前往的內容不存在，或網址已經變更。"
        />

        <Card className="mx-auto max-w-2xl p-8 text-center sm:p-10">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/35">
            404
          </div>
          <p className="mt-4 text-base leading-7 text-black/60">
            你可以返回首頁，或直接前往探索群組繼續瀏覽。
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              前往探索群組
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black/5"
            >
              返回首頁
            </Link>
          </div>
        </Card>
      </SmartContainer>
    </section>
  );
}
