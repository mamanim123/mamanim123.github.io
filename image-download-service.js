const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');

class ImageDownloadService {
    constructor() {
        this.thumbnailDir = path.join(__dirname, 'images', 'thumbnails');
        
        // 썸네일 디렉토리 확인
        if (!fs.existsSync(this.thumbnailDir)) {
            fs.mkdirSync(this.thumbnailDir, { recursive: true });
        }
        
        console.log('🖼️  이미지 다운로드 서비스 초기화 완료');
    }

    // URL을 해시로 변환하여 파일명 생성 (타임스탬프 포함으로 중복 방지)
    generateImageHash(url) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const urlHash = crypto.createHash('md5').update(url).digest('hex');
        return `${timestamp}-${urlHash.substring(0, 8)}`;
    }

    // 이미지가 이미 존재하는지 확인
    imageExists(url) {
        const hash = this.generateImageHash(url);
        const imagePath = path.join(this.thumbnailDir, `${hash}.jpg`);
        return fs.existsSync(imagePath);
    }

    // HTTP/HTTPS 요청으로 이미지 다운로드
    downloadImage(imageUrl, outputPath) {
        return new Promise((resolve, reject) => {
            const protocol = imageUrl.startsWith('https:') ? https : http;
            
            const request = protocol.get(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
                }
            }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                const fileStream = fs.createWriteStream(outputPath);
                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(outputPath);
                });

                fileStream.on('error', (error) => {
                    fs.unlink(outputPath, () => {}); // 실패한 파일 삭제
                    reject(error);
                });
            });

            request.on('error', (error) => {
                reject(error);
            });

            request.setTimeout(15000, () => {
                request.destroy();
                reject(new Error('이미지 다운로드 타임아웃'));
            });
        });
    }

    // 블로그 페이지에서 이미지 URL 추출
    async extractImageFromBlog(blogUrl) {
        return new Promise((resolve, reject) => {
            console.log(`🔍 블로그 페이지 분석: ${blogUrl}`);
            
            // 모바일 URL로 변환
            const mobileUrl = blogUrl.replace('blog.naver.com', 'm.blog.naver.com');
            
            const protocol = mobileUrl.startsWith('https:') ? https : http;
            
            const request = protocol.get(mobileUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
                }
            }, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                let html = '';
                response.on('data', (chunk) => {
                    html += chunk;
                });

                response.on('end', () => {
                    try {
                        const $ = cheerio.load(html);
                        const images = [];

                        // 본문 콘텐츠 영역에서 이미지 찾기
                        const contentSelectors = [
                            '.se-main-container img', // 스마트에디터 3.0
                            '.post-view img',         // 일반 포스트 뷰
                            '.entry-content img',     // 엔트리 콘텐츠
                            '#postViewArea img',      // 포스트 뷰 영역
                            '.post_ct img',           // 포스트 컨텐츠
                            '.se-component img',      // 스마트에디터 컴포넌트
                            '.se-image-resource img', // 이미지 리소스
                            'img'                     // 모든 이미지 (마지막 대안)
                        ];

                        for (const selector of contentSelectors) {
                            $(selector).each((index, element) => {
                                const src = $(element).attr('src');
                                const alt = $(element).attr('alt') || '';
                                const width = $(element).attr('width') || 0;
                                const height = $(element).attr('height') || 0;
                                
                                if (src && src.startsWith('http')) {
                                    // 네이버 이미지 서버만 필터링
                                    if (src.includes('blogfiles.naver.net') || 
                                        src.includes('phinf.pstatic.net') ||
                                        src.includes('postfiles.pstatic.net')) {
                                        
                                        // 아이콘, 프로필, 로고 등 제외
                                        if (!src.includes('profile') && 
                                            !src.includes('icon') && 
                                            !src.includes('logo') &&
                                            !src.includes('banner') &&
                                            !alt.includes('프로필') &&
                                            !alt.includes('아이콘') &&
                                            parseInt(width) !== 90 &&  // 90x90 아이콘 제외
                                            parseInt(height) !== 90) {
                                            
                                            let imageUrl = src;
                                            
                                            // 원본 크기 이미지로 요청
                                            if (imageUrl.includes('?type=w80_blur')) {
                                                imageUrl = imageUrl.replace('?type=w80_blur', '?type=w773');
                                            } else if (imageUrl.includes('type=w80')) {
                                                imageUrl = imageUrl.replace('type=w80', 'type=w773');
                                            } else if (!imageUrl.includes('?')) {
                                                imageUrl += '?type=w773';
                                            } else if (!imageUrl.includes('type=')) {
                                                imageUrl += '&type=w773';
                                            }
                                            
                                            images.push({
                                                src: imageUrl,
                                                original: src,
                                                width: parseInt(width) || 0,
                                                height: parseInt(height) || 0,
                                                alt: alt,
                                                index: index
                                            });
                                        }
                                    }
                                }
                            });
                            
                            // 이미지를 찾았으면 중단
                            if (images.length > 0) {
                                console.log(`✅ ${selector}에서 ${images.length}개 이미지 발견`);
                                break;
                            }
                        }

                        console.log(`📊 발견된 이미지: ${images.length}개`);
                        
                        if (images.length > 0) {
                            // 가장 큰 이미지 또는 첫 번째 본문 이미지 선택
                            let selectedImage = images[0]; // 기본값: 첫 번째 이미지
                            
                            // 크기 정보가 있는 경우, 가장 큰 이미지 선택
                            if (images.some(img => img.width > 0 && img.height > 0)) {
                                selectedImage = images.reduce((prev, current) => {
                                    const prevSize = (prev.width || 0) * (prev.height || 0);
                                    const currentSize = (current.width || 0) * (current.height || 0);
                                    return currentSize > prevSize ? current : prev;
                                });
                            }
                            
                            console.log(`🎯 선택된 이미지: ${selectedImage.src}`);
                            console.log(`   크기: ${selectedImage.width}x${selectedImage.height}`);
                            console.log(`   ALT: ${selectedImage.alt}`);
                            resolve(selectedImage.src);
                        } else {
                            console.log('⚠️  적절한 이미지를 찾을 수 없음');
                            resolve(null);
                        }
                    } catch (parseError) {
                        reject(new Error(`HTML 파싱 오류: ${parseError.message}`));
                    }
                });
            });

            request.on('error', (error) => {
                reject(new Error(`페이지 요청 오류: ${error.message}`));
            });

            request.setTimeout(15000, () => {
                request.destroy();
                reject(new Error('페이지 로딩 타임아웃'));
            });
        });
    }

    // 블로그 포스트에서 이미지 추출 및 저장
    async capturePostThumbnail(postUrl) {
        try {
            console.log(`🚀 이미지 추출 시작: ${postUrl}`);

            // 이미 존재하는 이미지 확인
            if (this.imageExists(postUrl)) {
                const hash = this.generateImageHash(postUrl);
                console.log(`✅ 캐시된 이미지 사용: ${hash}.jpg`);
                return `/images/thumbnails/${hash}.jpg`;
            }

            // 블로그에서 이미지 URL 추출
            const imageUrl = await this.extractImageFromBlog(postUrl);
            
            if (!imageUrl) {
                console.log('❌ 추출할 이미지가 없음');
                return null;
            }

            // 이미지 다운로드
            const hash = this.generateImageHash(postUrl);
            const outputPath = path.join(this.thumbnailDir, `${hash}.jpg`);
            
            console.log(`📥 이미지 다운로드 중: ${imageUrl}`);
            await this.downloadImage(imageUrl, outputPath);
            
            console.log(`✅ 이미지 저장 완료: ${hash}.jpg`);
            return `/images/thumbnails/${hash}.jpg`;

        } catch (error) {
            console.error(`❌ 이미지 추출 실패 (${postUrl}):`, error.message);
            return null;
        }
    }

    // 여러 포스트 처리
    async captureMultiplePosts(posts) {
        console.log(`📋 ${posts.length}개 포스트 이미지 추출 시작`);
        
        const results = [];
        
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            console.log(`\n진행률: ${i + 1}/${posts.length} - ${post.title.substring(0, 50)}...`);
            
            const thumbnailPath = await this.capturePostThumbnail(post.link);
            
            results.push({
                ...post,
                imageUrl: thumbnailPath
            });

            // 서버 부하 방지를 위한 딜레이
            if (i < posts.length - 1) {
                console.log('⏳ 2초 대기...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log('\n🎉 모든 이미지 추출 완료');
        return results;
    }

    // 호환성을 위한 더미 메소드들
    async initBrowser() { return true; }
    async closeBrowser() { return true; }
}

module.exports = ImageDownloadService;