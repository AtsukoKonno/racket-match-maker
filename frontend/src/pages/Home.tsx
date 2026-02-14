import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventSummary } from '../types';
import { API_BASE_URL } from '../config';
import Header from '../components/Header';

export default function Home() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('イベントコードを入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/by-code/${trimmedCode}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('イベントが見つかりません。コードを確認してください。');
        } else {
          setError('エラーが発生しました');
        }
        return;
      }
      const event: EventSummary = await res.json();
      navigate(`/join/${event.id}`);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container">
      
      <div className="card">
        <h2>イベントに参加する</h2>
        <p style={{ marginBottom: '16px', color: '#4A5568' }}>
          主催者から共有されたイベントコードを入力してください
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>イベントコード（6桁）</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="例: ABC123"
              maxLength={6}
              style={{ 
                textTransform: 'uppercase', 
                letterSpacing: '0.2em',
                fontSize: '1.2rem',
                textAlign: 'center'
              }}
            />
          </div>
          
          {error && <div className="error-box">{error}</div>}
          
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? '検索中...' : '参加する'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>新しいイベントを作成する</h2>
        <p style={{ marginBottom: '16px', color: '#4A5568' }}>
          主催者の方はこちらからイベントを作成できます
        </p>
        <button 
          className="btn btn-secondary btn-block"
          onClick={() => navigate('/create')}
        >
          イベントを作成
        </button>
      </div>
      </div>
    </>
  );
}
