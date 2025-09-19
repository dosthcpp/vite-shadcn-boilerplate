import { StudySchedule, DailyPlan, SubjectProgress } from '@/types/study';

export const subjects: SubjectProgress[] = [
  {
    name: '신용분석사 2부',
    current: 18, // 16강 + 17~18강 완료
    total: 50,
    color: 'bg-blue-500',
    description: '신용분석사 시험 준비 (10/25 시험)'
  },
  {
    name: '선형대수학 KOCW',
    current: 12, // 11강 + 12강 완료
    total: 24,
    color: 'bg-green-500',
    description: 'AI대학원 준비 - 선형대수학 (10/19까지)'
  },
  {
    name: '미적분학',
    current: 0,
    total: 21,
    color: 'bg-purple-500',
    description: 'AI대학원 준비 - 미적분학 (10/19까지)'
  },
  {
    name: '확률과통계 KOCW',
    current: 1,
    total: 12, // 2~13강만 수강
    color: 'bg-orange-500',
    description: 'AI대학원 준비 - 확률과통계 (10/19까지)'
  }
];

export const dailyPlans: DailyPlan[] = [
  {
    date: '2025-09-17',
    dayOfWeek: '수',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-19-20',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 19~20강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'linear-13',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 13강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-09-18',
    dayOfWeek: '목',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-21-22',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 21~22강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-1-5-1-6',
        subject: '미적분학',
        type: 'lecture',
        content: '1.5 연속 + 1.6 무한대와 관련된 극한',
        lectures: '2챕터',
        duration: 0.93
      }
    ]
  },
  {
    date: '2025-09-19',
    dayOfWeek: '금',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-23-24',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 23~24강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-2-1',
        subject: '미적분학',
        type: 'lecture',
        content: '2.1 미분 계수와 변화율',
        lectures: '1챕터',
        duration: 0.54
      }
    ]
  },
  {
    date: '2025-09-20',
    dayOfWeek: '토',
    isWeekend: true,
    totalHours: 2, // 고향 방문으로 축소
    tasks: [
      {
        id: 'credit-25-26',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 25~26강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'linear-14',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 14강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-09-21',
    dayOfWeek: '일',
    isWeekend: true,
    totalHours: 2, // 고향 방문으로 축소
    tasks: [
      {
        id: 'credit-27-28',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 27~28강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-2-2',
        subject: '미적분학',
        type: 'lecture',
        content: '2.2 도함수',
        lectures: '1강',
        duration: 0.61
      }
    ]
  },
  {
    date: '2025-09-22',
    dayOfWeek: '월',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-29-30',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 29~30강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'linear-15',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 15강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-09-23',
    dayOfWeek: '화',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-31-32',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 31~32강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-2-3-2-5',
        subject: '미적분학',
        type: 'lecture',
        content: '2.3 기본적인 미분법 + 2.5 연쇄 법칙',
        lectures: '2챕터',
        duration: 0.82
      }
    ]
  },
  {
    date: '2025-09-24',
    dayOfWeek: '수',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-33-34',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 33~34강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'linear-16',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 16강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-09-25',
    dayOfWeek: '목',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-35-36',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 35~36강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-4-1',
        subject: '미적분학',
        type: 'lecture',
        content: '4.1 최댓값과 최솟값',
        lectures: '1챕터',
        duration: 0.38
      },
      {
        id: 'stat-2',
        subject: '확률과통계',
        type: 'lecture',
        content: '2강 독립사건과 확률',
        lectures: '1강',
        duration: 1
      }
    ]
  },
  {
    date: '2025-09-26',
    dayOfWeek: '금',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-37-38',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 37~38강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-5-1-5-3',
        subject: '미적분학',
        type: 'lecture',
        content: '5.1 넓이와 거리 + 5.3 정 적분의 값 찾기',
        lectures: '2챕터',
        duration: 0.51
      }
    ]
  },
  {
    date: '2025-09-27',
    dayOfWeek: '토',
    isWeekend: true,
    totalHours: 4.5,
    tasks: [
      {
        id: 'credit-39-42',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 39~42강',
        lectures: '4강',
        duration: 2
      },
      {
        id: 'linear-18',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 18강',
        lectures: '1강',
        duration: 1.5
      },
      {
        id: 'stat-6',
        subject: '확률과통계',
        type: 'lecture',
        content: '6강 조건부 평균',
        lectures: '1강',
        duration: 1
      }
    ]
  },
  {
    date: '2025-09-28',
    dayOfWeek: '일',
    isWeekend: true,
    totalHours: 4.5,
    tasks: [
      {
        id: 'credit-43-46',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 43~46강',
        lectures: '4강',
        duration: 2
      },
      {
        id: 'calc-5-2-5-4',
        subject: '미적분학',
        type: 'lecture',
        content: '5.2 정 적분 + 5.4 미적분학의 기본 정리',
        lectures: '2챕터',
        duration: 0.94
      },
      {
        id: 'linear-19',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 19강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-09-29',
    dayOfWeek: '월',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-47-48',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 47~48강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-7-7',
        subject: '미적분학',
        type: 'lecture',
        content: '7.7 미분 방정식',
        lectures: '1챕터',
        duration: 0.25
      },
      {
        id: 'stat-7',
        subject: '확률과통계',
        type: 'lecture',
        content: '7강 여러가지 이산확률분포',
        lectures: '1강',
        duration: 1
      }
    ]
  },
  {
    date: '2025-09-30',
    dayOfWeek: '화',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-49-50',
        subject: '신용분석사',
        type: 'lecture',
        content: '2부 49~50강 완강',
        lectures: '2강',
        duration: 1
      },
      {
        id: 'calc-8-8',
        subject: '미적분학',
        type: 'lecture',
        content: '8.8 테일러 다항 함수의 활용',
        lectures: '1챕터',
        duration: 0.36
      },
      {
        id: 'stat-8',
        subject: '확률과통계',
        type: 'lecture',
        content: '8강 지수분포와 어랑분포',
        lectures: '1강',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-01',
    dayOfWeek: '수',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-review-1',
        subject: '신용분석사',
        type: 'review',
        content: '2부 1차 복습',
        lectures: '복습',
        duration: 1
      },
      {
        id: 'linear-21',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 21강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-10-02',
    dayOfWeek: '목',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-review-2',
        subject: '신용분석사',
        type: 'review',
        content: '2부 2차 복습',
        lectures: '복습',
        duration: 1
      },
      {
        id: 'calc-8-7',
        subject: '미적분학',
        type: 'lecture',
        content: '8.7 테일러 급수와 매클로린 급수',
        lectures: '1챕터',
        duration: 0.76
      }
    ]
  },
  {
    date: '2025-10-03',
    dayOfWeek: '금',
    isWeekend: false,
    isHoliday: true,
    totalHours: 3.5, // 휴일로 시간 증가
    tasks: [
      {
        id: 'credit-practice-1',
        subject: '신용분석사',
        type: 'practice',
        content: '기출문제 1개년 풀이',
        lectures: '기출',
        duration: 1.5
      },
      {
        id: 'linear-22',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 22강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-10-04',
    dayOfWeek: '토',
    isWeekend: true,
    isHoliday: true,
    totalHours: 4, // 휴일
    tasks: [
      {
        id: 'credit-practice-2',
        subject: '신용분석사',
        type: 'practice',
        content: '기출문제 2개년 풀이',
        lectures: '기출',
        duration: 1.5
      },
      {
        id: 'calc-11-3',
        subject: '미적분학',
        type: 'lecture',
        content: '11.3 편도함수',
        lectures: '1챕터',
        duration: 0.44
      },
      {
        id: 'linear-23',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 23강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-10-05',
    dayOfWeek: '일',
    isWeekend: true,
    isHoliday: true,
    totalHours: 4, // 휴일
    tasks: [
      {
        id: 'credit-practice-3',
        subject: '신용분석사',
        type: 'practice',
        content: '기출문제 3개년 풀이',
        lectures: '기출',
        duration: 1.5
      },
      {
        id: 'calc-11-6',
        subject: '미적분학',
        type: 'lecture',
        content: '11.6 방향 도함수와 물매 벡터',
        lectures: '1챕터',
        duration: 0.68
      },
      {
        id: 'linear-24',
        subject: '선형대수학',
        type: 'lecture',
        content: 'KOCW 24강 완강',
        lectures: '1강',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-10-06',
    dayOfWeek: '월',
    isWeekend: false,
    isHoliday: true,
    totalHours: 3.5, // 휴일
    tasks: [
      {
        id: 'credit-mock-1',
        subject: '신용분석사',
        type: 'practice',
        content: '최종 모의고사',
        lectures: '모의고사',
        duration: 1.5
      },
      {
        id: 'calc-11-7',
        subject: '미적분학',
        type: 'lecture',
        content: '11.7 최댓값과 최솟값',
        lectures: '1챕터',
        duration: 1.45
      },
      {
        id: 'stat-12',
        subject: '확률과통계',
        type: 'lecture',
        content: '12강 조건부 평균과 공분산',
        lectures: '1강',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-07',
    dayOfWeek: '화',
    isWeekend: false,
    isHoliday: true,
    totalHours: 3.5, // 휴일
    tasks: [
      {
        id: 'credit-weak-study',
        subject: '신용분석사',
        type: 'review',
        content: '약점 보완 학습',
        lectures: '복습',
        duration: 1.5
      },
      {
        id: 'calc-11-8',
        subject: '미적분학',
        type: 'lecture',
        content: '11.8 라그랑주 곱수',
        lectures: '1챕터',
        duration: 0.5
      },
      {
        id: 'stat-13',
        subject: '확률과통계',
        type: 'lecture',
        content: '13강 상관계수와 연합정규분포',
        lectures: '1강',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-08',
    dayOfWeek: '수',
    isWeekend: false,
    isHoliday: true,
    totalHours: 3.5, // 휴일
    tasks: [
      {
        id: 'credit-practice-final',
        subject: '신용분석사',
        type: 'practice',
        content: '실전 문제 풀이',
        lectures: '문제풀이',
        duration: 1.5
      },
      {
        id: 'calc-multi-1',
        subject: '미적분학',
        type: 'lecture',
        content: '다중 적분 전체 (1부)',
        lectures: '1챕터',
        duration: 1.5
      },
      {
        id: 'stat-review-1',
        subject: '확률과통계',
        type: 'review',
        content: '전체 복습 1차',
        lectures: '복습',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-09',
    dayOfWeek: '목',
    isWeekend: false,
    isHoliday: true,
    totalHours: 3.5, // 휴일
    tasks: [
      {
        id: 'credit-final-check',
        subject: '신용분석사',
        type: 'review',
        content: '최종 점검',
        lectures: '점검',
        duration: 1.5
      },
      {
        id: 'calc-multi-2',
        subject: '미적분학',
        type: 'lecture',
        content: '다중 적분 전체 (2부)',
        lectures: '1챕터',
        duration: 1.5
      },
      {
        id: 'linear-review-2',
        subject: '선형대수학',
        type: 'review',
        content: '전체 복습 2차',
        lectures: '복습',
        duration: 0.5
      }
    ]
  },
  {
    date: '2025-10-10',
    dayOfWeek: '금',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-mock-final',
        subject: '신용분석사',
        type: 'practice',
        content: '최종 실전 모의고사',
        lectures: '모의고사',
        duration: 1.5
      },
      {
        id: 'calc-multi-3',
        subject: '미적분학',
        type: 'lecture',
        content: '다중 적분 전체 (3부)',
        lectures: '1챕터',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-11',
    dayOfWeek: '토',
    isWeekend: true,
    totalHours: 4.5,
    tasks: [
      {
        id: 'credit-final-prep',
        subject: '신용분석사',
        type: 'review',
        content: '시험 전 마지막 정리',
        lectures: '정리',
        duration: 2
      },
      {
        id: 'calc-multi-4-13-2',
        subject: '미적분학',
        type: 'lecture',
        content: '다중 적분 전체 (4부) + 13.2 선 적분',
        lectures: '2챕터',
        duration: 2
      },
      {
        id: 'stat-review-2',
        subject: '확률과통계',
        type: 'review',
        content: '전체 복습 2차',
        lectures: '복습',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-12',
    dayOfWeek: '일',
    isWeekend: true,
    totalHours: 4.5,
    tasks: [
      {
        id: 'calc-13-7',
        subject: '미적분학',
        type: 'lecture',
        content: '13.7 면 적분',
        lectures: '1챕터',
        duration: 1
      },
      {
        id: 'stat-review-3',
        subject: '확률과통계',
        type: 'review',
        content: '전체 복습 3차',
        lectures: '복습',
        duration: 1.5
      },
      {
        id: 'linear-review-3',
        subject: '선형대수학',
        type: 'review',
        content: '전체 복습 3차',
        lectures: '복습',
        duration: 2
      }
    ]
  },
  {
    date: '2025-10-13',
    dayOfWeek: '월',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'calc-final-prep',
        subject: '미적분학',
        type: 'review',
        content: 'AI대학원 준비 최종 정리',
        lectures: '정리',
        duration: 1.5
      },
      {
        id: 'stat-final-prep',
        subject: '확률과통계',
        type: 'review',
        content: 'AI대학원 준비 최종 정리',
        lectures: '정리',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-14',
    dayOfWeek: '화',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'linear-final-prep',
        subject: '선형대수학',
        type: 'review',
        content: 'AI대학원 준비 최종 정리',
        lectures: '정리',
        duration: 1.5
      },
      {
        id: 'credit-summary',
        subject: '신용분석사',
        type: 'review',
        content: '시험 전 핵심 요약',
        lectures: '요약',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-15',
    dayOfWeek: '수',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-final-check-2',
        subject: '신용분석사',
        type: 'practice',
        content: '최종 실전 점검',
        lectures: '점검',
        duration: 2.5
      }
    ]
  },
  {
    date: '2025-10-16',
    dayOfWeek: '목',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'credit-final-review',
        subject: '신용분석사',
        type: 'review',
        content: '시험 전 최종 복습',
        lectures: '복습',
        duration: 2.5
      }
    ]
  },
  {
    date: '2025-10-17',
    dayOfWeek: '금',
    isWeekend: false,
    totalHours: 2,
    tasks: [
      {
        id: 'credit-final-finish',
        subject: '신용분석사',
        type: 'review',
        content: '시험 전 마무리',
        lectures: '마무리',
        duration: 2
      }
    ]
  },
  {
    date: '2025-10-18',
    dayOfWeek: '토',
    isWeekend: true,
    totalHours: 3,
    tasks: [
      {
        id: 'credit-rest-review',
        subject: '신용분석사',
        type: 'review',
        content: '시험 전 휴식 및 가벼운 복습',
        lectures: '휴식',
        duration: 1.5
      },
      {
        id: 'calc-final-check',
        subject: '미적분학',
        type: 'review',
        content: 'AI대학원 준비 마지막 점검',
        lectures: '점검',
        duration: 1.5
      }
    ]
  },
  {
    date: '2025-10-19',
    dayOfWeek: '일',
    isWeekend: true,
    totalHours: 3,
    tasks: [
      {
        id: 'stat-final-check',
        subject: '확률과통계',
        type: 'review',
        content: 'AI대학원 준비 마지막 점검',
        lectures: '점검',
        duration: 1
      },
      {
        id: 'linear-final-check',
        subject: '선형대수학',
        type: 'review',
        content: 'AI대학원 준비 마지막 점검',
        lectures: '점검',
        duration: 1
      },
      {
        id: 'credit-condition',
        subject: '신용분석사',
        type: 'review',
        content: '시험 전 컨디션 관리',
        lectures: '컨디션',
        duration: 1
      }
    ]
  },
  {
    date: '2025-10-20',
    dayOfWeek: '월',
    isWeekend: false,
    totalHours: 2.5,
    tasks: [
      {
        id: 'stat-2',
        subject: '확률과통계',
        type: 'lecture',
        content: '2강 독립사건과 확률',
        lectures: '1강',
        duration: 1
      }
    ]
  }
];

export const studySchedule: StudySchedule = {
  dailyPlans,
  subjects,
  currentDate: '2025-09-17'
};