#!/usr/bin/env node
/**
 * 청담재활 블로그 업데이트 자동화 스크립트
 * 사용법: node update-blog.js
 * 
 * 이 스크립트는:
 * 1. 네이버 블로그 RSS에서 최신 3개 글 가져오기
 * 2. 각 글의 대표 이미지 스크린샷 촬영
 * 3. 이미지 크롭 및 최적화
 * 4. index.html 파일 자동 업데이트
 * 5. Git 커밋 준비
 */

const xml2js = require('xml2js');
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// 설정
const CONFIG = {
    BLOG_RSS_URL: 'https://rss.blog.naver.com/chungdam311.xml',
    MAX_POSTS: 3,
    IMAGE_WIDTH: 400,
    IMAGE_HEIGHT: 280,
    CROP_SELECTOR: '.se-main-container', // 네이버 블로그 메인 콘텐츠 영역
    BACKUP_IMAGE: './images/blog-post-2-improved.png' // 대체 이미지
};

class BlogUpdater {
    constructor() {
        this.posts = [];
        this.browser = null;
    }

    // RSS에서 최신 블로그 포스트 가져오기
    async fetchLatestPosts() {
        console.log('📡 RSS에서 최신 블로그 포스트 가져오는 중...');
        
        try {
            const response = await fetch(CONFIG.BLOG_RSS_URL);
            const xmlData = await response.text();
            
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(xmlData);
            
            const items = result.rss.channel[0].item || [];
            
            this.posts = items.slice(0, CONFIG.MAX_POSTS).map((item, index) => ({
                title: this.cleanTitle(item.title[0]),
                link: item.link[0],
                pubDate: this.formatDate(item.pubDate[0]),
                description: item.description ? item.description[0] : '',
                imageFileName: `blog-post-${index + 1}-auto.png`,
                index: index + 1
            }));
            
            console.log(`✅ ${this.posts.length}개 포스트 가져옴:`);
            this.posts.forEach((post, i) => {
                console.log(`   ${i + 1}. ${post.title} (${post.pubDate})`);
            });
            
        } catch (error) {
            console.error('❌ RSS 가져오기 실패:', error);
            throw error;
        }
    }

    // 제목 정리 (HTML 태그 제거 등)
    cleanTitle(title) {
        return title.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
    }

    // 날짜 형식 변환
    formatDate(dateString) {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    }

    // 블로그 포스트 스크린샷 촬영
    async capturePostImages() {
        console.log('📸 블로그 포스트 이미지 촬영 중...');
        
        this.browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const context = await this.browser.newContext({
            viewport: { width: 1200, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });

        for (const post of this.posts) {
            try {
                console.log(`   📷 ${post.title} 스크린샷 촬영...`);
                
                const page = await context.newPage();
                await page.goto(post.link, { waitUntil: 'networkidle' });
                await page.waitForTimeout(3000);

                // 블로그 메인 콘텐츠 영역 스크린샷
                const element = await page.$(CONFIG.CROP_SELECTOR);
                if (element) {
                    const screenshot = await element.screenshot();
                    await this.processImage(screenshot, post.imageFileName);
                } else {
                    // 대체 이미지 사용
                    console.log(`   ⚠️  ${post.title}: 콘텐츠 영역 찾을 수 없음, 대체 이미지 사용`);
                    await this.useBackupImage(post.imageFileName);
                }
                
                await page.close();
                
            } catch (error) {
                console.error(`   ❌ ${post.title} 이미지 처리 실패:`, error);
                await this.useBackupImage(post.imageFileName);
            }
        }
        
        await this.browser.close();
    }

    // 이미지 크롭 및 최적화
    async processImage(screenshot, fileName) {
        try {
            await sharp(screenshot)
                .resize(CONFIG.IMAGE_WIDTH, CONFIG.IMAGE_HEIGHT, {
                    fit: 'cover',
                    position: 'center'
                })
                .png({ quality: 90 })
                .toFile(path.join('./images', fileName));
                
            console.log(`   ✅ ${fileName} 생성 완료`);
        } catch (error) {
            console.error(`   ❌ ${fileName} 처리 실패:`, error);
            await this.useBackupImage(fileName);
        }
    }

    // 대체 이미지 사용
    async useBackupImage(fileName) {
        try {
            await fs.copyFile(CONFIG.BACKUP_IMAGE, path.join('./images', fileName));
            console.log(`   🔄 ${fileName} 대체 이미지 사용`);
        } catch (error) {
            console.error(`   ❌ 대체 이미지 복사 실패:`, error);
        }
    }

    // HTML 파일 업데이트
    async updateHtmlFile() {
        console.log('📝 index.html 파일 업데이트 중...');
        
        try {
            const htmlContent = await fs.readFile('./index.html', 'utf8');
            
            // 블로그 카드 HTML 생성 (클릭 가능한 전체 카드)
            const blogCardsHtml = this.posts.map(post => `
                <a href="${post.link}" target="_blank" class="program-card blog-post clickable-card">
                    <div class="blog-image">
                        <img src="./images/${post.imageFileName}" alt="${post.title}" loading="lazy">
                    </div>
                    <div class="blog-content">
                        <h3>${post.title}</h3>
                        <p class="blog-date">${post.pubDate}</p>
                        <span class="blog-link">
                            자세히 보기 <i class="fas fa-external-link-alt"></i>
                        </span>
                    </div>
                </a>`).join('\n                ');

            // HTML에서 블로그 섹션 교체
            const updatedHtml = htmlContent.replace(
                /<div class="programs-container" id="blog-posts">[\s\S]*?<\/div>\s*<\/div>/,
                `<div class="programs-container" id="blog-posts">
                ${blogCardsHtml}
            </div>
            
            <div class="blog-error" id="blog-error" style="display: none;">
                <p>⚠️ 소식을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.</p>
            </div>`
            );

            await fs.writeFile('./index.html', updatedHtml, 'utf8');
            console.log('✅ index.html 업데이트 완료');
            
        } catch (error) {
            console.error('❌ HTML 파일 업데이트 실패:', error);
            throw error;
        }
    }

    // Git 상태 확인 및 커밋 준비
    async prepareGitCommit() {
        console.log('🔄 Git 커밋 준비 중...');
        
        try {
            const { execSync } = require('child_process');
            
            // Git 상태 확인
            const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            
            if (gitStatus.trim()) {
                console.log('📋 변경된 파일들:');
                console.log(gitStatus);
                
                console.log('');
                console.log('🚀 Git 커밋을 위해 다음 명령어를 실행하세요:');
                console.log('   git add .');
                console.log(`   git commit -m "블로그 업데이트: ${this.posts[0].title}"`);
                console.log('   git push origin test');
            } else {
                console.log('📝 변경사항이 없습니다.');
            }
            
        } catch (error) {
            console.log('⚠️  Git 상태를 확인할 수 없습니다. 수동으로 커밋해주세요.');
        }
    }

    // 메인 실행 함수
    async run() {
        console.log('🎯 청담재활 블로그 자동 업데이트 시작!\n');
        
        try {
            await this.fetchLatestPosts();
            await this.capturePostImages();
            await this.updateHtmlFile();
            await this.prepareGitCommit();
            
            console.log('\n🎉 블로그 업데이트 완료!');
            console.log('   브라우저에서 index.html을 열어 결과를 확인하세요.');
            
        } catch (error) {
            console.error('\n💥 업데이트 실패:', error);
            process.exit(1);
        }
    }
}

// 스크립트 실행
if (require.main === module) {
    const updater = new BlogUpdater();
    updater.run();
}

module.exports = BlogUpdater;