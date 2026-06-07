import throttle from "lodash/throttle";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { safeJsonParse } from "../../../helpers/safeJsonParse";
import { formatPlaybackTime } from "../../../helpers/player";
import { SavedPlaybackTime } from "../../../types/player";
import styles from "./SavedTime.module.css";

const saveTime = throttle(
  (
    film: string | number | undefined,
    currentSeason: number,
    currentEpisode: number,
    currentTime: number,
  ) => {
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
  isPlaying: boolean;
  film?: string | number;
  hasSeries: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  url: string;
  change: (timeData: SavedPlaybackTime) => void;
}

export const SavedTime = ({
  currentSeason,
  currentEpisode,
  isPlaying,
  film,
  hasSeries,
  videoRef,
  url,
  change,
}: SavedTimeProps) => {
  const storedTimeRef = useRef<SavedPlaybackTime | null>(
    safeJsonParse<SavedPlaybackTime>(
      film ? localStorage.getItem("savedTime:" + film) : null,
    ),
  );
  const [show, setShow] = useState(true);
  const storedTime = storedTimeRef.current;
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    const syncTimelineState = () => {
      setCurrentTime(
        Number.isFinite(videoElement.currentTime)
          ? videoElement.currentTime
          : 0,
      );
    };

    videoElement.addEventListener("loadedmetadata", syncTimelineState);
    videoElement.addEventListener("durationchange", syncTimelineState);
    videoElement.addEventListener("timeupdate", syncTimelineState);
    videoElement.addEventListener("progress", syncTimelineState);
    videoElement.addEventListener("seeking", syncTimelineState);
    videoElement.addEventListener("seeked", syncTimelineState);

    return () => {
      videoElement.removeEventListener("loadedmetadata", syncTimelineState);
      videoElement.removeEventListener("durationchange", syncTimelineState);
      videoElement.removeEventListener("timeupdate", syncTimelineState);
      videoElement.removeEventListener("progress", syncTimelineState);
      videoElement.removeEventListener("seeking", syncTimelineState);
      videoElement.removeEventListener("seeked", syncTimelineState);
      setCurrentTime(0);
    };
  }, [url]);

  useEffect(() => {
    if (isPlaying) saveTime(film, currentSeason, currentEpisode, currentTime);
  }, [film, currentSeason, currentEpisode, currentTime, isPlaying]);

  useEffect(() => {
    if (isPlaying && show) {
      setShow(false);
    }
  }, [isPlaying, show]);

  if (
    !show ||
    !change ||
    !storedTime ||
    !Number.isFinite(storedTime.currentTime)
  ) {
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
