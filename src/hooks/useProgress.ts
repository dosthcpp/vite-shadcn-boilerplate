import { useState, useEffect } from 'react';
import { studyDB } from '@/lib/database';
import { studySchedule } from '@/data/studyPlan';

export interface SubjectProgress {
  id: string;
  name: string;
  current: number;
  total: number;
  color: string;
  description: string;
  completedTasks: string[];
}

export const useProgress = () => {
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    try {
      // 사전 정의된 과목 메타 정보
      const subjectMeta: { [key: string]: { name: string; color: string; description: string } } = {
        'credit-analyst': {
          name: '신용분석사',
          color: 'bg-blue-500',
          description: '신용분석사 시험 준비 (10/25 시험)'
        },
        'linear-algebra': {
          name: '선형대수학',
          color: 'bg-green-500',
          description: 'AI대학원 준비 - 선형대수학 (10/19까지)'
        },
        'calculus': {
          name: '미적분학',
          color: 'bg-purple-500',
          description: 'AI대학원 준비 - 미적분학 (10/19까지)'
        },
        'statistics': {
          name: '확률과통계',
          color: 'bg-orange-500',
          description: 'AI대학원 준비 - 확률과통계 (10/19까지)'
        }
      };

      // 각 과목의 총 태스크 수 계산 (DB 기준, 없으면 스케줄 기준)
      const totalBySubjectId: { [key: string]: number } = {
        'credit-analyst': 0,
        'linear-algebra': 0,
        'calculus': 0,
        'statistics': 0
      };

      const nameToId = (name: string) => {
        if (name === '신용분석사') return 'credit-analyst';
        if (name === '선형대수학') return 'linear-algebra';
        if (name === '미적분학') return 'calculus';
        if (name === '확률과통계') return 'statistics';
        return '';
      };

      // 1) 우선 DB에서 실제 태스크를 카운트 (중복 ID/오버라이드 반영)
      const allTasks = await studyDB.getAllTasks();
      if (allTasks.length > 0) {
        for (const t of allTasks) {
          const sid = nameToId(t.subject);
          if (sid) totalBySubjectId[sid] = (totalBySubjectId[sid] || 0) + 1;
        }
      } else {
        // 2) DB가 비어있으면 스케줄 정의로 카운트 (초기 상태)
        for (const plan of studySchedule.dailyPlans) {
          for (const task of plan.tasks) {
            const sid = nameToId(task.subject);
            if (sid) totalBySubjectId[sid] = (totalBySubjectId[sid] || 0) + 1;
          }
        }
      }

      // 진행 데이터 로드 (없으면 0으로 간주)
      const progressData = await studyDB.getAllProgress();
      const progressById: { [key: string]: string[] } = {};
      for (const p of progressData) {
        progressById[p.subjectId] = p.completedTasks || [];
      }

      const allSubjectIds = Object.keys(subjectMeta);
      const formattedSubjects = allSubjectIds.map((sid) => {
        const meta = subjectMeta[sid];
        const completed = progressById[sid] || [];
        const total = totalBySubjectId[sid] || 0;
        return {
          id: sid,
          name: meta.name,
          current: Math.min(completed.length, total),
          total,
          color: meta.color,
          description: meta.description,
          completedTasks: completed
        } as SubjectProgress;
      });

      console.log('formattedSubjects', formattedSubjects);

      setSubjects(formattedSubjects);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, subjectId: string, isCompleted: boolean) => {
    try {
      if (isCompleted) {
        await studyDB.markTaskCompleted(taskId, subjectId);
      } else {
        await studyDB.markTaskUncompleted(taskId, subjectId);
      }
      await loadProgress(); // Reload to get updated data
      // 다른 훅 인스턴스에도 업데이트 이벤트 브로드캐스트
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('progress-updated'));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  useEffect(() => {
    loadProgress();
    // 전역 진행도 업데이트 이벤트 수신하여 재로딩
    const handler = () => { loadProgress(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('progress-updated', handler as EventListener);
      window.addEventListener('database-restored', handler as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('progress-updated', handler as EventListener);
        window.removeEventListener('database-restored', handler as EventListener);
      }
    };
  }, []);

  return {
    subjects,
    loading,
    toggleTask,
    refreshProgress: loadProgress
  };
};