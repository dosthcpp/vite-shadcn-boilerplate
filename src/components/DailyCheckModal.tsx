import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { TaskRecord } from '@/lib/database';

interface DailyCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  yesterdayTasks: TaskRecord[];
  onConfirm: (completedTaskIds: string[]) => void;
  date: string;
}

const DailyCheckModal = ({ isOpen, onClose, yesterdayTasks, onConfirm, date }: DailyCheckModalProps) => {
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

  const handleTaskCheck = (taskId: string, checked: boolean) => {
    const newChecked = new Set(checkedTasks);
    if (checked) {
      newChecked.add(taskId);
    } else {
      newChecked.delete(taskId);
    }
    setCheckedTasks(newChecked);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(checkedTasks));
    setCheckedTasks(new Set());
    onClose();
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            어제({date}) 학습 완료 체크
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            어제 계획했던 학습을 실제로 완료했는지 체크해주세요.
          </p>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {yesterdayTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-3">
                <div className={`border-l-4 ${getSubjectColor(task.subject)} pl-3`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={task.id}
                      checked={checkedTasks.has(task.id)}
                      onCheckedChange={(checked) => handleTaskCheck(task.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{task.subject}</span>
                        <Badge size="sm" className={getTypeColor(task.type)}>
                          {task.type === 'lecture' ? '강의' : 
                           task.type === 'review' ? '복습' : '문제풀이'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{task.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{task.lectures}</span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{task.duration}시간</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              확인 ({checkedTasks.size}/{yesterdayTasks.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyCheckModal;