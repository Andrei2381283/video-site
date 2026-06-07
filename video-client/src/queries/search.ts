import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SERVER_URL } from "../constants";
import { SearchItem } from "../types/player";

export const useSearchQuery = (search: string) =>
  useQuery<SearchItem[]>({
    queryKey: ["SEARCH", search],
    queryFn: async () => {
      const response = await axios.get<SearchItem[]>(
        SERVER_URL + "/search?search=" + encodeURIComponent(search),
      );
      return response.data;
    },
    enabled: Boolean(search),
    retry: 0,
    gcTime: 0,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
