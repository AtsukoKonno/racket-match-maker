import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CreateEvent from './pages/CreateEvent';
import ViewSchedule from './pages/ViewSchedule';
import EditEvent from './pages/EditEvent';
import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateEvent />} />
        <Route path="/event/:id" element={<ViewSchedule />} />
        <Route path="/event/:id/edit" element={<EditEvent />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
