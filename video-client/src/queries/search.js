import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { SERVER_URL } from "../constants";

export const useSearchQuery = (search) => useQuery({
  queryKey: ["SEARCH", search],
  queryFn: () => axios.get(SERVER_URL + '/search?search=' + search),
  select: (response) => response.data,
  enabled: Boolean(search),
  retry: 0,
  gcTime: 0,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  refetchOnWindowFocus: false
});
