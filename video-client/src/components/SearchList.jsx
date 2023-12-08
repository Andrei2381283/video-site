import { useCallback, useEffect, useState } from "react";
import Loader from "./Loader";
import { useSearchQuery } from "../queries/search";

function SearchList({ search, onSelect, containerRef }) {
  const { data: result = [], isLoading } = useSearchQuery(search);
  const [isClosed, setClosed] = useState(true);

  useEffect(() => {
    const listener = (event) => {
      const path = event.composedPath();
      setClosed(!path.includes(containerRef.current));
    };

    document.addEventListener('click', listener, false);

    return () => document.removeEventListener('click', listener);
  }, []);

  const onSelectHandle = useCallback((id) => (event) => {
    event.stopPropagation();
    setClosed(true);
    onSelect(id);
  }, [setClosed, onSelect]);

  if (!search || isClosed) return null;

  return <div className="list searchList">
    {isLoading && <Loader />}
    {!isLoading && result.map((item) => <div className="searchItem" onClickCapture={onSelectHandle(item.id)}>
      <img src={item.poster} width={64} height={93} />
      <span>{item.name}</span>
    </div>)}
    {!result.length && !isLoading && <span>Нет результатов</span>}
  </div>
}

export default SearchList;