import { GroupDetailSection } from "./GroupDetailSection.jsx";

export function GroupDetailFaqSection({ faqItems }) {
  return (
    <GroupDetailSection eyebrow="FAQ" title="常見問題">
      <div className="divide-y divide-black/8">
        {faqItems.map((item) => (
          <div key={item.question} className="py-5 first:pt-0 last:pb-0">
            <div className="text-base font-semibold text-black">{item.question}</div>
            <p className="mt-3 text-sm leading-8 text-black/58">{item.answer}</p>
          </div>
        ))}
      </div>
    </GroupDetailSection>
  );
}
