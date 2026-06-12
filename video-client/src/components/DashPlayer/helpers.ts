import { SERVER_URL } from "../../constants";
import { AudioMeta, PlaylistEpisode, PlaylistSeason } from "../../types/player";
import type { Level, MediaPlaylist } from "hls.js";

//Дописать точные типы dashjs-треков после проверки runtime-структуры библиотеки.
export type DashTrack = any;
//Дописать точные типы dashjs-representation после проверки runtime-структуры библиотеки.
export type DashRepresentation = any;

export type HlsAudioTrackAdapter = {
  id: number;
  index: number;
  lang?: string;
  codec?: string;
  labels: Array<{ text: string }>;
  hlsAudioTrackIndex: number;
  sourceType: "hls";
};

export type HlsVideoQualityAdapter = {
  id: string;
  width?: number;
  height?: number;
  bandwidth?: number;
  bitrate?: number;
  hlsLevelIndex: number;
  sourceType: "hls";
};

export type OrderedAudioTrack = {
  track: DashTrack;
  trackKey: string;
  label: string;
};

export function transformCdnUrl(inputUrl: string, unixTime?: number) {
  const encodedPrefix = "/x-en-x/";
  const sourceAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const targetAlphabet = "DlChEXitLONYRkFjAsnBbymWzSHMqKPgQZpvwerofJTVdIuUcxaG";

  function isAlreadyTransformed(url: string) {
    return url.includes(encodedPrefix);
  }

  function replaceLetters(value: string) {
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

export function getProxyUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith(`${SERVER_URL}/proxy-stream?url=`)) return url;

  return `${SERVER_URL}/proxy-stream?url=${encodeURIComponent(url)}`;
}

export function getAudioTrackKey(track?: DashTrack | null) {
  return [track?.id, track?.index, track?.lang, track?.codec].join(":");
}

export function getHlsAudioTrackAdapters(
  tracks: MediaPlaylist[],
): HlsAudioTrackAdapter[] {
  return tracks.map((track, index) => ({
    id: track.id ?? index,
    index,
    lang: track.lang,
    codec: track.audioCodec,
    labels: [{ text: track.name || `Audio ${index + 1}` }],
    hlsAudioTrackIndex: index,
    sourceType: "hls",
  }));
}

export function getHlsVideoQualityAdapters(
  levels: Level[],
): HlsVideoQualityAdapter[] {
  return levels.map((level, index) => ({
    id: `hls:${index}`,
    width: level.width,
    height: level.height,
    bandwidth: level.bitrate,
    bitrate: level.bitrate,
    hlsLevelIndex: index,
    sourceType: "hls",
  }));
}

function getAudioTrackLabel(track: DashTrack, index: number) {
  const label = track?.labels?.[0]?.text;
  const lang = track?.lang;
  const roles = track?.roles
    ?.map((role: any) => role.value)
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

export function getOrderedAudioTracks(
  tracks: DashTrack[],
  audioMeta?: AudioMeta,
): OrderedAudioTrack[] {
  if (!tracks.length) {
    return [];
  }

  const names = Array.isArray(audioMeta?.names) ? audioMeta.names : [];
  const order = Array.isArray(audioMeta?.order) ? audioMeta.order : [];
  const usedTrackIndices = new Set<number>();
  const orderedTracks: OrderedAudioTrack[] = [];

  const appendTrack = (track: DashTrack, trackIndex: number) => {
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

export function getSeasonLabel(season: PlaylistSeason | undefined, index: number) {
  const seasonNumber = season?.season || index + 1;

  return `Сезон ${seasonNumber}`;
}

export function getEpisodeLabel(episode: PlaylistEpisode | undefined, index: number) {
  const episodeNumber = episode?.episode || index + 1;

  return `Эпизод ${episodeNumber}`;
}

export function getInitialAudioTrack(
  tracks: DashTrack[],
  audioMeta?: AudioMeta,
) {
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

export function getVideoQualityKey(representation: DashRepresentation) {
  return [
    representation?.width,
    representation?.height,
    representation?.bandwidth,
    representation?.id,
  ].join(":");
}

export function getVideoQualityLabel(representation?: DashRepresentation | null) {
  if (!representation) return "";

  return representation.height;
}

export function getBufferedTime(videoElement: HTMLVideoElement) {
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
