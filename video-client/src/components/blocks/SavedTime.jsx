import throttle from "lodash/throttle";
import React, { useEffect, useRef, useState } from "react";
import { safeJsonParse } from "../../helpers/safeJsonParse";
import { formatPlaybackTime } from "../../helpers/player";

const saveTime = throttle(
  (film, currentSeason, currentEpisode, currentTime) => {
    localStorage.setItem(
      "savedTime:" + film,
      JSON.stringify({ currentSeason, currentEpisode, currentTime }),
    );
  },
  2000,
);

export const SavedTime = ({
  currentSeason,
  currentEpisode,
  currentTime,
  isPlaying,
  film,
  hasSeries,
  change,
}) => {
  const storedTimeRef = useRef(
    safeJsonParse(localStorage.getItem("savedTime:" + film)),
  );
  const [show, setShow] = useState(true);

  const storedTime = storedTimeRef.current;

  useEffect(() => {
    if (isPlaying) saveTime(film, currentSeason, currentEpisode, currentTime);
  }, [film, currentSeason, currentEpisode, currentTime, isPlaying]);

  useEffect(() => {
    if (isPlaying && show) {
      setShow(false);
    }
  }, [isPlaying, show]);

  if (!show || !change || !Number.isFinite(storedTime?.currentTime))
    return null;

  return (
    <div className="savedTimeContainer">
      Вы остановились на{" "}
      {hasSeries
        ? `${storedTime.currentSeason + 1} сезоне, ${storedTime.currentEpisode + 1} серии,`
        : ""}{" "}
      {formatPlaybackTime(storedTime.currentTime)}
      <button
        className="button"
        onClick={() => {
          change(storedTime);
          setShow(false);
        }}
      >
        Продолжить
      </button>
    </div>
  );
};
