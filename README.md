# 📑 새모양 F&B 경비관리 시스템

법인카드 영수증을 찍어 올리면 OCR로 금액을 자동 인식하고, 지출 내역을 엑셀로 정리 및 메일 발송하는 사내 경비관리 웹앱입니다.

## ✨ 주요 기능
- 📷 **영수증 다중 업로드** — 여러 장 동시 선택 또는 카메라 직접 촬영
- 🔍 **OCR 자동 인식** — 영수증에서 금액 자동 추출 (ocr.space API)
- 📝 **정보 입력** — 날짜 / 금액 / 사용자 / 카테고리 / 동반직원 / 비고
- 📊 **누적 내역 관리** — 브라우저 로컬 저장 (새로고침 후에도 유지)
- 📥 **엑셀 다운로드** — 지출 내역을 .xlsx로 즉시 저장
- 📧 **이메일 자동 발송** — 결재자에게 엑셀 첨부 메일 전송

## 🚀 로컬 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
# .env.local.example 을 복사해 .env.local 생성
copy .env.local.example .env.local
# 실제 값으로 수정
```

`.env.local` 내용:
```
OCR_SPACE_API_KEY=your_key    # https://ocr.space 에서 무료 발급
SMTP_SERVER=smtp.naver.com
SMTP_PORT=587
SENDER_EMAIL=your@naver.com
SENDER_PASSWORD=your_app_password
RECEIVER_EMAIL=manager@company.com
```

### 3. 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000 에서 확인

---

## 🐙 GitHub 등록 방법

```bash
# 1. 현재 디렉터리에서 git 초기화
git init

# 2. 모든 파일 스테이징
git add .

# 3. 첫 커밋
git commit -m "feat: 초기 프로젝트 구성"

# 4. GitHub에서 새 레포지토리 생성 후 연결
git remote add origin https://github.com/YOUR_ID/saemoyangfnb-receipt.git
git branch -M main
git push -u origin main
```

---

## ☁️ Vercel 배포 방법

### 자동 배포 (추천)
1. [vercel.com](https://vercel.com) 에서 로그인
2. **"Add New Project"** → GitHub 레포지토리 선택
3. **Environment Variables** 탭에서 아래 변수 추가:
   - `OCR_SPACE_API_KEY`
   - `SMTP_SERVER`
   - `SMTP_PORT`
   - `SENDER_EMAIL`
   - `SENDER_PASSWORD`
   - `RECEIVER_EMAIL`
4. **Deploy** 클릭 → 자동 배포 완료!

이후 `git push` 할 때마다 자동으로 재배포됩니다.

---

## 🎨 폰트 커스터마이징 (조선일보명조체)

현재는 Google Fonts의 **Noto Serif KR** (유사 한국 명조체)를 사용합니다.  
조선일보명조체로 변경하려면:

1. 조선일보 홈페이지에서 폰트 파일 다운로드 (`.woff2`)
2. `public/fonts/ChosunilboNM.woff2` 로 저장
3. `app/globals.css` 의 `@font-face` 주석 해제

---

## 📁 프로젝트 구조

```
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 페이지
│   ├── globals.css         # 전역 스타일
│   └── api/
│       ├── ocr/route.ts    # OCR API
│       └── send-email/route.ts  # 이메일 API
├── components/
│   ├── Header.tsx          # 상단 헤더 (폰트 크기 조절)
│   ├── ReceiptUploader.tsx # 파일 업로드 영역
│   ├── ReceiptCard.tsx     # 영수증 입력 카드
│   └── SummaryTable.tsx    # 누적 내역 테이블
├── contexts/
│   └── FontSizeContext.tsx # 글씨 크기 전역 상태
├── lib/
│   ├── types.ts            # TypeScript 타입
│   ├── constants.ts        # 직원/카테고리 목록
│   ├── storage.ts          # localStorage 유틸
│   └── excel.ts            # 엑셀 생성 유틸
└── .env.local.example      # 환경변수 템플릿
```
