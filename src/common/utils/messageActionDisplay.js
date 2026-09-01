import { getServiceById } from './serviceUtils'
import { hasFilledServiceInfo, isSharedCredentialsMethod } from './serviceInfoFields'

export function getFillServiceInfoDisplay({ userId, hostId, fillServiceId, myMember }) {
  const isHost = userId === hostId
  const sharingMethod = getServiceById(fillServiceId)?.sharingMethod
  const isSharedCredentials = isSharedCredentialsMethod(sharingMethod)
  const iAlreadyFilled = isHost || (hasFilledServiceInfo(myMember?.serviceInfo, sharingMethod, fillServiceId) && !myMember?.serviceInfoIssueNote)

  return { sharingMethod, isSharedCredentials, iAlreadyFilled }
}
