import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical } from 'lucide-react';
import { TaskRecord } from '@/lib/database';

interface DraggableTaskProps {
  task: TaskRecord;
  isCompleted: boolean;
  onToggle: (taskId: string, checked: boolean) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
  getSubjectColor: (subject: string) => string;
  getTypeColor: (type: string) => string;
}

const DraggableTask = ({
  task,
  isCompleted,
  onToggle,
  onDragStart,
  onDragEnd,
  getSubjectColor,
  getTypeColor
}: DraggableTaskProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart(task.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'
      } ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white'}`}
    >
      <CardContent className="p-3">
        <div className={`border-l-4 ${getSubjectColor(task.subject)} pl-3`}>
          <div className="flex items-start gap-3">
            <GripVertical className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
            <Checkbox
              id={task.id}
              checked={isCompleted}
              onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
              className="mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.subject}
                </span>
                <Badge size="sm" className={getTypeColor(task.type)}>
                  {task.type === 'lecture' ? '강의' : 
                   task.type === 'review' ? '복습' : '문제풀이'}
                </Badge>
                {task.original_date && task.original_date !== task.date && (
                  <Badge variant="outline" size="sm" className="text-xs">
                    이동됨
                  </Badge>
                )}
              </div>
              <p className={`text-sm mb-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {task.content}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{task.lectures}</span>
                <span>{task.duration}시간</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DraggableTask;