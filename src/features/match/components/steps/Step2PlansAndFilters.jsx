import Step2Plans from './Step2Plans'
import Step3Filters from './Step3Filters'
import ScrollHintButton from '../../../../shared/ui/ScrollHintButton'
import { useScrollEdge } from '../../../../shared/utils/hooks'

export default function Step2PlansAndFilters({ conditions, onChangePlan, onChangeFilter }) {
  const { scrollRef, atBottom, canScroll, handleScroll, scrollToTop, scrollDown } = useScrollEdge()

  return (
    <div className="relative h-full lg:h-[600px]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full space-y-8 rounded-xl bg-white p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-y-auto"
      >
        <Step2Plans conditions={conditions} onChangePlan={onChangePlan} />
        <div className="border-t border-slate-100 pt-8">
          <Step3Filters conditions={conditions} onChange={onChangeFilter} />
        </div>
      </div>

      <ScrollHintButton canScroll={canScroll} atBottom={atBottom} onScrollToTop={scrollToTop} onScrollDown={scrollDown} />
    </div>
  )
}
