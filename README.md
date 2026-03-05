# 대신고 2-1반 클래스 관리 시스템 🎓

Next.js 기반의 현대적인 학급 관리 시스템입니다. Toss 스타일의 깔끔한 UI와 Firebase 실시간 데이터베이스를 활용합니다.

## ✨ 주요 기능

- **야자 통계 📊**: 야간 자율학습 불참 현황 관리 및 통계 시각화
- **야자 출석 체크 ✅**: 36명 학생 출석 현황을 한눈에 보는 시각적 그리드
- **수행평가 📝**: 수행평가 일정 관리 및 D-day 알림
- **학특사 🎯**: 학교 특색 사업 활동 생성 및 참여
- **급식표 🍱**: NEIS Open API 연동 중식 정보 + 석식 사진 업로드
- **내신 계산기 🧮**: 과목별 성적 입력 및 등급 계산
- **타임라인 📅**: 학급 일정 및 주요 이벤트 관리
- **다크 모드 🌙**: 라이트/다크 모드 전환 및 자동 저장

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS (Toss UI 스타일)
- **Animation**: Framer Motion
- **Database**: Firebase Realtime Database
- **Charts**: Chart.js + react-chartjs-2
- **State Management**: Zustand
- **Date Handling**: date-fns

## 📦 설치 방법

### 1. 저장소 클론 또는 이동

```bash
cd my-website-nextjs
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Firebase 설정

`.env.local` 파일이 이미 생성되어 있습니다. 필요한 경우 Firebase 프로젝트 설정을 확인하세요.

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NEIS Open API Configuration
NEXT_PUBLIC_NEIS_API_KEY=your_neis_api_key
NEXT_PUBLIC_NEIS_ATPT_OFCDC_SC_CODE=J10
NEXT_PUBLIC_NEIS_SD_SCHUL_CODE=7530138
```

#### NEIS API 키 발급
1. [NEIS Open API](https://open.neis.go.kr) 접속
2. 회원가입 후 로그인
3. **인증키 신청** → 일반 인증키(오픈 API) 신청
4. 발급받은 키를 `.env.local`에 추가

#### Firebase Storage 활성화
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. **Build** > **Storage** 클릭
3. **시작하기** 클릭 및 위치 선택 (asia-northeast3 권장)
4. 자세한 내용은 [FIREBASE_STORAGE_SETUP.md](FIREBASE_STORAGE_SETUP.md) 참고

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📱 페이지 구조

```
/                   - 홈페이지 (메뉴 카드)
/yaja-stats         - 야자 통계 및 관리
/yaja-attendance    - 야자 출석 체크 (36명 학생 그리드)
/suhang             - 수행평가 관리
/hagteugsa          - 학특사 활동 관리
/food-calendar      - 급식표 (NEIS API 중식 + 석식 사진)
/calculator         - 내신 계산기
/timeline           - 학급 타임라인
```

## 🔥 Firebase 데이터베이스 구조

```
firebase-database/
├── yaja_students/
│   └── {id}/
│       ├── date: "2026-02-26"
│       ├── period: 1
│       ├── studentName: "홍길동"
│       ├── studentCode: "205"
│       ├── studentNumber: "5"
│       ├── reason: "학원"
│       └── createdAt: 1234567890
│
├── assessments/
│   └── {id}/
│       ├── subject: "수학"
│       ├── title: "수학 탐구 보고서"
│       ├── description: "..."
│       ├── dueDate: "2026-03-15"
│       ├── maxScore: 100
│       ├── weight: 100
│       ├── category: "report"
│       └── createdAt: 1234567890
│
├── hagteugsa/
│   └── {id}/
│       ├── title: "독서 토론 모임"
│       ├── description: "..."
│       ├── maxMembers: 10
│       ├── date: "2026-03-20"
│       ├── location: "도서관"
│       ├── creatorName: "홍길동"
│       ├── creatorCode: "205"
│       ├── members/
│       │   └── {memberId}/
│       │       ├── name: "김철수"
│       │       ├── studentNumber: "7"
│       │       └── joinedAt: 1234567890
│       └── createdAt: 1234567890
│
├── timeline_events/
│   └── {id}/
│       ├── title: "중간고사"
│       ├── description: "..."
│       ├── date: "2026-04-15"
│       ├── category: "exam"
│       └── createdAt: 1234567890
│
├── dinner_images/
│   └── {date}/              # YYYY-MM-DD 형식
│       ├── url: "https://..."
│       └── uploadedAt: 1234567890
│
└── food_menu/
    └── {year}/
        └── {month}/
            └── {date}/
                ├── breakfast: "밥, 국, ..."
                ├── lunch: "밥, 국, ..."
                └── dinner: "밥, 국, ..."
```

**참고**: 중식 정보는 NEIS Open API에서 실시간으로 가져오며, 석식 사진은 Firebase Storage에 저장됩니다.

## 🎨 UI 디자인 특징

### Toss 스타일 디자인 시스템
- **컬러**: Toss Blue (#3182F6)를 메인 컬러로 사용
- **타이포그래피**: Pretendard 폰트 사용
- **컴포넌트**: 깔끔한 카드 디자인, 부드러운 애니메이션
- **인터랙션**: Framer Motion을 활용한 자연스러운 모션

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 모두 지원
- Tailwind CSS의 반응형 유틸리티 활용

## 🚀 배포

### Vercel으로 배포 (권장)

1. Vercel 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 (.env.local) 설정
4. 자동 배포

```bash
npm install -g vercel
vercel
```

### 빌드

```bash
npm run build
npm run start
```

## 📝 주요 변경사항 (Flask → Next.js)

### 아키텍처
- **Backend**: Flask + SQLite → Next.js API Routes (optional) + Firebase
- **Frontend**: HTML + Vanilla JS → React + TypeScript
- **Styling**: CSS → Tailwind CSS
- **State**: 없음 → Zustand

### 기능 개선
- ✅ 실시간 데이터 동기화 (Firebase Realtime Database)
- ✅ 타입 안전성 (TypeScript)
- ✅ 현대적인 UI/UX (Toss 스타일)
- ✅ 부드러운 애니메이션 (Framer Motion)
- ✅ 반응형 디자인
- ✅ SEO 최적화 (Next.js)

## 🔒 보안

- `.env.local` 파일은 Git에 커밋되지 않습니다
- Firebase Security Rules를 설정하여 데이터 보호
- 환경 변수로 민감한 정보 관리

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 🙋‍♂️ 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요!

---

**Made with ❤️ for 대신고 2-1반**
