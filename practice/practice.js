Go();

document.getElementById("next").addEventListener("click", () => {
	Go();
});

function Go() {
	let randomIdx = codes[Math.floor(Math.random() * codes.length)];
	let poles = randomIdx.poles;

	let clops = poles.map(e => `./webm/${e}.webm`);
	clops.push('./webm/end.webm');

	document.getElementById("answer").innerHTML = poles.join(' ');
	Play(clops);
}


// The below code is from https://github.com/joshuatz/mediasource-append-examples/tree/main/multi-file/sequence

/**
 * Adds (and returns once ready) a SourceBuffer to a MediaSource
 * @param {MediaSource} mediaSource
 * @param {string} mimeStr Example: `video/webm; codecs="vp9,opus"`
 * @param {'sequence' | 'segments'} [mode]
 * @returns {Promise<SourceBuffer>}
 */
const addSourceBufferWhenOpen = (mediaSource, mimeStr, mode = 'segments') => {
	return new Promise((res, rej) => {
		const getSourceBuffer = () => {
			try {
				const sourceBuffer = mediaSource.addSourceBuffer(mimeStr);
				sourceBuffer.mode = mode;
				res(sourceBuffer);
			} catch (e) {
				rej(e);
			}
		};
		if (mediaSource.readyState === 'open') {
			getSourceBuffer();
		} else {
			mediaSource.addEventListener('sourceopen', getSourceBuffer);
		}
	});
};

/**
 * @file In comparison with the segments mode, sequence is much easier, since the browser will handle the offsets automatically based on the decoded content. However, you are not really *supposed* to use this with separate files, and Chromium will likely deprecate support at some point (throws warning right now: `Warning: using MSE 'sequence' AppendMode for a SourceBuffer with multiple tracks may cause loss of track synchronization. In some cases, buffered range gaps and playback stalls can occur. It is recommended to instead use 'segments' mode for a multitrack SourceBuffer.`)
 */

async function Play(vidClips) {
	const videoElement = document.querySelector('video');

	// Get video clips as buffers
	const clipsToAppend = await Promise.all(
		vidClips.map(async (vidUrl) => {
			return (await fetch(vidUrl)).arrayBuffer();
		})
	);

	// Normal setup, with MediaSource, Object URL, and prepped SourceBuffer
	const mediaSource = new MediaSource();
	videoElement.src = URL.createObjectURL(mediaSource);
	// mode = sequence
	const sourceBuffer = await addSourceBufferWhenOpen(mediaSource, `video/webm; codecs="vp8"`, 'sequence');

	/**
	 * Pointer to last vid appended out of source list
	 */
	let clipIndex = 0;
	sourceBuffer.onupdateend = () => {
		if (clipIndex < vidClips.length - 1) {
			clipIndex++;
			sourceBuffer.appendBuffer(clipsToAppend[clipIndex]);
		} else {
			// Done!
			mediaSource.endOfStream();
			videoElement.play();
		}
	};

	// This will kick off event listener chain above
	sourceBuffer.appendBuffer(clipsToAppend[clipIndex]);
}