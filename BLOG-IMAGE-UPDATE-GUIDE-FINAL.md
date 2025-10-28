# 🎯 청담재활 블로그 이미지 자동 추출 작업지침 (최종 버전)

## ⚠️ 절대 금지 사항
**🚫 절대로 Playwright나 Puppeteer 설치하려고 시간낭비하지 마세요!**
- ❌ `npm install playwright` 금지
- ❌ `npm install puppeteer` 금지  
- ❌ `npx playwright install` 금지
- ❌ 브라우저 시스템 종속성 설치 금지

**✅ 이 방법은 순수 HTTP 요청만 사용합니다**
- HTTP 요청으로 HTML 파싱
- cheerio로 DOM 탐색
- axios로 이미지 다운로드
- 브라우저 없이 완전 작동

## 📋 개요
HTTP 요청으로 네이버 블로그에서 실제 대표 이미지를 추출하여 **블로그 ID 기반 고유 파일명**으로 저장

## 🆔 새로운 파일명 시스템 (2025.07.10 업데이트)

### **블로그 ID 기반 파일명**
- **기존**: `blog-post-1-auto.png`, `blog-post-2-auto.png` (순차번호)
- **새로운**: `223928716039.png`, `223920577668.png` (블로그 ID)

### **장점**
- ✅ **직관적**: 파일명만 봐도 어떤 블로그 글인지 즉시 확인
- ✅ **중복 없음**: 블로그 ID는 네이버에서 고유하게 관리
- ✅ **매칭 완벽**: URL과 파일명이 정확히 일치

### **예시**
```
https://blog.naver.com/chungdam311/223928716039 → 223928716039.png
https://blog.naver.com/chungdam311/223920577668 → 223920577668.png
https://blog.naver.com/chungdam311/223898944941 → 223898944941.png
```

## 🛠️ 필요한 파일

### 1. 핵심 파일 (반드시 필요)
- `image-download-service.js` ⭐ - 이미지 추출 서비스
- `update-blog-images-final.js` ⭐ - 완전 자동화 스크립트

### 2. 프로젝트 파일
- `package.json` - axios, cheerio만 필요
- `index.html` - 업데이트할 메인 HTML 파일
- `images/` 폴더 - 이미지 저장 위치

## 📦 필요한 패키지 (브라우저 없음!)
```json
{
  "dependencies": {
    "axios": "^1.10.0",
    "cheerio": "^1.0.0-rc.12"
  }
}
```

## 🚀 실행 방법

### ⚡ 원클릭 자동화 (권장)
```bash
# 1. 패키지 설치 (axios, cheerio만)
npm install

# 2. 완전 자동화 실행
node update-blog-images-final.js
```

### 🔧 수동 실행 (디버깅용)
```bash
# 1. 이미지 추출만
node -e "
const ImageDownloadService = require('./image-download-service');
const service = new ImageDownloadService();

async function extractImages() {
    const urls = [
        'https://blog.naver.com/chungdam311/223920577668',
        'https://blog.naver.com/chungdam311/223898944941', 
        'https://blog.naver.com/chungdam311/223865345360'
    ];
    
    for (let i = 0; i < urls.length; i++) {
        const result = await service.capturePostThumbnail(urls[i]);
        console.log(\`\${i+1}번 결과: \${result}\`);
    }
}

extractImages();
"

# 2. 파일명 변경 (수동)
cp images/thumbnails/[최신파일].jpg images/blog-post-1-auto.png
cp images/thumbnails/[최신파일].jpg images/blog-post-2-auto.png  
cp images/thumbnails/[최신파일].jpg images/blog-post-3-auto.png
```

## 🔒 파일명 중복 방지 시스템

### 새로운 고유 파일명 생성 방식
```javascript
// 타임스탬프 + 해시로 절대 중복되지 않는 파일명
generateImageHash(url) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    return `${timestamp}-${urlHash.substring(0, 8)}`;
}

// 예시: 2025-07-08T12-13-45-123Z-a1b2c3d4.jpg
```

### 백업 시스템
- 기존 파일이 있으면 자동 백업: `blog-post-1-backup-1720435425123.png`
- 새 이미지로 안전하게 교체
- 롤백 필요시 백업 파일 사용 가능

## 📝 새 블로그 포스트 추가 방법

