import {
  ChangeEvent,
  KeyboardEvent as ReactKeyboardEvent,
  VideoHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MediaPlayer } from "dashjs";
import { ReactComponent as PlayIcon } from "../../assets/play.svg";
import { ReactComponent as PauseIcon } from "../../assets/pause.svg";
import { ReactComponent as FullscreenIcon } from "../../assets/fullscreen.svg";
import { ReactComponent as VolumeIcon } from "../../assets/volume.svg";
import { ReactComponent as QualityIcon } from "../../assets/quality.svg";
import { SavedTime } from "./SavedTime/SavedTime";
import { DashPlayerData } from "../../types/player";
import styles from "./DashPlayer.module.css";
import {
  DashRepresentation,
  DashTrack,
  getAudioTrackKey,
  getBufferedTime,
  getEpisodeLabel,
  getInitialAudioTrack,
  getOrderedAudioTracks,
  getProxyUrl,
  getSeasonLabel,
  getVideoQualityKey,
  getVideoQualityLabel,
  transformCdnUrl,
} from "./helpers";
import { isMobile } from "helpers/isMobile";
import { CurrentTime } from "./CurrentTime/CurrentTime";
import { TimeLine } from "./TimeLine/TimeLine";

//Дописать точные типы событий dashjs после проверки runtime-структуры библиотеки.
type DashEvent = any;
//Дописать точные типы request interceptor dashjs после проверки runtime-структуры библиотеки.
type DashRequest = any;

