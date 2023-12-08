import { useCallback, useEffect, useState } from 'react';
import FilmInput from './FilmInput';
import Bookmarks from './Bookmarks';
import Player from './Player';

import '../App.css';

function App() {
  const searchParams = new URLSearchParams(window.location.search);

  const [film, setFilm] = useState(null);

  const [filmIsString, setFilmIsString] = useState(false);

  const updateFilm = useCallback((newFilm) => {
    if (newFilm && isNaN(Number(newFilm)) && newFilm.indexOf('kinopoisk.ru') > -1 && newFilm.match(/kinopoisk.ru\/(?:film|series)\/([0-9]+)\//)) {
      const kp = newFilm.match(/kinopoisk.ru\/(?:film|series)\/([0-9]+)\//)[1];
      window.history.pushState({}, '', window.location.origin + '?f=' + encodeURI(kp));
      setFilm(kp);
      setFilmIsString(false);
    } else if (newFilm && isNaN(Number(newFilm))) {
      window.history.pushState({}, '', window.location.origin);
      setFilm(null);
      setFilmIsString(true);
    } else if (newFilm) {
      window.history.pushState({}, '', window.location.origin + '?f=' + encodeURI(newFilm));
      setFilm(newFilm);
      setFilmIsString(false);
    } else {
      window.history.pushState({}, '', window.location.origin);
      setFilm(null);
      setFilmIsString(false);
    }
  }, [setFilm, setFilmIsString]);

  useEffect(() => {
    if (searchParams.has('f')) updateFilm(searchParams.get('f'));
  }, [])

  return (
    <div className="content">
      <Bookmarks onSelect={updateFilm} />
      <FilmInput submit={updateFilm} />
      {filmIsString && <span style={{ color: 'white' }}>Поиск фильма по названию временно не работает</span>}
      {film && <Player film={film} key={film} />}
    </div>
  );
}

export default App;
