import { RefObject, useEffect, useState } from "react";
import { MediaPlayerClass } from "dashjs";
import Hls from "hls.js";
import { ReactComponent as QualityIcon } from "../../../assets/quality.svg";
import {
  DashRepresentation,
  getVideoQualityKey,
  getVideoQualityLabel,
} from "../helpers";
import styles from "../DashPlayer.module.css";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

type VideoQualitySelectProps = {
  videoQualities: DashRepresentation[];
  playerRef: RefObject<MediaPlayerClass | null>;
  hlsRef: RefObject<Hls | null>;
  isHlsActive: boolean;
};

export function VideoQualitySelect({
  videoQualities,
  playerRef,
  hlsRef,
  isHlsActive,
}: VideoQualitySelectProps) {
  const [selectedVideoQuality, setSelectedVideoQuality] = useState("auto");

  useEffect(() => {
    if (!videoQualities?.length || selectedVideoQuality === "auto") return;

    const quality = videoQualities.find(
      (item) => getVideoQualityKey(item) === selectedVideoQuality,
    );

    handleVideoQualityChange(quality ? getVideoQualityKey(quality) : "auto");
  }, [videoQualities]);

  const handleVideoQualityChange = (qualityKey: string) => {
    setSelectedVideoQuality(qualityKey);

    if (hlsRef.current && isHlsActive) {
      if (qualityKey === "auto") {
        hlsRef.current.currentLevel = -1;
        return;
      }

      const quality = videoQualities.find(
        (item) => getVideoQualityKey(item) === qualityKey,
      );

      if (typeof quality?.hlsLevelIndex !== "number") return;

      hlsRef.current.currentLevel = quality.hlsLevelIndex;
      return;
    }

    if (!playerRef.current) return;

    if (qualityKey === "auto") {
      playerRef.current.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: {
              video: true,
            },
          },
        },
      });
      return;
    }

    const quality = videoQualities.find(
      (item) => getVideoQualityKey(item) === qualityKey,
    );

    if (quality?.id === undefined || quality?.id === null) return;

    playerRef.current.updateSettings({
      streaming: {
        abr: {
          autoSwitchBitrate: {
            video: false,
          },
        },
      },
    });
    playerRef.current.setRepresentationForTypeById("video", quality.id, true);
  };

  return (
    <div className={styles.dashSelectControl}>
      <button
        type="button"
        className={styles.dashBottomItem}
        aria-label="Качество"
        aria-haspopup="true"
      >
        <QualityIcon aria-hidden="true" />
      </button>
      <div className={cx(styles.dashSelectList, styles.dashSelectListInverted)}>
        <button
          type="button"
          onClick={() => handleVideoQualityChange("auto")}
          className={[
            styles.dashSelectListItem,
            selectedVideoQuality === "auto" ? styles.isActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          Авто
        </button>
        {videoQualities.map((quality) => (
          <button
            type="button"
            key={getVideoQualityKey(quality)}
            onClick={() =>
              handleVideoQualityChange(getVideoQualityKey(quality))
            }
            className={[
              styles.dashSelectListItem,
              selectedVideoQuality === getVideoQualityKey(quality)
                ? styles.isActive
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {getVideoQualityLabel(quality)}
          </button>
        ))}
      </div>
    </div>
  );
}
