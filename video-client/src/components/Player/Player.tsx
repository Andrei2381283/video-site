import { useEffect, useReducer, useState } from "react";
import Loader from "../Loader/Loader";
import { useFilmQuery } from "../../queries/film";
import startImg from "../../assets/star.svg";
import { getBookmarks, toggleBookmark } from "../../helpers/bookmarks";
import DashPlayer from "../DashPlayer/DashPlayer";
import { FilmPlayerItem } from "../../types/player";
import styles from "./Player.module.css";

interface PlayerProps {
  film: string;
}

function Player({ film }: PlayerProps) {
  const { data: response, isLoading } = useFilmQuery(film);
  const [selectedPlayer, setPlayer] = useState<FilmPlayerItem | null | "">(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const bookmarks = getBookmarks();
  const filmInBookmarks = !!bookmarks.find((item) => item.id === Number(film));
  const title = response?.find((data) => data.name)?.name || null;
  const poster = response?.find((data) => data.poster)?.poster || null;

  useEffect(() => {
    if (!selectedPlayer && response?.length) setPlayer(response[0]);
    if (!response?.length) setPlayer("");
    if (response?.length && title) document.title = title;
  }, [response, selectedPlayer, title]);

  if (!film) return null;

  return (
    <div className={styles.playerContent}>
      {!response && isLoading && <Loader margin={16} />}
      {(!response || !response.length) && !isLoading && (
        <span className={styles.message}>Нет результатов</span>
      )}
      {title && <span className={styles.title}>{title}</span>}
      <div className={styles.buttonContent}>
        {response?.map((player, index) => (
          <button key={index} onClick={() => setPlayer(player)}>
            {player.type}
          </button>
        ))}
      </div>
      {selectedPlayer && typeof selectedPlayer !== "string" && selectedPlayer.src && (
        <iframe
          title="Player"
          className={styles.player}
          src={selectedPlayer.src}
          allow="fullscreen"
          allowFullScreen
          frameBorder="0"
        />
      )}
      {selectedPlayer && typeof selectedPlayer !== "string" && selectedPlayer.data && (
        <DashPlayer data={selectedPlayer.data} film={film} className={styles.player} />
      )}
      {selectedPlayer && (
        <button
          className={styles.saveBookmark}
          onClick={() => {
            toggleBookmark({ id: Number(film), name: title, poster });
            forceUpdate();
          }}
        >
          <img src={startImg} width={28} alt="Star" />{" "}
          {filmInBookmarks ? "Удалить из избранного" : "Добавить в избранное"}
        </button>
      )}
    </div>
  );
}

export default Player;
