import React, { useState } from 'react';
import { StoreProvider } from './lib/store';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { KeptWords } from './screens/KeptWords';
import { NewEntry } from './screens/NewEntry';
import { Entries } from './screens/Entries';
import { EntryDetail } from './screens/EntryDetail';
import { Reading } from './screens/Reading';
import { Insights } from './screens/Insights';
import { Images } from './screens/Images';
import type { ScreenId } from './lib/types';

function Shell() {
  const [screen, setScreen] = useState<ScreenId>('home');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  function navigate(s: ScreenId) {
    setScreen(s);
  }

  function openEntry(id: string) {
    setSelectedEntryId(id);
    setScreen('entryDetail');
  }

  return (
    <div className="phone-frame">
      <div className="phone-content">
        {screen === 'home' && <Home navigate={navigate} openEntry={openEntry} />}
        {screen === 'words' && <KeptWords />}
        {screen === 'new' && <NewEntry navigate={navigate} />}
        {screen === 'entries' && <Entries openEntry={openEntry} />}
        {screen === 'entryDetail' && <EntryDetail entryId={selectedEntryId} navigate={navigate} />}
        {screen === 'reading' && <Reading />}
        {screen === 'insights' && <Insights navigate={navigate} />}
        {screen === 'images' && <Images />}
      </div>
      <BottomNav active={screen} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
