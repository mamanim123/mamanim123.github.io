# 🚀 센터소식 업데이트 - 빠른 시작 가이드

## ⚡ 원클릭 실행 (어디서든 가능)

```bash
# 1. 리포지토리 클론
git clone https://github.com/mamanim123/chungdam.git
cd chungdam

# 2. 패키지 설치 (axios, cheerio만 - 브라우저 없음!)
npm install

# 3. 센터소식 자동 업데이트 실행
node update-blog-images-final.js
```

## 📋 작업 결과
- ✅ 실제 블로그에서 대표 이미지 자동 추출
- ✅ 센터소식 3개 이미지 업데이트
- ✅ HTML 자동 수정
- ✅ 파일명 중복 방지

## 📖 상세 가이드
더 자세한 내용은 `BLOG-IMAGE-UPDATE-GUIDE-FINAL.md` 파일 참조

## ⚠️ 중요사항
**절대로 Playwright/Puppeteer 설치하지 마세요!**
- HTTP 요청만 사용
- 브라우저 종속성 없음
- 어디서든 실행 가능