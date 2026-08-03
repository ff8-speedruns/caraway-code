import { useCallback, useEffect, useRef, useState } from 'react';
import { Anchor, Button, Center, Group, Stack, Text } from '@mantine/core';
import { IconCaretLeftFilled, IconReload } from '@tabler/icons-react';
import { ToolShell } from '@ff8-speedruns/ui';
import { codes } from './lib/caraway';
import './practice.css';

/**
 * Stitches the individual burst clips into one continuous video.
 *
 * Adapted from https://github.com/joshuatz/mediasource-append-examples —
 * 'sequence' mode lets the browser work out the offsets between separate files.
 *
 * `isCancelled` is checked before each step that touches shared state, so a
 * superseded call (the seed changed again before this one finished loading)
 * stops instead of racing the newer one. Returns the object URL it created
 * (or null if it bailed before creating one) so the caller can revoke it.
 */
async function playSequence(videoElement, clipUrls, isCancelled) {
  const buffers = await Promise.all(
    clipUrls.map(async (url) => (await fetch(url)).arrayBuffer())
  );
  if (isCancelled()) return null;

  const mediaSource = new MediaSource();
  const objectUrl = URL.createObjectURL(mediaSource);
  videoElement.src = objectUrl;

  const sourceBuffer = await new Promise((resolve, reject) => {
    const attach = () => {
      try {
        const buffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
        buffer.mode = 'sequence';
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    };

    if (mediaSource.readyState === 'open') attach();
    else mediaSource.addEventListener('sourceopen', attach);
  });
  if (isCancelled()) return objectUrl;

  let clipIndex = 0;
  sourceBuffer.onupdateend = () => {
    if (isCancelled()) return;
    if (clipIndex < buffers.length - 1) {
      clipIndex++;
      sourceBuffer.appendBuffer(buffers[clipIndex]);
    } else {
      mediaSource.endOfStream();
      videoElement.play();
    }
  };

  sourceBuffer.appendBuffer(buffers[clipIndex]);
  return objectUrl;
}

function randomEntry() {
  return codes[Math.floor(Math.random() * codes.length)];
}

export default function Practice() {
  const videoRef = useRef(null);
  const [seed, setSeed] = useState(randomEntry);

  const poles = seed.poles ?? [];
  const answer = poles.join(' ');

  const nextSeed = useCallback(() => {
    setSeed(randomEntry());
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    const currentPoles = seed.poles ?? [];
    const base = import.meta.env.BASE_URL;
    const clips = [...currentPoles.map((n) => `${base}webm/${n}.webm`), `${base}webm/End.webm`];

    if (videoRef.current) {
      playSequence(videoRef.current, clips, () => cancelled)
        .then((url) => {
          objectUrl = url;
        })
        .catch((error) => console.error('Could not play the practice clips', error));
    }

    // Clicking "Next seed" again before a clip finishes loading would
    // otherwise leave the previous fetch/append chain running (racing the
    // new one) and leak its blob URL — this stops the former and revokes
    // the latter.
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [seed]);

  return (
    <ToolShell
      title="Pole Counting Practice"
      status="needsTesters"
      repo="caraway-code"
      intro="Practice your pole counting. Check against the answer after Squall leaves."
      size="md"
    >
      <Stack gap="md">
        <video ref={videoRef} muted loop className="pole-video" />

        <Center>
          <Text size="sm">
            Hover for answer: <span className="pole-answer">{answer}</span>
          </Text>
        </Center>

        <Group justify="center">
          <Button
            component="a"
            href={import.meta.env.BASE_URL}
            variant="default"
            leftSection={<IconCaretLeftFilled size="1rem" />}
          >
            Calculator
          </Button>
          <Button onClick={nextSeed} leftSection={<IconReload size="1rem" />}>
            Next seed
          </Button>
        </Group>
      </Stack>
    </ToolShell>
  );
}
