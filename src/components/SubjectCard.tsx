import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SubjectProgress } from '@/types/study';

interface SubjectCardProps {
  subject: SubjectProgress;
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const progressPercentage = (subject.current / subject.total) * 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
          {subject.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subject.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>진도</span>
            <span className="font-medium">
              {subject.current}/{subject.total}강
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-right text-sm text-muted-foreground">
            {progressPercentage.toFixed(1)}% 완료
          </div>
        </div>
      </CardContent>
    </Card>
  );
}