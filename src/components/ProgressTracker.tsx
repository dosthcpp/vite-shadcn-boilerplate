import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Clock, TrendingUp } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';

const ProgressTracker = () => {
  const { subjects, loading } = useProgress();

  if (loading) {
    return <div>Loading progress...</div>;
  }

  const calculateDaysRemaining = (description: string) => {
    const today = new Date('2025-09-16'); // Fixed date for demo
    let targetDate: Date;
    
    if (description.includes('10/25')) {
      targetDate = new Date('2025-10-25');
    } else if (description.includes('10/19')) {
      targetDate = new Date('2025-10-19');
    } else {
      return null;
    }
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const totalProgress = subjects.reduce((acc, subject) => {
    return acc + (subject.current / subject.total) * 100;
  }, 0) / subjects.length;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="border-2 border-green-200 bg-green-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="h-5 w-5" />
            전체 학습 진도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-800">
                {totalProgress.toFixed(1)}%
              </span>
              <Badge variant="secondary">
                {subjects.reduce((acc, s) => acc + s.current, 0)} / {subjects.reduce((acc, s) => acc + s.total, 0)} 완료
              </Badge>
            </div>
            <Progress value={totalProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Subject Progress Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {subjects.map((subject) => {
          const progressPercent = (subject.current / subject.total) * 100;
          const daysRemaining = calculateDaysRemaining(subject.description);
          
          return (
            <Card key={subject.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${subject.color}`} />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{subject.name}</CardTitle>
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                  {daysRemaining !== null && (
                    <Badge variant={daysRemaining <= 7 ? 'destructive' : 'secondary'}>
                      D-{daysRemaining}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">진도율</span>
                    </div>
                    <span className="font-semibold text-lg">
                      {progressPercent.toFixed(1)}%
                    </span>
                  </div>
                  
                  <Progress value={progressPercent} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">
                        {subject.current} / {subject.total} 완료
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {subject.total - subject.current} 남음
                    </span>
                  </div>

                  {subject.current > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Clock className="h-4 w-4" />
                        <span>최근 완료: {subject.completedTasks.length}개 항목</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Study Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>학습 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {subjects.reduce((acc, s) => acc + s.current, 0)}
              </div>
              <div className="text-sm text-gray-600">완료한 강의</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {subjects.reduce((acc, s) => acc + s.total - s.current, 0)}
              </div>
              <div className="text-sm text-gray-600">남은 강의</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {subjects.filter(s => s.current > 0).length}
              </div>
              <div className="text-sm text-gray-600">진행 중인 과목</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {totalProgress.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">전체 진도율</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;