import { useState } from 'react'
import { uploadPlatformReportEvidence } from '../../../common/api/storageApi'
import { createPlatformReport } from '../../../common/api/platformReportsApi'
import { toast } from '../../../common/utils/toast'
import { useEvidenceUpload } from '../../../common/utils/hooks'

export function usePlatformReportForm(groupId) {
  const [show, setShow] = useState(false)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const evidence = useEvidenceUpload(uploadPlatformReportEvidence)

  function close() {
    setShow(false)
    setDescription('')
    evidence.reset()
  }

  async function submit() {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await createPlatformReport({
        groupId,
        description: description.trim(),
        evidenceUrl: evidence.key,
      })
      toast('回報已送出，客服會盡快協助處理', 'success')
      close()
    } catch (err) {
      toast(err?.message ?? '回報失敗，請稍後再試', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return { show, setShow, description, setDescription, submitting, evidence, close, submit }
}