type DashPlayerProps = {
  data: DashPlayerData;
  autoPlay?: boolean;
  className?: string;
  film?: string | number;
} & VideoHTMLAttributes<HTMLVideoElement>;

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function DashPlayer({
  data,
  autoPlay = false,
  className,
  film,
  ...videoProps
}: DashPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInitialAudioTrackAppliedRef = useRef(false);
  const controlsHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const safeContainerRef = useRef<HTMLDivElement | null>(null);
  const [isInitPhase, setIsInitPhase] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isShowActionIcon, setIsShowActionIcon] = useState(true);
  const [volume, setVolume] = useState(1);
  const [initTime, setInitTime] = useState(0);
  const [audioTracks, setAudioTracks] = useState<DashTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState("");
  const [videoQualities, setVideoQualities] = useState<DashRepresentation[]>(
    [],
  );
  const [selectedVideoQuality, setSelectedVideoQuality] = useState("auto");
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(0);

  const seasons = useMemo(() => {
    return [...(data?.playlist?.seasons || [])].sort(
      (prev, curr) => (prev.season || 0) - (curr.season || 0),
    );
  }, [data?.playlist?.seasons]);

  const episodes = useMemo(() => {
    return seasons?.[selectedSeason]?.episodes || [];
  }, [seasons, selectedSeason]);

  const episode = useMemo(() => {
    return episodes?.[selectedEpisode] || null;
  }, [episodes, selectedEpisode]);

  const episodeDash = episode?.dash || episode?.dasha;
  const sourceDash = data?.source?.dash || data?.source?.dasha;

  const url = useMemo(() => {
    if (episodeDash) {
      return transformCdnUrl(episodeDash);
    }

    if (!sourceDash) return null;

    return transformCdnUrl(sourceDash);
  }, [episodeDash, sourceDash]);

  const audios = useMemo(() => {
    return episode?.audio || data?.source?.audio;
  }, [episode?.audio, data?.source?.audio]);

  const clearControlsHideTimeout = () => {
    if (controlsHideTimeoutRef.current) {
      clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }
  };

  const showControls = () => {
    setIsControlsVisible(true);
    clearControlsHideTimeout();

    if (isPlaying) {
      controlsHideTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3500);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !isInitPhase) return;
    containerRef.current.focus();
  }, [isInitPhase, url]);

  useEffect(() => {
    if (isPlaying) {
      showControls();
      return;
    }

    clearControlsHideTimeout();
    setIsControlsVisible(true);
    // clearControlsHideTimeout работает только с ref, поэтому не должен управлять перезапуском эффекта.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsHideTimeoutRef.current) {
        clearTimeout(controlsHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isInitPhase) return;

    setIsShowActionIcon(true);
    const timeout = setTimeout(() => {
      setIsShowActionIcon(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isInitPhase, isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.volume = volume;
    videoRef.current.muted = volume === 0;
  }, [volume]);

  useEffect(() => {
    if (selectedSeason >= seasons.length) {
      setSelectedSeason(0);
    }
  }, [selectedSeason, seasons.length]);

  useEffect(() => {
    if (selectedEpisode >= episodes.length) {
      setSelectedEpisode(0);
    }
  }, [selectedEpisode, episodes.length]);

  useEffect(() => {
    if (!url || !videoRef.current) return undefined;

    const videoElement = videoRef.current;
    const player = MediaPlayer().create();
    playerRef.current = player;
    isInitialAudioTrackAppliedRef.current = false;

    const syncAudioTracks = () => {
      const tracks = player.getTracksFor("audio") || [];
      const currentTrack = player.getCurrentTrackFor("audio");
      const initialTrack = !isInitialAudioTrackAppliedRef.current
        ? getInitialAudioTrack(tracks, audios)
        : null;

      setAudioTracks(tracks);

      if (initialTrack) {
        const initialTrackKey = getAudioTrackKey(initialTrack);

        isInitialAudioTrackAppliedRef.current = true;
        setSelectedAudioTrack(initialTrackKey);

        if (getAudioTrackKey(currentTrack) !== initialTrackKey) {
          player.setCurrentTrack(initialTrack);
        }

        return;
      }

      setSelectedAudioTrack(currentTrack ? getAudioTrackKey(currentTrack) : "");
    };

    const syncVideoQualities = () => {
      const representations = player.getRepresentationsByType("video") || [];
      const uniqueRepresentations = Array.from(
        new Map(
          representations.map((representation) => [
            `${representation.width}x${representation.height}`,
            representation,
          ]),
        ).values(),
      ).sort((left, right) => {
        const leftPixels = (left.width || 0) * (left.height || 0);
        const rightPixels = (right.width || 0) * (right.height || 0);

        return rightPixels - leftPixels;
      });

      setVideoQualities(uniqueRepresentations);
    };

    const handleStreamInitialized = () => {
      syncAudioTracks();
      syncVideoQualities();
    };

    const handleTrackChange = (event: DashEvent) => {
      if (event?.mediaType === "audio") {
        syncAudioTracks();
      }
    };

    const handlePlay = () => {
      setIsInitPhase(false);
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    player.addRequestInterceptor((request: DashRequest) => {
      if (request?.url) {
        request.url = getProxyUrl(request.url);
      }

      return Promise.resolve(request);
    });
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handlePause);
    player.on(MediaPlayer.events.STREAM_INITIALIZED, handleStreamInitialized);
    player.on(MediaPlayer.events.TRACK_CHANGE_RENDERED, handleTrackChange);
    player.initialize(videoElement, url, autoPlay, initTime || undefined);
    setInitTime(0);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handlePause);
      player.off(
        MediaPlayer.events.STREAM_INITIALIZED,
        handleStreamInitialized,
      );
      player.off(MediaPlayer.events.TRACK_CHANGE_RENDERED, handleTrackChange);
      playerRef.current = null;
      isInitialAudioTrackAppliedRef.current = false;
      setAudioTracks([]);
      setSelectedAudioTrack("");
      setVideoQualities([]);
      setSelectedVideoQuality("auto");
      player.reset();
    };
    // initTime сбрасывается внутри эффекта, поэтому не должен повторно инициализировать тот же stream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoPlay]);

  const handleAudioTrackChange = (trackKey: string) => {
    const track = audioTracks.find(
      (item) => getAudioTrackKey(item) === trackKey,
    );

    setSelectedAudioTrack(trackKey);

    if (track && playerRef.current) {
      playerRef.current.setCurrentTrack(track);
    }
  };

  const handleVideoQualityChange = (qualityKey: string) => {
    setSelectedVideoQuality(qualityKey);

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

    if (!quality?.id) return;

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

  const togglePlay = () => {
    if (isInitPhase) {
      setIsInitPhase(false);
    }

    if (!playerRef.current) return;

    if (playerRef.current.isPaused()) {
      playerRef.current.play();
    } else {
      playerRef.current.pause();
    }
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(event.target.value));
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    containerRef.current?.requestFullscreen().then(() => {
      if (isMobile()) window.screen.orientation.lock("landscape");
    });
  };

  const handleContainerKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
      return;
    }

    if (event.code === "KeyF") {
      event.preventDefault();
      toggleFullscreen();
    }
  };

  const orderedAudioTracks = useMemo(
    () => getOrderedAudioTracks(audioTracks, audios),
    [audioTracks, audios],
  );
  const selectedAudioTrackItem = orderedAudioTracks.find(
    (track) => track.trackKey === selectedAudioTrack,
  );
  const selectedAudioTrackLabel = selectedAudioTrackItem?.label || "Аудио";
  const selectedSeasonLabel = seasons.length
    ? getSeasonLabel(seasons[selectedSeason], selectedSeason)
    : "Сезон";
  const selectedEpisodeLabel = episodes.length
    ? getEpisodeLabel(episodes[selectedEpisode], selectedEpisode)
    : "Эпизод";
  const hiddenControlsClass =
    isPlaying && !isControlsVisible ? styles.isHidden : "";

  if (!url) return null;

  return (
    <div
      className={cx(className, styles.dashContainer, hiddenControlsClass)}
      ref={containerRef}
      tabIndex={0}
      aria-label="Видеоплеер"
      onClick={(event) => {
        if (
          event.target === containerRef.current ||
          event.target === videoRef.current ||
          event.target === safeContainerRef.current
        ) {
          togglePlay();
        }
      }}
      onDoubleClick={(event) => {
        if (
          event.target === containerRef.current ||
          event.target === videoRef.current ||
          event.target === safeContainerRef.current
        ) {
          toggleFullscreen();
        }
      }}
      onKeyDown={handleContainerKeyDown}
      onMouseMove={showControls}
      onTouchStart={showControls}
      onTouchMove={showControls}
    >
      <div ref={safeContainerRef} style={{ width: "100%", height: "100%" }}>
        <div className={cx(styles.dashTopControls, hiddenControlsClass)}>
          {!!seasons.length && (
            <div className={styles.dashSelectControl}>
              <button
                type="button"
                className={cx(styles.dashTopItem, styles.dashSelectTrigger)}
                aria-label="Сезон"
                aria-haspopup="true"
              >
                <span className={styles.dashSelectTriggerLabel}>
                  {selectedSeasonLabel}
                </span>
              </button>
              <div className={styles.dashSelectList}>
                {seasons.map((season, index) => (
                  <button
                    type="button"
                    key={`${season?.season || index}`}
                    className={[
                      styles.dashSelectListItem,
                      selectedSeason === index ? styles.isActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setSelectedSeason(index);
                      setSelectedEpisode(0);
                      setInitTime(0);
                    }}
                  >
                    {getSeasonLabel(season, index)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!!episodes.length && (
            <div className={styles.dashSelectControl}>
              <button
                type="button"
                className={cx(styles.dashTopItem, styles.dashSelectTrigger)}
                aria-label="Эпизод"
                aria-haspopup="true"
              >
                <span className={styles.dashSelectTriggerLabel}>
                  {selectedEpisodeLabel}
                </span>
              </button>
              <div className={styles.dashSelectList}>
                {episodes.map((episodeItem, index) => (
                  <button
                    type="button"
                    key={`${episodeItem?.episode || index}-${episodeItem?.dash || index}`}
                    className={[
                      styles.dashSelectListItem,
                      selectedEpisode === index ? styles.isActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setSelectedEpisode(index);
                      setInitTime(0);
                    }}
                  >
                    {getEpisodeLabel(episodeItem, index)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!!audioTracks.length && (
            <div className={styles.dashSelectControl}>
              <button
                type="button"
                className={cx(styles.dashTopItem, styles.dashSelectTrigger)}
                aria-label="Аудиодорожка"
                aria-haspopup="true"
              >
                <span className={styles.dashSelectTriggerLabel}>
                  {selectedAudioTrackLabel}
                </span>
              </button>
              <div className={styles.dashSelectList}>
                {orderedAudioTracks.map(({ trackKey, label }) => {
                  return (
                    <button
                      type="button"
                      key={trackKey}
                      className={[
                        styles.dashSelectListItem,
                        selectedAudioTrack === trackKey ? styles.isActive : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handleAudioTrackChange(trackKey)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: -10,
          }}
        >
          <video
            ref={videoRef}
            className={styles.dashPlayer}
            autoPlay={false}
            {...videoProps}
          />
        </div>
        {(isShowActionIcon || isInitPhase) && (
          <div className={styles.dashActionIcon}>
            {isPlaying || isInitPhase ? (
              <PlayIcon aria-hidden="true" />
            ) : (
              <PauseIcon aria-hidden="true" />
            )}
          </div>
        )}
        <SavedTime
          currentSeason={selectedSeason}
          currentEpisode={selectedEpisode}
          hasSeries={!!seasons.length}
          isPlaying={isPlaying}
          film={film}
          change={(timeData) => {
            setSelectedSeason(timeData.currentSeason);
            setSelectedEpisode(timeData.currentEpisode);
            if (videoRef.current)
              videoRef.current.currentTime = timeData.currentTime;
            setInitTime(timeData.currentTime);
          }}
          videoRef={videoRef}
          url={url}
        />
        <div className={cx(styles.dashBottomControls, hiddenControlsClass)}>
          <TimeLine videoRef={videoRef} url={url} />
          <button
            type="button"
            className={styles.dashBottomItem}
            aria-label="Воспроизвести или поставить на паузу"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <PauseIcon aria-hidden="true" />
            ) : (
              <PlayIcon aria-hidden="true" />
            )}
          </button>
          <CurrentTime videoRef={videoRef} url={url} />
          <div style={{ width: "100%" }} />
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
          <div className={styles.dashSelectControl}>
            <button
              type="button"
              className={styles.dashBottomItem}
              aria-label="Качество"
              aria-haspopup="true"
            >
              <QualityIcon aria-hidden="true" />
            </button>
            <div
              className={cx(
                styles.dashSelectList,
                styles.dashSelectListInverted,
              )}
            >
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
          <button
            type="button"
            className={styles.dashBottomItem}
            aria-label="Полноэкранный режим"
            onClick={toggleFullscreen}
          >
            <FullscreenIcon aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashPlayer;
