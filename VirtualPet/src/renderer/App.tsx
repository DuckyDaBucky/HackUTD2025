import './App.css';
import PetScreen from './components/PetScreen';
import { RealtimeProvider } from './state/realtimeState';

export default function App() {
  return (
    <RealtimeProvider>
      <PetScreen />
    </RealtimeProvider>
  );
}
