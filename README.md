# 복실코인 (BXC)

고양이 "복실이"를 테마로 한 웹 기반 온라인 경제 게임입니다.

> ⚠️ 이 프로젝트는 순수한 게임입니다. 실제 암호화폐가 아니며, 실제 돈 입출금 및 블록체인은 없습니다.

## 기술 스택

- **프론트엔드**: HTML, CSS, JavaScript
- **백엔드**: Node.js, Express, Socket.IO
- **데이터베이스**: JSON 파일 (SQLite/PostgreSQL로 확장 가능)

## 실행 방법

```bash
cd boksil-coin
npm install
npm start
```

브라우저에서 http://localhost:3000 접속

개발 모드 (파일 변경 시 자동 재시작):

```bash
npm run dev
```

## 핵심 기능

- **실시간 공통 시세** — 모든 플레이어가 동일한 BXC 가격을 봅니다
- **시세 이벤트** — 일반 변동, 대형 호재/악재, TO THE MOON, 상장폐지 위기, 100배 펌프, 러그풀
- **거래 시스템** — 현금으로 BXC 매수/매도 (100%, 50%, 25%, 10%)
- **복실이 상점** — 현금으로 복실이 아이템 구매
- **컬렉션** — 보유 여부, 달성률, 희귀도 표시
- **현금 랭킹** — 실시간 순위표

## 게임 규칙

- 시작 자금: ₩10,000,000
- BXC 최저가: ₩1,000
- 닉네임: 2~12자 (한글, 영문, 숫자, 밑줄)

## 프로젝트 구조

```
boksil-coin/
├── server/
│   ├── index.js        # Express + Socket.IO 서버
│   ├── db.js           # 데이터 저장소
│   └── priceEngine.js  # 시세 엔진
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── app.js
│       └── chart.js
├── data/               # 게임 데이터 (자동 생성)
└── package.json
```
