import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
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
import { Look, loadLooks, purgeLegacyLooks, saveLook, updateLookTryOn } from './src/lib/looks';
import { saveTryOnImage } from './src/lib/files';
import { PermissionState, getPhotoPermission, requestPhotoPermission } from './src/lib/screenshots';
import { Analysis, analysePhoto, generateTryOn } from './src/lib/style';

type Stage = 'permission' | 'pick' | 'camera' | 'analysing' | 'result' | 'error';

export default function App() {
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [stage, setStage] = useState<Stage>('permission');
  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedLook, setSelectedLook] = useState<number | null>(null);
  const [tryOns, setTryOns] = useState<(string | null)[]>([]);
  const [tryOnErrors, setTryOnErrors] = useState<(string | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<'flow' | 'looks' | 'you'>('flow');
  const [looks, setLooks] = useState<Look[]>([]);

  useEffect(() => {
    void purgeLegacyLooks().then(loadLooks).then(setLooks);
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
    setSelectedLook(null);
    setTryOns([]);
    setTryOnErrors([]);
    setStage('pick');
  }, []);

  const openLook = useCallback((look: Look) => {
    setPhoto(look.photo);
    setAnalysis(look.analysis);
    setSelectedLook(null);
    setTryOns(look.tryOn ? [look.tryOn] : []);
    setTryOnErrors([]);
    setPage('flow');
    setStage('result');
  }, []);

  const onPick = useCallback(async (uri: string) => {
    setPhoto(uri);
    setStage('analysing');
    setSelectedLook(null);
    setTryOns([]);
    setTryOnErrors([]);

    let result: Analysis;
    try {
      result = await analysePhoto(uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that photo');
      setStage('error');
      return;
    }

    setAnalysis(result);
    setStage('result');

    // Everything past this point is persistence and the try-on. Neither is
    // allowed to fail the analysis the user is already looking at.
    const id = `${Date.now()}`;
    const look: Look = { id, savedAt: Date.now(), photo: uri, tryOn: null, analysis: result };
    const persist = saveLook(look)
      .then(loadLooks)
      .then(setLooks)
      .catch(() => {});

    // Six renders in parallel, each landing in its own slot so the grid fills
    // in as they arrive rather than waiting on the slowest.
    setTryOns(new Array(result.outfits.length).fill(null));
    setTryOnErrors(new Array(result.outfits.length).fill(null));

    result.outfits.forEach((outfit, i) => {
      generateTryOn(uri, outfit)
        .then(async (base64) => {
          // Straight to disk: a base64 PNG is megabytes, and AsyncStorage on
          // Android cannot read a row that size back out.
          const image = await saveTryOnImage(`${id}-${i}`, base64);
          setTryOns((prev) => {
            const next = [...prev];
            next[i] = image;
            return next;
          });
          // Only the first look becomes the history thumbnail.
          if (i === 0) {
            await persist;
            await updateLookTryOn(id, image);
            setLooks(await loadLooks());
          }
        })
        .catch((err) => {
          setTryOnErrors((prev) => {
            const next = [...prev];
            next[i] = err instanceof Error ? err.message : 'Try-on failed';
            return next;
          });
        });
    });
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
      return (
        <PickPhotoScreen
          onPick={onPick}
          onCamera={() => setStage('camera')}
          onLooks={() => setPage('looks')}
          onYou={() => setPage('you')}
        />
      );
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
          tryOns={tryOns}
          tryOnErrors={tryOnErrors}
          selected={selectedLook}
          onSelect={setSelectedLook}
          onRestart={restart}
        />
      );
    }
    return (
      <PermissionScreen permission={permission} onScan={start} onCamera={() => setStage('camera')} />
    );
  };

  /**
   * A single back rule for the app. Android's edge-swipe gesture and the
   * hardware button both come through here, so this is what makes the swipe
   * navigate instead of dropping the user out of the app.
   *
   * Returning true means handled; false lets the OS close the app, which is
   * only correct on the landing screen.
   */
  const goBack = useCallback((): boolean => {
    if (page !== 'flow') {
      setPage('flow');
      return true;
    }
    if (stage === 'camera' || stage === 'error') {
      setStage('pick');
      return true;
    }
    if (stage === 'result') {
      // An open look closes back to the deck before the flow restarts.
      if (selectedLook !== null) {
        setSelectedLook(null);
        return true;
      }
      restart();
      return true;
    }
    if (stage === 'pick') {
      setStage('permission');
      return true;
    }
    // Landing: nothing above us, so let the OS take it.
    return false;
  }, [page, stage, selectedLook, restart]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => sub.remove();
  }, [goBack]);

  const body = () => {
    if (page === 'looks') {
      return (
        <LooksScreen
          looks={looks}
          onOpen={openLook}
          onStart={() => {
            setPage('flow');
            setStage('pick');
          }}
        />
      );
    }
    if (page === 'you') return <YouScreen looks={looks} />;
    return styleFlow();
  };


  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {body()}
    </SafeAreaProvider>
  );
}
