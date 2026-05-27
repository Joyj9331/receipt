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
    // 같은 파일 재선택 가능하도록 value 초기화
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="p-4">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`
          relative border-2 border-dashed rounded-xl p-8
          flex flex-col items-center justify-center gap-3
          transition-all cursor-pointer select-none
          ${isDragging
            ? "border-brand-500 bg-brand-50"
            : "border-brand-300 bg-white hover:border-brand-400 hover:bg-brand-50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <div className="text-4xl">📷</div>
        <div className="text-center">
          <p className="font-bold text-brand-700" style={{ fontSize: "1em" }}>
            영수증 사진을 추가하세요
          </p>
          <p className="text-gray-500 mt-1" style={{ fontSize: "0.85em" }}>
            여러 장 동시 선택 가능 · 카메라로 직접 촬영 가능
          </p>
          <p className="text-gray-400 mt-1" style={{ fontSize: "0.78em" }}>
            JPG · PNG 지원
          </p>
        </div>

        {/* 모바일: 카메라 / PC: 갤러리 전용 버튼 두 개 */}
        <div className="flex gap-2 mt-1">
          <span
            className="px-4 py-2 bg-brand-700 text-white rounded-lg font-medium"
            style={{ fontSize: "0.88em" }}
          >
            📁 파일 선택 / 카메라
          </span>
        </div>
      </div>

      {/* 숨겨진 실제 input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  )
}
