// 서재 목록 — 새 책은 같은 형식(sections/anchors/cards/quiz) 파일을 추가하고 여기 한 줄 더한다.
export const CATEGORIES = [
  { id: 'data', label: 'Data Engineering', ko: '데이터 엔지니어링', desc: '데이터가 생겨서 쓸 수 있게 되기까지의 흐름' },
  { id: 'infra', label: 'Infrastructure', ko: '인프라', desc: '클라우드를 설계도로 다루는 법' },
  { id: 'cert', label: 'Certification', ko: '자격증', desc: '시험 범위를 그림과 문제로 정리' },
];

// 아직 안 쓴 책 — 카드 자리만 채우는 더미(누르면 「준비 중」).
export const DUMMIES = [
  { id: 'dbt', en: { title: 'dbt: Building Data Models', blurb: "A few SQL files that build the tables refreshed every day." }, kw: 'dbt', cat: 'data', title: 'dbt로 데이터 모델 만들기', blurb: 'SQL 파일 몇 개로 매일 도는 데이터 표를 만드는 법.', date: '준비 중' },
  { id: 'airflow', en: { title: 'Airflow: Ordering Your Jobs', blurb: "“Run B after A” — automatically, every morning." }, kw: 'Airflow', cat: 'data', title: 'Airflow, 작업 순서 정하기', blurb: '「A 끝나면 B」를 매일 새벽 자동으로.', date: '준비 중' },
  { id: 'bq', en: { title: 'BigQuery Without the Surprise Bill', blurb: "Cut scanned bytes with partitions and clustering." }, kw: 'BigQuery', cat: 'data', title: 'BigQuery 비용 안 터지게 쓰기', blurb: '파티션·클러스터로 스캔량 줄이기.', date: '준비 중' },
  { id: 'k8s', en: { title: 'Kubernetes: Dispatching Containers', blurb: "How a crashed server is brought back on its own." }, kw: 'Kubernetes', cat: 'infra', title: 'Kubernetes, 컨테이너 배차 시스템', blurb: '서버가 죽어도 알아서 다시 띄우는 원리.', date: '준비 중' },
  { id: 'iam', en: { title: 'Cloud IAM on One Page', blurb: "Who can do what — with least privilege." }, kw: 'IAM', cat: 'infra', title: '클라우드 권한(IAM) 한 장 정리', blurb: '누가 무엇을 할 수 있는지 최소 권한으로.', date: '준비 중' },
  { id: 'cicd', en: { title: 'CI/CD: Deploying Without a Button', blurb: "Test, build, and deploy chained to a single push." }, kw: 'CI/CD', cat: 'infra', title: 'CI/CD, 버튼 없이 배포하기', blurb: 'push 하면 테스트·빌드·배포가 이어지는 길.', date: '준비 중' },
  { id: 'sqld', en: { title: 'SQLD Study Guide', blurb: "Joins, subqueries, and window functions in diagrams." }, kw: 'SQLD', cat: 'cert', title: 'SQLD 한 권 가이드북', blurb: '조인·서브쿼리·윈도우 함수를 그림으로.', date: '준비 중' },
  { id: 'jungbo', en: { title: 'Information Processing Engineer (Practical) Summary', blurb: "The code-reading questions that keep coming back." }, kw: '정보처리기사', cat: 'cert', title: '정보처리기사 실기 요약', blurb: '자주 나오는 코드 읽기 문제 모음.', date: '준비 중' },
  { id: 'aws-saa', en: { title: 'AWS SAA: Service Map', blurb: "Only the services the exam asks about, on one page." }, kw: 'AWS SAA', cat: 'cert', title: 'AWS SAA 핵심 서비스 지도', blurb: '시험에 나오는 서비스만 골라 한 장으로.', date: '준비 중' },
];

export const BOOKS = [
  {
    id: 'pl', en: { title: 'Real-Time Data Pipelines', blurb: 'From “why” to failure cases: Kafka, Flink, CDC, storage — with numbers, code, and how to prompt an AI.' },
    kw: 'Kafka · Flink',
    cat: 'data',
    title: '실시간 데이터 파이프라인',
    blurb: '왜 필요한지부터 실패 케이스까지 — Kafka·Flink·CDC·저장소를 숫자 예시, 코드, AI에게 시키는 법과 함께.',
    date: '2026-10-14',
    minutes: 60,
    load: () => import('./pl.js'),
  },
  {
    id: 'tf', en: { title: 'Terraform: Blueprints Instead of Clicks', blurb: 'Reading a plan, state and drift, safety rails, adoption steps — with code and AI prompt keywords.' },
    kw: 'Terraform',
    cat: 'infra',
    title: '테라폼, 클릭 대신 설계도로',
    blurb: 'plan 읽는 법, 장부와 손수정 적발, 안전장치, 도입 순서 — 코드와 AI 프롬프트 키워드까지.',
    date: '2026-10-14',
    minutes: 35,
    load: () => import('./tf.js'),
  },
  {
    id: 'adsp', en: { title: 'ADsP Study Guide', blurb: "Subjects 1–3 as 51 figures, 100 flashcards, and 34 questions." },
    kw: 'ADsP',
    cat: 'cert',
    title: 'ADsP 한 권 가이드북',
    blurb: '1·2·3과목 요약강의를 그림 51장, 암기 카드 100장, 문제 34개로.',
    date: '2026-10-14',
    minutes: 120,
    load: () => import('./adsp.js'),
  },
];
