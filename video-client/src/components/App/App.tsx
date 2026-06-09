import { useCallback, useEffect, useMemo, useState } from "react";
import FilmInput from "../FilmInput/FilmInput";
import Bookmarks from "../Bookmarks/Bookmarks";
import Player from "../Player/Player";
import styles from "./App.module.css";

function App() {
  const [film, setFilm] = useState<string | null>(null);
  const [filmIsString, setFilmIsString] = useState(false);

  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const queries = useMemo(() => {
    const newParams = [];
    if (searchParams.has("test")) newParams.push("test");
    if (searchParams.has("tv")) newParams.push("tv");

    return newParams.join("&");
  }, [searchParams]);

  const getQueries = useCallback(
    (firstSym = "&") => {
      if (!queries.length) return "";

      return firstSym + queries;
    },
    [queries],
  );

  const updateFilm = useCallback(
    (newFilm: string | number | null) => {
      const normalizedFilm = newFilm == null ? "" : String(newFilm);
      const kinopoiskMatch = normalizedFilm.match(
        /kinopoisk.ru\/(?:film|series)\/([0-9]+)\//,
      );

      if (
        normalizedFilm &&
        Number.isNaN(Number(normalizedFilm)) &&
        kinopoiskMatch
      ) {
        const kp = kinopoiskMatch[1];
        window.history.pushState(
          {},
          "",
          window.location.origin + "?f=" + encodeURI(kp) + getQueries("&"),
        );
        setFilm(kp);
        setFilmIsString(false);
      } else if (normalizedFilm && Number.isNaN(Number(normalizedFilm))) {
        window.history.pushState(
          {},
          "",
          window.location.origin + getQueries("?"),
        );
        setFilm(null);
        setFilmIsString(true);
      } else if (normalizedFilm) {
        window.history.pushState(
          {},
          "",
          window.location.origin +
            "?f=" +
            encodeURI(normalizedFilm) +
            getQueries("&"),
        );
        setFilm(normalizedFilm);
        setFilmIsString(false);
      } else {
        window.history.pushState(
          {},
          "",
          window.location.origin + getQueries("&"),
        );
        setFilm(null);
        setFilmIsString(false);
      }
    },
    [queries, searchParams],
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
