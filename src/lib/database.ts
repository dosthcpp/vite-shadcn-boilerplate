import Dexie, { Table } from 'dexie';

export interface TaskRecord {
  id: string;
  subject: string;
  type: 'lecture' | 'review' | 'practice';
  content: string;
  lectures: string;
  duration: number;
  date: string;
  originalDate: string; // 원래 계획된 날짜
  completed: boolean;
}

export interface ProgressRecord {
  id: string;
  subjectId: string;
  completedTasks: string[];
  lastUpdated: Date;
}

export interface DailyCheckRecord {
  id: string;
  date: string;
  completedTasks: string[];
  checkedAt: Date;
}

class StudyDatabase extends Dexie {
  tasks!: Table<TaskRecord>;
  progress!: Table<ProgressRecord>;
  dailyChecks!: Table<DailyCheckRecord>;

  constructor() {
    super('StudyDatabase');
    this.version(2).stores({
      tasks: 'id, subject, type, date, originalDate, completed',
      progress: 'id, subjectId',
      dailyChecks: 'id, date'
    }).upgrade(trans => {
      // 기존 태스크들에 originalDate 필드 추가
      return trans.table('tasks').toCollection().modify((task: any) => {
        if (!task.originalDate) {
          task.originalDate = task.date;
        }
      });
    });
  }

  async saveTask(task: TaskRecord): Promise<void> {
    console.log('Saving task:', task);
    await this.tasks.put(task);
  }

  async getTasksForDate(date: string): Promise<TaskRecord[]> {
    const tasks = await this.tasks.where('date').equals(date).toArray();
    // console.log(`Tasks for ${date}:`, tasks);
    return tasks;
  }

  async moveTaskToDate(taskId: string, newDate: string): Promise<void> {
    console.log(`Moving task ${taskId} to ${newDate}`);
    
    // 기존 태스크 가져오기
    const existingTask = await this.tasks.get(taskId);
    if (!existingTask) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    // 날짜 업데이트 (원래 날짜는 보존)
    const updatedTask = { 
      ...existingTask, 
      date: newDate,
      originalDate: existingTask.originalDate || existingTask.date // originalDate가 없으면 현재 date를 사용
    };
    await this.tasks.put(updatedTask);
    
    console.log(`Task ${taskId} moved from ${existingTask.date} to ${newDate} (original: ${updatedTask.originalDate})`);
    
    // 검증: 이동이 제대로 되었는지 확인
    const movedTask = await this.tasks.get(taskId);
    console.log(`Verification - Task ${taskId} now has date:`, movedTask?.date, 'original:', movedTask?.originalDate);
  }

  async saveProgress(progress: ProgressRecord): Promise<void> {
    await this.progress.put(progress);
  }

  async getProgress(subjectId: string): Promise<ProgressRecord | undefined> {
    // progress 테이블의 기본 키(id)는 subjectId와 동일하게 사용
    const existing = await this.progress.get(subjectId);
    return existing;
  }

  async getAllProgress(): Promise<ProgressRecord[]> {
    return await this.progress.toArray();
  }

  // 진행도 레코드가 없으면 생성하여 반환
  async getOrCreateProgress(subjectId: string): Promise<ProgressRecord> {
    const existing = await this.getProgress(subjectId);
    if (existing) return existing;
    const record: ProgressRecord = {
      id: subjectId,
      subjectId,
      completedTasks: [],
      lastUpdated: new Date()
    };
    await this.saveProgress(record);
    return record;
  }

  async markTaskCompleted(taskId: string, subjectId: string): Promise<void> {
    const progress = await this.getOrCreateProgress(subjectId);
    if (!progress.completedTasks.includes(taskId)) {
      progress.completedTasks = [...progress.completedTasks, taskId];
      progress.lastUpdated = new Date();
      await this.saveProgress(progress);
    }
  }

  async markTaskUncompleted(taskId: string, subjectId: string): Promise<void> {
    const progress = await this.getOrCreateProgress(subjectId);
    const next = progress.completedTasks.filter(id => id !== taskId);
    if (next.length !== progress.completedTasks.length) {
      progress.completedTasks = next;
      progress.lastUpdated = new Date();
      await this.saveProgress(progress);
    }
  }

  async saveDailyCheck(check: DailyCheckRecord): Promise<void> {
    await this.dailyChecks.put(check);
  }

  async getDailyCheck(date: string): Promise<DailyCheckRecord | undefined> {
    return await this.dailyChecks.get(date);
  }

  async deleteTask(taskId: string): Promise<void> {
    console.log(`Deleting task: ${taskId}`);
    await this.tasks.delete(taskId);
  }

  async clearAllTasks(): Promise<void> {
    await this.tasks.clear();
  }

  async clearAllProgress(): Promise<void> {
    await this.progress.clear();
  }

  async clearAllDailyChecks(): Promise<void> {
    await this.dailyChecks.clear();
  }

  // 디버깅을 위한 모든 태스크 조회
  async getAllTasks(): Promise<TaskRecord[]> {
    const allTasks = await this.tasks.toArray();
    console.log('All tasks in database:', allTasks);
    return allTasks;
  }

  async getAllDailyChecks(): Promise<DailyCheckRecord[]> {
    const all = await this.dailyChecks.toArray();
    return all;
  }

  async bulkSaveTasks(records: TaskRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    await this.tasks.bulkPut(records);
  }

  async bulkSaveProgress(records: ProgressRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    await this.progress.bulkPut(records);
  }

  async bulkSaveDailyChecks(records: DailyCheckRecord[]): Promise<void> {
    if (!records || records.length === 0) return;
    await this.dailyChecks.bulkPut(records);
  }
}

export const studyDB = new StudyDatabase();