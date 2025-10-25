#!/usr/bin/env node

/**
 * 🚀 청담재활 블로그 효율적인 업데이트 스크립트
 * 
 * ✅ 새로운 글 1개만 처리 (기존 이미지 보존)
 * ✅ 순차적 번호 할당 (파일명 중복 없음)
 * ✅ HTML 자동 업데이트 (최신 3개만 표시)
 * ✅ HTTP 요청만 사용 (브라우저 없음)
 */

const ImageDownloadService = require('./image-download-service');
const fs = require('fs').promises;
const path = require('path');

class EfficientBlogUpdater {
    constructor() {
        this.service = new ImageDownloadService();
    }

    async updateWithLatestPost() {
        console.log('🚀 효율적인 블로그 업데이트 시작!');
        
        try {
            // 1. 현재 센터소식에 표시된 블로그 URL들 가져오기
            const currentBlogUrls = await this.getCurrentBlogUrls();
            console.log(`📋 현재 센터소식 글 개수: ${currentBlogUrls.length}`);
            
            // 2. RSS에서 최신 블로그 URL들 가져오기 (최대 5개)
            const latestBlogUrls = await this.getLatestBlogUrls(5);
            console.log(`🔗 RSS 최신 글 개수: ${latestBlogUrls.length}`);
            
            // 3. 새로운 글들만 찾기
            const newBlogUrls = latestBlogUrls.filter(url => !currentBlogUrls.includes(url));
            console.log(`🆕 새로운 글 개수: ${newBlogUrls.length}`);
            
            if (newBlogUrls.length === 0) {
                console.log('✅ 새로운 글이 없습니다. 업데이트 불필요');
                return;
            }
            
            // 4. 현재 최대 이미지 번호 확인
            const currentMaxNumber = await this.getCurrentMaxImageNumber();
            let nextNumber = currentMaxNumber + 1;
            console.log(`📊 현재 최대 번호: ${currentMaxNumber}, 다음 번호부터: ${nextNumber}`);
            
            // 5. 새로운 글들의 이미지만 다운로드 (블로그 번호 기반 파일명)
            const newImageFiles = [];
            for (const blogUrl of newBlogUrls) {
                const blogId = this.extractBlogId(blogUrl);
                const newImageFile = `${blogId}-청담재활.png`;
                console.log(`📥 새 이미지 다운로드 중: ${newImageFile} (${blogUrl})`);
                
                const result = await this.service.capturePostThumbnail(blogUrl);
                if (result) {
                    // 썸네일을 블로그 번호로 복사
                    await this.copyThumbnailToTarget(result, newImageFile);
                    newImageFiles.push(newImageFile);
                    console.log(`✅ 새 이미지 생성 완료: ${newImageFile}`);
                } else {
                    console.error(`❌ 이미지 다운로드 실패: ${blogUrl}`);
                }
            }
            
            // 6. HTML 업데이트 (최신 3개만 표시)
            await this.updateHtmlWithLatestPosts();
            console.log('✅ HTML 업데이트 완료');
            
            // 7. 완료 보고
            console.log('\n🎉 효율적인 업데이트 완료!');
            console.log(`📁 생성된 파일: ${newImageFiles.join(', ')}`);
            console.log(`📄 HTML 업데이트: 최신 3개 글 표시`);
            console.log(`⚡ 처리 시간: ${newImageFiles.length}개 이미지만 다운로드`);
            
        } catch (error) {
            console.error('❌ 업데이트 실패:', error.message);
            throw error;
        }
    }

    async getCurrentBlogUrls() {
        try {
            const htmlPath = 'index.html';
            const htmlContent = await fs.readFile(htmlPath, 'utf8');
            
            // HTML에서 현재 블로그 URL들 추출
            const urlRegex = /href="(https:\/\/blog\.naver\.com\/chungdam311\/\d+)"/g;
            const urls = [];
            let match;
            
            while ((match = urlRegex.exec(htmlContent)) !== null) {
                urls.push(match[1]);
            }
            
            return urls;
        } catch (error) {
            console.error('현재 블로그 URL 추출 실패:', error.message);
            return [];
        }
    }

    async getLatestBlogUrls(maxCount = 5) {
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        try {
            const response = await axios.get('https://rss.blog.naver.com/chungdam311.xml');
            const $ = cheerio.load(response.data, { xmlMode: true });
            
            const urls = [];
            $('item').each((index, element) => {
                if (index < maxCount) {
                    const link = $(element).find('link').text();
                    urls.push(link.replace('?fromRss=true&trackingCode=rss', ''));
                }
            });
            
            return urls;
        } catch (error) {
            console.error('RSS 피드 읽기 실패:', error.message);
            throw error;
        }
    }

    async getLatestBlogUrl() {
        const urls = await this.getLatestBlogUrls(1);
        return urls[0] || '';
    }

