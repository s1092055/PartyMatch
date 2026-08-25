import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import ImageLightbox from '../../../components/ui/ImageLightbox'
import ServiceLogo from '../../../components/ui/ServiceLogo'
import { useAuthStore } from '../../../common/stores/useAuthStore'
import { useScrollLock } from '../../../common/utils/hooks'
import { getServiceById } from '../../../common/utils/serviceUtils'
import { HOME_AUDIENCES } from '../data/homeContent'

function audiencePhotoUrl({ photo, photoSeed }) {
  return photo ?? `https://picsum.photos/seed/${photoSeed}/400/500`
}

function AudienceCard({ photo, photoSeed, title, desc, tall, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-2xl text-left outline-none focus-visible:ring-4 focus-visible:ring-brand-subtle ${tall ? 'row-span-2 min-h-[280px] lg:min-h-0' : 'min-h-[132px]'}`}
    >
      <img
        src={audiencePhotoUrl({ photo, photoSeed })}
        alt={title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="font-extrabold text-white">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/80">{desc}</p>
      </div>
    </button>
  )
}

export default function AudienceGrid() {
  const navigate = useNavigate()
  const loggedIn = useAuthStore(s => s.loggedIn)
  const [openIndex, setOpenIndex] = useState(null)
  const openAudience = openIndex != null ? HOME_AUDIENCES[openIndex] : null
  useScrollLock(openAudience != null)

  function showPrev() {
    setOpenIndex(i => (i - 1 + HOME_AUDIENCES.length) % HOME_AUDIENCES.length)
  }
  function showNext() {
    setOpenIndex(i => (i + 1) % HOME_AUDIENCES.length)
  }

  return (
    <section className="flex w-full flex-col items-center gap-10">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-extrabold text-ink">
          適合每一種共享生活
        </h2>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-ink-3">
          不論是學生、情侶、家庭或工作夥伴
          <br />
          自己開團，輕鬆管理
        </p>
      </div>

      <div className="-mx-3 grid w-[calc(100%+1.5rem)] grid-cols-2 grid-rows-2 gap-3 sm:mx-0 sm:w-full sm:grid-cols-3 sm:gap-4">
        {HOME_AUDIENCES.map((audience, i) => (
          <AudienceCard key={audience.title} {...audience} tall={i === 0} onOpen={() => setOpenIndex(i)} />
        ))}
      </div>

      <Button
        size="lg"
        className="rounded-full px-8"
        onClick={() => loggedIn ? window.dispatchEvent(new CustomEvent('pm:open-create-group')) : navigate('/register')}
      >
        立即建立群組
        <ChevronRight size={14} strokeWidth={1.5} />
      </Button>

      {openAudience && (
        <ImageLightbox
          url={audiencePhotoUrl(openAudience)}
          alt={openAudience.title}
          onClose={() => setOpenIndex(null)}
          onPrev={showPrev}
          onNext={showNext}
          imageClassName="aspect-[4/3] w-[85vw] max-w-sm object-cover sm:max-w-md"
          caption={
            <>
              <p className="font-extrabold text-white">{openAudience.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/80">{openAudience.desc}</p>
              {openAudience.services?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {openAudience.services.map(serviceId => {
                    const service = getServiceById(serviceId)
                    if (!service) return null
                    return (
                      <span
                        key={serviceId}
                        className="flex items-center gap-1.5 rounded-full bg-white/15 py-1 pl-1 pr-2.5 text-2xs font-bold text-white backdrop-blur"
                      >
                        <ServiceLogo serviceId={serviceId} size={16} />
                        {service.name}
                      </span>
                    )
                  })}
                </div>
              )}
            </>
          }
        />
      )}
    </section>
  )
}
