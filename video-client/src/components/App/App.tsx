import { useCallback, useEffect, useMemo, useState } from "react";
import FilmInput from "../FilmInput/FilmInput";
import Bookmarks from "../Bookmarks/Bookmarks";
import Player from "../Player/Player";
import styles from "./App.module.css";

function App() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [film, setFilm] = useState<string | null>(null);
  const [filmIsString, setFilmIsString] = useState(false);

  const getTestQuery = useCallback(
    () => (searchParams.has("test") ? "&test" : ""),
    [searchParams],
  );

  const updateFilm = useCallback(
    (newFilm: string | number | null) => {
      const normalizedFilm = newFilm == null ? "" : String(newFilm);
      const kinopoiskMatch = normalizedFilm.match(/kinopoisk.ru\/(?:film|series)\/([0-9]+)\//);

      if (normalizedFilm && Number.isNaN(Number(normalizedFilm)) && kinopoiskMatch) {
        const kp = kinopoiskMatch[1];
        window.history.pushState({}, "", window.location.origin + "?f=" + encodeURI(kp) + getTestQuery());
        setFilm(kp);
        setFilmIsString(false);
      } else if (normalizedFilm && Number.isNaN(Number(normalizedFilm))) {
        window.history.pushState({}, "", window.location.origin + (searchParams.has("test") ? "?test" : ""));
        setFilm(null);
        setFilmIsString(true);
      } else if (normalizedFilm) {
        window.history.pushState({}, "", window.location.origin + "?f=" + encodeURI(normalizedFilm) + getTestQuery());
        setFilm(normalizedFilm);
        setFilmIsString(false);
      } else {
        window.history.pushState({}, "", window.location.origin + (searchParams.has("test") ? "?test" : ""));
        setFilm(null);
        setFilmIsString(false);
      }
    },
    [getTestQuery, searchParams],
  );

  useEffect(() => {
    if (searchParams.has("f")) updateFilm(searchParams.get("f"));
  }, [searchParams, updateFilm]);

  return (
    <div className={styles.content}>
      <Bookmarks onSelect={updateFilm} />
      <FilmInput submit={updateFilm} />
      {filmIsString && (
        <span className={styles.message}>
          Поиск фильма по названию временно не работает
        </span>
      )}
      {film && <Player film={film} key={film} />}
    </div>
  );
}

export default App;
