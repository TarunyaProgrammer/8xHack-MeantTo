import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PermissionScreen } from './src/screens/PermissionScreen';
import { ScanningScreen } from './src/screens/ScanningScreen';
import { PickPhotoScreen } from './src/screens/PickPhotoScreen';
import { CameraScreen } from './src/screens/CameraScreen';
import { StyleResultScreen } from './src/screens/StyleResultScreen';
import { MessageScreen } from './src/screens/MessageScreen';
import { LooksScreen } from './src/screens/LooksScreen';
import { YouScreen } from './src/screens/YouScreen';
import { TabBar, TabId } from './src/components/TabBar';
import { Look, loadLooks, saveLook, updateLookTryOn } from './src/lib/looks';
import { PermissionState, getPhotoPermission, requestPhotoPermission } from './src/lib/screenshots';
import { Analysis, analysePhoto, generateTryOn } from './src/lib/style';

type Stage = 'permission' | 'pick' | 'camera' | 'analysing' | 'result' | 'error';

export default function App() {
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [stage, setStage] = useState<Stage>('permission');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [tryOn, setTryOn] = useState<string | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('style');
  const [looks, setLooks] = useState<Look[]>([]);

  useEffect(() => {
    void loadLooks().then(setLooks);
  }, []);

  useEffect(() => {
    void getPhotoPermission().then(setPermission);
  }, []);

  const start = useCallback(async () => {
    let state = permission;
    if (state !== 'granted') {
      try {
        state = await requestPhotoPermission();
      } catch {
        state = 'denied';
      }
      setPermission(state);
    }
    setStage('pick');
  }, [permission]);

  const restart = useCallback(() => {
    setPhoto(null);
    setAnalysis(null);
    setTryOn(null);
    setTryOnError(null);
    setStage('pick');
  }, []);

  const openLook = useCallback((look: Look) => {
    setPhoto(look.photo);
    setAnalysis(look.analysis);
    setTryOn(look.tryOn);
    setTryOnError(null);
    setTab('style');
    setStage('result');
  }, []);

  const onPick = useCallback(async (uri: string) => {
    setPhoto(uri);
    setStage('analysing');
    setTryOn(null);
    setTryOnError(null);

    try {
      const result = await analysePhoto(uri);
      setAnalysis(result);
      setStage('result');

      const id = `${Date.now()}`;
      const look: Look = { id, savedAt: Date.now(), photo: uri, tryOn: null, analysis: result };
      await saveLook(look);
      setLooks(await loadLooks());

      // Try-on runs after the result is already on screen — 25s of dead air is
      // what kills a demo, not the wait itself.
      generateTryOn(uri, result.outfit)
        .then(async (image) => {
          setTryOn(image);
          await updateLookTryOn(id, image);
          setLooks(await loadLooks());
        })
        .catch((err) => setTryOnError(err instanceof Error ? err.message : 'Try-on failed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that photo');
      setStage('error');
    }
  }, []);

  const styleFlow = () => {
    if (stage === 'permission') {
      return (
        <PermissionScreen
          permission={permission}
          onScan={start}
          onCamera={() => setStage('camera')}
        />
      );
    }
    if (stage === 'pick') {
      return <PickPhotoScreen onPick={onPick} onCamera={() => setStage('camera')} />;
    }
    if (stage === 'camera') {
      return <CameraScreen onCapture={onPick} onClose={() => setStage('pick')} />;
    }
    if (stage === 'analysing') return <ScanningScreen done={0} total={0} />;
    if (stage === 'error') {
      return (
        <MessageScreen
          tone="error"
          title="Couldn't read that photo"
          detail={error ?? undefined}
          actionLabel="Try another"
          onAction={restart}
        />
      );
    }
    if (analysis && photo) {
      return (
        <StyleResultScreen
          original={photo}
          analysis={analysis}
          tryOn={tryOn}
          tryOnError={tryOnError}
          onRestart={restart}
        />
      );
    }
    return (
      <PermissionScreen permission={permission} onScan={start} onCamera={() => setStage('camera')} />
    );
  };

  const body = () => {
    if (tab === 'looks') {
      return (
        <LooksScreen
          looks={looks}
          onOpen={openLook}
          onStart={() => {
            setTab('style');
            setStage('pick');
          }}
        />
      );
    }
    if (tab === 'you') return <YouScreen looks={looks} />;
    return styleFlow();
  };

  // The tab bar floats over content, so it hides during full-bleed capture and
  // while a step is mid-flight — a nav control you cannot act on is noise.
  const showTabs = tab !== 'style' || stage === 'permission' || stage === 'pick' || stage === 'result';

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {body()}
      {showTabs && <TabBar active={tab} onChange={setTab} />}
    </SafeAreaProvider>
  );
}