### 1. URL 업데이트
`update-blog-images-final.js` 파일에서 blogUrls 배열 수정:
```javascript
this.blogUrls = [
    {
        url: 'https://blog.naver.com/chungdam311/새글번호',
        title: '새 블로그 글 제목',
        targetFile: 'blog-post-1-auto.png'
    },
    // ... 기존 URL들
];
```

### 2. RSS 피드에서 최신 URL 확인
```bash
curl -s "https://rss.blog.naver.com/chungdam311.xml" | grep -o 'https://blog.naver.com/chungdam311/[0-9]*'
```

## 🔍 트러블슈팅

### ❌ 문제: "Cannot find module 'playwright'"
**해결책**: 이 오류가 나오면 Playwright를 설치하려 하지 마세요!
```bash
# 잘못된 방법 (하지 마세요)
npm install playwright  # ❌

# 올바른 방법
rm -rf node_modules
npm install  # axios, cheerio만 설치됨 ✅
```

### ❌ 문제: 이미지 추출 실패
```bash
# 네트워크 연결 확인
curl -I https://blog.naver.com/chungdam311/223920577668

# User-Agent 헤더 문제 - 자동 처리됨
```

### ❌ 문제: 파일 권한 오류
```bash
chmod 755 images/
chmod 755 images/thumbnails/
```

### ❌ 문제: 메모리 부족
```bash
# Node.js 메모리 제한 증가
node --max-old-space-size=4096 update-blog-images-final.js
```

## ✅ 성공 확인 방법

### 1. 파일 생성 확인
```bash
ls -la images/blog-post-*-auto.png
# 결과: 3개 파일이 모두 존재해야 함
```

### 2. 파일 크기 확인
```bash
file images/blog-post-*-auto.png
# 결과: 모든 파일이 JPEG/PNG 이미지여야 함
```

### 3. 백업 파일 확인
```bash
ls -la images/*backup*
# 결과: 백업 파일들이 생성됨 (기존 파일이 있었던 경우)
```

### 4. HTML 확인
```bash
grep -n "blog-post-.*-auto.png" index.html
# 결과: 3개 이미지 경로가 모두 업데이트됨
```

### 5. 브라우저 확인
- `index.html` 파일을 브라우저에서 열기
- 센터 소식 섹션의 이미지들이 올바르게 표시되는지 확인
- 이미지가 실제 블로그 내용과 일치하는지 확인

## 📋 작업 체크리스트

### 사전 준비
- [ ] `image-download-service.js` 파일 존재 확인
- [ ] `update-blog-images-final.js` 파일 존재 확인
- [ ] `package.json`에 axios, cheerio만 포함 확인
- [ ] Playwright/Puppeteer 패키지 없음 확인

### 실행 과정
- [ ] `npm install` 실행 (axios, cheerio만 설치)
- [ ] 블로그 URL 목록 최신화 확인
- [ ] `node update-blog-images-final.js` 실행
- [ ] 에러 없이 완료 확인

### 결과 검증
- [ ] 3개 이미지 파일 생성 확인
- [ ] HTML 파일 업데이트 확인
- [ ] 브라우저에서 표시 확인
- [ ] 이미지 내용 일치 확인

### Git 관리 (선택사항)
- [ ] 변경된 파일들 스테이징
- [ ] 의미있는 커밋 메시지 작성
- [ ] 리모트 푸시

## 🎯 핵심 요약

### ✅ 해야 할 것
1. **HTTP 기반 이미지 추출** 사용
2. **완전 자동화 스크립트** 실행
3. **파일명 중복 방지** 시스템 활용
4. **백업 파일** 확인

### ❌ 하지 말아야 할 것
1. **Playwright/Puppeteer 설치** 시도
2. **브라우저 종속성** 설치
3. **수동 파일 복사** (자동화 스크립트 사용)
4. **기존 백업 파일** 삭제

---

## 💡 최종 팁

**이 방법의 장점:**
- 🚀 빠른 실행 (브라우저 로딩 없음)
- 🔒 안정적 (시스템 종속성 없음)  
- 🔄 완전 자동화 (원클릭 실행)
- 📁 파일명 중복 방지 (타임스탬프 기반)
- 💾 자동 백업 (데이터 안전)

**문제 발생시:**
1. 절대 Playwright/Puppeteer 설치하지 마세요
2. `npm install`만 실행하세요 (axios, cheerio)
3. 자동화 스크립트를 믿고 사용하세요
4. 수동 작업 최소화하세요

**🎉 이 가이드로 Playwright 없이도 완벽한 블로그 이미지 자동 업데이트가 가능합니다!**