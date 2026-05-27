"use client"

import { useRef, useState } from "react"

interface Props {
  onFilesSelected: (files: FileList) => void
  disabled?: boolean
}

export default function ReceiptUploader({ onFilesSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    onFilesSelected(files)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="card" style={{ marginBottom: "20px" }}>
      <h3 className="section-title">
        <span>영수증 업로드</span>
        <span className="sub">다중 선택 가능 · 카메라 직접 촬영 지원</span>
      </h3>

      <div
        className={`upload-zone ${isDragging ? "drag-over" : ""} ${disabled ? "opacity-50" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <div style={{ fontSize: "2.4em", marginBottom: "8px" }}>📷</div>
        <p style={{ fontWeight: 900, color: "var(--text-main)", margin: "0 0 4px 0", fontSize: "1.05em" }}>
          영수증 사진을 올리거나 여기를 터치하세요
        </p>
        <p style={{ fontSize: "0.82em" }}>JPG · PNG 지원 · 여러 장 동시 선택 가능</p>
        <div style={{ marginTop: "14px" }}>
          <span className="action-btn" style={{ display: "inline-block", padding: "10px 24px", flex: "none", fontSize: "0.9em" }}>
            📁 파일 선택 / 카메라 촬영
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  )
}
