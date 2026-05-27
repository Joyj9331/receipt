import streamlit as st
import pandas as pd
import requests
import io
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from PIL import Image
from datetime import datetime

# --- 1. 환경 설정 ---
OCR_SPACE_API_KEY = "helloworld"  # 무료 오픈 OCR 키

# 이메일 발송 설정 (과장님 정보에 맞게 수정 필요)
SMTP_SERVER = "smtp.naver.com"    # 네이버 메일 기준 (구글이면 smtp.gmail.com)
SMTP_PORT = 587
SENDER_EMAIL = "your_email@naver.com"       # 보내는 사람 메일
SENDER_PASSWORD = "your_app_password"      # 메일 비밀번호 (또는 앱 비밀번호)
RECEIVER_EMAIL = "receiver_email@naver.com" # 보고 받는 자(결재자)의 메일

STAFF_LIST = ["조영준 과장", "김재광 본부장", "이대리", "박사원"]
CATEGORY_LIST = ["식사", "주유", "기타", "직접입력"]

st.set_page_config(page_title="새모양 F&B 경비관리 시스템", layout="wide")

# --- 2. 핵심 함수 (OCR 및 이메일) ---
def ocr_space_file(image_bytes):
    """무료 OCR API 호출"""
    url = "https://api.ocr.space/parse/image"
    payload = {"apikey": OCR_SPACE_API_KEY, "language": "kor", "detectOrientation": True}
    files = {"file": ("receipt.jpg", image_bytes, "image/jpeg")}
    try:
        response = requests.post(url, data=payload, files=files)
        result = response.json()
        if result.get("OCRExitCode") == 1:
            return result.get("ParsedResults", [{}])[0].get("ParsedText", "")
        return ""
    except:
        return ""

def send_email_with_excel(df):
    """등록된 데이터프레임을 엑셀로 변환하여 이메일 전송"""
    try:
        # 엑셀 파일 생성 (메모리 버퍼에 저장)
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            # 과장님이 원하시는 [날짜, 사용자, 금액, 비고] 순서로 정렬하여 저장
            export_df = df[["날짜", "사용자", "금액", "카테고리", "동반직원", "비고"]]
            export_df.to_excel(writer, index=False, sheet_name="영수증지출내역")
        excel_data = excel_buffer.getvalue()

        # 이메일 메시지 구성
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = RECEIVER_EMAIL
        msg['Subject'] = f"⚠️ [법인카드 지출보고] {datetime.now().strftime('%Y-%m-%d')} 경비 내역"
        
        body = "안녕하세요, 법인카드 영수증 처리 시스템에서 자동 발송된 지출 내역 엑셀 파일입니다."
        msg.attach(MIMEText(body, 'plain'))

        # 엑셀 파일 첨부
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(excel_data)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', f"attachment; filename=Receipt_Report_{datetime.now().strftime('%Y%m%d')}.xlsx")
        msg.attach(part)

        # SMTP 서버 연결 및 전송
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, RECEIVER_EMAIL, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        st.error(f"메일 발송 실패 오류: {str(e)}")
        return False

# --- 3. 데이터 세션 저장소 초기화 ---
if 'db' not in st.session_state:
    st.session_state.db = pd.DataFrame(columns=["날짜", "사용자", "금액", "카테고리", "동반직원", "비고"])

st.title("📑 법인카드 복수 영수증 일괄 처리 시스템 (PC 버전)")
st.info("여러 개의 영수증을 한 번에 올리고 개별 설정을 마친 뒤, 단 한 번의 클릭으로 엑셀 보고서를 메일로 전송합니다.")

# --- 4. 메인 화면: 파일 업로드 ---
uploaded_files = st.file_uploader("영수증 사진들을 한 번에 선택하세요 (다중 선택 가능)", type=['jpg', 'jpeg', 'png'], accept_multiple_files=True)

