import React, { ChangeEvent, FC, RefObject, useEffect, useState } from "react";
import styles from "./TimeLine.module.css";
import { MediaPlayerClass } from "dashjs";
import { getBufferedTime } from "../helpers";

interface TimeLineProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  url: string;
}

export const TimeLine: FC<TimeLineProps> = ({ videoRef, url }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    const syncTimelineState = () => {
      setCurrentTime(
        Number.isFinite(videoElement.currentTime)
          ? videoElement.currentTime
          : 0,
      );
      setDuration(
        Number.isFinite(videoElement.duration) ? videoElement.duration : 0,
      );
      setBufferedTime(getBufferedTime(videoElement));
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
      setDuration(0);
      setBufferedTime(0);
    };
  }, [url]);

  const handleTimelineChange = (
    event: ChangeEvent<HTMLInputElement> | number,
  ) => {
    const nextTime =
      typeof event === "number" ? event : Number(event.target.value);

    if (!videoRef.current || !Number.isFinite(nextTime)) return;

    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const safeDuration = duration > 0 ? duration : 0;
  const playedPercent = safeDuration ? (currentTime / safeDuration) * 100 : 0;
  const bufferedPercent = safeDuration
    ? (bufferedTime / safeDuration) * 100
    : 0;

  return (
    <div className={styles.dashBottomTimeline}>
      <div className={styles.dashTimelineTrack}>
        <div
          className={styles.dashTimelineBuffered}
          style={{ width: `${Math.min(bufferedPercent, 100)}%` }}
        />
        <div
          className={styles.dashTimelineProgress}
          style={{ width: `${Math.min(playedPercent, 100)}%` }}
        />
        <input
          type="range"
          min="0"
          max={safeDuration || 0}
          step="0.1"
          value={Math.min(currentTime, safeDuration || 0)}
          onChange={handleTimelineChange}
          className={styles.dashTimelineSlider}
          aria-label="Перемотка видео"
        />
      </div>
    </div>
  );
};
