export interface AudioMeta {
  names?: string[];
  order?: number[];
  //Дописать остальные поля аудиоконфигурации после стабилизации ответа API.
}

export interface PlaylistEpisode {
  episode?: number;
  dash?: string;
  dasha?: string;
  audio?: AudioMeta;
  //Дописать остальные поля эпизода после стабилизации ответа API.
  [key: string]: unknown;
}

export interface PlaylistSeason {
  season?: number;
  episodes?: PlaylistEpisode[];
  //Дописать остальные поля сезона после стабилизации ответа API.
  [key: string]: unknown;
}

export interface DashPlayerData {
  source?: {
    dash?: string;
    dasha?: string;
    audio?: AudioMeta;
    //Дописать остальные source-поля после стабилизации ответа API.
    [key: string]: unknown;
  };
  playlist?: {
    seasons?: PlaylistSeason[];
    //Дописать остальные playlist-поля после стабилизации ответа API.
    [key: string]: unknown;
  };
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
