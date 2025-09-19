import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { TaskRecord } from '@/lib/database';

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  onConfirm: (completedTasks: string[]) => void;
  yesterdayTasks: TaskRecord[];
  yesterdayDate: string;
}

const DailyReviewModal = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  yesterdayTasks,
  yesterdayDate
}: DailyReviewModalProps) => {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    if (checked) {
      setCompletedTasks([...completedTasks, taskId]);
    } else {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    }
  };

  const handleConfirm = () => {
    onConfirm(completedTasks);
    setCompletedTasks([]);
  };

  const handleClose = () => {
    onClose();
    void Promise.resolve(onCancel()).catch((error: unknown) => {
      console.error('DailyReviewModal onCancel error:', error);
    });
    setCompletedTasks([]);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'practice': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalHours = yesterdayTasks.reduce((sum, task) => sum + task.duration, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            학습 완료 체크 ({yesterdayDate})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-800 mb-2">
              {yesterdayDate}에 계획했던 학습을 실제로 완료했는지 체크해주세요.
            </p>
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Clock className="h-4 w-4" />
              총 계획 시간: {totalHours}시간
            </div>
          </div>

          <div className="space-y-3">
            {yesterdayTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-3">
                <div className={`border-l-4 ${getSubjectColor(task.subject)} pl-3`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={task.id}
                      checked={completedTasks.includes(task.id)}
                      onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{task.subject}</span>
                        <Badge className={getTypeColor(task.type)}>
                          {task.type === 'lecture' ? '강의' : 
                           task.type === 'review' ? '복습' : '문제풀이'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{task.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{task.lectures}</span>
                        <span>{task.duration}시간</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>참고:</strong> "취소"를 눌러도 모든 미완료 과제는 자동으로 오늘 일정에 추가됩니다. 완료 체크 후 다음 미리뷰 날짜가 자동으로 표시됩니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소 (모든 과제 오늘로 이동)
          </Button>
          <Button onClick={handleConfirm}>
            확인 ({completedTasks.length}개 완료, {yesterdayTasks.length - completedTasks.length}개 이동)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyReviewModal;