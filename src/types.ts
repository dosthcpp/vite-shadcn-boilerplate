export interface Subject {
  id: string;
  name: string;
  totalLectures: number;
  completedLectures: number;
  color: string;
  category: 'credit-analyst' | 'ai-prep';
}

export interface StudySession {
  subject: string;
  lectures: string;
  duration: string;
  type: 'new' | 'review';
}

export interface DailyPlan {
  date: string;
  dayOfWeek: string;
  sessions: StudySession[];
  totalHours: number;
  isWeekend: boolean;
  isHoliday?: boolean;
}

export interface WeeklyProgress {
  week: string;
  creditAnalyst: number;
  calculus: number;
  linearAlgebra: number;
  statistics: number;
}