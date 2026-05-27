"use client"

import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Suspense } from "react"

function ErrorContent() {
  const params = useSearchParams()
  const error = params.get("error")

  const isAccessDenied = error === "AccessDenied"

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ fontSize: "2.4em", marginBottom: "12px" }}>
          {isAccessDenied ? "✕" : "!"}
        </div>
        <h1 className="login-title">새모양 F&amp;B</h1>
        <p className="login-sub">법인카드 경비관리 시스템</p>
        <hr className="login-divider" />

        {isAccessDenied ? (
          <>
            <p
              style={{
                fontSize: "0.9em",
                fontWeight: 700,
                color: "var(--point-color)",
                marginBottom: "8px",
              }}
            >
              접근 권한이 없습니다
            </p>
            <p
              style={{
                fontSize: "0.82em",
                color: "var(--text-sub)",
                marginBottom: "22px",
                lineHeight: 1.7,
              }}
            >
              이 시스템은 허가된 임직원만 사용 가능합니다.<br />
              관리자에게 접근 권한을 요청해주세요.
            </p>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: "0.9em",
                fontWeight: 700,
                color: "var(--point-color)",
                marginBottom: "8px",
              }}
            >
              로그인 중 오류가 발생했습니다
            </p>
            <p
              style={{
                fontSize: "0.82em",
                color: "var(--text-sub)",
                marginBottom: "22px",
                lineHeight: 1.7,
              }}
            >
              잠시 후 다시 시도해주세요.<br />
              <span style={{ fontSize: "0.9em", opacity: 0.7 }}>오류 코드: {error ?? "Unknown"}</span>
            </p>
          </>
        )}

        <button
          className="social-btn google"
          onClick={() => signIn(undefined, { callbackUrl: "/" })}
          style={{ justifyContent: "center" }}
        >
          ← 로그인 화면으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-page)",
            fontFamily: "Chosunilbo_myungjo, serif",
            color: "var(--text-sub)",
          }}
        >
          로딩 중…
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  )
}