if uploaded_files:
    st.subheader("▶ 각 영수증별 정보 확인 및 담당자 지정")
    
    # 여러 영수증의 데이터를 임시로 담아둘 리스트
    temp_records = []
    
    # 업로드된 파일 개수만큼 루프를 돌며 각각 입력 폼을 생성
    for idx, file in enumerate(uploaded_files):
        st.markdown(f"#### 🧾 {idx+1}번 영수증: `{file.name}`")
        
        col1, col2 = st.columns([1, 2])
        
        with col1:
            image = Image.open(file)
            st.image(image, width=250, caption=f"{idx+1}번 이미지")
            
            # 파일별 OCR 인식 (세션 캐싱으로 중복 호출 방지)
            cache_key = f"ocr_{file.name}"
            if cache_key not in st.session_state:
                img_byte_arr = io.BytesIO()
                image.convert("RGB").save(img_byte_arr, format='JPEG')
                text = ocr_space_file(img_byte_arr.getvalue())
                st.session_state[cache_key] = text
            else:
                text = st.session_state[cache_key]
        
        with col2:
            # 금액 자동 추출 알고리즘 적용
            detected_amount = 0
            if text:
                clean_text = text.replace(",", "")
                numbers = [int(s) for s in re.findall(r'\d+', clean_text) if len(s) >= 3]
                if numbers:
                    valid_numbers = [n for n in numbers if n < 5000000]
                    if valid_numbers:
                        detected_amount = max(valid_numbers)

            # 각 영수증별 고유한 Key값을 주어 개별 제어
            c_date = st.date_input(f"날짜 ({idx+1}번)", datetime.now(), key=f"date_{idx}")
            c_amount = st.number_input(f"금액(원) ({idx+1}번)", min_value=0, value=int(detected_amount), key=f"amount_{idx}")
            c_user = st.selectbox(f"사용자 ({idx+1}번)", STAFF_LIST, key=f"user_{idx}")
            c_cat = st.radio(f"카테고리 ({idx+1}번)", CATEGORY_LIST, horizontal=True, key=f"cat_{idx}")
            c_comp = st.multiselect(f"함께 사용한 직원 ({idx+1}번)", STAFF_LIST, key=f"comp_{idx}")
            c_note = st.text_input(f"비고/가맹점명 ({idx+1}번)", key=f"note_{idx}")
            
            # 임시 배열에 데이터 적재
            temp_records.append({
                "날짜": c_date.strftime('%Y-%m-%d'),
                "사용자": c_user,
                "금액": int(c_amount),
                "카테고리": c_cat,
                "동반직원": ", ".join(c_comp) if c_comp else "없음",
                "비고": c_note if c_note else "영수증 처리"
            })
        st.divider()

    # 일괄 등록 버튼
    if st.button("🔥 확인된 모든 영수증 데이터 테이블에 얹기", type="primary"):
        new_df = pd.DataFrame(temp_records)
        st.session_state.db = pd.concat([st.session_state.db, new_df], ignore_index=True)
        st.success("하단 표에 모든 데이터가 성공적으로 누적되었습니다!")

# --- 5. 하단: 누적 데이터 확인 및 이메일 전송 ---
st.subheader("📊 현재 최종 누적된 내역 (원하는 양식)")
st.dataframe(st.session_state.db, use_container_width=True)

if not st.session_state.db.empty:
    col_btn1, col_btn2 = st.columns(2)
    
    with col_btn1:
        # 로컬 다운로드용
        csv = st.session_state.db.to_csv(index=False).encode('utf-8-sig')
        st.download_button("📥 PC에 바로 엑셀(CSV) 저장", data=csv, file_name="법카_지출내역.csv", mime="text/csv")
        
    with col_btn2:
        # 이메일 발송용
        if st.button("📧 보고 받는 자에게 엑셀 파일 메일 전송하기"):
            with st.spinner("엑셀 변환 후 메일 발송 중..."):
                success = send_email_with_excel(st.session_state.db)
                if success:
                    st.success(f"📬 {RECEIVER_EMAIL}로 엑셀 보고서가 발송되었습니다!")