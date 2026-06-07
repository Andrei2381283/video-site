import { BookmarkItem } from "../types/player";
import { safeJsonParse } from "./safeJsonParse";

export const getBookmarks = (): BookmarkItem[] => {
  return safeJsonParse<BookmarkItem[]>(localStorage.getItem("bookmarks")) || [];
};

export const addBookmark = (film: BookmarkItem): void => {
  const bookmarks = getBookmarks();
  if (!bookmarks.find((item) => item.id === film.id)) bookmarks.push(film);
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
};

export const toggleBookmark = (film: BookmarkItem): void => {
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((item) => item.id === film.id);
  if (index === -1) bookmarks.push(film);
  else bookmarks.splice(index, 1);
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
};

export const updateBookmarks = (bookmarks: BookmarkItem[]): void => {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
};
