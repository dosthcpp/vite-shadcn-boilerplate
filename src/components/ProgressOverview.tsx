import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Target, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { studySchedule } from '@/data/studyPlan';

const ProgressOverview = () => {
  const { subjects, loading } = useProgress();

  // Build a lookup of taskId -> { date, content, subject }
  const taskById: { [id: string]: { date: string; content: string; subject: string } } = {};
  for (const plan of studySchedule.dailyPlans) {
    for (const t of plan.tasks) {
      taskById[t.id] = { date: plan.date, content: t.content, subject: t.subject };
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">진도 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">진도 정보가 없습니다</h3>
              <p className="text-gray-500">학습 계획을 시작하면 진도가 표시됩니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalProgress = subjects.reduce((acc, subject) => {
    return acc + (subject.current / subject.total) * 100;
  }, 0) / subjects.length;

  const totalCompleted = subjects.reduce((acc, subject) => acc + subject.current, 0);
  const totalTasks = subjects.reduce((acc, subject) => acc + subject.total, 0);

  return (
    <div className="space-y-6">
      {/* Overall Progress Summary */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-5 w-5" />
            전체 학습 진도
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">전체 진행률</span>
              <span className="text-2xl font-bold text-blue-600">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{totalCompleted} / {totalTasks} 완료</span>
              <span>{subjects.length}개 과목</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Subject Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        {subjects.map((subject) => {
          const progressPercentage = (subject.current / subject.total) * 100;
          const isCompleted = subject.current >= subject.total;
          
          const completedDetails = subject.completedTasks
            .map((id) => ({ id, ...taskById[id] }))
            .filter((x) => x.date);

          return (
            <Card key={subject.id} className={`border-l-4 ${subject.color.replace('bg-', 'border-l-')} hover:shadow-md transition-shadow`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{subject.name}</CardTitle>
                    <p className="text-sm text-gray-600">{subject.description}</p>
                  </div>
                  {isCompleted && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      완료
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">진행률</span>
                  <span className="text-xl font-bold" style={{ color: subject.color.replace('bg-', '') }}>
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                
                <Progress value={progressPercentage} className="h-2" />
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>{subject.current} / {subject.total}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{subject.completedTasks.length}개 완료</span>
                  </div>
                </div>

                {/* Progress Details */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">남은 학습량</span>
                      <p className="font-medium text-gray-900">{subject.total - subject.current}개</p>
                    </div>
                    <div>
                      <span className="text-gray-500">완료율</span>
                      <p className="font-medium text-gray-900">{Math.round(progressPercentage)}%</p>
                    </div>
                  </div>
                </div>

                {/* Completed Items List */}
                {completedDetails.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">완료한 항목</span>
                      <Badge variant="outline" className="ml-1">{completedDetails.length}</Badge>
                    </div>
                    <ul className="space-y-1 max-h-48 overflow-auto pr-1">
                      {completedDetails.map((item) => (
                        <li key={item.id} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="mt-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0"></span>
                          <span className="flex-1">
                            <span className="font-medium">{item.date}</span>
                            <span className="mx-1 text-gray-400">·</span>
                            <span>{item.content}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Study Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            학습 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{subjects.length}</div>
              <div className="text-sm text-gray-600">총 과목 수</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
              <div className="text-sm text-gray-600">완료한 학습</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{totalTasks - totalCompleted}</div>
              <div className="text-sm text-gray-600">남은 학습</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.round(totalProgress)}%</div>
              <div className="text-sm text-gray-600">전체 진행률</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressOverview;