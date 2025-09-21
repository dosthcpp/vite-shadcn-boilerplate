import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const expected = (import.meta as any).env?.VITE_PASSWORD as string | undefined;
  const state = location.state as any;
  const nextPath = state?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expected) {
      // If no password is configured, let users in
      localStorage.setItem('auth-ok', '1');
      localStorage.setItem('auth-exp', String(Date.now() + 30 * 60 * 1000));
      navigate(nextPath, { replace: true });
      return;
    }
    setLoading(true);
    try {
      if (password === expected) {
        localStorage.setItem('auth-ok', '1');
        localStorage.setItem('auth-exp', String(Date.now() + 30 * 60 * 1000));
        navigate(nextPath, { replace: true });
      } else {
        toast('비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center">로그인</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm text-gray-600 mb-1">비밀번호</label>
              <input
                id="password"
                type="password"
                autoFocus
                className="w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-300 text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '확인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;


