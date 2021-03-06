import * as GIF from 'gif.js';

declare var require: {
  <T>(path: string): T;
};

enum ReadyState {
  NONE,
  ENCODING,
  FINISHED,
}

const global: any = window;

const GIFWorker = require('raw-loader!gif.js/dist/gif.worker.js');
const workerScript = URL.createObjectURL(new Blob([GIFWorker], {
  type: 'text/javascript',
}));

const MutationObserver = global.MutationObserver || global.WebKitMutationObserver || global.MozMutationObserver;

start();

window.addEventListener('popstate', start);

// hook pushState
const pushState = history.pushState;

history.pushState = function pushStateHook(...args) {
  pushState.call(history, ...args);
  start();
};

function start() {
  if (window !== window.top) {
    return;
  }

  const observer: MutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(({ addedNodes }) => {
      analyze(addedNodes);
    });
  });

  poll((cancel) => {
    const container = document.querySelector('#stream-items-id');

    if (container) {
      cancel();

      if (!container.getAttribute('data-gif-observed')) {
        observer.observe(container, {
          childList: true,
        });

        container.setAttribute('data-gif-observed', 'true');
      }
    }
  });

  analyze(document.querySelectorAll('.AdaptiveMedia-video'));
}

function analyze(nodes: NodeList): Window[] {
  return Array.prototype.filter.call(nodes, node => {
    return node.nodeType === Node.ELEMENT_NODE &&
           node.querySelector('.PlayableMedia--gif');
  })
  .forEach(function getMediaContext(el: Element) {
    const player = el.querySelector('.PlayableMedia-player');

    if (player.getAttribute('data-gif')) {
      return;
    }

    player.setAttribute('data-gif', 'true');
    addDownloadButton(player);
  });
}

function addDownloadButton(container: Element) {
  const a = document.createElement('a');
  a.textContent = 'Encode GIF';
  a.style.cssText =
`
position: absolute;
bottom: 8px;
right: 8px;
padding: 2px 5px;
line-height: 16px;
background: rgba(0,0,0,.3);
border-radius: 3px;
color: #fff;
font-size: 12px;
cursor: pointer;
z-index: 1;
`;

  let state = ReadyState.NONE;

  a.addEventListener('click', () => {
    if (state === ReadyState.ENCODING || state === ReadyState.FINISHED) {
      return;
    }

    a.textContent = 'Waiting...';
    state = ReadyState.ENCODING;

    getMediaSrc(container)
      .then(createVideo)
      .then(video => encodeGIF(video, a))
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const filename = url.replace(/.+?(?=[^\/]+$)/, '');
        a.href = url;
        a.textContent = 'Download';
        a.download = `${filename}.gif`;

        state = ReadyState.FINISHED;
      })
      .catch((e) => {
        a.textContent = 'Failed';
        console.error(e);
      });
  });

  container.appendChild(a);
}

function getMediaSrc(container: Element): Promise<string> {
  const videoEl = container.querySelector('video');

  return Promise.resolve(videoEl.src);
}

function createVideo(url: string): Promise<HTMLVideoElement> {
  const video = document.createElement('video');

  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.src = url;

  return new Promise((resolve, reject) => {
    video.onerror = reject;
    video.oncanplaythrough = () => resolve(video);
  });
}

function encodeGIF(video: HTMLVideoElement, logEl: Element): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = canvas.width = video.videoWidth;
  const height = canvas.height = video.videoHeight;

  const gif = new GIF({
    width, height, workerScript,
    workers: 4,
  });

  return new Promise((resolve, reject) => {
    let lastTime = video.currentTime;
    let lastPixels: ImageData;

    requestAnimationFrame(function capture() {
      ctx.drawImage(video, 0, 0);
      const pixels = ctx.getImageData(0, 0, width, height);

      const duration = video.currentTime - lastTime;
      logEl.textContent = `Reading ${video.currentTime / video.duration * 100 | 0}%`;

      if (!lastPixels || !isSameFrame(lastPixels, pixels)) {
        lastPixels = pixels;
        lastTime = video.currentTime;

        gif.addFrame(canvas, {
          copy: true,
          delay: duration * 1000,
        });
      }

      if (!video.ended) {
        requestAnimationFrame(capture);
      } else {
        gif.render();
      }
    });

    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });

    gif.on('progress', (p) => {
      logEl.textContent = `Encoding ${p * 100 | 0}%`;
    });

    video.play();
    video.onerror = reject;
  });
}

function isSameFrame(a: ImageData, b: ImageData): boolean {
  if (a.data.length !== b.data.length) {
    return false;
  }

  const max = a.data.length;

  for (let i = 0; i < max; i++) {
    if (a.data[i] !== b.data[i]) {
      return false;
    }
  }

  return true;
}

function poll(callback: (cancel: () => void) => void) {
  let cnt = 0;

  const timerID = setInterval(() => {
    if (++cnt >= 100) {
      cancel();
    }

    callback(cancel);
  }, 100);

  function cancel() {
    clearInterval(timerID);
  }
}

global.analyzeGIF = function analyzeGIF() {
  console.info('starting service...');
  start();
};

if (!global.eventRegistered) {
  window.addEventListener('keydown', (evt) => {
    if (evt.ctrlKey && String.fromCharCode(evt.keyCode) === 'G') {
      start();
    }
  });
}
