// 새 블로그 글의 이미지를 생성하는 간단한 스크립트
const sharp = require('sharp');

async function createBirthdayImage() {
    try {
        // 기본 이미지 템플릿 생성 (생신잔치 테마)
        const width = 400;
        const height = 280;
        
        const svgImage = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#ffa726;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad)"/>
            <circle cx="200" cy="100" r="40" fill="#fff" opacity="0.9"/>
            <text x="200" y="110" font-family="Arial, sans-serif" font-size="24" fill="#333" text-anchor="middle">🎂</text>
            <text x="200" y="160" font-family="Arial, sans-serif" font-size="18" fill="#fff" text-anchor="middle" font-weight="bold">청담재활</text>
            <text x="200" y="185" font-family="Arial, sans-serif" font-size="16" fill="#fff" text-anchor="middle">2분기 생신잔치</text>
            <text x="200" y="210" font-family="Arial, sans-serif" font-size="14" fill="#fff" text-anchor="middle" opacity="0.9">2025.07.03</text>
        </svg>
        `;

        await sharp(Buffer.from(svgImage))
            .png()
            .toFile('./images/blog-post-4-birthday.png');
        
        console.log('✅ 생신잔치 이미지 생성 완료: blog-post-4-birthday.png');
    } catch (error) {
        console.error('❌ 이미지 생성 실패:', error);
    }
}

createBirthdayImage();