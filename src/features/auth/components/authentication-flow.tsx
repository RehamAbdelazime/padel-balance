import { useState } from 'react'
import { LoginScreen } from './login-screen'
import { VerifyOtpScreen } from './verify-otp-screen'

type AuthenticationFlowState = { screen: 'LOGIN' } | { screen: 'VERIFY_OTP'; phone: string }

export function AuthenticationFlow() {
  const [state, setState] = useState<AuthenticationFlowState>({ screen: 'LOGIN' })

  if (state.screen === 'VERIFY_OTP') {
    return <VerifyOtpScreen phone={state.phone} />
  }

  return (
    <LoginScreen onOtpRequested={(phone) => setState({ screen: 'VERIFY_OTP', phone })} />
  )
}
