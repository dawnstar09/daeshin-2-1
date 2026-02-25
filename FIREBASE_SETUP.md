# Firebase 데이터베이스 초기 설정 가이드

## Firebase Realtime Database Rules

Firebase 콘솔에서 다음 보안 규칙을 설정하세요:

```json
{
  "rules": {
    "yaja_students": {
      ".read": true,
      ".write": true,
      "$id": {
        ".validate": "newData.hasChildren(['date', 'period', 'studentName', 'studentCode', 'studentNumber', 'reason', 'createdAt'])"
      }
    },
    "assessments": {
      ".read": true,
      ".write": true,
      "$id": {
        ".validate": "newData.hasChildren(['subject', 'title', 'description', 'dueDate', 'maxScore', 'weight', 'category', 'createdAt'])"
      }
    },
    "hagteugsa": {
      ".read": true,
      ".write": true,
      "$id": {
        ".validate": "newData.hasChildren(['title', 'description', 'maxMembers', 'date', 'location', 'creatorName', 'creatorCode', 'createdAt'])"
      }
    },
    "timeline_events": {
      ".read": true,
      ".write": true,
      "$id": {
        ".validate": "newData.hasChildren(['title', 'description', 'date', 'category', 'createdAt'])"
      }
    },
    "food_menu": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 샘플 데이터 입력

Firebase 콘솔에서 다음 샘플 데이터를 입력할 수 있습니다:

### 야자 학생 샘플
경로: `/yaja_students`
```json
{
  "-sample1": {
    "date": "2026-02-25",
    "period": 1,
    "studentName": "김철수",
    "studentCode": "205",
    "studentNumber": "3",
    "reason": "병원",
    "createdAt": 1709000000000
  }
}
```

### 수행평가 샘플
경로: `/assessments`
```json
{
  "-sample1": {
    "subject": "수학",
    "title": "수학 탐구 보고서",
    "description": "수학적 개념을 탐구하고 보고서 작성",
    "dueDate": "2026-03-15",
    "maxScore": 100,
    "weight": 30,
    "category": "report",
    "createdAt": 1709000000000
  }
}
```

### 급식표 샘플
경로: `/food_menu/2026/2`
```json
{
  "2026-02-26": {
    "breakfast": "밥, 김치찌개, 계란후라이",
    "lunch": "밥, 된장찌개, 불고기, 김치",
    "dinner": "밥, 미역국, 생선구이"
  },
  "2026-02-27": {
    "breakfast": "토스트, 우유, 과일",
    "lunch": "밥, 카레, 돈까스, 샐러드",
    "dinner": "밥, 김치찌개, 두부조림"
  }
}
```

## Firebase 프로젝트 설정 단계

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. 좌측 메뉴에서 "Realtime Database" 선택
4. "데이터베이스 만들기" 클릭
5. 위치 선택 (asia-southeast1 권장)
6. 보안 규칙에서 위의 규칙 적용
7. 프로젝트 설정에서 웹 앱 추가
8. Firebase 구성 정보를 `.env.local`에 복사

## 주의사항

⚠️ **프로덕션 환경에서는 반드시 보안 규칙을 강화하세요!**

현재 규칙은 개발 편의를 위해 읽기/쓰기가 모두 허용되어 있습니다. 실제 배포 시에는 인증을 추가하고 적절한 권한 관리를 해야 합니다.

예시 (인증 필요):
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
