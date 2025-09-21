import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { studySchedule } from '@/data/studyPlan';
import { useProgress } from '@/hooks/useProgress';
import { studyDB, TaskRecord } from '@/lib/database';
import { scheduleManager } from '@/lib/scheduleManager';
import DraggableTask from './DraggableTask';
import DailyReviewModal from './DailyReviewModal';
import { pushSnapshot, subscribeSchedule, getScheduleOnce, getDeviceId, pushDaySettingsOnly } from '@/lib/realtime';

const StudyCalendar = () => {
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const addDaysToDateString = (dateStr: string, days: number) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const base = new Date(y, (m - 1), d);
    base.setDate(base.getDate() + days);
    return getLocalDateString(base);
  };
  const { subjects, toggleTask } = useProgress();
  const [tasks, setTasks] = useState<{ [date: string]: TaskRecord[] }>({});
  // Drag state not needed; each task handles its own visual dragging state
  const [showDailyReview, setShowDailyReview] = useState(false);
  const [yesterdayTasks, setYesterdayTasks] = useState<TaskRecord[]>([]);
  const [yesterdayDate, setYesterdayDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingCapacityDate, setEditingCapacityDate] = useState<string | null>(null);
  const [capacityValue, setCapacityValue] = useState('');
  const [mobileDraggingTaskId, setMobileDraggingTaskId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      await loadTasks();
      await checkForDailyReview();
    })();
  }, []);

  // One-time cleanup: remove legacy localStorage review flags so cloud/Dexie are authoritative
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('daily-review-')) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, []);

  // Realtime: apply incoming snapshots from Firestore (other devices)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const deviceId = getDeviceId();
        const unsub = await subscribeSchedule('default-user', async (payload: any) => {
          try {
            if (payload?.source?.deviceId === deviceId) return; // ignore own writes
            const tasksPayload = Array.isArray(payload?.tasks) ? payload.tasks : [];
            const progressPayload = Array.isArray(payload?.progress) ? payload.progress : [];
            const dailyPayload = Array.isArray(payload?.dailyChecks) ? payload.dailyChecks : [];
            const daySettingsPayload = Array.isArray(payload?.daySettings) ? payload.daySettings : [];

            // Merge strategy to avoid losing local state
            const localTasks = await studyDB.getAllTasks();
            if (localTasks.length === 0 && tasksPayload.length) {
              await studyDB.bulkSaveTasks(tasksPayload);
            }

            if (progressPayload.length) {
              const localProgress = await studyDB.getAllProgress();
              const byId: Record<string, { id: string; subjectId: string; completedTasks: string[]; lastUpdated: Date }>
                = Object.fromEntries(localProgress.map(p => [p.id, p]));
              for (const p of progressPayload) {
                const id = p.id || p.subjectId;
                const existing = byId[id];
                const remoteCompleted = Array.isArray(p.completedTasks) ? p.completedTasks : [];
                const merged = Array.from(new Set([...(existing?.completedTasks || []), ...remoteCompleted]));
                byId[id] = {
                  id,
                  subjectId: id,
                  completedTasks: merged,
                  lastUpdated: p.lastUpdated ? new Date(p.lastUpdated) : (existing?.lastUpdated || new Date())
                };
              }
              await studyDB.clearAllProgress();
              await studyDB.bulkSaveProgress(Object.values(byId));
            }

            if (dailyPayload.length) {
              const localDaily = await studyDB.getAllDailyChecks();
              const byDate: Record<string, { id: string; date: string; completedTasks: string[]; checkedAt: Date }>
                = Object.fromEntries(localDaily.map(d => [d.id, d]));
              for (const d of dailyPayload) {
                const id = d.id || d.date;
                const existing = byDate[id];
                const remoteCompleted = Array.isArray(d.completedTasks) ? d.completedTasks : [];
                const merged = Array.from(new Set([...(existing?.completedTasks || []), ...remoteCompleted]));
                byDate[id] = {
                  id,
                  date: id,
                  completedTasks: merged,
                  checkedAt: d.checkedAt ? new Date(d.checkedAt) : (existing?.checkedAt || new Date())
                };
              }
              await studyDB.clearAllDailyChecks();
              await studyDB.bulkSaveDailyChecks(Object.values(byDate));
            }
            // Apply daySettings (totalHours) to local studySchedule
            if (daySettingsPayload.length) {
              for (const s of daySettingsPayload) {
                const plan = studySchedule.dailyPlans.find(p => p.date === s?.date);
                if (plan && typeof s?.totalHours === 'number') {
                  plan.totalHours = Math.round(s.totalHours * 100) / 100;
                }
              }
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('progress-updated'));
              window.dispatchEvent(new CustomEvent('database-restored'));
            }
            await loadTasks();
          } catch (e) {
            console.warn('apply remote snapshot failed', e);
          }
        });
        unsubscribe = unsub;
      } catch (e) {
        console.warn('subscribeSchedule failed', e);
      }
    })();
    return () => { if (typeof unsubscribe === 'function') unsubscribe(); };
  }, []);

  useEffect(() => {
    const onRestored = async () => {
      await loadTasks();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('database-restored', onRestored as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('database-restored', onRestored as EventListener);
      }
    };
  }, []);

  const checkForDailyReview = async () => {
    const today = new Date();
    const todayString = getLocalDateString(today);
    
    console.log('Checking for daily review from past dates...');
    // Cloud-first: load dailyChecks from Firestore once
    let cloudDailyReviewed: Set<string> = new Set();
    try {
      const payload = await getScheduleOnce('default-user');
      const daily = Array.isArray(payload?.dailyChecks) ? payload.dailyChecks : [];
      cloudDailyReviewed = new Set(daily.map((d: any) => d?.id || d?.date).filter(Boolean));
    } catch (e) {
      console.warn('getScheduleOnce failed; fallback to local sources only');
    }
    
    // 30일 전부터 오늘까지 정순으로 과거 날짜들을 체크
    for (let i = 30; i >= 1; i--) { // 30일 전부터 1일 전까지
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateString = getLocalDateString(checkDate);
      
      // 오늘 날짜는 건너뛰기
      if (checkDateString === todayString) continue;
      
      console.log(`\n=== CHECKING DATE: ${checkDateString} ===`);
      console.log(`Checking for earlier tasks at: ${checkDateString}`);
      
      // 해당 날짜에 현재 있는 태스크들 중에서 원래 그 날짜보다 이전에 계획된 것들 찾기
      const currentDateTasks = await studyDB.getTasksForDate(checkDateString);
      
      const earlierTasks = currentDateTasks.filter(task => {
        const originalDate = task.originalDate || task.date;
        const isEarlier = originalDate < checkDateString;
        return isEarlier;
      });
      
      // 우선순위: 이전 날짜에서 들어온 태스크가 있으면 그것만, 없으면 해당 날짜 원래 태스크 전체
      const tasksToReview = earlierTasks.length > 0 ? earlierTasks : currentDateTasks;
      if (tasksToReview.length > 0) {
        // Review state priority: Cloud → Dexie (no localStorage fallback)
        let reviewed = cloudDailyReviewed.has(checkDateString);
        if (!reviewed) {
          try {
            const dc = await studyDB.getDailyCheck(checkDateString);
            reviewed = !!dc;
          } catch {}
        }
        console.log(`Has reviewed ${checkDateString}:`, reviewed);
        if (!reviewed) {
          setYesterdayTasks(tasksToReview);
          setYesterdayDate(checkDateString);
          setShowDailyReview(true);
          return; // 첫 번째 미리뷰 날짜에서 멈춤
        }
      }
    }
    
    console.log('No unreviewed dates found');
  };

  const handleDailyReviewConfirm = async (completedTasks: string[]) => {
    console.log('=== DAILY REVIEW CONFIRM START ===');
    console.log('Completed tasks:', completedTasks);
    console.log('Yesterday tasks:', yesterdayTasks);
    
    setIsLoading(true);
    
    try {
      // 완료된 태스크들 처리
      for (const taskId of completedTasks) {
        const task = yesterdayTasks.find(t => t.id === taskId);
        if (task) {
          const subjectId = getSubjectId(task.subject);
          await toggleTask(taskId, subjectId, true);
          console.log(`Marked task ${taskId} as completed`);
        }
      }

      // 미완료 태스크들을 "해당 날짜 이후"로 전파 (17일 → 18일 등)
      const incompleteTasks = yesterdayTasks
        .filter(task => !completedTasks.includes(task.id))
        .map(task => task.id);
      
      console.log('Incomplete tasks to move forward:', incompleteTasks);
      
      if (incompleteTasks.length > 0) {
        // 다음 날짜로 먼저 모은 후, 그 날짜에서 앞으로 캐스케이드 (원래 다음 날짜 태스크 우선 퇴출)
        const nextDateStr = addDaysToDateString(yesterdayDate, 1);
        const originalNextTasks = await studyDB.getTasksForDate(nextDateStr);
        const preferEvictIds = originalNextTasks.map(t => t.id);

        for (const taskId of incompleteTasks) {
          await studyDB.moveTaskToDate(taskId, nextDateStr);
        }

        await scheduleManager.cascadeFrom(nextDateStr, preferEvictIds);
        console.log('Moved incomplete tasks into', nextDateStr, 'and cascaded forward with eviction');
      } else {
        console.log('No incomplete tasks to move - all tasks were completed');
      }

      // 리뷰 완료 표시 (Dexie only; syncing via Firestore)
      try {
        await studyDB.saveDailyCheck({ id: yesterdayDate, date: yesterdayDate, completedTasks, checkedAt: new Date() } as any);
      } catch {}
      setShowDailyReview(false);
      
      // Push snapshot (includes dailyChecks) BEFORE reload so cloud-first load sees it
      try {
        const allTasks = await studyDB.getAllTasks();
        const allProgress = await studyDB.getAllProgress();
        const allDaily = await studyDB.getAllDailyChecks();
        const deviceId = getDeviceId();
        await pushSnapshot('default-user', { tasks: allTasks, progress: allProgress, dailyChecks: allDaily }, { deviceId });
      } catch {}
      // 태스크 다시 로드 (cloud-first)
      console.log('Reloading tasks after daily review...');
      await loadTasks();
      
      // 다음 미리뷰 날짜 체크
      console.log('Checking for next unreviewed date...');
      await checkForDailyReview();
      console.log('=== DAILY REVIEW CONFIRM END ===');
      
    } catch (error) {
      console.error('Error in daily review confirm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailyReviewCancel = async () => {
    console.log('=== DAILY REVIEW CANCEL START ===');
    console.log('Moving ALL tasks (treating as incomplete):', yesterdayTasks.map(t => t.id));
    
    setIsLoading(true);
    
    try {
      // 취소 시에도 해당 날짜 다음날로 모은 뒤 앞으로 전파 (원래 다음 날짜 태스크 우선 퇴출)
      const allTaskIds = yesterdayTasks.map(task => task.id);
      console.log('All task IDs to move:', allTaskIds);

      if (allTaskIds.length > 0) {
        const nextDateStr = addDaysToDateString(yesterdayDate, 1);
        const originalNextTasks = await studyDB.getTasksForDate(nextDateStr);
        const preferEvictIds = originalNextTasks.map(t => t.id);

        for (const taskId of allTaskIds) {
          await studyDB.moveTaskToDate(taskId, nextDateStr);
        }
        await scheduleManager.cascadeFrom(nextDateStr, preferEvictIds);
        console.log('Moved all tasks into', nextDateStr, 'and cascaded forward with eviction');
      } else {
        console.log('No tasks to move');
      }

      // 리뷰 완료 표시 (취소했더라도 다시 묻지 않음) - Dexie only; syncing via Firestore
      try {
        await studyDB.saveDailyCheck({ id: yesterdayDate, date: yesterdayDate, completedTasks: [], checkedAt: new Date() } as any);
      } catch {}
      setShowDailyReview(false);
      
      // Push snapshot (includes dailyChecks) BEFORE reload so cloud-first load sees it
      try {
        const allTasks = await studyDB.getAllTasks();
        const allProgress = await studyDB.getAllProgress();
        const allDaily = await studyDB.getAllDailyChecks();
        const deviceId = getDeviceId();
        await pushSnapshot('default-user', { tasks: allTasks, progress: allProgress, dailyChecks: allDaily }, { deviceId });
      } catch {}
      // 태스크 다시 로드 (cloud-first)
      console.log('Reloading tasks after cancel...');
      await loadTasks();
      
      // 다음 미리뷰 날짜 체크
      console.log('Checking for next unreviewed date...');
      await checkForDailyReview();
      console.log('=== DAILY REVIEW CANCEL END ===');
      
    } catch (error) {
      console.error('Error in daily review cancel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    console.log('=== LOADING TASKS START ===');
    setIsLoading(true);
    
    try {
      // Always pull Firestore snapshot first and treat as source of truth
      let cloudApplied = false;
      try {
        const payload = await getScheduleOnce('default-user');
        if (payload) {
          const tasksPayload = Array.isArray(payload?.tasks) ? payload.tasks : [];
          const progressPayload = Array.isArray(payload?.progress) ? payload.progress : [];
          const dailyPayload = Array.isArray(payload?.dailyChecks) ? payload.dailyChecks : [];
          const daySettingsPayload = Array.isArray(payload?.daySettings) ? payload.daySettings : [];
          const hasAnyCloudData = (tasksPayload.length + progressPayload.length + dailyPayload.length) > 0;

          // Apply day settings to local studySchedule
          if (daySettingsPayload.length) {
            for (const s of daySettingsPayload) {
              const plan = studySchedule.dailyPlans.find(p => p.date === s?.date);
              if (plan && typeof s?.totalHours === 'number') {
                plan.totalHours = Math.round(s.totalHours * 100) / 100;
              }
            }
          }

          if (hasAnyCloudData) {
            // Replace Dexie data with cloud snapshot
            await studyDB.clearAllTasks();
            await studyDB.clearAllProgress();
            await studyDB.clearAllDailyChecks();
            if (tasksPayload.length) await studyDB.bulkSaveTasks(tasksPayload);
            if (progressPayload.length) await studyDB.bulkSaveProgress(progressPayload.map((p: any) => ({
              id: p.id || p.subjectId,
              subjectId: p.subjectId || p.id,
              completedTasks: Array.isArray(p.completedTasks) ? p.completedTasks : [],
              lastUpdated: p?.lastUpdated?.toDate ? p.lastUpdated.toDate() : (p.lastUpdated ? new Date(p.lastUpdated) : new Date()),
            })));
            if (dailyPayload.length) await studyDB.bulkSaveDailyChecks(dailyPayload.map((d: any) => ({
              id: d.id || d.date,
              date: d.date || d.id,
              completedTasks: Array.isArray(d.completedTasks) ? d.completedTasks : [],
              checkedAt: d?.checkedAt?.toDate ? d.checkedAt.toDate() : (d.checkedAt ? new Date(d.checkedAt) : new Date()),
            })));
            cloudApplied = true;
          }
        }
      } catch (e) {
        console.warn('cloud pull failed', e);
      }

      // Get all tasks to detect empty DB state
      const allExisting = await studyDB.getAllTasks();
      let dbEmpty = (allExisting?.length || 0) === 0;
      
      // Initialize tasks from studySchedule only once
      const initFlagKey = 'study-db-initialized';
      const isInitialized = localStorage.getItem(initFlagKey) === 'true';
      // Seed only if cloud had nothing and local DB is empty
      const shouldSeed = (!cloudApplied) && (!isInitialized || dbEmpty);
      
      const clearDailyReviewKeys = () => {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || '';
          if (key.startsWith('daily-review-')) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      };
      const tasksByDate: { [date: string]: TaskRecord[] } = {};
      
      for (const plan of studySchedule.dailyPlans) {
        const existingTasks = await studyDB.getTasksForDate(plan.date);
        if (shouldSeed && existingTasks.length === 0 && plan.tasks.length > 0) {
          const planTasks = plan.tasks.map(task => ({
            ...task,
            date: plan.date,
            originalDate: plan.date, // 원래 계획된 날짜
            completed: false
          }));
          for (const task of planTasks) {
            await studyDB.saveTask(task);
          }
          tasksByDate[plan.date] = planTasks;
        } else {
          tasksByDate[plan.date] = existingTasks;
        }
      }

      if (shouldSeed) {
        // 새로 시드할 때는 과거 리뷰 상태 초기화
        clearDailyReviewKeys();
        localStorage.setItem(initFlagKey, 'true');
        // Seed 후 전체 리밸런싱 (용량 초과 날짜들을 앞으로 전파)
        await scheduleManager.rebalanceAll();
        // 리밸런싱 후 다시 로드
        for (const plan of studySchedule.dailyPlans) {
          tasksByDate[plan.date] = await studyDB.getTasksForDate(plan.date);
        }
      }
      
      setTasks(tasksByDate);
      // If we seeded because cloud was empty, publish seed to cloud so next loads use Firebase
      if (shouldSeed) {
        try {
          const allTasksNow = await studyDB.getAllTasks();
          const allProgressNow = await studyDB.getAllProgress();
          const allDailyNow = await studyDB.getAllDailyChecks();
          const deviceId = getDeviceId();
          await pushSnapshot('default-user', { tasks: allTasksNow, progress: allProgressNow, dailyChecks: allDailyNow }, { deviceId });
        } catch {}
      }
      // Avoid pushing from load to prevent loops on mobile
      // Notify other parts (like useProgress) to recompute from DB after (re)seeding or reload
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('progress-updated'));
      }
      console.log('Tasks loaded by date:', tasksByDate);
      console.log('=== LOADING TASKS END ===');
      
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  

  const getSubjectId = (subjectName: string) => {
    const subjectMap: { [key: string]: string } = {
      '신용분석사': 'credit-analyst',
      '선형대수학': 'linear-algebra',
      '미적분학': 'calculus',
      '확률과통계': 'statistics'
    };
    return subjectMap[subjectName] || '';
  };

  const isTaskCompleted = (taskId: string, subjectName: string) => {
    const subjectId = getSubjectId(subjectName);
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.completedTasks.includes(taskId) || false;
  };

  const handleTaskToggle = async (taskId: string, subjectName: string, checked: boolean) => {
    const subjectId = getSubjectId(subjectName);
    await toggleTask(taskId, subjectId, checked);
    // Push snapshot so other devices reflect the change
    try {
      const allTasks = await studyDB.getAllTasks();
      const allProgress = await studyDB.getAllProgress();
      const allDaily = await studyDB.getAllDailyChecks();
      const deviceId = getDeviceId();
      await pushSnapshot('default-user', { tasks: allTasks, progress: allProgress, dailyChecks: allDaily }, { deviceId });
    } catch {}
  };

  const handleDragStart = (_taskId: string) => {};

  const handleDragEnd = () => {};

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
  };

  // Mobile: start/stop drag and drop onto containers or tasks
  const handleMobileDragStart = (taskId: string) => {
    setMobileDraggingTaskId(taskId);
  };
  const handleMobileDropOnTask = async (targetTaskId: string, _targetDate: string) => {
    if (!mobileDraggingTaskId || mobileDraggingTaskId === targetTaskId) return;
    // reuse swap logic
    const fakeEvent: any = { preventDefault: () => {} , dataTransfer: { getData: () => mobileDraggingTaskId } };
    await handleDropOnTask(targetTaskId, _targetDate, fakeEvent);
    setMobileDraggingTaskId(null);
  };
  const handleMobileDropOnDate = async (targetDate: string) => {
    if (!mobileDraggingTaskId) return;
    // move into date container logic
    const fakeEvent: any = { preventDefault: () => {}, dataTransfer: { getData: () => mobileDraggingTaskId } };
    await handleDrop(fakeEvent, targetDate);
    setMobileDraggingTaskId(null);
  };

  const handleDropOnTask = async (targetTaskId: string, _targetDate: string, e: React.DragEvent) => {
    e.preventDefault();
    const draggedTaskId = e.dataTransfer.getData('text/plain');
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    // 스왑: 드래그한 태스크와 타겟 태스크의 날짜를 교환
    const dragged = await studyDB.tasks.get(draggedTaskId);
    const target = await studyDB.tasks.get(targetTaskId);
    if (!dragged || !target) return;

    // 타겟 태스크가 완료된 경우: 스왑하지 않고, 드래그한 태스크만 타겟 날짜로 이동
    const targetCompleted = isTaskCompleted(targetTaskId, target.subject);
    if (targetCompleted) {
      const targetDateNow = target.date;
      await studyDB.moveTaskToDate(draggedTaskId, targetDateNow);
      const targetSideTasksNow = await studyDB.getTasksForDate(targetDateNow);
      const completedPinnedIds = targetSideTasksNow
        .filter(t => isTaskCompleted(t.id, t.subject))
        .map(t => t.id);
      const pinIds = Array.from(new Set([draggedTaskId, ...completedPinnedIds]));
      const preferEvictIds = targetSideTasksNow
        .filter(t => !pinIds.includes(t.id))
        .map(t => t.id);
      await scheduleManager.cascadeFrom(targetDateNow, preferEvictIds, { date: targetDateNow, taskIds: pinIds });
      try {
        const allTasks = await studyDB.getAllTasks();
        const allProgress = await studyDB.getAllProgress();
        const allDaily = await studyDB.getAllDailyChecks();
        const deviceId = getDeviceId();
        await pushSnapshot('default-user', { tasks: allTasks, progress: allProgress, dailyChecks: allDaily }, { deviceId });
      } catch {}
      await loadTasks();
      return;
    }

    const sourceDate = dragged.date;
    const targetDateNow = target.date; // 신뢰
    if (sourceDate === targetDateNow) return; // 같은 날짜면 스왑 불필요 (현재는 순서 변경 미지원)

    // 1) 날짜 교환
    await studyDB.moveTaskToDate(draggedTaskId, targetDateNow);
    await studyDB.moveTaskToDate(targetTaskId, sourceDate);

    // 2) 두 날짜 각각 리밸런싱: 각각의 고정 태스크를 해당 날짜에 유지하고, 기존 태스크를 우선 퇴출
    const targetSideTasks = await studyDB.getTasksForDate(targetDateNow);
    const sourceSideTasks = await studyDB.getTasksForDate(sourceDate);
    const targetCompletedPinned = targetSideTasks.filter(t => isTaskCompleted(t.id, t.subject)).map(t => t.id);
    const sourceCompletedPinned = sourceSideTasks.filter(t => isTaskCompleted(t.id, t.subject)).map(t => t.id);
    const pinAtTarget = Array.from(new Set([draggedTaskId, ...targetCompletedPinned]));
    const pinAtSource = Array.from(new Set([targetTaskId, ...sourceCompletedPinned]));
    const preferEvictAtTarget = targetSideTasks.filter(t => !pinAtTarget.includes(t.id)).map(t => t.id);
    const preferEvictAtSource = sourceSideTasks.filter(t => !pinAtSource.includes(t.id)).map(t => t.id);

    // 먼저 더 이른 날짜부터 전파
    const earlierDate = sourceDate < targetDateNow ? sourceDate : targetDateNow;

    if (earlierDate === targetDateNow) {
      await scheduleManager.cascadeFrom(targetDateNow, preferEvictAtTarget, { date: targetDateNow, taskIds: pinAtTarget });
      await scheduleManager.cascadeFrom(sourceDate, preferEvictAtSource, { date: sourceDate, taskIds: pinAtSource });
    } else {
      await scheduleManager.cascadeFrom(sourceDate, preferEvictAtSource, { date: sourceDate, taskIds: pinAtSource });
      await scheduleManager.cascadeFrom(targetDateNow, preferEvictAtTarget, { date: targetDateNow, taskIds: pinAtTarget });
    }

    // 3) 동기화 후 리로드
    try {
      const allTasks = await studyDB.getAllTasks();
      const allProgress = await studyDB.getAllProgress();
      const allDaily = await studyDB.getAllDailyChecks();
      const deviceId = getDeviceId();
      await pushSnapshot('default-user', { tasks: allTasks, progress: allProgress, dailyChecks: allDaily }, { deviceId });
    } catch {}
    await loadTasks();
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId) {
      // 타겟 날짜로 이동
      await studyDB.moveTaskToDate(taskId, targetDate);
      // 타겟 날짜 리밸런싱 (초과 시 미래로 자동 밀림)
      // 방금 옮긴 태스크는 targetDate에 고정하고, 기존 targetDate 태스크들을 우선 내보내도록 설정
      const originalTargetTasks = await studyDB.getTasksForDate(targetDate);
      const completedPinnedIds = originalTargetTasks
        .filter(t => isTaskCompleted(t.id, t.subject))
        .map(t => t.id);
      const pinnedOnTarget = Array.from(new Set([taskId, ...completedPinnedIds]));
      const preferEvictIds = originalTargetTasks
        .filter(t => !pinnedOnTarget.includes(t.id))
        .map(t => t.id);
      await scheduleManager.cascadeFrom(targetDate, preferEvictIds, { date: targetDate, taskIds: pinnedOnTarget });
      // Push snapshot FIRST so subsequent cloud-first reload reflects the move
      try {
        const allTasks = await studyDB.getAllTasks();
        const allProgress = await studyDB.getAllProgress();
        const allDaily = await studyDB.getAllDailyChecks();
        const deviceId = getDeviceId();
        await pushSnapshot('default-user', { tasks: allTasks, progress: allProgress, dailyChecks: allDaily }, { deviceId });
      } catch {}
      // Reload tasks (cloud-first)
      await loadTasks();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'practice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case '신용분석사': return 'border-l-blue-500';
      case '선형대수학': return 'border-l-green-500';
      case '미적분학': return 'border-l-purple-500';
      case '확률과통계': return 'border-l-orange-500';
      default: return 'border-l-gray-500';
    }
  };

  const beginEditCapacity = (date: string, current: number) => {
    setEditingCapacityDate(date);
    setCapacityValue(String(current));
  };

  const cancelEditCapacity = () => {
    setEditingCapacityDate(null);
    setCapacityValue('');
  };

  const saveEditCapacity = (date: string) => {
    const newVal = parseFloat(capacityValue);
    if (!isNaN(newVal) && newVal > 0) {
      const plan = studySchedule.dailyPlans.find(p => p.date === date);
      if (plan) {
        plan.totalHours = Math.round(newVal * 100) / 100;
        // Sync day settings to cloud
        try {
          const deviceId = getDeviceId();
          // Await to ensure the write is actually sent
          (async () => {
            await pushDaySettingsOnly('default-user', [{ date, totalHours: plan.totalHours }], { deviceId });
          })();
        } catch {}
      }
    }
    cancelEditCapacity();
  };

  // Get today's date and calculate the range
  const today = getLocalDateString(new Date()); // Real today date
  const todayPlan = studySchedule.dailyPlans.find(plan => plan.date === today);
  const todayTasks = tasks[today] || [];

  // Calculate the date range: find today's index and show 14 days from today
  const todayIndex = studySchedule.dailyPlans.findIndex(plan => plan.date === today);
  const startIndex = todayIndex >= 0 ? todayIndex : 0; // If today not found, start from beginning
  const endIndex = Math.min(startIndex + 14, studySchedule.dailyPlans.length); // Show 14 days or until end
  const displayPlans = studySchedule.dailyPlans.slice(startIndex, endIndex);

  // 예상 완강 날짜 - 과목별 (복습 제외, 미완료 태스크의 마지막 날짜)
  const allTasksFlat: TaskRecord[] = Object.values(tasks).flat();
  const subjectsInTasks = Array.from(new Set(allTasksFlat.map(t => t.subject)));
  const predictedFinishBySubject: { [subject: string]: string | null } = {};
  for (const subjectName of subjectsInTasks) {
    const remaining = allTasksFlat.filter(t => t.subject === subjectName && t.type !== 'review' && !isTaskCompleted(t.id, t.subject));
    predictedFinishBySubject[subjectName] = remaining.length
      ? remaining.reduce((max, t) => (t.date > max ? t.date : max), remaining[0].date)
      : null; // 남은 강의가 없으면 null로 표시 (완강)
  }

  return (
    <div className="space-y-6">
      {/* Daily Review Modal */}
      <DailyReviewModal
        isOpen={showDailyReview}
        onClose={() => setShowDailyReview(false)}
        onConfirm={handleDailyReviewConfirm}
        onCancel={handleDailyReviewCancel}
        yesterdayTasks={yesterdayTasks}
        yesterdayDate={yesterdayDate}
      />

      {/* Debug Controls */}
      {/* <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <RefreshCw className="h-5 w-5" />
            디버그 컨트롤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleManualRefresh}
              disabled={isLoading}
            >
              {isLoading ? '로딩 중...' : '수동 새로고침'}
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                setIsLoading(true);
                await scheduleManager.rebalanceAll();
                await loadTasks();
                setIsLoading(false);
              }}
            >
              {isLoading ? '로딩 중...' : '전체 리밸런싱'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => studyDB.getAllTasks()}
            >
              모든 태스크 콘솔 출력
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (confirm('정말로 모든 태스크를 삭제하고 초기화하시겠습니까?')) {
                  await studyDB.clearAllTasks();
                  await loadTasks();
                  console.log('Database reset completed');
                }
              }}
            >
              데이터베이스 초기화
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Today's Schedule */}
      {todayPlan && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <BookOpen className="h-5 w-5" />
              오늘의 학습 계획 ({todayPlan.date} {todayPlan.dayOfWeek})
              {isLoading && <span className="text-sm text-gray-500">(로딩 중...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap gap-y-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  총 {todayPlan.totalHours}시간
                </div>
                <Badge variant={todayPlan.isWeekend ? 'secondary' : 'default'}>
                  {todayPlan.isWeekend ? '주말' : '평일'}
                </Badge>
                {/* Holiday badge omitted to avoid type dependency */}
              </div>
              
              <div
                className="space-y-3 min-h-[100px] p-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-25"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, today)}
                onTouchEnd={() => handleMobileDropOnDate(today)}
              >
                {todayTasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    isCompleted={isTaskCompleted(task.id, task.subject)}
                    onToggle={(taskId, checked) => handleTaskToggle(taskId, task.subject, checked)}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    getSubjectColor={getSubjectColor}
                    getTypeColor={getTypeColor}
                    onDropOnTask={handleDropOnTask}
                    onMobileDragStart={handleMobileDragStart}
                    onMobileDropOnTask={handleMobileDropOnTask}
                    isMobileDragging={mobileDraggingTaskId !== null}
                  />
                ))}
                {todayTasks.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    오늘 할 일이 없습니다. 다른 날짜에서 드래그해서 가져오세요.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap w-full sm:items-center">
            <CalendarIcon className="h-5 w-5" />
            주간 학습 계획
            <Badge variant="secondary" className="ml-2 sm:ml-auto whitespace-nowrap">
              {startIndex + 1}일차 ~ {endIndex}일차
            </Badge>
            <div className="flex gap-2 flex-wrap ml-2">
              {Object.entries(predictedFinishBySubject).map(([subjectName, dateStr]) => (
                <Badge key={subjectName} className="whitespace-nowrap" title="복습 제외, 미완료 기준">
                  {subjectName}: {dateStr ?? '완강 완료'}
                </Badge>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayPlans.map((plan) => {
              const planTasks = tasks[plan.date] || [];
              const totalDuration = planTasks.reduce((sum, task) => sum + task.duration, 0);
              const isOverCapacity = totalDuration > plan.totalHours;
              
              return (
                <div key={plan.date} className={`border rounded-lg p-4 ${isOverCapacity ? 'border-red-300 bg-red-50' : ''}`}>
                  <div className="flex justify-between mb-3 flex-wrap gap-y-2 items-start sm:items-center">
                    <div className="flex items-center gap-3 flex-wrap gap-y-2">
                      <h3 className="font-semibold text-lg">
                        {plan.date} ({plan.dayOfWeek})
                      </h3>
                      <Badge variant={plan.isWeekend ? 'secondary' : 'default'}>
                        {plan.isWeekend ? '주말' : '평일'}
                      </Badge>
                      {/* Holiday badge omitted to avoid type dependency */}
                      {plan.date === today && (
                        <Badge className="bg-blue-500">오늘</Badge>
                      )}
                      {isOverCapacity && (
                        <Badge variant="destructive">시간 초과</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 select-none flex-wrap gap-y-1">
                      <Clock className="h-4 w-4" />
                      {editingCapacityDate === plan.date ? (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">{totalDuration.toFixed(1)}/</span>
                          <input
                            autoFocus
                            type="number"
                            step="0.25"
                            min="0.25"
                            className="w-20 px-2 py-1 border rounded text-gray-900"
                            value={capacityValue}
                            onChange={(e) => setCapacityValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditCapacity(plan.date);
                              if (e.key === 'Escape') cancelEditCapacity();
                            }}
                            onBlur={() => saveEditCapacity(plan.date)}
                          />
                          <span className="text-gray-500">시간</span>
                        </div>
                      ) : (
                        <span
                          title="더블클릭하여 일일 최대 시간 수정"
                          onDoubleClick={() => beginEditCapacity(plan.date, plan.totalHours)}
                          className={isOverCapacity ? 'text-red-600 font-bold cursor-text' : 'cursor-text'}
                        >
                          {totalDuration.toFixed(1)}/{plan.totalHours}시간
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div
                    className="space-y-2 min-h-[80px] p-2 border-2 border-dashed border-gray-200 rounded-lg bg-gray-25"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, plan.date)}
                    onTouchEnd={() => handleMobileDropOnDate(plan.date)}
                  >
                    {planTasks.map((task) => (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        isCompleted={isTaskCompleted(task.id, task.subject)}
                        onToggle={(taskId, checked) => handleTaskToggle(taskId, task.subject, checked)}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        getSubjectColor={getSubjectColor}
                        getTypeColor={getTypeColor}
                        onDropOnTask={handleDropOnTask}
                        onMobileDragStart={handleMobileDragStart}
                        onMobileDropOnTask={handleMobileDropOnTask}
                        isMobileDragging={mobileDraggingTaskId !== null}
                      />
                    ))}
                    {planTasks.length === 0 && (
                      <div className="text-center text-gray-400 py-4 text-sm">
                        이 날짜에는 할 일이 없습니다
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyCalendar;