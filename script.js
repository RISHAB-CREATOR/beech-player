document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const rewindBtn = document.getElementById('rewind');
  const playPauseBtn = document.getElementById('playPause');
  const forwardBtn = document.getElementById('forward');
  const volumeToggleBtn = document.getElementById('volumeToggle');
  const fullscreenToggleBtn = document.getElementById('fullscreenToggle');
  const playerContainer = document.getElementById('playerContainer');

  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');

  const volumeIcon = document.getElementById('volumeIcon');
  const muteIcon = document.getElementById('muteIcon');

  const fullscreenIcon = document.getElementById('fullscreenIcon');
  const minimizeIcon = document.getElementById('minimizeIcon');

  const progressBar = document.getElementById('progressBar');
  const durationDisplay = document.getElementById('durationDisplay');
  const customSubtitle = document.getElementById('customSubtitle');
    const subtitleToggleBtn = document.getElementById('subtitleToggle');
  const loadingIndicator = document.getElementById('loadingIndicator');
const scanOverlay = document.getElementById('scanOverlay');
const scanMessage = document.getElementById('scanMessage');
  const watchPartyBtn = document.getElementById('watchPartyBtn');

watchPartyBtn.addEventListener('click', () => {
    const modal = document.getElementById('m3u8Modal');
    const input = document.getElementById('m3u8Input');
    const status = document.getElementById('copyStatus');

    const videoUrl = window._originalM3U8;

    if (!videoUrl) {
      input.value = '❌ No video URL available';
    } else {
      input.value = videoUrl;
    }

    status.textContent = '';
    modal.classList.add('show');

    input.focus();
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    const modal = document.getElementById('m3u8Modal');
    modal.classList.remove('show');
  });

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('m3u8Modal');
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  document.getElementById('copyM3U8Btn').addEventListener('click', () => {
    const input = document.getElementById('m3u8Input');
    input.select();
    input.setSelectionRange(0, 99999);

    try {
      const successful = document.execCommand('copy');
      const status = document.getElementById('copyStatus');
      if (successful) {
        status.textContent = 'URL copied to clipboard!';
      } else {
        status.textContent = '❌ Failed to copy URL.';
      }
    } catch (err) {
      console.error('Copy failed', err);
    }

    window.getSelection().removeAllRanges(); 
  });

scanOverlay.style.display = 'flex';
scanMessage.textContent = 'Scanning servers...';

  video.autoplay = true;
  video.muted = true;

  volumeIcon.style.display = 'none';
  muteIcon.style.display = 'inline';

  loadingIndicator.style.display = 'block';
  video.addEventListener('playing', () => {
    loadingIndicator.style.display = 'none';
  });
  video.addEventListener('waiting', () => {
    loadingIndicator.style.display = 'block';
  });
  video.addEventListener('canplay', () => {
    loadingIndicator.style.display = 'none';
  });

    let subtitlesEnabled = true; 

  function handleCueChange(track) {
    track.addEventListener('cuechange', () => {
      if (!subtitlesEnabled) {
        customSubtitle.textContent = '';
        return;
      }
      const activeCues = track.activeCues;
      if (activeCues.length > 0) {
        customSubtitle.textContent = activeCues[0].text;
      } else {
        customSubtitle.textContent = '';
      }
    });
  }

  video.textTracks.addEventListener('addtrack', (event) => {
    const track = event.track;
    if (track.language === 'en') {
      track.mode = 'hidden';
      handleCueChange(track);
    }
  });

  for (let i = 0; i < video.textTracks.length; i++) {
    const track = video.textTracks[i];
    if (track.language === 'en') {
      track.mode = 'hidden';
      handleCueChange(track);
    }
  }

subtitleToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation(); 
  subtitleMenu.classList.toggle('show'); 
});

