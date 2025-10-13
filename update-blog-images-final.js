#!/usr/bin/env node

/**
 * 🎯 청담재활 블로그 이미지 완전 자동화 업데이트 스크립트 (v3 - 최종)
 * 
 * 📝 순수 HTTP 요청 및 RSS 파싱을 사용하여 최신 블로그 글 자동 업데이트
 * 🔒 파일명 중복 방지 (타임스탬프 + 해시)
 */

const ImageDownloadService = require('./image-download-service');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

const CONFIG = {
    BLOG_RSS_URL: 'https://rss.blog.naver.com/chungdam311.xml',
    MAX_POSTS: 3,
};

class BlogImageUpdater {
    constructor() {
        this.service = new ImageDownloadService();
        this.blogPosts = []; // 동적으로 채워질 배열
    }

    // RSS 피드에서 최신 블로그 포스트 가져오기
    async fetchLatestPostsFromRSS() {
        console.log('📡 RSS 피드에서 최신 블로그 포스트를 가져옵니다...');
        try {
            const response = await axios.get(CONFIG.BLOG_RSS_URL);
            const xmlData = response.data;
            
            const parser = new xml2js.Parser();
            const result = await parser.parseStringPromise(xmlData);
            
            const items = result.rss.channel[0].item || [];
            
            this.blogPosts = items.slice(0, CONFIG.MAX_POSTS).map((item, index) => {
                const postUrl = item.link[0];
                // URL에서 쿼리 파라미터 제거
                const cleanUrl = postUrl.split('?')[0];
                const postId = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1);
                return {
                    url: postUrl,
                    title: item.title[0].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
                    targetFile: `청담재활-${postId}.png` // 수정된 파일명 규칙
                };
            });

            console.log(`✅ ${this.blogPosts.length}개의 최신 포스트를 가져왔습니다:`);
            this.blogPosts.forEach((post, i) => {
                console.log(`   ${i + 1}. ${post.title} (${post.targetFile})`);
            });

        } catch (error) {
            console.error('❌ RSS 피드를 가져오는 데 실패했습니다:', error.message);
            throw new Error('RSS 피드 처리 중 오류 발생');
        }
    }

    async updateAllImages() {
        console.log('🎯 블로그 이미지 전체 업데이트 시작!');
        console.log('💡 Playwright/Puppeteer 없이 HTTP 요청으로 처리됩니다.');
        
        // 1. RSS에서 최신 글 정보 가져오기
        await this.fetchLatestPostsFromRSS();
        if (this.blogPosts.length === 0) {
            console.log('⚠️ 업데이트할 블로그 글이 없습니다. 작업을 중단합니다.');
            return;
        }

        const results = [];
        
        // 2. 이미지 추출 및 다운로드
        for (let i = 0; i < this.blogPosts.length; i++) {
            const blog = this.blogPosts[i];
            
            try {
                console.log(`\n📖 ${i+1}번 블로그 처리 중: ${blog.title}`);
                const thumbnailPath = await this.service.capturePostThumbnail(blog.url);

                if (thumbnailPath) {
                    // thumbnailPath는 이미 전체 파일 경로를 포함 (예: /images/thumbnails/xxx.jpg)
                    const fullPath = path.join(__dirname, thumbnailPath.replace(/^\//, ''));
                    results.push({
                        blog: blog,
                        sourceThumbnail: fullPath,
                        success: true
                    });
                    console.log(`✅ ${i+1}번 이미지 추출 완료: ${fullPath}`);
                } else {
                    throw new Error('이미지 추출 결과가 없습니다.');
                }

            } catch (error) {
                console.error(`❌ ${i+1}번 이미지 추출 오류:`, error.message);
                results.push({ blog: blog, sourceThumbnail: null, success: false });
            }
        }
        
        // 3. 표준 파일명으로 이미지 복사
        await this.copyImagesToStandardNames(results);
        
        // 4. HTML 업데이트
        await this.updateHTML(results);
        
        console.log('\n🎉 모든 작업 완료!');
        this.printSummary(results);
    }

    async findLatestThumbnail(thumbnailDir) {
        const files = await fs.readdir(thumbnailDir);
        const latestFile = files
            .filter(file => file.endsWith('.jpg') || file.endsWith('.png'))
            .sort((a, b) => b.localeCompare(a))[0];
        return latestFile ? path.join(thumbnailDir, latestFile) : null;
    }

    async copyImagesToStandardNames(results) {
        console.log('\n📁 이미지 파일명 표준화 중...');
        
        for (const result of results) {
            if (result.success && result.sourceThumbnail) {
                try {
                    const targetPath = path.join(__dirname, 'images', result.blog.targetFile);
                    
                    if (await this.fileExists(targetPath)) {
                        const backupPath = targetPath.replace('.png', `-backup-${Date.now()}.png`);
                        await fs.copyFile(targetPath, backupPath);
                        console.log(`📦 기존 파일 백업: ${path.basename(backupPath)}`);
                    }
                    
                    await fs.copyFile(result.sourceThumbnail, targetPath);
                    console.log(`✅ ${path.basename(result.sourceThumbnail)} → ${result.blog.targetFile}`);
                    
                    result.finalPath = targetPath;
                    
                } catch (error) {
                    console.error(`❌ 파일 복사 실패 (${result.blog.targetFile}):`, error.message);
                    result.success = false;
                }
            }
        }
    }

    async updateHTML(results) {
        console.log('\n📝 HTML 파일 업데이트 중...');
        try {
            const htmlPath = path.join(__dirname, 'index.html');
            let html = await fs.readFile(htmlPath, 'utf8');
            let modified = false;

            const postElements = html.match(/<a href="https:\/\/blog\.naver\.com\/chungdam311\/[0-9]+"[^>]*class="program-card blog-post clickable-card"[^>]*>[\s\S]*?<\/a>/g);

            if (postElements && postElements.length === results.length) {
                results.forEach((result, i) => {
                    if (result.success) {
                        let postHtml = postElements[i];
                        postHtml = postHtml.replace(/href="[^"]+"/, `href="${result.blog.url}"`);
                        postHtml = postHtml.replace(/src="[^"]+"/, `src="./images/${result.blog.targetFile}"`);
                        postHtml = postHtml.replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${result.blog.title}</h3>`);
                        
                        if (postElements[i] !== postHtml) {
                            html = html.replace(postElements[i], postHtml);
                            modified = true;
                            console.log(`✅ HTML 업데이트: ${i + 1}번째 블로그 카드`);
                        }
                    }
                });
            }

            if (modified) {
                await fs.writeFile(htmlPath, html);
                console.log('✅ HTML 파일 저장 완료');
            } else {
                console.log('ℹ️ HTML 파일에 변경할 내용이 없습니다.');
            }
            
        } catch (error) {
            console.error('❌ HTML 업데이트 실패:', error.message);
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    printSummary(results) {
        console.log('\n📋 작업 결과 요약:');
        console.log('='.repeat(50));
        
        results.forEach((result, index) => {
            const status = result.success ? '✅ 성공' : '❌ 실패';
            console.log(`${index + 1}. ${result.blog.title}`);
            console.log(`   상태: ${status}`);
            if (result.success) {
                console.log(`   파일: ${result.blog.targetFile}`);
            }
            console.log('');
        });
        
        const successCount = results.filter(r => r.success).length;
        console.log(`🎯 총 ${results.length}개 중 ${successCount}개 성공`);
        
        if (successCount === results.length) {
            console.log('🎉 모든 이미지 업데이트 완료!');
        } else {
            console.log('⚠️  일부 이미지 업데이트 실패. 수동 확인 필요.');
        }
        
        console.log('\n📍 다음 단계:');
        console.log('1. 브라우저에서 index.html 파일 열어서 확인');
        console.log('2. Git 커밋 및 푸시 (필요시)');
    }
}

// 스크립트 실행
if (require.main === module) {
    console.log('🎯 청담재활 블로그 자동 업데이트 (RSS 버전)');
    console.log('⚠️  브라우저 종속성 없음 - HTTP 요청 및 RSS 파싱 사용');
    console.log('');
    
    const updater = new BlogImageUpdater();
    updater.updateAllImages().catch(error => {
        console.error('💥 전체 작업 실패:', error.message);
        process.exit(1);
    });
}

module.exports = BlogImageUpdater;
