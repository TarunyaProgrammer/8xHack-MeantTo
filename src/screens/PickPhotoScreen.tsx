import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Icon, PrimaryButton, Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Photo, listRecentPhotos } from '../lib/photos';

interface Props {
  onPick: (uri: string) => void;
  onCamera: () => void;
}

/** Only real photos from the device. An empty roll renders as empty. */
export function PickPhotoScreen({ onPick, onCamera }: Props) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void listRecentPhotos(24).then(setPhotos).catch(() => setPhotos([]));
  }, []);

  return (
    <Screen tabSafe>
      <Text style={type.caption}>Step one</Text>
      <Text style={[type.display, { marginTop: 6 }]}>FULL{'\n'}BODY</Text>
      <Text style={[type.bodyMuted, { marginTop: space.sm, marginBottom: space.lg }]}>
        Head to feet. Plain wall.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={onCamera}
            style={({ pressed }) => [
              {
                width: 104,
                height: 148,
                borderRadius: radius.button,
                borderWidth: 1,
                borderColor: color.border,
                backgroundColor: color.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.xs,
              },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Icon name="camera" size={24} color={color.accent} />
            <Text style={[type.caption, { color: color.accent }]}>Take photo</Text>
          </Pressable>

          {(photos ?? []).map((photo) => {
            const active = selected === photo.uri;
            return (
              <Pressable key={photo.id} onPress={() => setSelected(photo.uri)}>
                <Image
                  source={{ uri: photo.uri }}
                  style={{
                    width: 104,
                    height: 148,
                    borderRadius: radius.button,
                    borderWidth: active ? 3 : 1,
                    borderColor: active ? color.accent : color.border,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        {photos !== null && photos.length === 0 && (
          <Text style={type.bodyMuted}>No photos found.</Text>
        )}
      </ScrollView>

      <PrimaryButton
        label="Style me"
        disabled={!selected}
        onPress={() => selected && onPick(selected)}
        style={{ marginTop: space.md }}
      />
    </Screen>
  );
}