async function loadVideo() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'movie';
  const id = params.get('id');
  const season = params.get('season');
  const episode = params.get('episode');

  await setPlayerBackgroundFromTMDb(id, type);

  if (!id) {
    alert('❗ Missing ?id= in URL');
    return;
  }
  if (type === 'tv' && (!season || !episode)) {
    alert('❗ Missing ?season= and ?episode= for TV show');
    return;
  }

  const playerContainer = document.getElementById('playerContainer');
  const scanOverlay = document.getElementById('scanOverlay');
  const scanMessage = document.getElementById('scanMessage');
  const video = document.getElementById('video');
  const qualityBtn = document.getElementById('qualityBtn');
  const qualityMenu = document.getElementById('qualityMenu');
  const subtitleToggle = document.getElementById('subtitleToggle');
  const subtitleMenu = document.getElementById('subtitleMenu');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const sourceSelectorBtn = document.getElementById('sourceSelectorBtn');
  const sourceDropdown = document.getElementById('sourceDropdown');

  let currentSubtitleTrack = null;
  let isFindingSources = true;
  let hasLoadedSource = false;

  scanOverlay.style.display = 'flex';
  scanMessage.textContent = 'Fetching sources...';
  if (loadingIndicator) loadingIndicator.style.display = 'none';
  
  const endpoint = (type === 'tv')
    ? `/api/stream/tv/${id}/${season}/${episode}`
    : `/api/stream/${id}`;

  let fetchTimeout = setTimeout(() => {
    if (scanOverlay.style.display !== 'none') {
      scanOverlay.style.display = 'none';
      console.warn('Fetching sources timed out after 60 seconds');
    }
  }, 60000);

  video.addEventListener('playing', () => {
    if (!isFindingSources && loadingIndicator) loadingIndicator.style.display = 'none';
    playerContainer.classList.remove('has-backdrop');
    playerContainer.classList.add('no-backdrop');
  });
  video.addEventListener('waiting', () => {
    if (!isFindingSources && loadingIndicator) loadingIndicator.style.display = 'block';
  });
  video.addEventListener('canplay', () => {
    if (!isFindingSources && loadingIndicator) loadingIndicator.style.display = 'none';
  });

  // Source dropdown toggle
  sourceSelectorBtn.addEventListener('click', e => {
    e.stopPropagation();
    sourceDropdown.style.display = sourceDropdown.style.display === 'block' ? 'none' : 'block';
  });
  document.addEventListener('click', () => {
    sourceDropdown.style.display = 'none';
    qualityMenu.style.display = 'none';
    subtitleMenu.style.display = 'none';
  });

  // Quality menu toggle
  qualityBtn.addEventListener('click', e => {
    e.stopPropagation();
    qualityMenu.style.display = qualityMenu.style.display === 'block' ? 'none' : 'block';
  });

  // --------- Subtitle Logic ---------

  if (loadingIndicator) loadingIndicator.style.display = 'block';

  console.log('🧾 Fetching subtitles for ID:', id);

  let subtitlesData = [];
  let subtitlesLoaded = false;

  function buildSubtitleMenu() {
    subtitleMenu.innerHTML = '';

    if (!subtitlesData.length) {
      subtitleMenu.innerHTML = '<div style="padding:10px; color:#ccc;">No subtitles available</div>';
      return;
    }

    const label = document.createElement('div');
    label.textContent = 'Subtitle';
    label.classList.add('subtitle-label');
    subtitleMenu.appendChild(label);

    subtitlesData.forEach(sub => {
      const item = document.createElement('div');
      item.classList.add('item');

      const icon = document.createElement('img');
      icon.src = sub.flagUrl || '';
      icon.alt = sub.language || '';
      icon.classList.add('flag-icon');

      const textEl = document.createElement('span');
      textEl.textContent = sub.display || sub.language || 'Subtitle';

      item.append(icon, textEl);

      item.addEventListener('click', async () => {
        // Remove highlight from all items
        subtitleMenu.querySelectorAll('.item').forEach(i => i.classList.remove('active'));
        // Highlight this clicked item
        item.classList.add('active');

        if (currentSubtitleTrack) currentSubtitleTrack.remove();

        let content = await (await fetch(sub.url)).text();
        if (sub.format === 'srt') {
          content = 'WEBVTT\n\n' + content.replace(/\r+/g, '')
            .replace(/^\s+|\s+$/g, '')
            .split('\n')
            .map(l => l.replace(/(\d+:\d+:\d+),(\d+)/g, '$1.$2'))
            .join('\n');
        }

        const blob = new Blob([content], { type: 'text/vtt' });
        const trackUrl = URL.createObjectURL(blob);

        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = sub.display || sub.language || 'Subtitle';
        track.srclang = sub.language;
        track.src = trackUrl;
        track.default = true;

        video.appendChild(track);
        currentSubtitleTrack = track;

        track.addEventListener('load', () => {
          const tt = track.track;
          tt.mode = 'hidden';
          handleCueChange(tt);
        });

        subtitleMenu.style.display = 'none';
        subtitleToggle.setAttribute('aria-pressed', 'false');
      });

      subtitleMenu.appendChild(item);
    });

    // Highlight default subtitle (English) if available
    const defaultSub = subtitlesData.find(s => s.language === 'en');
    if (defaultSub) {
      const defaultItem = Array.from(subtitleMenu.querySelectorAll('.item'))
        .find(i => i.textContent.includes(defaultSub.display || defaultSub.language));
      if (defaultItem) {
        defaultItem.classList.add('active');
      }
    }
  }

async function fetchAndShowSubtitles() {
  subtitleMenu.innerHTML = '';
  try {
    let subtitleUrl = '';
    if (type === 'tv') {
      subtitleUrl = `https://madplay.site/api/subtitle?id=${id}&season=${season}&episode=${episode}`;
    } else {
      subtitleUrl = `https://madplay.site/api/subtitle?id=${id}`;
    }

    const subRes = await fetch(subtitleUrl);
    const subs = await subRes.json();

    // Filter subtitles with format vtt or srt and deduplicate by display+language
    let tracks = subs.filter(s => (s.format === 'vtt' || s.format === 'srt'));
    const unique = new Map();
    tracks.forEach(s => {
      const key = (s.display || '').toLowerCase() + '_' + (s.language || '');
      if (!unique.has(key)) unique.set(key, s);
    });
    subtitlesData = Array.from(unique.values());

    buildSubtitleMenu();

    subtitlesLoaded = true;

    if (loadingIndicator) loadingIndicator.style.display = 'none';
  } catch (err) {
    subtitleMenu.innerHTML = '<div style="padding:10px; color:#ccc;">Failed to load subtitles</div>';
    console.error(err);
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
}

    // Auto-fetch subtitles immediately when video loads (before user clicks toggle)
    await fetchAndShowSubtitles();

    subtitleToggle.addEventListener('click', e => {
      e.stopPropagation();

      const isVisible = subtitleMenu.style.display === 'block';

      if (isVisible) {
        subtitleMenu.style.display = 'none';
        subtitleToggle.setAttribute('aria-pressed', 'false');
        return;
      }

      subtitleMenu.style.display = 'block';
      subtitleToggle.setAttribute('aria-pressed', 'true');
    });

    // Prevent subtitleMenu closing if clicking inside or on toggle
    document.addEventListener('click', e => {
      if (!subtitleMenu.contains(e.target) && e.target !== subtitleToggle) {
        subtitleMenu.style.display = 'none';
        subtitleToggle.setAttribute('aria-pressed', 'false');
      }
    });
  // ---------------- End subtitle code ----------------

let attempt = 0;
let data = null;

while (attempt < 10) {
  try {
    const response = await fetch(endpoint);
    const json = await response.json();

    if (response.ok && (json.videoUrl || json.sources)) {
      data = json;
      scanMessage.textContent = 'Fetching success';
      clearTimeout(fetchTimeout);
      scanOverlay.style.display = 'none';
      break;
    }
  } catch (e) {
    console.warn(`Fetch attempt ${attempt + 1} failed.`);
  }

  attempt++;
  // No delay here, move to next attempt immediately
}

    if (!data) {
      scanMessage.textContent = 'No sources found after multiple attempts.';
      setTimeout(() => scanOverlay.style.display = 'none', 6000);
      return;
    }

            let sources = [];
    if (Array.isArray(data.sources)) {
      data.sources.forEach(src => {
        if (Array.isArray(src)) {
          sources.push(...src);
        } else {
          sources.push(src);
        }
      });
    } else if (data.videoUrl) {
      sources = [{ videoUrl: data.videoUrl, source: data.source || 'Default' }];
    }

    // Populate source dropdown with sources
function getCountryCodeFromLanguage(language) {
  const map = {
    English: 'US',
    Hindi: 'IN',
    Bengali: 'BD',
    Tamil: 'IN',
    Telugu: 'IN',
    Spanish: 'ES',
    French: 'FR',
    Japanese: 'JP',
    Korean: 'KR',
    Chinese: 'CN',
    German: 'DE',
    Italian: 'IT',
    Filipino: 'PH',
  };
  return map[language] || 'UN'; // fallback flag
}

let activeIndex = 0; // will be updated later after finding first working source

function renderSources() {
  sourceDropdown.innerHTML = '';

  sources.forEach(({ videoUrl, source, working, title }, index) => {
    const item = document.createElement('div');
    item.classList.toggle('active', index === activeIndex);
    item.style.cursor = working ? 'pointer' : 'not-allowed';
    item.style.opacity = working ? '1' : '0.5';
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = '8px';
    item.style.marginBottom = '6px';

    const countryCode = getCountryCodeFromLanguage(title || source);

    const flagImg = document.createElement('img');
    flagImg.src = `https://flagsapi.com/${countryCode}/shiny/32.png`;
    flagImg.width = 20;
    flagImg.height = 15;
    flagImg.alt = title || source;
    item.appendChild(flagImg);

    const label = document.createElement('span');
    label.textContent = working ? (title || source) : `${source} (Unavailable)`;
    item.appendChild(label);

    if (working) {
      item.addEventListener('click', () => {
        if (activeIndex !== index) {
          activeIndex = index;
          loadStream(videoUrl, source);
          renderSources();
        }
      });
    }

    sourceDropdown.appendChild(item);
  });
}

function loadStream(rawM3U8, sourceName = '') {
  hasLoadedSource = true;
  window._originalM3U8 = rawM3U8;

  const isDirectM3U8 = rawM3U8.endsWith('.m3u8');
  const isMadplayProxy = rawM3U8.includes('madplay.site/api/holly/proxy?url=');

  // Force proxy for certain sources and edge cases
  const shouldUseProxy =
    sourceName.toUpperCase() === 'FAIA' ||
    !rawM3U8.startsWith('http') ||
    !isDirectM3U8;

  const finalUrl = shouldUseProxy
    ? `/api/proxy?url=${encodeURIComponent(rawM3U8)}`
    : rawM3U8;

  // Cleanup old instance
  if (window.hls) {
    window.hls.destroy();
    window.hls = null;
  }

  if (Hls.isSupported()) {
    const hls = new Hls();
    window.hls = hls;

    hls.attachMedia(video);
    hls.loadSource(finalUrl);
    console.log(`🎥 Loading stream from: ${finalUrl}`);

    // Quality menu handler
    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      qualityMenu.innerHTML = '';

      const autoLi = document.createElement('li');
      autoLi.textContent = 'Auto';
      autoLi.classList.add('active');
      autoLi.style.cursor = 'pointer';
      autoLi.addEventListener('click', () => {
        hls.currentLevel = -1;
        setActiveQualityItem(autoLi);
        qualityMenu.style.display = 'none';
      });
      qualityMenu.appendChild(autoLi);

      data.levels.forEach((level, i) => {
        const label = level.height
          ? `${level.height}p`
          : `${Math.round(level.bitrate / 1000)} kbps`;
        const li = document.createElement('li');
        li.textContent = label;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          hls.currentLevel = i;
          setActiveQualityItem(li);
          qualityMenu.style.display = 'none';
        });
        qualityMenu.appendChild(li);
      });

      video.play();
    });

    // Error handling
    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('❌ HLS error:', data);
      if (data.fatal) {
        hls.destroy();
        alert('Stream playback failed. Try a different source.');
      }
    });

  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari fallback
    video.src = finalUrl;
    video.addEventListener('loadedmetadata', () => video.play());
  } else {
    alert('Your browser does not support HLS playback.');
    scanMessage.textContent = 'Unsupported browser';
  }
}

