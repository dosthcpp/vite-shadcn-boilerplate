export interface StudyTask {
  id: string;
  subject: string;
  type: 'lecture' | 'review' | 'practice';
  content: string;
  lectures: string;
  duration: number; // in hours
  completed?: boolean;
}

export interface DailyPlan {
  date: string;
  dayOfWeek: string;
  tasks: StudyTask[];
  totalHours: number;
  isWeekend: boolean;
  isHoliday?: boolean;
}

export interface SubjectProgress {
  name: string;
  current: number;
  total: number;
  color: string;
  description: string;
}

export interface StudySchedule {
  dailyPlans: DailyPlan[];
  subjects: SubjectProgress[];
  currentDate: string;
}