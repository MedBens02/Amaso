import api from "@/lib/api"

/**
 * How long to wait for the server to revoke the token before leaving anyway.
 *
 * The local session is cleared either way, so the worst case of giving up is
 * a token that stays valid server-side until it is used and rejected - which
 * is better than trapping someone in a session they asked to end because the
 * backend is slow or unreachable.
 */
const REVOKE_TIMEOUT_MS = 2500

/**
 * Ends the session: revokes the token server-side, clears it locally, and
 * returns to the login page.
 *
 * There are two logout buttons - the sidebar and the profile menu - and they
 * used to do different things. The sidebar removed only the cached "user"
 * object and pushed to /login, leaving `amaso_token` in localStorage and
 * still valid on the server: it looked instant precisely because it never
 * logged anyone out. The profile menu did revoke the token, but awaited the
 * round trip before navigating, so it felt slow enough that people pressed
 * it twice. Both now call this.
 *
 * The final navigation is a full document load rather than router.push, so
 * every component unmounts and nothing the previous session had cached in
 * memory survives into the login screen.
 */
export async function logout(): Promise<void> {
  await Promise.race([
    api.logout().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, REVOKE_TIMEOUT_MS)),
  ])

  // api.logout() clears the session in its own `finally`, but the timeout
  // above can win the race - so make certain of it before leaving.
  api.clearSession()

  window.location.assign("/login")
}