// 👉 Initial source selection (if you want autoplay first source)
const firstWorkingIndex = sources.findIndex(s => s.working);
activeIndex = firstWorkingIndex >= 0 ? firstWorkingIndex : 0;

const initialSource = sources[activeIndex];
loadStream(initialSource.videoUrl, initialSource.source);

// Initial render and load
renderSources();
if (sources[activeIndex]?.working) {
  loadStream(sources[activeIndex].videoUrl, sources[activeIndex].source);
}

// Fallback: if no source loaded after 5s, load first available source
setTimeout(() => {
  if (!hasLoadedSource && sources.length > 0) {
    activeIndex = 0;
    renderSources();
    loadStream(sources[0].videoUrl, sources[0].source);
  }
}, 5000);

function loadStream(rawM3U8, sourceName = '') {
  window._originalM3U8 = rawM3U8;

  const isDirectStream = rawM3U8.endsWith('.m3u8');
  const isMadplayProxy = rawM3U8.includes('madplay.site/api/holly/proxy?url=');

  const useProxy = sourceName.toUpperCase() === 'FAIA';

  let finalUrl;
  if (useProxy) {
    finalUrl = `/api/proxy?url=${encodeURIComponent(rawM3U8)}`;
  } else if (isMadplayProxy || isDirectStream) {
    finalUrl = rawM3U8;
  } else {
    finalUrl = rawM3U8; // direct stream for others
  }

  if (window.hls) {
    window.hls.destroy();
    window.hls = null;
  }

  if (Hls.isSupported()) {
    window.hls = new Hls();

    window.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      qualityMenu.innerHTML = '';

      const autoLi = document.createElement('li');
      autoLi.textContent = 'Auto';
      autoLi.classList.add('active');
      autoLi.style.cursor = 'pointer';
      autoLi.addEventListener('click', () => {
        window.hls.currentLevel = -1;
        setActiveQualityItem(autoLi);
        qualityMenu.style.display = 'none';
      });
      qualityMenu.appendChild(autoLi);

      data.levels.forEach((level, i) => {
        const label = level.height
          ? `${level.height}p`
          : `${Math.round(level.bitrate / 1000)} kbps`;
        const li = document.createElement('li');
        li.textContent = label;
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
          window.hls.currentLevel = i;
          setActiveQualityItem(li);
          qualityMenu.style.display = 'none';
        });
        qualityMenu.appendChild(li);
      });
    });

    window.hls.loadSource(finalUrl);
    window.hls.attachMedia(video);
    window.hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = finalUrl;
    video.addEventListener('loadedmetadata', () => video.play());
  } else {
    alert('Your browser does not support HLS playback.');
    scanMessage.textContent = 'Unsupported browser';
  }
}

    function setActiveQualityItem(el) {
      qualityMenu.querySelectorAll('li').forEach(li => li.classList.remove('active'));
      el.classList.add('active');
    }

    isFindingSources = false;
    if (loadingIndicator) loadingIndicator.style.display = 'block';
  }

