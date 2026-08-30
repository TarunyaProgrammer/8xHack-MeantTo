import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PermissionScreen } from './src/screens/PermissionScreen';
import { ScanningScreen } from './src/screens/ScanningScreen';
import { VerdictScreen } from './src/screens/VerdictScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { ExecutingScreen } from './src/screens/ExecutingScreen';
import { MessageScreen } from './src/screens/MessageScreen';
import { useScan } from './src/lib/useScan';
import { PermissionState, getPhotoPermission, requestPhotoPermission } from './src/lib/screenshots';
import { actionableCount } from './src/lib/verdict';
import { ActionOutcome, buildSteps } from './src/lib/actions';

type Stage = 'permission' | 'verdict' | 'executing' | 'results';

export default function App() {
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [stage, setStage] = useState<Stage>('permission');
  const [outcomes, setOutcomes] = useState<ActionOutcome[]>([]);
  const scan = useScan();

  useEffect(() => {
    void getPhotoPermission().then(setPermission);
  }, []);

  const startScan = useCallback(async () => {
    const state = permission === 'granted' ? 'granted' : await requestPhotoPermission();
    setPermission(state);
    if (state !== 'granted') return;
    setStage('verdict');
    await scan.run();
  }, [permission, scan]);

  const rescan = useCallback(() => {
    setOutcomes([]);
    setStage('permission');
  }, []);

  const finishExecuting = useCallback((results: ActionOutcome[]) => {
    setOutcomes(results);
    setStage('results');
  }, []);

  const body = () => {
    if (stage === 'permission') {
      return <PermissionScreen permission={permission} onScan={startScan} />;
    }

    if (scan.phase === 'scanning' || scan.phase === 'idle') {
      return <ScanningScreen done={scan.progress.done} total={scan.progress.total} />;
    }

    if (scan.phase === 'error') {
      return (
        <MessageScreen
          tone="error"
          title="Couldn't read your screenshots"
          detail={scan.error ?? undefined}
          actionLabel="Try again"
          onAction={rescan}
        />
      );
    }

    if (scan.phase === 'empty') {
      return (
        <MessageScreen
          title="No screenshots found."
          detail="Nothing to answer for."
          actionLabel="Scan again"
          onAction={rescan}
        />
      );
    }

    if (stage === 'executing') {
      return <ExecutingScreen steps={buildSteps(scan.items)} onDone={finishExecuting} />;
    }

    if (stage === 'results') {
      return (
        <ResultsScreen
          items={scan.items}
          outcomes={outcomes}
          totalValue={scan.totalValue}
          onRescan={rescan}
        />
      );
    }

    return (
      <VerdictScreen
        totalScreenshots={scan.totalScreenshots}
        counts={scan.counts}
        verdictLine={scan.verdictLine}
        actionable={actionableCount(scan.items)}
        onFix={() => setStage('executing')}
      />
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {body()}
    </SafeAreaProvider>
  );
}
