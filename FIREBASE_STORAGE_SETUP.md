# Firebase Storage 설정 가이드

급식 페이지의 석식 사진 업로드 기능을 사용하려면 Firebase Storage를 활성화해야 합니다.

## 1. Firebase Console에서 Storage 활성화

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택 (daeshin2-5)
3. 왼쪽 메뉴에서 **Build** > **Storage** 클릭
4. **시작하기** 버튼 클릭
5. 보안 규칙 모드 선택:
   - **테스트 모드로 시작** 선택 (개발 중)
   - 또는 아래의 보안 규칙 사용
6. Cloud Storage 위치 선택:
   - **asia-northeast3 (서울)** 권장
7. **완료** 클릭

## 2. Storage 보안 규칙 설정

Firebase Console의 Storage > **Rules** 탭에서 다음 규칙을 설정하세요:

### 개발용 (누구나 읽기 가능, 쓰기는 인증 필요)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 프로덕션용 (인증된 사용자만 접근)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 석식 사진 업로드
    match /dinner_images/{imageId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 기타 파일은 기본적으로 차단
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 임시 개발용 (모두 허용 - 보안 취약)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **주의**: 임시 개발용 규칙은 30일 후 자동으로 만료됩니다. 실제 서비스에서는 반드시 인증을 추가하세요.

## 3. Storage 구조

```
storage/
└── dinner_images/
    ├── 2024-03-15.jpg
    ├── 2024-03-16.png
    └── 2024-03-17.jpg
```

- 경로: `dinner_images/{날짜}.{확장자}`
- 날짜 형식: `YYYY-MM-DD`
- 지원 형식: JPG, PNG, GIF 등 모든 이미지 형식

## 4. 환경 변수 확인

`.env.local` 파일에 다음 변수가 올바르게 설정되어 있는지 확인:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=daeshin2-5.firebasestorage.app
```

## 5. 사용 방법

### 석식 사진 업로드
1. 급식표 페이지 접속
2. 날짜 선택
3. 석식 섹션에서 **업로드** 버튼 클릭
4. 이미지 파일 선택
5. **업로드** 버튼 클릭

### 석식 사진 변경
1. 이미 사진이 있는 날짜 선택
2. **변경** 버튼 클릭
3. 새 이미지 파일 선택
4. **업로드** 버튼 클릭 (기존 사진은 자동 삭제됨)

### 석식 사진 삭제
1. 사진이 있는 날짜 선택
2. **삭제** 버튼 클릭
3. 확인 대화상자에서 **확인** 클릭

## 6. 트러블슈팅

### "사진 업로드에 실패했습니다" 오류
- Firebase Storage가 활성화되어 있는지 확인
- Storage 보안 규칙이 올바른지 확인
- .env.local 파일의 STORAGE_BUCKET 값 확인
- 브라우저 콘솔에서 자세한 오류 메시지 확인

### 이미지가 표시되지 않음
- Storage 보안 규칙에서 `allow read: if true` 설정 확인
- 이미지 URL이 유효한지 확인 (브라우저에서 직접 URL 열어보기)
- 네트워크 탭에서 이미지 로드 실패 여부 확인

### "Permission denied" 오류
- 현재 임시로 인증 없이 사용 중이므로, Storage 규칙을 테스트 모드로 변경
- 또는 Firebase Authentication을 활성화하고 로그인 기능 추가

## 7. 추후 개선 사항

- [ ] Firebase Authentication 추가
- [ ] 이미지 압축 기능 추가
- [ ] 업로드 진행률 표시
- [ ] 드래그 앤 드롭 업로드 지원
- [ ] 이미지 미리보기 기능
- [ ] 여러 이미지 업로드 지원