const qualityBtn = document.getElementById('qualityBtn');
const qualityMenu = document.getElementById('qualityMenu');

qualityBtn.addEventListener('click', () => {
  qualityMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (!qualityBtn.contains(e.target) && !qualityMenu.contains(e.target)) {
    qualityMenu.classList.remove('show');
  }
});

qualityMenu.querySelectorAll('li').forEach(item => {
  item.addEventListener('click', async () => {
    const selectedQuality = item.getAttribute('data-quality');

    qualityMenu.querySelectorAll('li').forEach(li => li.classList.remove('active'));

    item.classList.add('active');

    qualityMenu.classList.remove('show');

    if (!window.hls) {
      alert('HLS is not initialized');
      return;
    }

    const level = window.hls.levels.findIndex(lvl => {
      if (selectedQuality === '1080p') return lvl.height === 1080;
      if (selectedQuality === '780p') return lvl.height === 780;
      if (selectedQuality === '480p') return lvl.height === 480;
      return false;
    });

    if (level === -1) {
      alert(`Quality ${selectedQuality} not available.`);
      return;
    }

    window.hls.currentLevel = level;
  });
});

qualityBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  qualityMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (!qualityBtn.contains(e.target) && !qualityMenu.contains(e.target)) {
    qualityMenu.classList.remove('show');
  }
});

