import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SERVER_URL } from "../constants";

export const useFilmQuery = (film) => useQuery({
  queryKey: ["FILM", film],
  queryFn: () => axios.get(SERVER_URL + '/film/' + film),
  select: (response) => response.data,
  retry: 0,
  gcTime: 0,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  refetchOnWindowFocus: false
});
