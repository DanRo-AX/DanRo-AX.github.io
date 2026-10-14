// 서재 목록 — 새 책은 같은 형식(sections/anchors/cards/quiz) 파일을 추가하고 여기 한 줄 더한다.
export const CATEGORIES = [
  { id: 'data', label: 'Data Engineering', ko: '데이터 엔지니어링', desc: '데이터가 생겨서 쓸 수 있게 되기까지의 흐름' },
  { id: 'infra', label: 'Infrastructure', ko: '인프라', desc: '클라우드를 설계도로 다루는 법' },
  { id: 'cert', label: 'Certification', ko: '자격증', desc: '시험 범위를 그림과 문제로 정리' },
];

export const BOOKS = [
  {
    id: 'pl',
    cat: 'data',
    title: '실시간 데이터 파이프라인, 아무것도 몰라도 되는 입문',
    blurb: '종이 신문과 생중계로 시작해 Kafka·Flink·CDC 구조, 코드, AI에게 시킬 때 쓸 키워드까지.',
    date: '2026-10-14',
    minutes: 60,
    load: () => import('./pl.js'),
  },
  {
    id: 'tf',
    cat: 'infra',
    title: '테라폼, 클릭 대신 설계도로',
    blurb: '레고 설명서 비유로 시작해 plan 읽는 법, 지우기 방지, 바이브코딩 프롬프트까지.',
    date: '2026-10-14',
    minutes: 35,
    load: () => import('./tf.js'),
  },
  {
    id: 'adsp',
    cat: 'cert',
    title: 'ADsP 한 권 가이드북',
    blurb: '1·2·3과목 요약강의를 그림 51장, 암기 카드 100장, 문제 34개로.',
    date: '2026-10-14',
    minutes: 120,
    load: () => import('./adsp.js'),
  },
];
