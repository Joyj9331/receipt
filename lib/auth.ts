import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Gmail 발송 권한 포함 (로그인된 구글 계정으로 직접 발송)
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.send",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    async jwt({ token, account }) {
      // 최초 로그인 시 토큰 저장
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000
        return token
      }

      // 토큰이 아직 유효하면 그대로 반환
      if (Date.now() < (token.accessTokenExpires ?? 0)) {
        return token
      }

      // 구글 토큰 만료 시 갱신 시도
      if (token.provider === "google" && token.refreshToken) {
        try {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          })
          const refreshed = (await res.json()) as {
            access_token?: string
            expires_in?: number
            error?: string
          }
          if (refreshed.error) throw new Error(refreshed.error)
          return {
            ...token,
            accessToken: refreshed.access_token,
            accessTokenExpires: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
            error: undefined,
          }
        } catch {
          return { ...token, error: "RefreshAccessTokenError" }
        }
      }

      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.provider = token.provider as string | undefined
      session.error = token.error as string | undefined
      return session
    },
  },

  pages: {
    signIn: "/",
  },

  secret: process.env.NEXTAUTH_SECRET,
}
