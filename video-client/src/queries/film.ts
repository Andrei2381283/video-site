import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SERVER_URL } from "../constants";
import { FilmPlayerItem } from "../types/player";

export const useFilmQuery = (film: string | number | null) =>
  useQuery<FilmPlayerItem[]>({
    queryKey: ["FILM", film],
    queryFn: async () => {
      const response = await axios.get<FilmPlayerItem[]>(SERVER_URL + "/film/" + film);
      return response.data;
    },
    retry: 0,
    gcTime: 0,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: Boolean(film),
  });
