import { studyDB, TaskRecord } from './database';
import { studySchedule } from '@/data/studyPlan';

export class ScheduleManager {
  private taskOrderIndexCache: Map<string, number> | null = null;

  private buildTaskOrderIndexCache(): void {
    if (this.taskOrderIndexCache) return;
    this.taskOrderIndexCache = new Map<string, number>();
    let idx = 0;
    for (const plan of studySchedule.dailyPlans) {
      const tasks: any[] = (plan as any).tasks || [];
      for (const t of tasks) {
        if (t?.id && !this.taskOrderIndexCache.has(t.id)) {
          this.taskOrderIndexCache.set(t.id, idx++);
        }
      }
    }
  }

  // Compute a global order index for a task to preserve lecture sequence.
  // Lower value means earlier in the study plan.
  private getTaskOrderIndex(task: TaskRecord): number {
    this.buildTaskOrderIndexCache();
    const cache = this.taskOrderIndexCache!;
    if (cache.has(task.id)) return cache.get(task.id)!;
    // Fallback: unseen tasks get placed after all known tasks
    return 1_000_000 + (task.date ? this.hashString(task.id) % 1000 : 0);
  }

  private hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }
  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, (m - 1), d);
    date.setDate(date.getDate() + days);
    return this.getLocalDateString(date);
  }

  private isWeekend(dateStr: string): boolean {
    const [y, m, d] = dateStr.split('-').map(Number);
    const day = new Date(y, (m - 1), d).getDay();
    return day === 0 || day === 6;
  }

  private ensurePlanExists(dateStr: string): void {
    const exists = studySchedule.dailyPlans.find(p => p.date === dateStr);
    if (exists) return;

    const weekend = this.isWeekend(dateStr);
    const totalHours = weekend ? 4.5 : 2.5; // 기준: 평일 2.5, 주말/휴일 4.5

    const [y, m, d] = dateStr.split('-').map(Number);
    const dayOfWeekMap = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = dayOfWeekMap[new Date(y, (m - 1), d).getDay()];

    studySchedule.dailyPlans.push({
      date: dateStr,
      dayOfWeek,
      tasks: [],
      totalHours,
      isWeekend: weekend,
      // isHoliday는 동적으로 생성 시 기본 false로 간주
    } as any);
  }
  
  // 스케줄 자동 재배치 함수
  async redistributeSchedule(movedTaskId: string, targetDate: string): Promise<boolean> {
    try {
      // 이동된 태스크 정보 가져오기
      const movedTask = await studyDB.tasks.get(movedTaskId);
      if (!movedTask) return false;

      // 타겟 날짜의 현재 태스크들과 총 시간 계산
      const targetTasks = await studyDB.getTasksForDate(targetDate);
      const targetPlan = studySchedule.dailyPlans.find(plan => plan.date === targetDate);
      
      if (!targetPlan) return false;

      const currentTotalHours = targetTasks.reduce((sum, task) => sum + task.duration, 0);
      const newTotalHours = currentTotalHours + movedTask.duration;

      // 시간 초과 시 앞으로 캐스케이드
      if (newTotalHours > targetPlan.totalHours) {
        await this.cascadeFrom(targetDate);
      }

      return true;
    } catch (error) {
      console.error('Error redistributing schedule:', error);
      return false;
    }
  }

  // 시작 날짜부터 앞으로만 순차적으로 넘기는 캐스케이드 리밸런싱
  // preferredMoveIds: 해당 날짜에서 우선적으로 내보낼 태스크 ID 목록 (예: 원래 오늘 태스크)
  async cascadeFrom(startDate: string, preferredMoveIds: string[] = []): Promise<void> {
    try {
      // startDate가 포함된 인덱스부터 끝까지 순회하며 초과분을 다음날로 이동
      let index = studySchedule.dailyPlans.findIndex(p => p.date === startDate);
      if (index < 0) index = 0;

      for (let i = index; i < studySchedule.dailyPlans.length; i++) {
        const currentPlan = studySchedule.dailyPlans[i];
        this.ensurePlanExists(currentPlan.date);
        const currentTasks = await studyDB.getTasksForDate(currentPlan.date);
        const used = currentTasks.reduce((s, t) => s + t.duration, 0);
        const capacity = currentPlan.totalHours;
        let excess = used - capacity;
        if (excess <= 0) continue;

        // Decide which tasks to evict: later tasks (in study plan order) first.
        // Tasks in preferredMoveIds get an eviction bonus so they are evicted before others when tied.
        const scored = currentTasks.map(t => {
          const order = this.getTaskOrderIndex(t);
          const bonus = preferredMoveIds.includes(t.id) ? 1000000 : 0; // large bonus to evict preferred first
          const evictScore = order + bonus; // larger score means more likely to evict (later tasks or preferred)
          return { task: t, evictScore };
        });
        // Sort by descending score (evict later tasks first)
        scored.sort((a, b) => b.evictScore - a.evictScore);

        const toEvict: TaskRecord[] = [];
        let remaining = excess;
        for (const item of scored) {
          if (remaining <= 0) break;
          toEvict.push(item.task);
          remaining -= item.task.duration;
        }

        // 다음 날짜로 이동 (없으면 동적 생성하면서 수용 가능한 슬롯 확보까지 전파)
        for (const t of toEvict) {
          const targetDate = await this.findNextAvailableDate(currentPlan.date, t.duration);
          await studyDB.moveTaskToDate(t.id, targetDate);
        }
      }

      // 초과분 전파 후, 빈 용량을 앞당겨 채워서 빽빽하게 만들기
      await this.compactFrom(startDate);

      // 마지막으로 전 구간을 전역 순서에 맞춰 재분배하여 순서를 보정
      await this.reorderFrom(startDate);
    } catch (error) {
      console.error('Error cascading schedule:', error);
    }
  }

  // 용량이 남는 날에 대해 다음날의 가장 이른 태스크부터 당겨와 채우기 (빽빽하게)
  private async compactFrom(startDate: string): Promise<void> {
    try {
      let startIndex = studySchedule.dailyPlans.findIndex(p => p.date === startDate);
      if (startIndex < 0) startIndex = 0;

      for (let i = startIndex; i < studySchedule.dailyPlans.length - 1; i++) {
        const currentPlan = studySchedule.dailyPlans[i];
        const nextPlan = studySchedule.dailyPlans[i + 1];
        this.ensurePlanExists(currentPlan.date);
        this.ensurePlanExists(nextPlan.date);

        const currentTasks = await studyDB.getTasksForDate(currentPlan.date);
        const nextTasks = await studyDB.getTasksForDate(nextPlan.date);

        let used = currentTasks.reduce((s, t) => s + t.duration, 0);
        const capacity = currentPlan.totalHours;
        let available = capacity - used;
        if (available <= 0 || nextTasks.length === 0) continue;

        // 다음날 태스크를 원래 계획 순서대로 정렬 (가장 이른 것부터 당김)
        const sortedNext = [...nextTasks].sort((a, b) => this.getTaskOrderIndex(a) - this.getTaskOrderIndex(b));

        for (const t of sortedNext) {
          if (available <= 0) break;
          if (t.duration <= available) {
            await studyDB.moveTaskToDate(t.id, currentPlan.date);
            available -= t.duration;
          }
        }
      }
    } catch (error) {
      console.error('Error compacting schedule:', error);
    }
  }

  // 전역 순서를 보장하도록 startDate 이후의 모든 태스크를 공부 순서대로 다시 채움
  private async reorderFrom(startDate: string): Promise<void> {
    try {
      let startIndex = studySchedule.dailyPlans.findIndex(p => p.date === startDate);
      if (startIndex < 0) startIndex = 0;

      // 1) 수집
      const collected: TaskRecord[] = [];
      for (let i = startIndex; i < studySchedule.dailyPlans.length; i++) {
        const date = studySchedule.dailyPlans[i].date;
        const items = await studyDB.getTasksForDate(date);
        collected.push(...items);
      }

      // 2) 전역 순서대로 정렬
      collected.sort((a, b) => this.getTaskOrderIndex(a) - this.getTaskOrderIndex(b));

      // 3) 용량에 맞춰 앞에서부터 재배치
      let cursor = 0;
      for (let i = startIndex; i < studySchedule.dailyPlans.length; i++) {
        const plan = studySchedule.dailyPlans[i];
        let remaining = plan.totalHours;

        // 현재 날짜에 이미 있는 태스크는 무시하고 전체에서 재할당
        while (cursor < collected.length && collected[cursor].duration <= remaining) {
          const t = collected[cursor];
          cursor++;
          remaining -= t.duration;
          if (t.date !== plan.date) {
            await studyDB.moveTaskToDate(t.id, plan.date);
          }
        }
      }
    } catch (error) {
      console.error('Error reordering schedule:', error);
    }
  }
  // 기존 API 유지: 해당 날짜에서 시작해 앞으로만 전파
  async rebalanceDate(date: string): Promise<void> {
    await this.cascadeFrom(date);
  }

  // 전체 일정에서 용량 초과인 날들을 순차적으로 앞으로 전파하여 리밸런싱
  async rebalanceAll(): Promise<void> {
    try {
      for (const plan of studySchedule.dailyPlans) {
        const tasks = await studyDB.getTasksForDate(plan.date);
        const used = tasks.reduce((s, t) => s + t.duration, 0);
        if (used > plan.totalHours) {
          await this.cascadeFrom(plan.date);
        }
      }
    } catch (error) {
      console.error('Error in rebalanceAll:', error);
    }
  }

  // 다음 가능한 날짜 찾기 (기존 학습 계획 내에서만)
  private async findNextAvailableDate(fromDate: string, requiredHours: number): Promise<string> {
    let fromIndex = studySchedule.dailyPlans.findIndex(plan => plan.date === fromDate);
    if (fromIndex < 0) fromIndex = -1;

    // 기존 계획에서 먼저 찾기
    for (let i = fromIndex + 1; i < studySchedule.dailyPlans.length; i++) {
      const plan = studySchedule.dailyPlans[i];
      const existingTasks = await studyDB.getTasksForDate(plan.date);
      const currentHours = existingTasks.reduce((sum, task) => sum + task.duration, 0);
      if (currentHours + requiredHours <= plan.totalHours) {
        return plan.date;
      }
    }

    // 없으면 미래 날짜를 동적으로 생성하면서 수용 가능한 날짜를 찾음
    let lastDate = studySchedule.dailyPlans[studySchedule.dailyPlans.length - 1]?.date || fromDate;
    while (true) {
      const candidate = this.addDays(lastDate, 1);
      this.ensurePlanExists(candidate);
      const candidatePlan = studySchedule.dailyPlans.find(p => p.date === candidate)!;
      const existingTasks = await studyDB.getTasksForDate(candidatePlan.date);
      const currentHours = existingTasks.reduce((sum, task) => sum + task.duration, 0);
      if (currentHours + requiredHours <= candidatePlan.totalHours) {
        return candidatePlan.date;
      }
      lastDate = candidate;
    }
  }

  // 미완료 태스크를 다음날로 이동하고 전체 일정 재조정 - 완전히 새로 작성
  async moveIncompleteTasks(fromDate: string, incompleteTasks: string[]): Promise<void> {
    console.log(`=== MOVING INCOMPLETE TASKS START ===`);
    console.log(`From date: ${fromDate}`);
    console.log(`Task IDs to move: ${incompleteTasks}`);
    
    try {
      // 1. 각 태스크를 개별적으로 다음 가능한 날짜로 이동
      for (const taskId of incompleteTasks) {
        console.log(`Processing task: ${taskId}`);
        
        const task = await studyDB.tasks.get(taskId);
        if (!task) {
          console.error(`Task ${taskId} not found in database`);
          continue;
        }
        
        console.log(`Found task: ${task.subject} - ${task.content} (${task.duration}h)`);
        
        // fromDate 다음날부터 시작해서 가능한 날짜 찾기
        const fromIndex = studySchedule.dailyPlans.findIndex(plan => plan.date === fromDate);
        let placed = false;
        
        for (let i = fromIndex + 1; i < studySchedule.dailyPlans.length; i++) {
          const targetPlan = studySchedule.dailyPlans[i];
          const existingTasks = await studyDB.getTasksForDate(targetPlan.date);
          const currentHours = existingTasks.reduce((sum, t) => sum + t.duration, 0);
          
          console.log(`Checking ${targetPlan.date}: ${currentHours}/${targetPlan.totalHours}h used`);
          
          // 이 날짜에 배치 가능한지 확인
          if (currentHours + task.duration <= targetPlan.totalHours) {
            console.log(`Moving task ${taskId} to ${targetPlan.date}`);
            
            // 태스크 이동
            await studyDB.moveTaskToDate(taskId, targetPlan.date);
            
            // 이동 확인
            const movedTask = await studyDB.tasks.get(taskId);
            console.log(`Verification: Task ${taskId} now has date: ${movedTask?.date}`);
            
            placed = true;
            break;
          }
        }
        
        if (!placed) {
          // 동적 날짜 생성 포함한 탐색 사용
          const targetDate = await this.findNextAvailableDate(fromDate, task.duration);
          console.log(`No existing slot, creating/using future date ${targetDate} for task ${taskId}`);
          await studyDB.moveTaskToDate(taskId, targetDate);
          const movedTask2 = await studyDB.tasks.get(taskId);
          console.log(`Verification: Task ${taskId} now has date: ${movedTask2?.date}`);
        }
      }
      
      console.log(`=== MOVING INCOMPLETE TASKS END ===`);
      
    } catch (error) {
      console.error('Error in moveIncompleteTasks:', error);
    }
  }
}

export const scheduleManager = new ScheduleManager();