    async getCurrentMaxImageNumber() {
        try {
            const files = await fs.readdir('images');
            const blogPostFiles = files.filter(file => 
                file.match(/^blog-post-\d+-auto\.png$/)
            );
            
            if (blogPostFiles.length === 0) {
                return 0; // 첫 번째 파일이면 0 반환
            }
            
            const numbers = blogPostFiles.map(file => {
                const match = file.match(/blog-post-(\d+)-auto\.png/);
                return match ? parseInt(match[1]) : 0;
            });
            
            return Math.max(...numbers);
        } catch (error) {
            console.error('이미지 번호 확인 실패:', error.message);
            return 0;
        }
    }

    async copyThumbnailToTarget(thumbnailPath, targetFile) {
        try {
            const sourcePath = path.join('images', 'thumbnails', path.basename(thumbnailPath));
            const targetPath = path.join('images', targetFile);
            
            await fs.copyFile(sourcePath, targetPath);
            console.log(`📋 이미지 복사 완료: ${targetFile}`);
        } catch (error) {
            console.error('이미지 복사 실패:', error.message);
            throw error;
        }
    }

    async updateHtmlWithLatestPosts() {
        try {
            const htmlPath = 'index.html';
            let htmlContent = await fs.readFile(htmlPath, 'utf8');
            
            // RSS에서 최신 3개 글 정보 가져오기
            const latestPosts = await this.getLatestPostsInfo(3);
            
            console.log(`📊 표시할 블로그 글 개수: ${latestPosts.length}`);
            
            // HTML의 센터 소식 섹션 정확히 교체
            const newBlogSection = this.generateBlogSectionWithBlogIds(latestPosts);
            
            // 더 정확한 패턴으로 블로그 섹션 찾기
            const blogSectionPattern = /<div class="programs-container" id="blog-posts">([\s\S]*?)<\/div>\s*<\/div>/;
            const match = htmlContent.match(blogSectionPattern);
            
            if (match) {
                // 전체 매치를 새로운 섹션으로 교체
                const fullMatch = match[0];
                const replacement = newBlogSection + '\n            </div>';
                htmlContent = htmlContent.replace(fullMatch, replacement);
                
                await fs.writeFile(htmlPath, htmlContent, 'utf8');
                console.log('✅ HTML 업데이트 완료');
            } else {
                throw new Error('HTML 블로그 섹션을 찾을 수 없습니다');
            }
            
        } catch (error) {
            console.error('HTML 업데이트 실패:', error.message);
            throw error;
        }
    }

    async getLatestPostsInfo(maxCount) {
        // RSS에서 최신 글 정보 가져오기
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        try {
            const response = await axios.get('https://rss.blog.naver.com/chungdam311.xml');
            const $ = cheerio.load(response.data, { xmlMode: true });
            
            const posts = [];
            $('item').each((index, element) => {
                if (index < maxCount) {
                    const title = $(element).find('title').text();
                    const link = $(element).find('link').text().replace('?fromRss=true&trackingCode=rss', '');
                    const pubDate = new Date($(element).find('pubDate').text());
                    const blogId = this.extractBlogId(link);
                    
                    posts.push({
                        title: title,
                        link: link,
                        date: pubDate.toISOString().split('T')[0].replace(/-/g, '.'),
                        blogId: blogId
                    });
                }
            });
            
            return posts;
        } catch (error) {
            console.error('포스트 정보 가져오기 실패:', error.message);
            return [];
        }
    }

    extractBlogId(blogUrl) {
        const match = blogUrl.match(/\/(\d+)$/);
        return match ? match[1] : '';
    }

    generateBlogSection(posts, displayNumbers) {
        const blogCards = posts.map((post, index) => {
            const imageNumber = displayNumbers[index];
            const imagePath = `./images/blog-post-${imageNumber}-auto.png`;
            
            return `
                <a href="${post.link}" target="_blank" class="program-card blog-post clickable-card">
                    <div class="blog-image">
                        <img src="${imagePath}" alt="${post.title}" loading="lazy">
                    </div>
                    <div class="blog-content">
                        <h3>${post.title}</h3>
                        <p class="blog-date">${post.date}</p>
                        <span class="blog-link">
                            자세히 보기 <i class="fas fa-external-link-alt"></i>
                        </span>
                    </div>
                </a>`;
        }).join('\n');
        
        return `<div class="programs-container" id="blog-posts">${blogCards}\n            </div>`;
    }

    generateBlogSectionWithBlogIds(posts) {
        const blogCards = posts.map((post) => {
            const imagePath = `./images/${post.blogId}-청담재활.png`;
            
            return `
                <a href="${post.link}" target="_blank" class="program-card blog-post clickable-card">
                    <div class="blog-image">
                        <img src="${imagePath}" alt="${post.title}" loading="lazy">
                    </div>
                    <div class="blog-content">
                        <h3>${post.title}</h3>
                        <p class="blog-date">${post.date}</p>
                        <span class="blog-link">
                            자세히 보기 <i class="fas fa-external-link-alt"></i>
                        </span>
                    </div>
                </a>`;
        }).join('\n');
        
        return `<div class="programs-container" id="blog-posts">${blogCards}\n            </div>`;
    }
}

// 실행
async function main() {
    const updater = new EfficientBlogUpdater();
    try {
        await updater.updateWithLatestPost();
    } catch (error) {
        console.error('메인 실행 실패:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = EfficientBlogUpdater;