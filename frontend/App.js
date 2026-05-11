import React, { useState } from 'react';
import FMDashboardScreen from './src/screens/FMDashboardScreen';
import FMIssueDetailScreen from './src/screens/FMIssueDetailScreen';

export default function App() {
  const [screen, setScreen] = useState('dashboard');
  const [issueId, setIssueId] = useState(null);

  const navigation = {
    navigate: (name, params) => {
      if (name === 'FMIssueDetail') {
        setIssueId(params.issueId);
        setScreen('detail');
      }
    },
    goBack: () => setScreen('dashboard'),
    replace: () => {},
  };

  if (screen === 'detail') {
    return <FMIssueDetailScreen route={{ params: { issueId } }} navigation={navigation} />;
  }

  return <FMDashboardScreen navigation={navigation} />;
}