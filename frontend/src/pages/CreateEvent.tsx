import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Participant } from '../types';
import { API_BASE_URL } from '../config';

const emptyParticipant = (): Participant => ({
  name: '',
  level: 'intermediate',
  ruleUnderstanding: 'knows'
});

export default function CreateEvent() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [matchDuration, setMatchDuration] = useState(20);
  const [breakDuration, setBreakDuration] = useState(5);
  const [courtCount, setCourtCount] = useState(2);
  const [pin, setPin] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    emptyParticipant(), emptyParticipant(), emptyParticipant(), emptyParticipant()
  ]);
  const [pairVariation, setPairVariation] = useState(true);
  const [opponentVariation, setOpponentVariation] = useState(true);
  const [levelMatching, setLevelMatching] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validParticipants = participants.filter(p => p.name.trim());
    if (validParticipants.length < 4) {
      setError('参加者は最低4人必要です');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PINは4桁の数字で入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, date, startTime, endTime, matchDuration, breakDuration,
          courtCount, pin, participants: validParticipants,
          pairVariation, opponentVariation, levelMatching
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Generate schedule immediately
      await fetch(`${API_BASE_URL}/api/events/${data.eventId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      navigate(`/event/${data.eventId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🎾 イベント作成</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>基本情報</h2>
          <div className="form-group">
            <label>イベント名</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} 
              placeholder="例：〇〇部 ピックル1day大会" required />
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

        <div className="card">
          <h2>編集PIN</h2>
          <div className="form-group">
            <label>4桁の数字（後から編集する際に必要）</label>
            <input type="password" value={pin} onChange={e => setPin(e.target.value)} 
              placeholder="例：1234" maxLength={4} pattern="\d{4}" required />
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? '作成中...' : 'スケジュール生成'}
        </button>
      </form>
    </div>
  );
}
