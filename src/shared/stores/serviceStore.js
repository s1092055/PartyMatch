import { SERVICES } from '../data/serviceCatalog'
import { readAllServices } from '../api/servicesApi'

// Start with local catalog so services are available even before Firestore responds
let _services = [...SERVICES]

export async function initServices() {
  try {
    const data = await readAllServices()
    if (data.length > 0) {
      _services = data.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    }
  } catch (err) {
    console.warn('[serviceStore] Firestore unavailable, using local catalog:', err.message)
  }
}

export function getServices() { return _services }
export function getServiceById(id) { return _services.find(s => s.id === id) ?? null }
