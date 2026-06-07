import React, { FC, RefObject, useEffect, useState } from "react";
import styles from "./CurrentTime.module.css";
import { formatPlaybackTime } from "helpers/player";

interface CurrentTimeProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  url: string;
}

export const CurrentTime: FC<CurrentTimeProps> = ({
  videoRef,
  url,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    };
  }, [url]);

  return (
    <div className={styles.dashTimeInfo}>
      <span>{formatPlaybackTime(currentTime)}</span>
      <span>/</span>
      <span>{formatPlaybackTime(duration)}</span>
    </div>
  );
};
