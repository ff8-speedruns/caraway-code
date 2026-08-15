import { useState } from 'react';
import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';

const NPC_INFO = {
  station: {
    label: 'Station',
    description: 'On the train platform.',
    states: {
      Walk: 'NPC walks across as you head for the exit.',
      None: 'Nobody crosses the platform.',
    },
  },
  escalator: {
    label: 'Escalator',
    description: 'Station escalator.',
    states: {
      Boy: 'Boy (cream shirt) appears.',
      Girl: 'Girl (green clothes) appears.',
      'Boy + Girl': 'Both children appear.',
      None: 'Escalator is empty.',
    },
  },
  street: {
    label: 'Street',
    description: 'First screen after the station.',
    states: {
      None: 'No NPC at all.',
      Still: 'Stationary NPC in beige jacket. A second NPC may or may not appear.',
      Walk: 'Pair of NPCs walk across the screen.',
    },
  },
  bus: {
    label: 'Bus',
    description: 'The bus in front of the mansion.',
    states: {
      Spawn: 'Dog lady appears at the same time as the bus.',
      Stop: 'Dog lady appears as the bus stops.',
      Leave: 'Dog lady appears as bus pulls away.',
      None: 'Dog lady never appears.',
    },
  },
};

const CLIP_DIRECTORY = 'npc';
const CLIP_EXTENSION = 'webm';
const CLIP_HEIGHT = 180;

/** Asset name for a state, so "Boy + Girl" looks for escalator-boy-girl.webm. */
const clipFile = (field, state) => {
  const slug = state
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${field}-${slug}.${CLIP_EXTENSION}`;
};

/**
 * One state's clip. The clips are dropped in by hand over time, so a missing
 * file shows the name it is looking for rather than a dead video frame.
 */
function NpcExample({ field, state }) {
  const [missing, setMissing] = useState(false);
  const file = clipFile(field, state);

  return (
    <Stack gap={4} align="center">
      {missing ? (
        <Paper
          h={CLIP_HEIGHT}
          w="100%"
          radius="sm"
          withBorder
          style={{ borderStyle: 'dashed', display: 'grid', placeItems: 'center', padding: 4 }}
        >
          <Text size="xs" c="dimmed" ta="center" style={{ wordBreak: 'break-all' }}>
            {file}
          </Text>
        </Paper>
      ) : (
        <video
          src={`${import.meta.env.BASE_URL}${CLIP_DIRECTORY}/${file}`}
          aria-label={`${NPC_INFO[field].label}: ${state}`}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setMissing(true)}
          style={{
            height: CLIP_HEIGHT,
            width: '100%',
            objectFit: 'contain',
            borderRadius: 'var(--mantine-radius-sm)',
          }}
        />
      )}
      <div>
        <Text size="xs" fw={600} ta="center">
          {state}
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          {NPC_INFO[field].states[state]}
        </Text>
      </div>
    </Stack>
  );
}

export default function NpcReference() {
  return (
    <Stack gap="lg">
      <Text size="sm">
        When more than one code matches your pole counts, these animations help you confirm which
        one you to use. Watch for them on the way to the mansion and compare against each result.
      </Text>

      {Object.entries(NPC_INFO).map(([field, info]) => (
        <Stack key={field} gap={6}>
          <div>
            <Text fw={600} size="sm">
              {info.label}
            </Text>
            <Text size="xs" c="dimmed">
              {info.description}
            </Text>
          </div>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {Object.keys(info.states).map((state) => (
              <NpcExample key={state} field={field} state={state} />
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
}
