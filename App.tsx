import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Look, loadLooks, purgeLegacyLooks, saveLook, setLookTryOn } from './src/lib/looks';
import { findTryOnImage, saveTryOnImage } from './src/lib/files';
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
  /**
   * The look currently on screen. A render takes up to 45s, so one started
   * before the user opened a different look can still be in flight — and its
   * slot index means nothing there. Renders check this before touching state.
   * They still write to storage, because the image is valid for its own look.
   */
  const shown = useRef<string | null>(null);

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
    shown.current = null;
    setPhoto(null);
    setAnalysis(null);
    setSelectedLook(null);
    setTryOns([]);
    setTryOnErrors([]);
    setStage('pick');
  }, []);

  /**
   * Render one outfit, write it to disk, show it, and record its uri against
   * the look. Shared so a reopened look fills its gaps by exactly the same
   * route a fresh analysis does.
   *
   * `ready` gates the storage write on the look's row existing: on a fresh
   * analysis a render can land before `saveLook` has returned, and patching a
   * row that is not there yet would drop the image.
   */
  const renderTryOn = useCallback(
    async (
      id: string,
      photoUri: string,
      outfit: Analysis['outfits'][number],
      index: number,
      ready?: Promise<unknown>
    ) => {
      try {
        const base64 = await generateTryOn(photoUri, outfit);
        // Straight to disk: a base64 PNG is megabytes, and AsyncStorage on
        // Android cannot read a row that size back out.
        const image = await saveTryOnImage(id, index, base64);
        if (shown.current === id) {
          setTryOns((prev) => {
            const next = [...prev];
            next[index] = image;
            return next;
          });
        }
        if (ready) await ready;
        setLooks(await setLookTryOn(id, index, image));
      } catch (err) {
        if (shown.current !== id) return;
        setTryOnErrors((prev) => {
          const next = [...prev];
          next[index] = err instanceof Error ? err.message : 'Try-on failed';
          return next;
        });
      }
    },
    []
  );

  /**
   * Reopen a saved look. The record now carries one image per outfit, so this
   * is a restore, not a re-render.
   *
   * Three tiers, cheapest first:
   *  1. uris on the record — instant
   *  2. uris recovered from disk. Looks saved before the record held an array
   *     recorded only the first image, but all six files were always written
   *     under a deterministic name, so they can be found and re-attached.
   *  3. only what is still genuinely missing is generated — a slot that failed
   *     the first time, which would otherwise shimmer forever.
   */
  const openLook = useCallback(async (look: Look) => {
    const count = look.analysis.outfits.length;
    shown.current = look.id;
    setPhoto(look.photo);
    setAnalysis(look.analysis);
    setSelectedLook(null);
    setTryOnErrors(new Array(count).fill(null));
    setPage('flow');
    setStage('result');

    const slots: (string | null)[] = [];
    for (let i = 0; i < count; i++) slots.push(look.tryOns[i] ?? null);
    setTryOns([...slots]);

    // Tier 2. Runs for every gap, but only ever reads the filesystem.
    const recovered = await Promise.all(
      slots.map((uri, i) => (uri ? Promise.resolve(uri) : findTryOnImage(look.id, i)))
    );
    if (recovered.some((uri, i) => uri && !slots[i])) {
      if (shown.current === look.id) setTryOns([...recovered]);
      for (let i = 0; i < count; i++) {
        if (recovered[i] && !slots[i]) setLooks(await setLookTryOn(look.id, i, recovered[i] as string));
      }
    }

    // Tier 3.
    recovered.forEach((uri, i) => {
      if (uri) return;
      void renderTryOn(look.id, look.photo, look.analysis.outfits[i], i);
    });
  }, [renderTryOn]);

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
    const look: Look = {
      id,
      savedAt: Date.now(),
      photo: uri,
      tryOn: null,
      tryOns: new Array(result.outfits.length).fill(null),
      analysis: result,
    };
    shown.current = id;
    const persist = saveLook(look).then(setLooks).catch(() => {});

    // Six renders in parallel, each landing in its own slot so the grid fills
    // in as they arrive rather than waiting on the slowest. Every slot is
    // recorded, so reopening this look later costs nothing.
    setTryOns(new Array(result.outfits.length).fill(null));
    setTryOnErrors(new Array(result.outfits.length).fill(null));

    result.outfits.forEach((outfit, i) => {
      void renderTryOn(id, uri, outfit, i, persist);
    });
  }, [renderTryOn]);

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
