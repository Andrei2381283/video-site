import React, { useEffect, useReducer, useState } from "react";
import Loader from "./Loader";
import { useFilmQuery } from "../queries/film";

import startImg from "../assets/star.svg";
import { getBookmarks, toggleBookmark } from "../helpers/bookmarks";
import DashPlayer from "./DashPlayer";

function Player({ film }) {
  const searchParams = new URLSearchParams(window.location.search);
  const { data: response_, isLoading } = useFilmQuery(film);
  const [selectedPlayer, setPlayer] = useState(null);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const response =
    response_?.filter(
      (res) => searchParams.has("test") || res.type !== "self",
    ) || [];

  const bookmarks = getBookmarks();

  const filmInBookmarks = !!bookmarks.find((item) => item.id === Number(film));

  const title = (response && response.find((data) => data.name)?.name) || null;

  const poster =
    (response && response.find((data) => data.poster)?.poster) || null;

  useEffect(() => {
    if (!selectedPlayer && response && response.length) setPlayer(response[0]);
    if (!response || !response.length) setPlayer("");
    if (response && response.length) document.title = title;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  if (!film) return null;

  return (
    <div className="playerContent">
      {!response && isLoading && <Loader margin={16} />}
      {(!response || !response.length) && !isLoading && (
        <span style={{ color: "white", textAlign: "center" }}>
          Нет результатов
        </span>
      )}
      {title && <span className="title">{title}</span>}
      <div className="buttonContent">
        {response &&
          response.map((player, index) => (
            <button key={index} onClick={() => setPlayer(player)}>
              {player.type}
            </button>
          ))}
      </div>
      {selectedPlayer?.src && (
        <iframe
          title="Player"
          className="player"
          src={selectedPlayer?.src}
          allow="fullscreen"
          allowFullScreen="allowfullscreen"
          frameBorder="0"
        ></iframe>
      )}
      {selectedPlayer?.data && (
        <DashPlayer data={selectedPlayer?.data} film={film} />
      )}
      {selectedPlayer && (
        <button
          className="saveBookmark"
          onClick={() =>
            toggleBookmark({ id: Number(film), name: title, poster }) ||
            forceUpdate()
          }
        >
          <img src={startImg} width={28} alt="Star"></img>{" "}
          {filmInBookmarks ? "Удалить из избранного" : "Добавить в избранное"}
        </button>
      )}
      {/* <Together /> */}
    </div>
  );
}

export default Player;
