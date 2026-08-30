import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Chip, Icon, PrimaryButton, Screen } from '../components';
import { color, radius, space } from '../theme/tokens';
import { type } from '../theme/type';
import { Photo, listRecentPhotos } from '../lib/photos';
import { CAN_PICK_FILE, pickFile } from '../lib/pickFile';

interface Props {
  onPick: (uri: string) => void;
  onLooks: () => void;
  onYou: () => void;
  onCamera: () => void;
}

/** Only real photos from the device. An empty roll renders as empty. */
export function PickPhotoScreen({ onPick, onCamera, onLooks, onYou }: Props) {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void listRecentPhotos(24).then(setPhotos).catch(() => setPhotos([]));
  }, []);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={type.caption}>Step one</Text>
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          <Pressable onPress={onLooks} hitSlop={8}>
            <Chip label="Looks" />
          </Pressable>
          <Pressable onPress={onYou} hitSlop={8}>
            <Chip label="You" />
          </Pressable>
        </View>
      </View>
      <Text style={[type.display, { marginTop: 6 }]}>Pick a photo</Text>
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
                borderRadius: radius.thumb,
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
                    borderRadius: radius.thumb,
                    borderWidth: active ? 3 : 1,
                    borderColor: active ? color.accent : color.border,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        {photos !== null && photos.length === 0 && !CAN_PICK_FILE && (
          <Text style={type.bodyMuted}>No photos found.</Text>
        )}
      </ScrollView>

      {CAN_PICK_FILE && (
        <PrimaryButton
          label="Choose a photo"
          onPress={async () => {
            const uri = await pickFile();
            if (uri) onPick(uri);
          }}
          style={{ marginTop: space.md }}
        />
      )}

      <PrimaryButton
        label="Style me"
        disabled={!selected}
        onPress={() => selected && onPick(selected)}
        style={{ marginTop: space.md }}
      />
    </Screen>
  );
}
