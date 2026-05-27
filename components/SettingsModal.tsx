"use client"

import { useState, useEffect } from "react"

interface Props {
  onClose: () => void
}

const SETTINGS_KEY = "receipt_settings_v1"

interface Settings {
  receiverEmail: string
  ccEmail: string
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return { receiverEmail: "", ccEmail: "" }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? (JSON.parse(raw) as Settings) : { receiverEmail: "", ccEmail: "" }
  } catch {
    return { receiverEmail: "", ccEmail: "" }
  }
}

export function saveSettings(s: Settings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export function getReceiverEmail(): string {
  return loadSettings().receiverEmail
}

export default function SettingsModal({ onClose }: Props) {
  const [settings, setSettings] = useState<Settings>({ receiverEmail: "", ccEmail: "" })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 800)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">⚙️ 이메일 발송 설정</h2>

        <div style={{ marginBottom: "16px" }}>
          <label className="form-label">수신자 이메일 (결재자) *</label>
          <input
            type="email"
            className="form-input"
            placeholder="manager@company.com"
            value={settings.receiverEmail}
            onChange={(e) =>
              setSettings((s) => ({ ...s, receiverEmail: e.target.value }))
            }
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label className="form-label">참조 이메일 (CC, 선택)</label>
          <input
            type="email"
            className="form-input"
            placeholder="cc@company.com"
            value={settings.ccEmail}
            onChange={(e) =>
              setSettings((s) => ({ ...s, ccEmail: e.target.value }))
            }
          />
        </div>

        <p
          style={{
            fontSize: "0.78em",
            color: "var(--text-sub)",
            marginBottom: "18px",
            lineHeight: 1.5,
          }}
        >
          * 이 설정은 이 기기에만 저장됩니다.<br />
          * Google 로그인 계정으로 메일이 발송됩니다.
        </p>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="action-btn"
            style={{ flex: "none", padding: "12px 20px" }}
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="action-btn primary"
            onClick={handleSave}
            disabled={!settings.receiverEmail}
          >
            {saved ? "✓ 저장됨!" : "저장"}
          </button>
        </div>
      </div>
    </div>
  )
}
