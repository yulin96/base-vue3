import type { ResData } from '@/api/types'
import { axiosGet, axiosPost } from '@/utils/request'

export interface PhoneAuthToken {
  accessToken: string
  jwtToken: string
}

export interface PhoneAuthMobile {
  mobile: string
}

export interface PhoneVerifyResult {
  matched: boolean
  verifyResult: 'PASS' | 'REJECT' | 'UNKNOWN'
  verifyId?: string
}

export function apiGetPhoneAuthToken() {
  return axiosGet<ResData<PhoneAuthToken>>('/phone-auth/token')
}

export function apiGetPhoneByToken(spToken: string) {
  return axiosPost<ResData<PhoneAuthMobile>>('/phone-auth/mobile', { spToken })
}

export function apiGetPhoneVerifyToken() {
  return axiosGet<ResData<PhoneAuthToken>>('/phone-auth/verify-token')
}

export function apiVerifyPhone(phoneNumber: string, spToken: string) {
  return axiosPost<ResData<PhoneVerifyResult>>('/phone-auth/verify', { phoneNumber, spToken })
}
