export const getBookmarks = () => {
  return JSON.parse(localStorage.getItem('bookmarks')) || [];
}

export const addBookmark = (film) => {
  const bookmarks = getBookmarks();
  if(!bookmarks.find((item) => item.id === film.id)) bookmarks.push(film);
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

export const toggleBookmark = (film) => {
  console.log(film);
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex((item) => item.id === film.id);
  if(index === -1) bookmarks.push(film);
  else bookmarks.splice(index, 1);
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}

export const updateBookmarks = (bookmarks) => {
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}