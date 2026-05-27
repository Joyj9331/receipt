import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import KakaoProvider from "next-auth/providers/kakao"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // 기본 스코프만 사용 (민감 권한 없음 → Google 앱 심사 불필요)
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    // ── B안: 이메일 화이트리스트 ──────────────────────────────
    // ALLOWED_EMAILS 환경변수에 콤마로 구분된 이메일 목록을 설정하세요.
    // 예) ALLOWED_EMAILS=admin@company.com,user@company.com
    // 값이 비어있으면 모든 이메일 허용 (개발 환경 편의를 위해)
    //
    // ※ 카카오는 비즈 앱 전환 없이는 이메일을 제공하지 않으므로
    //    provider가 kakao인 경우 이메일 체크를 건너뜁니다.
    async signIn({ user, account }) {
      // 카카오는 이메일 미제공 → 화이트리스트 체크 생략
      if (account?.provider === "kakao") return true

      const raw = process.env.ALLOWED_EMAILS ?? ""
      const allowedEmails = raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)

      if (allowedEmails.length === 0) return true

      const userEmail = (user.email ?? "").toLowerCase()
      if (!allowedEmails.includes(userEmail)) {
        // NextAuth에서 자동으로 /auth/error?error=AccessDenied 로 리다이렉트
        return false
      }
      return true
    },

    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider
        token.accessToken = account.access_token
      }
      return token
    },

    async session({ session, token }) {
      session.provider = token.provider as string | undefined
      return session
    },
  },

  pages: {
    signIn: "/",
    error: "/auth/error",   // 커스텀 에러 페이지
  },

  secret: process.env.NEXTAUTH_SECRET,
}
