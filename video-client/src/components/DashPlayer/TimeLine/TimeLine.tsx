import React, {
  ChangeEvent,
  FC,
  RefObject,
  useEffect,
  useMemo,
  useState,
} from "react";
import styles from "./TimeLine.module.css";
import { MediaPlayerClass } from "dashjs";
import { getBufferedTime } from "../helpers";
import { EpisodeSection } from "types/player";

interface TimeLineProps {
  isPlaying: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  url: string;
  sections?: EpisodeSection[];
  disabledSections?: string[];
}

export const TimeLine: FC<TimeLineProps> = ({
  isPlaying,
  videoRef,
  url,
  sections = [],
  disabledSections = [],
}) => {
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

  const activeSections = useMemo(
    () => sections.filter((section) => disabledSections.includes(section.type)),
    [sections, disabledSections],
  );

  useEffect(() => {
    if (!isPlaying || currentTime >= Math.floor(duration)) return;

    for (const section of activeSections) {
      if (currentTime >= section.start && currentTime < section.end) {
        handleTimelineChange(section.end);
        break;
      }
    }
  }, [currentTime, isPlaying, duration]);

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
          step="5"
          value={Math.min(currentTime, safeDuration || 0)}
          onChange={handleTimelineChange}
          className={styles.dashTimelineSlider}
          aria-label="Перемотка видео"
        />
        {activeSections.map((section) => (
          <div
            className={styles.dashTimelineSector}
            style={{
              left: (section.start / safeDuration) * 100 + "%",
              width: ((section.end - section.start) / safeDuration) * 100 + "%",
            }}
          />
        ))}
      </div>
    </div>
  );
};
