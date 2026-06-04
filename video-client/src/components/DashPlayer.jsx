import { useEffect, useRef, useState } from "react";
import { MediaPlayer } from "dashjs";
import { useMemo } from "react";
import { SERVER_URL } from "../constants";
import { ReactComponent as PlayIcon } from "../assets/play.svg";
import { ReactComponent as PauseIcon } from "../assets/pause.svg";
import { ReactComponent as FullscreenIcon } from "../assets/fullscreen.svg";
import { ReactComponent as VolumeIcon } from "../assets/volume.svg";
import { ReactComponent as QualityIcon } from "../assets/quality.svg";

function transformCdnUrl(inputUrl, unixTime) {
  const encodedPrefix = "/x-en-x/";
  const sourceAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const targetAlphabet = "DlChEXitLONYRkFjAsnBbymWzSHMqKPgQZpvwerofJTVdIuUcxaG";

  function isAlreadyTransformed(url) {
    return url.includes(encodedPrefix);
  }

  function replaceLetters(value) {
    return value
      .split("")
      .map((char) => {
        const index = sourceAlphabet.indexOf(char);
        return index > -1 ? targetAlphabet[index] : char;
      })
      .join("");
  }

  if (isAlreadyTransformed(inputUrl)) {
    return inputUrl;
  }

  const url = new URL(inputUrl);

  const timeMs = unixTime ? unixTime * 1000 : Date.now();
  const hour = Math.round(timeMs / 1000 / 60 / 60);

  const payload = `${hour}/${url.pathname}${url.search}`;
  const encodedPayload = replaceLetters(btoa(payload));

  return `${url.origin}${encodedPrefix}${encodedPayload}`;
}

function getProxyUrl(url) {
  if (!url) return null;
  if (url.startsWith(`${SERVER_URL}/proxy-stream?url=`)) return url;

  return `${SERVER_URL}/proxy-stream?url=${encodeURIComponent(url)}`;
}

function getAudioTrackKey(track) {
  return [track?.id, track?.index, track?.lang, track?.codec].join(":");
}

function getAudioTrackLabel(track, index) {
  const label = track?.labels?.[0]?.text;
  const lang = track?.lang;
  const roles = track?.roles
    ?.map((role) => role.value)
    .filter(Boolean)
    .join(", ");
  const parts = [
    label,
    lang && lang !== label ? lang : null,
    roles || null,
    track?.codec || null,
  ].filter(Boolean);

  return parts.length ? parts.join(" | ") : `Audio ${index + 1}`;
}

function getOrderedAudioTracks(tracks, audioMeta) {
  if (!tracks.length) {
    return [];
  }

  const names = Array.isArray(audioMeta?.names) ? audioMeta.names : [];
  const order = Array.isArray(audioMeta?.order) ? audioMeta.order : [];
  const usedTrackIndices = new Set();
  const orderedTracks = [];

  const appendTrack = (track, trackIndex) => {
    orderedTracks.push({
      track,
      trackKey: getAudioTrackKey(track),
      label:
        names[trackIndex] || getAudioTrackLabel(track, orderedTracks.length),
    });
  };

  order.forEach((trackIndex) => {
    if (
      !Number.isInteger(trackIndex) ||
      trackIndex < 0 ||
      trackIndex >= tracks.length ||
      usedTrackIndices.has(trackIndex)
    ) {
      return;
    }

    usedTrackIndices.add(trackIndex);
    appendTrack(tracks[trackIndex], trackIndex);
  });

  tracks.forEach((track, trackIndex) => {
    if (usedTrackIndices.has(trackIndex)) {
      return;
    }

    appendTrack(track, trackIndex);
  });

  return orderedTracks;
}

function getSeasonLabel(season, index) {
  const seasonNumber = season?.season || index + 1;

  return `Сезон ${seasonNumber}`;
}

function getEpisodeLabel(episode, index) {
  const episodeNumber = episode?.episode || index + 1;

  return `Эпизод ${episodeNumber}`;
}

function getInitialAudioTrack(tracks, audioMeta) {
  const order = Array.isArray(audioMeta?.order) ? audioMeta.order : [];
  const firstTrackIndex = order.find(
    (trackIndex) =>
      Number.isInteger(trackIndex) &&
      trackIndex >= 0 &&
      trackIndex < tracks.length,
  );

  if (firstTrackIndex === undefined) {
    return null;
  }

  return tracks[firstTrackIndex] || null;
}

function getVideoQualityKey(representation) {
  return [
    representation?.width,
    representation?.height,
    representation?.bandwidth,
    representation?.id,
  ].join(":");
}

function getVideoQualityLabel(representation) {
  if (!representation) return "";

  return representation.height;
}

function qualityButtonStyle(isActive) {
  return {
    padding: "6px 12px",
    background: isActive ? "#3a4d66" : "#2a3544",
    border: "1px solid #1a212b",
    cursor: "pointer",
  };
}

