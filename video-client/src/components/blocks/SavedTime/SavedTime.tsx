import throttle from "lodash/throttle";
import { useEffect, useRef, useState } from "react";
import { safeJsonParse } from "../../../helpers/safeJsonParse";
import { formatPlaybackTime } from "../../../helpers/player";
import { SavedPlaybackTime } from "../../../types/player";
import styles from "./SavedTime.module.css";

const saveTime = throttle(
  (film: string | number | undefined, currentSeason: number, currentEpisode: number, currentTime: number) => {
    if (!film) return;
    localStorage.setItem(
      "savedTime:" + film,
      JSON.stringify({ currentSeason, currentEpisode, currentTime }),
    );
  },
  2000,
);

interface SavedTimeProps {
  currentSeason: number;
  currentEpisode: number;
  currentTime: number;
  isPlaying: boolean;
  film?: string | number;
  hasSeries: boolean;
  change: (timeData: SavedPlaybackTime) => void;
}

export const SavedTime = ({
  currentSeason,
  currentEpisode,
  currentTime,
  isPlaying,
  film,
  hasSeries,
  change,
}: SavedTimeProps) => {
  const storedTimeRef = useRef<SavedPlaybackTime | null>(
    safeJsonParse<SavedPlaybackTime>(film ? localStorage.getItem("savedTime:" + film) : null),
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

  if (!show || !change || !storedTime || !Number.isFinite(storedTime.currentTime)) {
    return null;
  }

  return (
    <div className={styles.savedTimeContainer}>
      Вы остановились на{" "}
      {hasSeries
        ? `${storedTime.currentSeason + 1} сезоне, ${storedTime.currentEpisode + 1} серии,`
        : ""}{" "}
      {formatPlaybackTime(storedTime.currentTime)}
      <button
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
