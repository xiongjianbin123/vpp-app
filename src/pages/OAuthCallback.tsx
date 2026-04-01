import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';
import type { UserInfo } from '../services/authService';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const userParam = params.get('user');
    const error = params.get('error');

    if (error || !token || !userParam) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam)) as UserInfo;
      loginWithToken(token, user);
      navigate('/', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  }, [params, loginWithToken, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="正在登录..." />
    </div>
  );
}
