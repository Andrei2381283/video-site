import React, { useEffect, useReducer, useState } from "react";
import Loader from "./Loader";
import { useFilmQuery } from "../queries/film";

import startImg from "../assets/star.svg";
import { getBookmarks, toggleBookmark } from "../helpers/bookmarks";

function Player({ film }) {
  const { data: response, isLoading } = useFilmQuery(film);
  const [selectedPlayer, setPlayer] = useState('');
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  const bookmarks = getBookmarks();

  const filmInBookmarks = !!bookmarks.find((item) => item.id === Number(film));

  const title = (response && response.find((data) => data.name)?.name) || null;

  const poster = (response && response.find((data) => data.poster)?.poster) || null;

  useEffect(() => {
    if (!selectedPlayer && response && response.length) setPlayer(response[0].src);
    if (!response || !response.length) setPlayer('');
    if (response && response.length) document.title = title;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  if (!film) return null;

  return (
    <div className="playerContent">
      {(!response && isLoading) && <Loader margin={16} />}
      {(!response || !response.length) && !isLoading && <span style={{ color: 'white', textAlign: 'center' }}>Нет результатов</span>}
      {title && <span className="title">{title}</span>}
      <div className="buttonContent">
        {response && response.map((player, index) => (
          <button key={index} onClick={() => setPlayer(player.src)}>{player.type}</button>
        ))}
      </div>
      {selectedPlayer && <iframe title="Player" className="player" src={selectedPlayer} allow="fullscreen" allowFullScreen="allowfullscreen" frameBorder="0"></iframe>}
      {selectedPlayer && <button className="saveBookmark" onClick={() => toggleBookmark({id: Number(film), name: title, poster}) || forceUpdate()}><img src={startImg} width={28} alt="Star"></img> {filmInBookmarks ? "Удалить из избранного" : "Добавить в избранное"}</button>}
      {/* <Together /> */}
    </div>
  )
}

export default Player;