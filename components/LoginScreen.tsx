"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginScreen() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: "google" | "kakao") => {
    setLoading(provider)
    await signIn(provider, { callbackUrl: "/" })
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ fontSize: "2.4em", marginBottom: "12px" }}>📑</div>
        <h1 className="login-title">새모양 F&amp;B</h1>
        <p className="login-sub">법인카드 경비관리 시스템</p>
        <hr className="login-divider" />

        <p
          style={{
            fontSize: "0.82em",
            color: "var(--text-sub)",
            marginBottom: "18px",
            lineHeight: 1.6,
          }}
        >
          허가된 임직원 계정으로 로그인해주세요.<br />
          별도 이메일 설정 없이 바로 사용 가능합니다.
        </p>

        <button
          className="social-btn google"
          onClick={() => handleSignIn("google")}
          disabled={loading !== null}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          {loading === "google" ? "로그인 중…" : "Google 계정으로 로그인"}
        </button>

        <button
          className="social-btn kakao"
          onClick={() => handleSignIn("kakao")}
          disabled={loading !== null}
        >
          <svg width="18" height="17" viewBox="0 0 18 17" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0C4.029 0 0 3.116 0 6.96c0 2.418 1.524 4.538 3.823 5.773L2.9 16.12a.3.3 0 00.453.322L7.54 13.85A10.51 10.51 0 009 13.92c4.971 0 9-3.116 9-6.96S13.971 0 9 0z"
              fill="#3C1E1E"
            />
          </svg>
          {loading === "kakao" ? "로그인 중…" : "카카오 계정으로 로그인"}
        </button>

        <p
          style={{
            fontSize: "0.72em",
            color: "var(--text-sub)",
            marginTop: "18px",
            lineHeight: 1.5,
          }}
        >
          * Google 로그인 시 Gmail을 통해 결재자에게 이메일 발송<br />
          * 카카오 로그인은 영수증 등록·저장 기능만 사용 가능
        </p>
      </div>
    </div>
  )
}
