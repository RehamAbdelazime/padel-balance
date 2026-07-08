# Authentication State Machine

## States

- **UNAUTHENTICATED** — No active session. Initial state.
- **OTP_SENT** — An OTP has been requested for a phone number and is awaiting verification.
- **AUTHENTICATED** — The OTP has been verified and a Supabase session exists.
- **READY** — The authenticated session has been restored/confirmed valid on app load and is usable by the rest of the app.

## Transitions

### `requestOtp()`
- **From:** UNAUTHENTICATED
- **To:** OTP_SENT
- Sends a one-time password to the given phone number.

### `verifyOtp()`
- **From:** OTP_SENT
- **To:** AUTHENTICATED
- Verifies the submitted OTP token and establishes a session.

### `restoreSession()`
- **From:** UNAUTHENTICATED
- **To:** READY (on success) or UNAUTHENTICATED (on failure/no session)
- Attempts to recover an existing session (e.g. on app startup).

### `signOut()`
- **From:** AUTHENTICATED or READY
- **To:** UNAUTHENTICATED
- Clears the session.

## Diagram

```
UNAUTHENTICATED --requestOtp()--> OTP_SENT --verifyOtp()--> AUTHENTICATED
UNAUTHENTICATED --restoreSession()--> READY
AUTHENTICATED --signOut()--> UNAUTHENTICATED
READY --signOut()--> UNAUTHENTICATED
```
