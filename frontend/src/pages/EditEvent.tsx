import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Participant, EventData } from '../types';
import { API_BASE_URL } from '../config';

const emptyParticipant = (): Participant => ({
  name: '',
  level: 'intermediate',
  ruleUnderstanding: 'knows'
});

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const pin = (location.state as any)?.pin || '';

  const [event, setEvent] = useState<EventData | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [matchDuration, setMatchDuration] = useState(20);
  const [breakDuration, setBreakDuration] = useState(5);
  const [courtCount, setCourtCount] = useState(2);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pairVariation, setPairVariation] = useState(true);
  const [opponentVariation, setOpponentVariation] = useState(true);
  const [levelMatching, setLevelMatching] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  useEffect(() => {
    if (!pin) {
      navigate(`/event/${id}`);
      return;
    }
    fetchEvent();
  }, [id, pin]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
      if (!res.ok) throw new Error('イベントが見つかりません');
      const data: EventData = await res.json();
      setEvent(data);
      setName(data.name);
      setDate(data.date);
      setStartTime(data.startTime);
      setEndTime(data.endTime);
      setMatchDuration(data.matchDuration);
      setBreakDuration(data.breakDuration);
      setCourtCount(data.courtCount);
      setParticipants(data.participants);
      setPairVariation(data.pairVariation);
      setOpponentVariation(data.opponentVariation);
      setLevelMatching(data.levelMatching);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, emptyParticipant()]);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleSave = async () => {
    setError('');
    const validParticipants = participants.filter(p => p.name.trim());
    if (validParticipants.length < 4) {
      setError('参加者は最低4人必要です');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin, name, date, startTime, endTime, matchDuration, breakDuration,
          courtCount, participants: validParticipants,
          pairVariation, opponentVariation, levelMatching
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setShowRegenConfirm(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/api/events/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      navigate(`/event/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setShowRegenConfirm(false);
    }
  };

  if (loading) return <div className="container text-center mt-2">読み込み中...</div>;
  if (error && !event) return <div className="container"><p className="error">{error}</p></div>;

  return (
    <div className="container">
      <h1>🎾 イベント編集</h1>
      
      <div className="card">
        <h2>基本情報</h2>
        <div className="form-group">
          <label>イベント名</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>開催日</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <div className="row">
          <div className="form-group">
            <label>開始時刻</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>終了時刻</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
          </div>
        </div>
        <div className="row">
          <div className="form-group">
            <label>1試合の時間（分）</label>
            <input type="number" value={matchDuration} onChange={e => setMatchDuration(Number(e.target.value))} min={5} max={60} required />
          </div>
          <div className="form-group">
            <label>休憩時間（分）</label>
            <input type="number" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} min={0} max={30} required />
          </div>
        </div>
        <div className="form-group">
          <label>コート数</label>
          <input type="number" value={courtCount} onChange={e => setCourtCount(Number(e.target.value))} min={1} max={6} required />
        </div>
      </div>

      <div className="card">
        <h2>参加者</h2>
        {participants.map((p, i) => (
          <div key={i} className="participant-row">
            <input type="text" value={p.name} onChange={e => updateParticipant(i, 'name', e.target.value)} placeholder="名前" />
            <select className="select-level" value={p.level} onChange={e => updateParticipant(i, 'level', e.target.value as any)}>
              <option value="beginner">初級</option>
              <option value="intermediate">中級</option>
              <option value="advanced">上級</option>
            </select>
            <select className="select-rules" value={p.ruleUnderstanding} onChange={e => updateParticipant(i, 'ruleUnderstanding', e.target.value as any)}>
              <option value="knows">ルール分かる</option>
              <option value="newbie">ほぼ初めて</option>
            </select>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => removeParticipant(i)}>×</button>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addParticipant}>+ 参加者を追加</button>
      </div>

      <div className="card">
        <h2>マッチメイク設定</h2>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={pairVariation} onChange={e => setPairVariation(e.target.checked)} />
            できるだけ毎回ペアを変える
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={opponentVariation} onChange={e => setOpponentVariation(e.target.checked)} />
            できるだけ対戦相手も被らないようにする
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={levelMatching} onChange={e => setLevelMatching(e.target.checked)} />
            レベルが近い人同士でペアを組む
          </label>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="row mt-2">
        <button className="btn btn-secondary" onClick={() => navigate(`/event/${id}`)}>
          キャンセル
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存してスケジュール再生成'}
        </button>
      </div>

      {showRegenConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>スケジュール再生成</h3>
            <p>設定を保存しました。スケジュールを再生成しますか？</p>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              ※再生成すると現在のスケジュールは上書きされます
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => navigate(`/event/${id}`)}>
                後で
              </button>
              <button className="btn btn-primary" onClick={handleRegenerate} disabled={saving}>
                再生成する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
