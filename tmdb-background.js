async function setPlayerBackgroundFromTMDb(id, type = 'movie') {
  const API_KEY = '3e20e76d6d210b6cb128d17d233b64dc';
  const tmdbUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}`;

  try {
    const res = await fetch(tmdbUrl);
    const data = await res.json();

    const container = document.getElementById('playerContainer');

    if (data.backdrop_path) {
      const backdropUrl = `https://image.tmdb.org/t/p/original${data.backdrop_path}`;

      container.style.backgroundImage = `url('${backdropUrl}')`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.backgroundRepeat = 'no-repeat';
    } else {
      console.warn('No backdrop image found.');
      container.style.backgroundImage = 'none';
    }

    let existingTitle = container.querySelector('.player-title');
    if (existingTitle) existingTitle.remove();

    const titleText = data.title || data.name || 'Unknown Title';

    const titleDiv = document.createElement('div');
    titleDiv.classList.add('player-title');
    titleDiv.textContent = titleText;

    container.appendChild(titleDiv);

  } catch (err) {
    console.error('Error fetching TMDb data:', err);
  }
}
