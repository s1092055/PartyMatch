import { useNavigate } from "react-router-dom";
import { SmartContainer } from "../../../../shared/components/layout/SmartContainer.jsx";
import { Button } from "../../../../shared/components/ui/Button.jsx";
import { Meteors } from "../../../../shared/components/ui/Meteors.jsx";

export function HeroBanner() {
  const navigate = useNavigate();

  return (
    <section className="relative flex min-h-[calc(100svh-18rem)] items-center overflow-hidden bg-white py-8 sm:min-h-[calc(100svh-17rem)] sm:py-10 lg:min-h-[calc(100svh-16rem)] lg:py-10">
      <div className="absolute inset-0 bg-white" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_80%,rgba(191,219,254,0.22),transparent_35%),radial-gradient(circle_at_22%_78%,rgba(226,232,240,0.16),transparent_28%)]" />
        <Meteors
          number={16}
          minDelay={0.4}
          maxDelay={1.35}
          minDuration={3.4}
          maxDuration={7}
          angle={215}
          className="opacity-100 [mask-image:linear-gradient(to_top,transparent_2%,black_24%,black_88%,transparent_100%)]"
        />
      </div>

      <SmartContainer size="wide" className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-black/45">
            PartyMatch
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-black sm:text-5xl lg:text-6xl">
            找到適合你的訂閱共享方案
          </h1>
          <p className="mt-4 max-w-2xl text-base text-black/65 sm:text-lg">
            用更直覺的方式瀏覽群組、比較方案與名額，快速加入最符合你需求的共享訂閱。
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              hoverLabel="立即探索"
              onClick={() => navigate("/explore")}
            >
              開始探索
            </Button>
            <Button
              variant="outline"
              hoverLabel="開始建立"
              onClick={() => navigate("/create-group")}
            >
              建立群組
            </Button>
          </div>
        </div>
      </SmartContainer>
    </section>
  );
}
