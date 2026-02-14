import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EventData, Participant } from '../types';
import { API_BASE_URL } from '../config';

export default function ViewSchedule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
      if (!res.ok) throw new Error('イベントが見つかりません');
      const data = await res.json();
      setEvent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setShowPinModal(true);
    setPinError('');
    setPin('');
  };

  const verifyPin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.valid) {
        navigate(`/event/${id}/edit`, { state: { pin } });
      } else {
        setPinError('PINが正しくありません');
      }
    } catch {
      setPinError('エラーが発生しました');
    }
  };

  const isHighlighted = (player: Participant) => {
    return selectedPlayer && player.name === selectedPlayer;
  };

  const getLevelBadge = (level: string) => {
    const labels: Record<string, string> = {
      beginner: '初級',
      intermediate: '中級',
      advanced: '上級'
    };
    return <span className={`level-badge level-${level}`}>{labels[level]}</span>;
  };

  if (loading) return <div className="container text-center mt-2">読み込み中...</div>;
  if (error) return <div className="container"><p className="error">{error}</p></div>;
  if (!event) return null;

  return (
    <div className="container">
      <div className="event-header">
        <h1>{event.name}</h1>
        <p>{event.date} {event.startTime}〜{event.endTime}</p>
        <p>コート数: {event.courtCount} / 参加者: {event.participants.length}名</p>
        {event.code && (
          <p style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.9 }}>
            イベントコード: <span style={{ fontFamily: 'monospace', letterSpacing: '0.1em', fontWeight: 'bold' }}>{event.code}</span>
          </p>
        )}
      </div>

      <div className="filter-bar">
        <label>自分の試合を確認:</label>
        <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
          <option value="">全員表示</option>
          {event.participants.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {event.schedule && event.schedule.length > 0 ? (
        event.schedule.map(round => {
          const hasHighlight = selectedPlayer && round.matches.some(m => 
            [...m.team1, ...m.team2].some(p => p.name === selectedPlayer)
          );
          const isResting = selectedPlayer && round.resting.some(p => p.name === selectedPlayer);

          if (selectedPlayer && !hasHighlight && !isResting) return null;

          return (
            <div key={round.roundNumber} className="round-card">
              <div className="round-header">
                Round {round.roundNumber}（{round.startTime}〜{round.endTime}）
              </div>
              {round.matches.map(match => {
                const matchHighlighted = selectedPlayer && 
                  [...match.team1, ...match.team2].some(p => p.name === selectedPlayer);
                
                return (
                  <div key={match.court} className={`match-item ${matchHighlighted ? 'highlighted' : ''}`}>
                    <div className="court-label">Court {match.court}</div>
                    <div className="match-teams">
                      <div className="team">
                        {match.team1.map(p => (
                          <span key={p.id} className={`player ${isHighlighted(p) ? 'highlighted' : ''}`}>
                            {p.name}{getLevelBadge(p.level)}
                          </span>
                        ))}
                      </div>
                      <span className="vs">vs</span>
                      <div className="team">
                        {match.team2.map(p => (
                          <span key={p.id} className={`player ${isHighlighted(p) ? 'highlighted' : ''}`}>
                            {p.name}{getLevelBadge(p.level)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {round.resting.length > 0 && (
                <div className="resting">
                  休憩: {round.resting.map(p => p.name).join(', ')}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="card text-center">
          <p>スケジュールがまだ生成されていません</p>
        </div>
      )}

      <div className="text-center mt-2">
        <button className="btn btn-secondary" onClick={handleEditClick}>
          編集モードへ
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')}
          style={{ marginLeft: '12px' }}
        >
          トップに戻る
        </button>
      </div>

      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>編集PIN入力</h3>
            <div className="form-group">
              <input 
                type="password" 
                value={pin} 
                onChange={e => setPin(e.target.value)}
                placeholder="4桁のPIN"
                maxLength={4}
              />
            </div>
            {pinError && <p className="error">{pinError}</p>}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPinModal(false)}>キャンセル</button>
              <button className="btn btn-primary" onClick={verifyPin}>確認</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
