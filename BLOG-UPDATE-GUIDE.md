# 🎯 청담재활 블로그 자동 업데이트 가이드

새 블로그 글이 올라올 때마다 **한 번의 명령어**로 웹사이트를 자동 업데이트할 수 있습니다!

## 🚀 빠른 시작

### Windows 사용자
```cmd
update.bat
```

### Linux/Mac 사용자  
```bash
./update.sh
```

### 또는 직접 실행
```bash
npm run update
```

## 📋 자동화되는 작업들

1. **📡 RSS 피드에서 최신 3개 글 가져오기**
2. **📸 각 블로그 글의 대표 이미지 스크린샷 촬영**
3. **✂️ 이미지 크롭 및 최적화** (400x280px)
4. **📝 index.html 파일 자동 업데이트**
5. **🔄 Git 커밋 준비**

## 🛠️ 설치 요구사항

- **Node.js 18+** (https://nodejs.org)
- **Git** (버전 관리용)

## 📁 생성되는 파일들

- `images/blog-post-1-auto.png` - 첫 번째 글 이미지
- `images/blog-post-2-auto.png` - 두 번째 글 이미지  
- `images/blog-post-3-auto.png` - 세 번째 글 이미지
- `index.html` - 업데이트된 메인 페이지

## 🔧 수동 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 블로그 업데이트 실행
node update-blog.js

# 3. Git 커밋 (선택사항)
git add .
git commit -m "블로그 업데이트: [새 글 제목]"
git push origin test
```

## ⚙️ 설정 변경

`update-blog.js` 파일에서 다음 설정을 변경할 수 있습니다:

```javascript
const CONFIG = {
    BLOG_RSS_URL: 'https://rss.blog.naver.com/chungdam311.xml',
    MAX_POSTS: 3,           // 표시할 글 개수
    IMAGE_WIDTH: 400,       // 이미지 너비
    IMAGE_HEIGHT: 280,      // 이미지 높이
    CROP_SELECTOR: '.se-main-container', // 크롭할 영역
    BACKUP_IMAGE: './images/blog-post-2-improved.png' // 대체 이미지
};
```

## 🐛 문제 해결

### "playwright 설치 오류"
```bash
npx playwright install
```

### "이미지 생성 실패"  
- 네트워크 연결 확인
- 블로그 접근 권한 확인
- 대체 이미지가 자동 사용됨

### "HTML 업데이트 실패"
- `index.html` 파일 권한 확인
- 백업 파일에서 복원

## 🎉 사용 예시

```bash
$ npm run update

🎯 청담재활 블로그 자동 업데이트 시작!

📡 RSS에서 최신 블로그 포스트 가져오는 중...
✅ 3개 포스트 가져옴:
   1. 청담재활 2분기 생신 잔치!! (2025.07.03)
   2. 청담재활 삼겹살 파티~~~ (2025.06.14)  
   3. 청담재활주간보호센터 어버이날 행사~~~!! (2025.05.14)

📸 블로그 포스트 이미지 촬영 중...
   📷 청담재활 2분기 생신 잔치!! 스크린샷 촬영...
   ✅ blog-post-1-auto.png 생성 완료
   📷 청담재활 삼겹살 파티~~~ 스크린샷 촬영...
   ✅ blog-post-2-auto.png 생성 완료
   📷 청담재활주간보호센터 어버이날 행사~~~!! 스크린샷 촬영...
   ✅ blog-post-3-auto.png 생성 완료

📝 index.html 파일 업데이트 중...
✅ index.html 업데이트 완료

🔄 Git 커밋 준비 중...
📋 변경된 파일들:
M  index.html
A  images/blog-post-1-auto.png
A  images/blog-post-2-auto.png  
A  images/blog-post-3-auto.png

🚀 Git 커밋을 위해 다음 명령어를 실행하세요:
   git add .
   git commit -m "블로그 업데이트: 청담재활 2분기 생신 잔치!!"
   git push origin test

🎉 블로그 업데이트 완료!
   브라우저에서 index.html을 열어 결과를 확인하세요.
```

---

## 💡 팁

- **정기 실행**: 매주 또는 매월 정기적으로 실행하면 항상 최신 상태 유지
- **이미지 품질**: 스크린샷이 마음에 안 들면 수동으로 교체 가능
- **Git 연동**: GitHub Pages와 연동하면 자동 배포까지 완성!