import { ChangeEvent, RefObject, useEffect, useState } from "react";
import { ReactComponent as VolumeIcon } from "../../../assets/volume.svg";
import styles from "../DashPlayer.module.css";

type VolumeControlProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function VolumeControl({ videoRef }: VolumeControlProps) {
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.volume = volume;
    videoRef.current.muted = volume === 0;
  }, [videoRef, volume]);

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  return (
    <div className={styles.dashVolumeControl}>
      <button
        type="button"
        className={styles.dashBottomItem}
        aria-label="Громкость"
      >
        <VolumeIcon aria-hidden="true" />
      </button>
      <div className={styles.dashVolumeSliderWrapper}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className={styles.dashVolumeSlider}
          aria-label="Изменить громкость"
        />
      </div>
    </div>
  );
}
