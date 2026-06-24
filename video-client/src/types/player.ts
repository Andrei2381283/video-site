export interface AudioMeta {
  names: string[];
  order: number[];
}

export interface ClosedCaption {
  url: string;
  name: string;
}

export interface EpisodeSection {
  title: string;
  start: number;
  end: number;
  skip: boolean;
  type: string;
}

export interface EpisodePreview {
  src: string;
}

export interface PlaylistEpisode {
  episode: string;
  id: number;
  videoKey: number;
  dash?: string;
  dasha?: string;
  hls?: string;
  audio: AudioMeta;
  cc?: ClosedCaption[];
  duration: number;
  title: string;
  download: string;
  sections: EpisodeSection[];
  poster: string;
  preview: EpisodePreview;
}

export interface PlaylistSeason {
  season: number;
  blocked: boolean;
  episodes: PlaylistEpisode[];
}

export interface PlaylistCurrent {
  season: number;
  episode: string;
}

export interface Playlist {
  open: boolean;
  autoNext: boolean;
  id: number;
  current: PlaylistCurrent;
  seasons: PlaylistSeason[];
}

export interface DashPlayerData {
  source?: {
    dash?: string;
    dasha?: string;
    hls?: string;
    audio?: AudioMeta;
    //Дописать остальные source-поля после стабилизации ответа API.
    [key: string]: unknown;
  };
  sections?: EpisodeSection[];
  playlist?: Playlist;
  //Дописать остальные поля data после стабилизации ответа API.
  [key: string]: unknown;
}

export interface FilmPlayerItem {
  type?: string;
  src?: string;
  name?: string;
  poster?: string;
  data?: DashPlayerData;
  //Дописать остальные поля ответа /film после стабилизации ответа API.
  [key: string]: unknown;
}

export interface SearchItem {
  id: number;
  name: string;
  poster?: string;
  //Дописать остальные поля ответа /search после стабилизации ответа API.
  [key: string]: unknown;
}

export interface BookmarkItem {
  id: number;
  name?: string | null;
  poster?: string | null;
}

export interface SavedPlaybackTime {
  currentSeason: number;
  currentEpisode: number;
  currentTime: number;
}
