import React from 'react';
import { createRoot } from 'react-dom/client';
import { FF8Provider } from '@ff8-speedruns/ui';
import PracticeApp from './PracticeApp';

import '@mantine/core/styles.css';
import '@ff8-speedruns/ui/styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FF8Provider>
      <PracticeApp />
    </FF8Provider>
  </React.StrictMode>,
);
