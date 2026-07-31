import axiosClient from './axiosClient'

export const fetchPaymentMethods    = ()       => axiosClient.get('/payment-methods')
export const createPaymentMethod    = (data)   => axiosClient.post('/payment-methods', data)
export const setDefaultPaymentMethod = (id)    => axiosClient.patch(`/payment-methods/${id}/default`)
export const deletePaymentMethod    = (id)     => axiosClient.delete(`/payment-methods/${id}`)
