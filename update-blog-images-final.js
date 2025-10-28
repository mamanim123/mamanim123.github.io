#!/usr/bin/env node

/**
 * 🎯 청담재활 블로그 이미지 완전 자동화 업데이트 스크립트
 * 
 * ⚠️ 중요: Playwright/Puppeteer 없이 작동합니다!
 * 📝 순수 HTTP 요청만 사용하여 이미지 추출
 * 🔒 파일명 중복 방지 (타임스탬프 + 해시)
 */

const ImageDownloadService = require('./image-download-service');
const fs = require('fs').promises;
const path = require('path');

class BlogImageUpdater {
    constructor() {
        this.service = new ImageDownloadService();
        this.blogUrls = [
            {
                url: 'https://blog.naver.com/chungdam311/223928716039',
                title: '청담재활 요리 체험 활동 시간',
                targetFile: 'blog-post-1-auto.png'
            },
            {
                url: 'https://blog.naver.com/chungdam311/223920577668',
                title: '청담재활 2분기 생신 잔치',
                targetFile: 'blog-post-2-auto.png'
            },
            {
                url: 'https://blog.naver.com/chungdam311/223898944941', 
                title: '청담재활 삼겹살 파티',
                targetFile: 'blog-post-3-auto.png'
            }
        ];
    }

    async updateAllImages() {
        console.log('🎯 블로그 이미지 전체 업데이트 시작!');
        console.log('💡 Playwright/Puppeteer 없이 HTTP 요청으로 처리됩니다.');
        
        const results = [];
        
        // 1. 이미지 추출 및 다운로드
        for (let i = 0; i < this.blogUrls.length; i++) {
            const blog = this.blogUrls[i];
            
            try {
                console.log(`\n📖 ${i+1}번 블로그 처리 중: ${blog.title}`);
                const result = await this.service.capturePostThumbnail(blog.url);
                
                if (result) {
                    results.push({
                        blog: blog,
                        thumbnailPath: result,
                        success: true
                    });
                    console.log(`✅ ${i+1}번 이미지 추출 완료: ${result}`);
                } else {
                    results.push({
                        blog: blog,
                        thumbnailPath: null,
                        success: false
                    });
                    console.log(`❌ ${i+1}번 이미지 추출 실패`);
                }
                
            } catch (error) {
                console.error(`❌ ${i+1}번 이미지 추출 오류:`, error.message);
                results.push({
                    blog: blog,
                    thumbnailPath: null,
                    success: false
                });
            }
        }
        
        // 2. 파일명 변경 (중복 방지)
        await this.copyImagesToStandardNames(results);
        
        // 3. HTML 업데이트  
        await this.updateHTML(results);
        
        console.log('\n🎉 모든 작업 완료!');
        this.printSummary(results);
    }

    async copyImagesToStandardNames(results) {
        console.log('\n📁 이미지 파일명 표준화 중...');
        
        for (const result of results) {
            if (result.success && result.thumbnailPath) {
                try {
                    // 썸네일 경로에서 실제 파일 찾기
                    const thumbnailDir = path.join(__dirname, 'images', 'thumbnails');
                    const files = await fs.readdir(thumbnailDir);
                    
                    // 가장 최근 파일 찾기 (타임스탬프 기준)
                    const latestFile = files
                        .filter(file => file.endsWith('.jpg'))
                        .sort((a, b) => b.localeCompare(a))[0];
                    
                    if (latestFile) {
                        const sourcePath = path.join(thumbnailDir, latestFile);
                        const targetPath = path.join(__dirname, 'images', result.blog.targetFile);
                        
                        // 기존 파일이 있으면 백업
                        if (await this.fileExists(targetPath)) {
                            const backupPath = targetPath.replace('.png', `-backup-${Date.now()}.png`);
                            await fs.copyFile(targetPath, backupPath);
                            console.log(`📦 기존 파일 백업: ${path.basename(backupPath)}`);
                        }
                        
                        // 새 파일 복사
                        await fs.copyFile(sourcePath, targetPath);
                        console.log(`✅ ${latestFile} → ${result.blog.targetFile}`);
                        
                        result.finalPath = targetPath;
                    }
                    
                } catch (error) {
                    console.error(`❌ 파일 복사 실패 (${result.blog.targetFile}):`, error.message);
                }
            }
        }
    }

    async updateHTML(results) {
        console.log('\n📝 HTML 파일 업데이트 중...');
        
        try {
            const htmlPath = path.join(__dirname, 'index.html');
            let html = await fs.readFile(htmlPath, 'utf8');
            
            // 각 블로그 포스트의 이미지 경로 업데이트
            for (const result of results) {
                if (result.success && result.finalPath) {
                    const filename = result.blog.targetFile;
                    
                    // 블로그 URL에 따라 특정 이미지 태그 찾아서 교체
                    const blogId = this.extractBlogId(result.blog.url);
                    const regex = new RegExp(
                        `(href="[^"]*${blogId}[^"]*"[\\s\\S]*?<img src=")([^"]*)(.*?")`,
                        'g'
                    );
                    
                    html = html.replace(regex, `$1./images/${filename}$3`);
                    console.log(`✅ HTML 업데이트: ${filename}`);
                }
            }
            
            await fs.writeFile(htmlPath, html);
            console.log('✅ HTML 파일 저장 완료');
            
        } catch (error) {
            console.error('❌ HTML 업데이트 실패:', error.message);
        }
    }

    extractBlogId(url) {
        const match = url.match(/\/([0-9]+)$/);
        return match ? match[1] : '';
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
        console.log('=' * 50);
        
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
        console.log('2. 이미지가 올바르게 표시되는지 검증');
        console.log('3. Git 커밋 및 푸시 (필요시)');
    }
}

// 스크립트 실행
if (require.main === module) {
    console.log('🎯 청담재활 블로그 이미지 자동 업데이트');
    console.log('⚠️  브라우저 종속성 없음 - HTTP 요청만 사용');
    console.log('');
    
    const updater = new BlogImageUpdater();
    updater.updateAllImages().catch(error => {
        console.error('💥 전체 작업 실패:', error.message);
        process.exit(1);
    });
}

module.exports = BlogImageUpdater;