function formatPlaybackTime(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getBufferedTime(videoElement) {
  if (!videoElement?.buffered?.length) {
    return 0;
  }

  for (let index = 0; index < videoElement.buffered.length; index += 1) {
    const start = videoElement.buffered.start(index);
    const end = videoElement.buffered.end(index);

    if (videoElement.currentTime >= start && videoElement.currentTime <= end) {
      return end;
    }
  }

  return videoElement.buffered.end(videoElement.buffered.length - 1);
}

function DashPlayer({
  data,
  autoPlay = false,
  className = "player",
  ...videoProps
}) {
  const videoRef = useRef(null);
  /** @type {React.RefObject<import("dashjs").MediaPlayerClass>} */
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const isInitialAudioTrackAppliedRef = useRef(false);
  const controlsHideTimeoutRef = useRef(null);
  const safeContainerRef = useRef(null);
  const [isInitPhase, setIsInitPhase] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isShowActionIcon, setIsShowActionIcon] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState("");
  const [videoQualities, setVideoQualities] = useState([]);
  const [selectedVideoQuality, setSelectedVideoQuality] = useState("auto");
  const [selectedSeason, setSelectedSeason] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(0);

  const seasons = useMemo(() => {
    return [...(data?.playlist?.seasons || [])].sort(
      (prev, curr) => prev.season - curr.season,
    );
  }, [data?.playlist?.seasons]);

  const episodes = useMemo(() => {
    return seasons?.[selectedSeason]?.episodes || [];
  }, [seasons, selectedSeason]);

  const episode = useMemo(() => {
    return episodes?.[selectedEpisode] || null;
  }, [episodes, selectedEpisode]);

  const url = useMemo(() => {
    if (episode?.dash || episode?.dasha) {
      return transformCdnUrl(episode.dash || episode?.dasha);
    }

    if (!data?.source?.dash) return null;

    return transformCdnUrl(data?.source?.dash);
  }, [data?.source?.dash, episode?.dash]);

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
  }, [url]);

  useEffect(() => {
    if (isPlaying) {
      showControls();
      return;
    }

    clearControlsHideTimeout();
    setIsControlsVisible(true);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      clearControlsHideTimeout();
    };
  }, []);

  useEffect(() => {
    if (isInitPhase) return;

    setIsShowActionIcon(true);
    const timeout = setTimeout(() => {
      setIsShowActionIcon(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [isPlaying]);

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
    setSelectedEpisode(0);
  }, [selectedSeason]);

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

    const handleTrackChange = (event) => {
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

    player.addRequestInterceptor((request) => {
      if (request?.url) {
        request.url = getProxyUrl(request.url);
      }

      return Promise.resolve(request);
    });
    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handlePause);
    videoElement.addEventListener("loadedmetadata", syncTimelineState);
    videoElement.addEventListener("durationchange", syncTimelineState);
    videoElement.addEventListener("timeupdate", syncTimelineState);
    videoElement.addEventListener("progress", syncTimelineState);
    videoElement.addEventListener("seeking", syncTimelineState);
    videoElement.addEventListener("seeked", syncTimelineState);
    player.on(MediaPlayer.events.STREAM_INITIALIZED, handleStreamInitialized);
    player.on(MediaPlayer.events.TRACK_CHANGE_RENDERED, handleTrackChange);
    player.initialize(videoElement, url, autoPlay);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handlePause);
      videoElement.removeEventListener("loadedmetadata", syncTimelineState);
      videoElement.removeEventListener("durationchange", syncTimelineState);
      videoElement.removeEventListener("timeupdate", syncTimelineState);
      videoElement.removeEventListener("progress", syncTimelineState);
      videoElement.removeEventListener("seeking", syncTimelineState);
      videoElement.removeEventListener("seeked", syncTimelineState);
      player.off(
        MediaPlayer.events.STREAM_INITIALIZED,
        handleStreamInitialized,
      );
      player.off(MediaPlayer.events.TRACK_CHANGE_RENDERED, handleTrackChange);
      playerRef.current = null;
      isInitialAudioTrackAppliedRef.current = false;
      setCurrentTime(0);
      setDuration(0);
      setBufferedTime(0);
      setAudioTracks([]);
      setSelectedAudioTrack("");
      setVideoQualities([]);
      setSelectedVideoQuality("auto");
      player.reset();
    };
  }, [url, autoPlay]);

  const handleAudioTrackChange = (trackKey) => {
    const track = audioTracks.find(
      (item) => getAudioTrackKey(item) === trackKey,
    );

    setSelectedAudioTrack(trackKey);

    if (track && playerRef.current) {
      playerRef.current.setCurrentTrack(track);
    }
  };

  const handleVideoQualityChange = (qualityKey) => {
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

  const handleVolumeChange = (event) => {
    setVolume(Number(event.target.value));
  };

  const handleTimelineChange = (event) => {
    const nextTime = Number(event.target.value);

    if (!videoRef.current || !Number.isFinite(nextTime)) return;

    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    containerRef.current?.requestFullscreen();
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return undefined;

    const handleKeyDown = (event) => {
      console.log(event);
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

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const safeDuration = duration > 0 ? duration : 0;
  const playedPercent = safeDuration ? (currentTime / safeDuration) * 100 : 0;
  const bufferedPercent = safeDuration
    ? (bufferedTime / safeDuration) * 100
    : 0;
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
    isPlaying && !isControlsVisible ? "is-hidden" : "";

  if (!url) return null;

  return (
    <div
      className={[className, "dashContainer", hiddenControlsClass]
        .filter(Boolean)
        .join(" ")}
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
      onMouseMove={showControls}
      onTouchStart={showControls}
      onTouchMove={showControls}
    >
      <div ref={safeContainerRef} style={{ width: "100%", height: "100%" }}>
        <div
          className={["dashTopControls", hiddenControlsClass]
            .filter(Boolean)
            .join(" ")}
        >
          {!!seasons.length && (
            <div className="dashSelectControl">
              <button
                type="button"
                className="dashTopItem dashSelectTrigger"
                aria-label="Сезон"
                aria-haspopup="true"
              >
                <span className="dashSelectTriggerLabel">
                  {selectedSeasonLabel}
                </span>
              </button>
              <div className="dashSelectList">
                {seasons.map((season, index) => (
                  <button
                    type="button"
                    key={`${season?.season || index}`}
                    className={[
                      "dashSelectListItem",
                      selectedSeason === index ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedSeason(index)}
                  >
                    {getSeasonLabel(season, index)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!!episodes.length && (
            <div className="dashSelectControl">
              <button
                type="button"
                className="dashTopItem dashSelectTrigger"
                aria-label="Эпизод"
                aria-haspopup="true"
              >
                <span className="dashSelectTriggerLabel">
                  {selectedEpisodeLabel}
                </span>
              </button>
              <div className="dashSelectList">
                {episodes.map((episodeItem, index) => (
                  <button
                    type="button"
                    key={`${episodeItem?.episode || index}-${episodeItem?.dash || index}`}
                    className={[
                      "dashSelectListItem",
                      selectedEpisode === index ? "is-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setSelectedEpisode(index)}
                  >
                    {getEpisodeLabel(episodeItem, index)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!!audioTracks.length && (
            <div className="dashSelectControl">
              <button
                type="button"
                className="dashTopItem dashSelectTrigger"
                aria-label="Аудиодорожка"
                aria-haspopup="true"
              >
                <span className="dashSelectTriggerLabel">
                  {selectedAudioTrackLabel}
                </span>
              </button>
              <div className="dashSelectList">
                {orderedAudioTracks.map(({ trackKey, label }) => {
                  return (
                    <button
                      type="button"
                      key={trackKey}
                      className={[
                        "dashSelectListItem",
                        selectedAudioTrack === trackKey ? "is-active" : "",
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
            className="dashPlayer"
            autoPlay={false}
            {...videoProps}
          />
        </div>
        {(isShowActionIcon || isInitPhase) && (
          <div className="dashActionIcon">
            {isPlaying || isInitPhase ? (
              <PlayIcon aria-hidden="true" />
            ) : (
              <PauseIcon aria-hidden="true" />
            )}
          </div>
        )}
        <div
          className={["dashBottomControls", hiddenControlsClass]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="dashBottomTimeline">
            <div className="dashTimelineTrack">
              <div
                className="dashTimelineBuffered"
                style={{ width: `${Math.min(bufferedPercent, 100)}%` }}
              />
              <div
                className="dashTimelineProgress"
                style={{ width: `${Math.min(playedPercent, 100)}%` }}
              />
              <input
                type="range"
                min="0"
                max={safeDuration || 0}
                step="0.1"
                value={Math.min(currentTime, safeDuration || 0)}
                onChange={handleTimelineChange}
                className="dashTimelineSlider"
                aria-label="Перемотка видео"
              />
            </div>
          </div>
          <button
            type="button"
            className="dashBottomItem"
            aria-label="Воспроизвести или поставить на паузу"
            onClick={togglePlay}
          >
            {isPlaying ? (
              <PauseIcon aria-hidden="true" />
            ) : (
              <PlayIcon aria-hidden="true" />
            )}
          </button>
          <div className="dashTimeInfo">
            <span>{formatPlaybackTime(currentTime)}</span>
            <span>/</span>
            <span>{formatPlaybackTime(duration)}</span>
          </div>
          <div style={{ width: "100%" }} />
          <div className="dashVolumeControl">
            <button
              type="button"
              className="dashBottomItem"
              aria-label="Громкость"
            >
              <VolumeIcon aria-hidden="true" />
            </button>
            <div className="dashVolumeSliderWrapper">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="dashVolumeSlider"
                aria-label="Изменить громкость"
              />
            </div>
          </div>
          <div className="dashSelectControl">
            <button
              type="button"
              className="dashBottomItem"
              aria-label="Качество"
              aria-haspopup="true"
            >
              <QualityIcon aria-hidden="true" />
            </button>
            <div className="dashSelectList dashSelectListInverted">
              <button
                type="button"
                onClick={() => handleVideoQualityChange("auto")}
                className={[
                  "dashSelectListItem",
                  selectedVideoQuality === 'auto'
                    ? "is-active"
                    : "",
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
                    "dashSelectListItem",
                    selectedVideoQuality === getVideoQualityKey(quality)
                      ? "is-active"
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
            className="dashBottomItem"
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
