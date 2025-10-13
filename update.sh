#!/bin/bash

echo "🎯 청담재활 블로그 자동 업데이트 시작!"
echo

# Node.js 버전 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되지 않았습니다."
    echo "   https://nodejs.org에서 다운로드하세요."
    exit 1
fi

# 필요한 패키지 설치 확인
if [ ! -d "node_modules" ]; then
    echo "📦 필요한 패키지 설치 중..."
    npm install
fi

# 블로그 업데이트 실행
echo "🚀 블로그 업데이트 실행 중..."
node update-blog.js

echo
echo "✅ 완료! 브라우저에서 index.html을 열어 확인하세요."