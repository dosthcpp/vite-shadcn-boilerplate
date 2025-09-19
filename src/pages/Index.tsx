import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import StudyCalendar from '@/components/StudyCalendar';
import ProgressOverview from '@/components/ProgressOverview';

export default function Index() {
  const { subjects, loading } = useProgress();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Set current date dynamically
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setCurrentDate(formattedDate);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">학습 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const totalProgress = subjects.reduce((acc, subject) => acc + subject.current, 0);
  const totalGoal = subjects.reduce((acc, subject) => acc + subject.total, 0);
  const overallPercentage = totalGoal > 0 ? Math.round((totalProgress / totalGoal) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            학습 관리 시스템
          </h1>
          <p className="text-gray-600">
            신용분석사 시험 & AI대학원 준비 ({currentDate})
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 border-2 border-blue-100 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              전체 진도 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">전체 완료율</span>
                <span className="text-2xl font-bold text-blue-600">{overallPercentage}%</span>
              </div>
              <Progress value={overallPercentage} className="h-3" />
              <div className="text-sm text-gray-600 text-center">
                {totalProgress} / {totalGoal} 강의 완료
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              학습 캘린더
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              과목별 진도
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <StudyCalendar />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressOverview />
            {/* <div className="grid gap-6 md:grid-cols-2">
              {subjects.map((subject) => {
                const percentage = Math.round((subject.current / subject.total) * 100);
                return (
                  <Card key={subject.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">{subject.name}</span>
                        <Badge className={subject.color}>
                          {percentage}%
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">{subject.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress value={percentage} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {subject.current} / {subject.total} 강의
                          </span>
                          <span className="text-gray-500">
                            남은 강의: {subject.total - subject.current}개
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div> */}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}