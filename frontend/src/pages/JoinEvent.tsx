import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventData, Participant } from '../types';
import { API_BASE_URL } from '../config';

export default function JoinEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const [name, setName] = useState('');
  const [level, setLevel] = useState<Participant['level']>('intermediate');
  const [ruleUnderstanding, setRuleUnderstanding] = useState<Participant['ruleUnderstanding']>('knows');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
      if (!res.ok) {
        setError('イベントが見つかりません');
        return;
      }
      const data = await res.json();
      setEvent(data);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), level, ruleUnderstanding })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '登録に失敗しました');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">読み込み中...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <div className="error-box">{error || 'イベントが見つかりません'}</div>
        <button className="btn btn-secondary btn-block mt-2" onClick={() => navigate('/')}>
          トップに戻る
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container">
        <div className="card">
          <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>登録完了！</h2>
          <div className="success-box" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
              <strong>{name}</strong> さんの参加登録が完了しました
            </p>
            <p style={{ color: '#4A5568' }}>
              スケジュールが生成されたら、主催者からお知らせがあります
            </p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary btn-block"
              onClick={() => navigate(`/event/${id}`)}
            >
              スケジュールを確認する
            </button>
            <button 
              className="btn btn-secondary btn-block mt-2"
              onClick={() => navigate('/')}
            >
              トップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>参加登録</h1>
      
      <div className="card">
        <h2>{event.name}</h2>
        <p style={{ color: '#4A5568', marginBottom: '8px' }}>
          📅 {event.date} {event.startTime}〜{event.endTime}
        </p>
        <p style={{ color: '#7AB2B2', fontSize: '0.9rem' }}>
          現在 {event.participants.length} 名が参加予定
        </p>
      </div>

      <div className="card">
        <h2>あなたの情報を入力</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 山田太郎"
            />
          </div>

          <div className="form-group">
            <label>レベル</label>
            <select
              className="select-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as Participant['level'])}
            >
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
          </div>

          <div className="form-group">
            <label>ルール理解度</label>
            <select
              className="select-rules"
              value={ruleUnderstanding}
              onChange={(e) => setRuleUnderstanding(e.target.value as Participant['ruleUnderstanding'])}
            >
              <option value="knows">ルール分かる</option>
              <option value="newbie">初めて</option>
            </select>
          </div>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '登録中...' : '参加登録する'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate(`/event/${id}`)}
        >
          スケジュールを見る
        </button>
      </div>
    </div>
  );
}
