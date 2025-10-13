#!/usr/bin/env node

const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');

/**
 * 청담재활주간보호센터 블로그 이미지 자동 크롭 도구
 * 
 * 사용법:
 * node auto-blog-images.js [blog-urls...]
 * 
 * 예시:
 * node auto-blog-images.js "https://blog.naver.com/chungdam311/223898944941" "https://blog.naver.com/chungdam311/223832675195"
 */

class BlogImageProcessor {
  constructor() {
    this.browser = null;
    this.imageDir = './images';
  }

  async init() {
    this.browser = await chromium.launch({ headless: true });
    console.log('🚀 브라우저 시작됨');
  }

  async processUrl(url, index) {
    const page = await this.browser.newPage();
    try {
      console.log(`📸 ${index + 1}번 블로그 포스트 처리 중...`);
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const html = await page.content();
      const $ = cheerio.load(html);
      // 1순위: og:image 메타태그에서 대표이미지 추출
      let imageUrl = $('meta[property="og:image"]').attr('content');
      // 2순위: 본문 첫 번째 이미지 (og:image 없을 때)
      if (!imageUrl) {
        imageUrl = $('.se-main-container img').first().attr('src') || $('#postViewArea img').first().attr('src');
      }
      // 3순위: 본문 두 번째 이미지 (첫 번째도 대표가 아닐 때)
      if (!imageUrl) {
        imageUrl = $('.se-main-container img').eq(1).attr('src') || $('#postViewArea img').eq(1).attr('src');
      }
      if (imageUrl) {
        const filename = `blog-post-${index + 1}-auto.png`;
        const filepath = path.join(this.imageDir, filename);
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        await fs.writeFile(filepath, response.data);
        console.log('대표이미지 저장 완료:', filepath);
        return filepath;
      } else {
        console.log('대표이미지를 찾을 수 없습니다.');
        return null;
      }
    } finally {
      await page.close();
    }
  }

  async cropCentralIllustration(screenshot) {
    const image = sharp(screenshot);
    const { width, height } = await image.metadata();
    
    // 중앙 일러스트 박스 위치 추정 (네이버 블로그 레이아웃 기준)
    const cropX = Math.round(width * 0.1);    // 좌측 10% 지점부터
    const cropY = Math.round(height * 0.35);  // 상단 35% 지점부터
    const cropWidth = Math.round(width * 0.8); // 전체 너비의 80%
    const cropHeight = Math.round(height * 0.4); // 전체 높이의 40%
    
    return await image
      .extract({ 
        left: cropX, 
        top: cropY, 
        width: cropWidth, 
        height: cropHeight 
      })
      .sharpen(1.2)                // 선명도 향상
      .modulate({ 
        brightness: 1.05,          // 밝기 5% 증가
        saturation: 1.1            // 채도 10% 증가
      })
      .png({ quality: 90 })        // 고품질 PNG
      .toBuffer();
  }

  async updateHTML(imagePaths) {
    console.log('📝 HTML 파일 업데이트 중...');
    
    const htmlPath = './index.html';
    let html = await fs.readFile(htmlPath, 'utf8');
    
    // 블로그 이미지 경로 업데이트
    imagePaths.forEach((imagePath, index) => {
      const filename = path.basename(imagePath);
      const oldPattern = new RegExp(`blog-post-${index + 1}-[^"]*\\.png`);
      html = html.replace(oldPattern, filename);
    });
    
    await fs.writeFile(htmlPath, html);
    console.log('✅ HTML 업데이트 완료');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔥 브라우저 종료됨');
    }
  }
}

// 메인 실행 함수
async function main() {
  const urls = process.argv.slice(2);
  
  if (urls.length === 0) {
    console.log(`
사용법: node auto-blog-images.js [blog-urls...]

예시:
node auto-blog-images.js \\
  "https://blog.naver.com/chungdam311/223898944941" \\
  "https://blog.naver.com/chungdam311/223832675195"

기본 URL들로 실행하려면: node auto-blog-images.js default
    `);
    return;
  }

  // 기본 URL 세트
  const defaultUrls = [
    "https://blog.naver.com/chungdam311/223898944941", // 삼겹살 파티
    "https://blog.naver.com/chungdam311/223832675195"  // 벚꽃 나들이
  ];

  const targetUrls = urls[0] === 'default' ? defaultUrls : urls;
  
  const processor = new BlogImageProcessor();
  
  try {
    await processor.init();
    
    console.log(`🎯 ${targetUrls.length}개 블로그 포스트 처리 시작`);
    
    const imagePaths = [];
    for (let i = 0; i < targetUrls.length; i++) {
      const imagePath = await processor.processUrl(targetUrls[i], i);
      imagePaths.push(imagePath);
    }
    
    await processor.updateHTML(imagePaths);
    
    console.log('🎉 모든 작업 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await processor.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BlogImageProcessor;