video.addEventListener('ended', () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || 'movie';

  if (type === 'tv') {
    let season = parseInt(params.get('season'));
    let episode = parseInt(params.get('episode'));

    if (!isNaN(season) && !isNaN(episode)) {
      episode += 1;

      params.set('episode', episode);
      const newUrl = `${window.location.pathname}?${params.toString()}`;

      window.location.href = newUrl;
    }
  }
});

  function updatePlayPauseIcons() {
    playIcon.style.display = video.paused ? 'inline' : 'none';
    pauseIcon.style.display = video.paused ? 'none' : 'inline';
  }

  playPauseBtn.addEventListener('click', () => {
    video.paused ? video.play() : video.pause();
  });

  video.addEventListener('play', updatePlayPauseIcons);
  video.addEventListener('pause', updatePlayPauseIcons);

  rewindBtn.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
  });

  forwardBtn.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
  });

  volumeToggleBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    volumeIcon.style.display = video.muted ? 'none' : 'inline';
    muteIcon.style.display = video.muted ? 'inline' : 'none';
  });

  video.addEventListener('timeupdate', () => {
    if (!isNaN(video.duration)) {
      const value = (video.currentTime / video.duration) * 100;
      progressBar.style.background = `linear-gradient(to right, #00e6b2 0%, #00e6b2 ${value}%, #444 ${value}%, #444 100%)`;
      progressBar.value = video.currentTime;
      progressBar.max = video.duration;
      durationDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
    }
  });

  progressBar.addEventListener('input', () => {
    const value = (progressBar.value / progressBar.max) * 100;
    progressBar.style.background = `linear-gradient(to right, #00e6b2 0%, #00e6b2 ${value}%, #444 ${value}%, #444 100%)`;
    video.currentTime = progressBar.value;
  });

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  fullscreenToggleBtn.addEventListener('click', () => {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;

    if (!isFullscreen) {
      const requestFS = playerContainer.requestFullscreen || playerContainer.webkitRequestFullscreen || playerContainer.msRequestFullscreen;

      if (requestFS) {
        requestFS.call(playerContainer).then(() => {
          fullscreenIcon.style.display = 'none';
          minimizeIcon.style.display = 'inline';
          playerContainer.classList.add('fullscreen');
        }).catch(err => {
          alert(`Fullscreen error: ${err.message}`);
        });
      } else if (video.webkitEnterFullscreen) {

        video.webkitEnterFullscreen();
        fullscreenIcon.style.display = 'none';
        minimizeIcon.style.display = 'inline';
        playerContainer.classList.add('fullscreen');
      } else {
        alert('Fullscreen API is not supported');
      }
    } else {
      const exitFS = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;

      if (exitFS) {
        exitFS.call(document).then(() => {
          fullscreenIcon.style.display = 'inline';
          minimizeIcon.style.display = 'none';
          playerContainer.classList.remove('fullscreen');
        });
      } else if (video.webkitExitFullscreen) {

        video.webkitExitFullscreen();
        fullscreenIcon.style.display = 'inline';
        minimizeIcon.style.display = 'none';
        playerContainer.classList.remove('fullscreen');
      }
    }
  });

  function onFullscreenChange() {
    const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    fullscreenIcon.style.display = isFS ? 'none' : 'inline';
    minimizeIcon.style.display = isFS ? 'inline' : 'none';
    playerContainer.classList.toggle('fullscreen', isFS);
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  document.addEventListener('MSFullscreenChange', onFullscreenChange);

  let hideControlsTimeout;

function showControls() {
  document.body.classList.remove('hide-controls');
  clearTimeout(hideControlsTimeout);
  hideControlsTimeout = setTimeout(() => {
    document.body.classList.add('hide-controls');
  }, 10000); 
}

document.addEventListener('mousemove', showControls);
document.addEventListener('keydown', showControls);
document.addEventListener('click', showControls);

showControls();

  loadVideo();
  updatePlayPauseIcons();
});
