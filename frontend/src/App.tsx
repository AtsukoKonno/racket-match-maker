import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import JoinEvent from './pages/JoinEvent';
import ViewSchedule from './pages/ViewSchedule';
import EditEvent from './pages/EditEvent';
import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateEvent />} />
        <Route path="/join/:id" element={<JoinEvent />} />
        <Route path="/event/:id" element={<ViewSchedule />} />
        <Route path="/event/:id/edit" element={<EditEvent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
