import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studyDB, TaskRecord, ProgressRecord, DailyCheckRecord } from '@/lib/database';
import { toCsv, downloadCsv, parseCsv } from '@/lib/csv';
import { downloadJson } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';

type Dataset = 'tasks' | 'progress' | 'dailyChecks';

export default function DataExportImport() {
  const [busy, setBusy] = useState<Dataset | null>(null);
  const [status, setStatus] = useState<string>('');

  // Keeping CSV helpers for potential future use, currently hidden in UI
  const exportCsv = async (dataset: Dataset) => {
    try {
      setBusy(dataset);
      if (dataset === 'tasks') {
        const rows = await studyDB.getAllTasks();
        const csv = toCsv(rows as any, [
          'id','subject','type','content','lectures','duration','date','originalDate','completed'
        ]);
        downloadCsv('tasks.csv', csv);
      } else if (dataset === 'progress') {
        const rows = await studyDB.getAllProgress();
        const normalized = rows.map(r => ({
          id: r.id,
          subjectId: r.subjectId,
          completedTasks: (r.completedTasks || []).join(';'),
          lastUpdated: r.lastUpdated ? new Date(r.lastUpdated).toISOString() : ''
        }));
        const csv = toCsv(normalized as any, ['id','subjectId','completedTasks','lastUpdated']);
        downloadCsv('progress.csv', csv);
      } else if (dataset === 'dailyChecks') {
        const rows = await studyDB.getAllDailyChecks();
        const normalized = rows.map(r => ({
          id: r.id,
          date: r.date,
          completedTasks: (r.completedTasks || []).join(';'),
          checkedAt: r.checkedAt ? new Date(r.checkedAt).toISOString() : ''
        }));
        const csv = toCsv(normalized as any, ['id','date','completedTasks','checkedAt']);
        downloadCsv('daily_checks.csv', csv);
      }
      toast('CSV 내보내기 완료', { description: `${dataset} 데이터를 CSV로 저장했습니다.` });
      setStatus(`${dataset} CSV 저장 완료`);
    } catch (e: any) {
      toast('내보내기 실패', { description: e?.message || String(e) });
      setStatus(`내보내기 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const importCsv = async (dataset: Dataset, file: File | null) => {
    if (!file) return;
    try {
      setBusy(dataset);
      const text = await file.text();
      const { rows } = parseCsv(text);
      if (dataset === 'tasks') {
        const records: TaskRecord[] = rows.map(r => ({
          id: String(r.id),
          subject: String(r.subject),
          type: (String(r.type) as any),
          content: String(r.content ?? ''),
          lectures: String(r.lectures ?? ''),
          duration: Number(r.duration ?? 0),
          date: String(r.date),
          originalDate: String(r.originalDate ?? r.date ?? ''),
          completed: String(r.completed ?? '').toLowerCase() === 'true'
        }));
        await studyDB.clearAllTasks();
        await studyDB.bulkSaveTasks(records);
      } else if (dataset === 'progress') {
        const records: ProgressRecord[] = rows.map(r => ({
          id: String(r.id ?? r.subjectId),
          subjectId: String(r.subjectId ?? r.id),
          completedTasks: String(r.completedTasks || '')
            .split(';').map(s => s.trim()).filter(Boolean),
          lastUpdated: r.lastUpdated ? new Date(String(r.lastUpdated)) : new Date()
        }));
        await studyDB.clearAllProgress();
        await studyDB.bulkSaveProgress(records);
      } else if (dataset === 'dailyChecks') {
        const records: DailyCheckRecord[] = rows.map(r => ({
          id: String(r.id ?? r.date),
          date: String(r.date ?? r.id),
          completedTasks: String(r.completedTasks || '')
            .split(';').map(s => s.trim()).filter(Boolean),
          checkedAt: r.checkedAt ? new Date(String(r.checkedAt)) : new Date()
        }));
        await studyDB.clearAllDailyChecks();
        await studyDB.bulkSaveDailyChecks(records);
      }
      toast('CSV 가져오기 완료', { description: `${dataset} 데이터를 업데이트했습니다.` });
      setStatus(`${dataset} CSV 가져오기 완료`);
    } catch (e: any) {
      toast('가져오기 실패', { description: e?.message || String(e) });
      setStatus(`가져오기 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const exportAllJson = async () => {
    try {
      setBusy('tasks');
      const [tasks, progress, dailyChecks] = await Promise.all([
        studyDB.getAllTasks(),
        studyDB.getAllProgress(),
        studyDB.getAllDailyChecks(),
      ]);
      downloadJson('timetable-backup.json', { tasks, progress, dailyChecks });
      toast('백업 완료', { description: '전체 데이터를 JSON으로 내보냈습니다.' });
      setStatus('JSON 백업 파일 저장 완료');
    } catch (e: any) {
      toast('백업 실패', { description: e?.message || String(e) });
      setStatus(`백업 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const importAllJson = async (file: File | null) => {
    if (!file) return;
    try {
      setBusy('tasks');
      const text = await file.text();
      const data = JSON.parse(text);
      const tasks: TaskRecord[] = Array.isArray(data?.tasks) ? data.tasks : [];
      const progress: ProgressRecord[] = Array.isArray(data?.progress) ? data.progress : [];
      const dailyChecks: DailyCheckRecord[] = Array.isArray(data?.dailyChecks) ? data.dailyChecks : [];
      await studyDB.clearAllTasks();
      await studyDB.clearAllProgress();
      await studyDB.clearAllDailyChecks();
      if (tasks.length) await studyDB.bulkSaveTasks(tasks);
      if (progress.length) await studyDB.bulkSaveProgress(progress.map(p => ({
        ...p,
        lastUpdated: p.lastUpdated ? new Date(p.lastUpdated) as any : new Date(),
      })));
      if (dailyChecks.length) await studyDB.bulkSaveDailyChecks(dailyChecks.map(d => ({
        ...d,
        checkedAt: d.checkedAt ? new Date(d.checkedAt) as any : new Date(),
      })));
      const msg = `복원 완료 - tasks: ${tasks.length}, progress: ${progress.length}, dailyChecks: ${dailyChecks.length}`;
      toast('복원 완료', { description: msg });
      setStatus(msg);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('database-restored'));
        window.dispatchEvent(new CustomEvent('progress-updated'));
      }
    } catch (e: any) {
      toast('복원 실패', { description: e?.message || String(e) });
      setStatus(`복원 실패: ${e?.message || String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>데이터 내보내기/가져오기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Button disabled={busy !== null} onClick={exportAllJson}>전체 내보내기 (JSON)</Button>
            <input
              id="import-json"
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0] || null;
                await importAllJson(file);
                // allow selecting the same file again to retrigger onChange
                e.currentTarget.value = '';
              }}
              disabled={busy !== null}
            />
            <label htmlFor="import-json">
              <Button variant="outline" disabled={busy !== null}>JSON 가져오기</Button>
            </label>
          </div>
          {status && <div className="text-sm text-gray-600">{status}</div>}
        </div>
        {/* <div className="grid gap-4 md:grid-cols-3">
          {(['tasks','progress','dailyChecks'] as Dataset[]).map(key => (
            <div key={key} className="flex flex-col gap-2 border rounded-md p-4">
              <div className="font-medium">{key} (CSV)</div>
              <div className="flex items-center gap-2">
                <Button disabled={busy !== null} onClick={() => exportCsv(key)}>내보내기</Button>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => importCsv(key, e.target.files?.[0] || null)}
                    disabled={busy !== null}
                  />
                </label>
              </div>
            </div>
          ))}
        </div> */}
      </CardContent>
    </Card>
  );
}



