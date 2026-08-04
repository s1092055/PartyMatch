import { useState } from 'react'

export function useFilterSelectGroup() {
  const [openKey, setOpenKey] = useState(null)
  return { openKey, setOpenKey }
}
